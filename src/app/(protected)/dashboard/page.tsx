import { getSession } from "@/src/lib/auth/get-session";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return <div>Dashboard</div>;
}
