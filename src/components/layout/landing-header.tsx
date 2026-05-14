"use client";

import { raleway } from "@/public/fonts";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog/dialog";
import { Button } from "../ui/button/button";
import google from "@/public/google-icon-logo-svgrepo-com.svg";
import Image from "next/image";
import { signInWithGoogle } from "@/src/lib/auth/sign-in-with-google";
import logo from "@/public/Logo.svg";

export default function LandingHeader() {
  return (
    <header className="flex h-16 items-center justify-between px-8 bg-primary sticky top-0 border-b border-b-border">
      <Link
        href="/"
        className={`${raleway.className} flex gap-2 text-[1.75rem] text-primary-foreground`}
      >
        <Image src={logo} alt="Itadaki logo" width={32} height={32} />
        <span>Itadaki</span>
      </Link>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="accent">Create Recipe</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle className="mb-4 text-tertiary">
            Wanna Cook Easier?
          </DialogTitle>
          <DialogDescription className="mb-6">
            Itadaki is an app to reduce your time thinking of what recipes to
            make. Just take a photo of your receipt of groceries; the app will
            generate a recipe in seconds.
          </DialogDescription>
          <Button
            variant="login"
            className="w-full px-6"
            centerText
            icon={
              <Image src={google} alt="Google Logo" height={16} width={16} />
            }
            onClick={signInWithGoogle}
          >
            <span>Continue with Google</span>
          </Button>
        </DialogContent>
      </Dialog>
    </header>
  );
}
