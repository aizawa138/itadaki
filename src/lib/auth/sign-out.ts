import { createSupabaseBrowserClient } from "../supabase/browser-client";

export default async function signOut() {
  const supabase = createSupabaseBrowserClient();

  await supabase.auth.signOut();
}
