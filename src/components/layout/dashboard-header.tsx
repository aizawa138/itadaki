import Image from "next/image";
import logo from "@/public/Logo.svg";
import Link from "next/link";

export default function DashboardHeader() {
  return (
    <header className="bg-primary flex border-b border-b-border sticky top-0 px-8 h-12">
      <Link href="/dashboard" className="flex items-center">
        <Image
          src={logo}
          alt="Itadaki logo"
          width={32}
          height={32}
          loading="eager"
        />
      </Link>
    </header>
  );
}
