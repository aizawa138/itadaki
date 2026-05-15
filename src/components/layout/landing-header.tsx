import { raleway } from "@/public/fonts";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/Logo.svg";
import Login from "@/src/features/auth/login";

export default function LandingHeader() {
  return (
    <header className="flex h-16 items-center justify-between px-8 bg-primary sticky top-0 border-b border-b-border">
      <Link
        href="/"
        className={`${raleway.className} flex gap-2 text-[1.75rem] text-primary-foreground`}
      >
        <Image
          src={logo}
          alt="Itadaki logo"
          width={32}
          height={32}
          loading="eager"
        />
        <h1>Itadaki</h1>
      </Link>
      <Login />
    </header>
  );
}
