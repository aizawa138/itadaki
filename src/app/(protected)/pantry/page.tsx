import { fetchPantry } from "@/src/features/pantry/actions/fetch-pantry";
import PantryCard from "@/src/features/pantry/components/pantry-card";
import RecentReceipt from "@/src/features/pantry/components/recent-receipt";
import CreateRecipe from "@/src/features/recipe/components/create-recipe";

export default async function Pantry() {
  const pantryItems = await fetchPantry();

  return (
    <main className="flex flex-col mx-auto w-full max-w-7xl px-6 mt-10">
      <h1 className="text-2xl font-semibold mb-6">Pantry</h1>
      <div className="flex w-full gap-10">
        <div className="min-w-0 flex-2">
          <div className="flex justify-between pr-2">
            <p className="mb-6 font-semibold text-secondary">
              {pantryItems.length} ingredients found
            </p>
            <CreateRecipe />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            {pantryItems.map((item) => (
              <PantryCard
                key={item.id}
                title={item.ingredient_name}
                quantity={item.quantity}
              />
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <RecentReceipt variant="preview" />
        </div>
      </div>
    </main>
  );
}
