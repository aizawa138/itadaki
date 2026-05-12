import { raleway } from "@/public/fonts";
import Link from "next/link";

export default function Header() {
  return (
    <header className="flex h-16 items-center justify-between px-8 bg-primary sticky top-0 border-b border-b-border">
      <Link
        href="/"
        className={`${raleway.className} text-[1.75rem] text-primary-foreground`}
      >
        Itadaki
      </Link>
      <div></div>
    </header>
  );
}
