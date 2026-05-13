"use client";

import { createSupabaseBrowserClient } from "../supabase/browser-client";

export const signInWithGoogle = async () => {
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
    },
  });
};
