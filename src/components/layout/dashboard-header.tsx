import Image from "next/image";
import logo from "@/public/Logo.svg";

export default function DashboardHeader() {
  return (
    <header className="bg-background flex border-b-2 border-b-border sticky top-0 px-8 h-14">
      <Image src={logo} alt="Itadaki logo" />
    </header>
  );
}
