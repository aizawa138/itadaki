import DashboardContainer from "@/src/components/layout/dashboard-container";
import { BentoCard } from "@/src/components/ui/bento-card/bento-card";

export default async function Dashboard() {
  return (
    <>
      <DashboardContainer>
        <h1 className="mt-10 mb-4 text-2xl">Dashboard</h1>
        <div className="w-5xl grid grid-cols-5 grid-rows-6 gap-2">
          <BentoCard title="Today's meal" size="hero"></BentoCard>
          <BentoCard title="Buy Next" size="square"></BentoCard>
          <BentoCard title="Recent Receipts" size="wide"></BentoCard>
          <BentoCard title="Recent Recipes" size="square"></BentoCard>
        </div>
      </DashboardContainer>
    </>
  );
}
