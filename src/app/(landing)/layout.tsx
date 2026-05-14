import LandingHeader from "@/src/components/layout/landing-header";
import { getSession } from "@/src/lib/auth/get-session";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <>
      <LandingHeader />
      {children}
    </>
  );
}
