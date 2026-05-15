"use client";

import {
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuRoot,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown/dropdown";
import { Button } from "@/src/components/ui/button/button";
import Image from "next/image";
import profile from "@/public/profile-circle-svgrepo-com.svg";
import { useRouter } from "next/navigation";
import signOut from "@/src/lib/auth/sign-out";

export default function ProfileIcon() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
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
      <DropdownMenuContent className="mr-2">
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuItem>Theme</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
}
