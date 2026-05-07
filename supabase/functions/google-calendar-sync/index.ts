import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SyncPayload = {
  workspaceType?: "personal" | "group";
  workspaceId?: string | null;
};

const refreshGoogleAccessToken = async (refreshToken: string) => {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: Deno.env.get("GOOGLE_CLIENT_ID") || "",
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
      grant_type: "refresh_token",
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    throw new Error(tokenData.error_description || "No se pudo renovar la sesion de Google.");
  }

  return {
    accessToken: tokenData.access_token,
    expiresAt: tokenData.expires_in
      ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString()
      : null,
  };
};

const buildEventPayload = (task: Record<string, unknown>) => {
  const dueDate = String(task.due_date || "");
  const nextDate = new Date(`${dueDate}T00:00:00`);
  nextDate.setDate(nextDate.getDate() + 1);

  return {
    summary: task.name,
    description: task.description || "Sin descripcion adicional.",
    start: {
      date: dueDate,
    },
    end: {
      date: nextDate.toISOString().split("T")[0],
    },
    colorId: task.completed ? "2" : task.priority === "Alta" ? "11" : task.priority === "Media" ? "5" : "10",
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authorization = req.headers.get("Authorization") || "";
    const token = authorization.replace("Bearer ", "").trim();

    if (!token) {
      throw new Error("No hay sesion activa para sincronizar.");
    }

    const { workspaceType = "personal", workspaceId = null }: SyncPayload = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("No se pudo validar la sesion actual.");
    }

    const { data: connection, error: connectionError } = await supabase
      .from("google_calendar_connections")
      .select("user_id, refresh_token, calendar_id")
      .eq("user_id", user.id)
      .single();

    if (connectionError || !connection) {
      throw new Error("Primero conecta tu cuenta con Google Calendar.");
    }

    const { accessToken, expiresAt } = await refreshGoogleAccessToken(connection.refresh_token);

    await supabase
      .from("google_calendar_connections")
      .update({
        access_token: accessToken,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    let tasksQuery = supabase
      .from("tasks")
      .select("id, user_id, scope, group_id, name, description, priority, due_date, completed")
      .order("due_date", { ascending: true });

    if (workspaceType === "group" && workspaceId) {
      const { data: membership } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", workspaceId)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!membership) {
        throw new Error("No tienes acceso a ese grupo para sincronizarlo.");
      }

      tasksQuery = tasksQuery.eq("scope", "group").eq("group_id", workspaceId);
    } else {
      tasksQuery = tasksQuery.eq("scope", "personal").eq("user_id", user.id);
    }

    const { data: tasks, error: tasksError } = await tasksQuery;

    if (tasksError) {
      throw new Error(tasksError.message || "No se pudieron leer las tareas.");
    }

    let syncedCount = 0;

    for (const task of tasks || []) {
      const { data: existingEvent } = await supabase
        .from("google_calendar_task_events")
        .select("event_id")
        .eq("user_id", user.id)
        .eq("task_id", task.id)
        .maybeSingle();

      const eventPayload = buildEventPayload(task);
      const endpoint = existingEvent?.event_id
        ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(connection.calendar_id)}/events/${existingEvent.event_id}`
        : `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(connection.calendar_id)}/events`;

      const googleResponse = await fetch(endpoint, {
        method: existingEvent?.event_id ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventPayload),
      });

      const googleData = await googleResponse.json();

      if (!googleResponse.ok) {
        throw new Error(googleData.error?.message || "No se pudo enviar una tarea a Google Calendar.");
      }

      await supabase.from("google_calendar_task_events").upsert({
        user_id: user.id,
        task_id: task.id,
        event_id: googleData.id,
        synced_at: new Date().toISOString(),
      });

      syncedCount += 1;
    }

    return new Response(
      JSON.stringify({
        synced: true,
        count: syncedCount,
        message: `Se sincronizaron ${syncedCount} tareas con Google Calendar.`,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "No se pudo sincronizar el calendario.",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
