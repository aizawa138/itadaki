import LandingHeader from "@/src/components/layout/landing-header";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <LandingHeader />
      {children}
    </>
  );
}
