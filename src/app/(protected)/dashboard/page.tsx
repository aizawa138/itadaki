import DashboardContainer from "@/src/components/layout/dashboard-container";
import { BentoCard } from "@/src/components/ui/bento-card/bento-card";
import CreateRecipe from "@/src/features/create/create-recipe";

export default async function Dashboard() {
  return (
    <>
      <DashboardContainer>
        <div className="flex justify-between items-center mt-10 mb-6">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <CreateRecipe />
        </div>
        <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 auto-rows-[60px] md:auto-rows-[80px] gap-4 grid-flow-row-dense">
          <BentoCard title="Today's meal" size="hero"></BentoCard>
          <BentoCard title="Buy Next" size="square"></BentoCard>
          <BentoCard title="Recent Receipts" size="wide"></BentoCard>
          <BentoCard title="Recent Recipes" size="square"></BentoCard>
        </div>
      </DashboardContainer>
    </>
  );
}
