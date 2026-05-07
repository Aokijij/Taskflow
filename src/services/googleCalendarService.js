import { supabase } from "../lib/supabaseClient";

const GOOGLE_CALENDAR_STATE = "taskflow-google-calendar";
const GOOGLE_SCOPE = "https://www.googleapis.com/auth/calendar.events";

export const getGoogleCalendarRedirectUri = () =>
  `${window.location.origin}/calendar`;

export const buildGoogleCalendarAuthUrl = () => {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error("Falta REACT_APP_GOOGLE_CLIENT_ID para conectar Google Calendar.");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleCalendarRedirectUri(),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: GOOGLE_SCOPE,
    state: GOOGLE_CALENDAR_STATE,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

export const isGoogleCalendarCallback = (searchParams) =>
  searchParams.get("state") === GOOGLE_CALENDAR_STATE && searchParams.has("code");

export const exchangeGoogleCalendarCode = async (code) => {
  const { data, error } = await supabase.functions.invoke("google-calendar-exchange", {
    body: {
      code,
      redirectUri: getGoogleCalendarRedirectUri(),
    },
  });

  if (error) {
    throw new Error(error.message || "No se pudo conectar Google Calendar.");
  }

  return data;
};

export const syncGoogleCalendar = async (workspace) => {
  const { data, error } = await supabase.functions.invoke("google-calendar-sync", {
    body: {
      workspaceType: workspace?.type || "personal",
      workspaceId: workspace?.type === "group" ? workspace.id : null,
    },
  });

  if (error) {
    throw new Error(error.message || "No se pudo sincronizar el calendario.");
  }

  return data;
};
