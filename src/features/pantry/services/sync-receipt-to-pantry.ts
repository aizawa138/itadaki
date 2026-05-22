import type { createSupabaseServerClient } from "@/src/lib/supabase/server-client";
import type { Database } from "@/src/types/supabase";

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type PantryItemInsert = Database["public"]["Tables"]["pantry_items"]["Insert"];

export type ReceiptItemForPantrySync = {
  id: string;
  normalized_name: string | null;
  quantity: number | null;
  unit: string | null;
};

type PantryAccumulator = {
  id: string;
  ingredient_name: string;
  quantity: number;
  unit: string | null;
  source_receipt_item_id: string;
  isNew: boolean;
  changed: boolean;
};

function pantryKey(name: string) {
  return name.trim().toLowerCase();
}

export async function syncReceiptItemsToPantry(
  supabase: SupabaseClient,
  userId: string,
  receiptItems: ReceiptItemForPantrySync[],
) {
  const purchasableItems = receiptItems.filter(
    (item) => item.normalized_name?.trim(),
  );

  if (purchasableItems.length === 0) {
    return;
  }

  const { data: existingPantry, error: fetchError } = await supabase
    .from("pantry_items")
    .select("id, ingredient_name, quantity, unit")
    .eq("user_id", userId);

  if (fetchError) {
    throw new Error(fetchError.message ?? "Failed to fetch pantry items");
  }

  const pantryByKey = new Map<string, PantryAccumulator>();

  for (const row of existingPantry ?? []) {
    if (!row.ingredient_name?.trim()) {
      continue;
    }

    pantryByKey.set(pantryKey(row.ingredient_name), {
      id: row.id,
      ingredient_name: row.ingredient_name.trim(),
      quantity: row.quantity ?? 0,
      unit: row.unit,
      source_receipt_item_id: "",
      isNew: false,
      changed: false,
    });
  }

  for (const item of purchasableItems) {
    const ingredientName = item.normalized_name!.trim();
    const key = pantryKey(ingredientName);
    const purchasedQty = item.quantity ?? 1;
    const existing = pantryByKey.get(key);

    if (existing) {
      existing.quantity += purchasedQty;
      existing.changed = true;
      if (!existing.unit && item.unit) {
        existing.unit = item.unit;
      }
      continue;
    }

    pantryByKey.set(key, {
      id: crypto.randomUUID(),
      ingredient_name: ingredientName,
      quantity: purchasedQty,
      unit: item.unit,
      source_receipt_item_id: item.id,
      isNew: true,
      changed: true,
    });
  }

  const toInsert: PantryItemInsert[] = [];
  const toUpdate: { id: string; quantity: number; unit: string | null }[] = [];

  for (const entry of pantryByKey.values()) {
    if (!entry.changed) {
      continue;
    }

    if (entry.isNew) {
      toInsert.push({
        id: entry.id,
        user_id: userId,
        ingredient_name: entry.ingredient_name,
        quantity: entry.quantity,
        unit: entry.unit,
        source_receipt_item_id: entry.source_receipt_item_id,
      });
      continue;
    }

    toUpdate.push({
      id: entry.id,
      quantity: entry.quantity,
      unit: entry.unit,
    });
  }

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("pantry_items")
      .insert(toInsert);

    if (insertError) {
      throw new Error(insertError.message ?? "Failed to add pantry items");
    }
  }

  for (const row of toUpdate) {
    const { error: updateError } = await supabase
      .from("pantry_items")
      .update({
        quantity: row.quantity,
        unit: row.unit,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .eq("user_id", userId);

    if (updateError) {
      throw new Error(updateError.message ?? "Failed to update pantry item");
    }
  }
}
