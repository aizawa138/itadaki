import { createSupabaseServerClient } from "../supabase/server-client";

export const getSession = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
};
