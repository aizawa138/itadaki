import { createSupabaseServerClient } from "@/src/lib/supabase/server-client";

export async function fetchPantry() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("pantry_items")
    .select("*")
    .eq("user_id", user.id)
    .gte("quantity", 1)
    .order("created_at", { ascending: false });
  if (error) {
    throw error;
  }
  return data;
}
