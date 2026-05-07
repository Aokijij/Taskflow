import { createClient } from "npm:@supabase/supabase-js@2";

const resendEndpoint = "https://api.resend.com/emails";

const getTomorrowString = () => {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 1);
  return nextDate.toISOString().split("T")[0];
};

const sendEmail = async (to: string, subject: string, html: string) => {
  const response = await fetch(resendEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY") || ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("EMAIL_FROM") || "TaskFlow <alerts@taskflow.app>",
      to,
      subject,
      html,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "No se pudo enviar el correo.");
  }

  return data;
};

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    );

    const today = new Date().toISOString().split("T")[0];
    const tomorrow = getTomorrowString();

    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select(`
        id,
        name,
        description,
        due_date,
        completed,
        scope,
        user_id,
        assigned_to,
        group_id,
        profiles:profiles!tasks_user_id_fkey (
          email
        )
      `)
      .eq("completed", false)
      .or(`due_date.eq.${tomorrow},due_date.lt.${today}`);

    if (tasksError) {
      throw new Error(tasksError.message || "No se pudieron cargar las tareas para recordar.");
    }

    let sent = 0;

    for (const task of tasks || []) {
      const notificationType = task.due_date === tomorrow ? "due_tomorrow" : "overdue";
      const subject =
        notificationType === "due_tomorrow"
          ? `TaskFlow: ${task.name} vence manana`
          : `TaskFlow: ${task.name} esta atrasada`;

      let recipients: string[] = [];

      if (task.assigned_to) {
        const { data: assignee } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", task.assigned_to)
          .maybeSingle();

        if (assignee?.email) {
          recipients = [assignee.email];
        }
      } else if (task.scope === "group" && task.group_id) {
        const { data: members } = await supabase
          .from("group_members")
          .select("email")
          .eq("group_id", task.group_id)
          .eq("status", "active");

        recipients = (members || []).map((member) => member.email).filter(Boolean);
      } else if (task.profiles?.email) {
        recipients = [task.profiles.email];
      }

      const uniqueRecipients = [...new Set(recipients.map((email) => email.toLowerCase()))];

      for (const recipient of uniqueRecipients) {
        const { data: existingLog } = await supabase
          .from("task_email_notifications")
          .select("id")
          .eq("task_id", task.id)
          .eq("recipient_email", recipient)
          .eq("notification_type", notificationType)
          .eq("notification_date", today)
          .maybeSingle();

        if (existingLog) {
          continue;
        }

        await sendEmail(
          recipient,
          subject,
          `
            <div style="font-family: Arial, sans-serif; color: #14213d;">
              <h2 style="margin-bottom: 12px;">${task.name}</h2>
              <p style="margin: 0 0 12px;">${task.description || "Tu tarea ya tiene una alerta activa."}</p>
              <p style="margin: 0;"><strong>Fecha:</strong> ${task.due_date}</p>
              <p style="margin: 8px 0 0;">
                ${notificationType === "due_tomorrow"
                  ? "Vence manana. Conviene dejarla lista hoy."
                  : "Sigue pendiente y ya quedo vencida. Vale la pena revisarla cuanto antes."}
              </p>
            </div>
          `,
        );

        await supabase.from("task_email_notifications").insert({
          task_id: task.id,
          recipient_email: recipient,
          notification_type: notificationType,
          notification_date: today,
        });

        sent += 1;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        sent,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "No se pudieron enviar recordatorios.",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
});
