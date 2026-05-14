import DashboardHeader from "@/src/components/layout/dashboard-header";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <DashboardHeader />
      {children}
    </>
  );
}
