import DashboardHeader from "@/src/components/layout/dashboard-header";
import { getSession } from "@/src/lib/auth/get-session";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <>
      <DashboardHeader />
      {children}
    </>
  );
}
