export type ReceiptItemForPantrySync = {
  id: string;
  normalized_name: string | null;
  quantity: number | null;
  unit: string | null;
};

type PantryRow = {
  id: string;
  ingredient_name: string | null;
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

type RestFetch = (
  url: string,
  init?: RequestInit,
) => Promise<Response>;

export async function syncReceiptItemsToPantry(
  restFetch: RestFetch,
  supabaseUrl: string,
  userId: string,
  receiptItems: ReceiptItemForPantrySync[],
) {
  const purchasableItems = receiptItems.filter(
    (item) => item.normalized_name?.trim(),
  );

  if (purchasableItems.length === 0) {
    return;
  }

  const selectUrl = new URL(`${supabaseUrl}/rest/v1/pantry_items`);
  selectUrl.searchParams.set("select", "id,ingredient_name,quantity,unit");
  selectUrl.searchParams.set("user_id", `eq.${userId}`);

  const selectRes = await restFetch(selectUrl.toString(), { method: "GET" });
  if (!selectRes.ok) {
    const text = await selectRes.text().catch(() => "");
    throw new Error(
      `Failed to fetch pantry items (${selectRes.status})${text ? `: ${text.slice(0, 200)}` : ""}`,
    );
  }

  const existingPantry = (await selectRes.json().catch(() => [])) as PantryRow[];
  const pantryByKey = new Map<string, PantryAccumulator>();

  for (const row of Array.isArray(existingPantry) ? existingPantry : []) {
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

  const toInsert: Record<string, unknown>[] = [];
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
    const insertRes = await restFetch(`${supabaseUrl}/rest/v1/pantry_items`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        prefer: "return=minimal",
      },
      body: JSON.stringify(toInsert),
    });

    if (!insertRes.ok) {
      const text = await insertRes.text().catch(() => "");
      throw new Error(
        `Failed to add pantry items (${insertRes.status})${text ? `: ${text.slice(0, 200)}` : ""}`,
      );
    }
  }

  for (const row of toUpdate) {
    const updateUrl = new URL(`${supabaseUrl}/rest/v1/pantry_items`);
    updateUrl.searchParams.set("id", `eq.${row.id}`);
    updateUrl.searchParams.set("user_id", `eq.${userId}`);

    const updateRes = await restFetch(updateUrl.toString(), {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        prefer: "return=minimal",
      },
      body: JSON.stringify({
        quantity: row.quantity,
        unit: row.unit,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!updateRes.ok) {
      const text = await updateRes.text().catch(() => "");
      throw new Error(
        `Failed to update pantry item (${updateRes.status})${text ? `: ${text.slice(0, 200)}` : ""}`,
      );
    }
  }
}
