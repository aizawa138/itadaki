import { fetchPantry } from "@/src/features/pantry/actions/fetch-pantry";
import PantryCard from "@/src/features/pantry/components/pantry-card";

export default async function Pantry() {
  const pantryItems = await fetchPantry();
  return (
    <main className="flex flex-col mx-auto w-full max-w-4xl px-6 mt-10">
      <h1 className="text-2xl font-semibold mb-6">Pantry</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
        {pantryItems.map((item) => (
          <PantryCard
            key={item.id}
            title={item.ingredient_name}
            quantity={item.quantity}
          />
        ))}
      </div>
    </main>
  );
}
