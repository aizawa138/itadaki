"use client";

import {
  DialogContent,
  Dialog,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog/dialog";
import { Button } from "@/src/components/ui/button/button";
import Image from "next/image";
import google from "@/public/google-icon-logo-svgrepo-com.svg";
import { signInWithGoogle } from "@/src/lib/auth/sign-in-with-google";

export default function Login() {
  return (
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
          icon={<Image src={google} alt="Google Logo" height={16} width={16} />}
          onClick={signInWithGoogle}
        >
          <span>Continue with Google</span>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
