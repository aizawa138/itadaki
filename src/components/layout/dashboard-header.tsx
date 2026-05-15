import Image from "next/image";
import logo from "@/public/Logo.svg";
import Link from "next/link";
import profile from "@/public/Profile.svg";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown/dropdown";
import { Button } from "../ui/button/button";

export default function DashboardHeader() {
  return (
    <header className="bg-primary flex items-center justify-between border-b border-b-border sticky top-0 px-8 h-12">
      <Link href="/dashboard">
        <Image
          src={logo}
          alt="Itadaki logo"
          width={32}
          height={32}
          loading="eager"
        />
      </Link>
      <DropdownMenuRoot>
        <DropdownMenuTrigger asChild>
          <Button size="icon">
            <Image
              src={profile}
              alt="Profile icon"
              width={32}
              height={32}
              loading="eager"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Theme</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuRoot>
    </header>
  );
}
