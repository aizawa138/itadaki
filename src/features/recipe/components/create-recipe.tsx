"use client";

import {
  Dialog,
  DialogTrigger,
  DialogTitle,
  DialogContent,
  DialogDescription,
} from "@/src/components/ui/dialog/dialog";
import { Button } from "@/src/components/ui/button/button";
import Link from "next/link";

export default function CreateRecipe() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          + Create Recipe
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogTitle className="mb-4 text-tertiary">
          What meal do you look for?
        </DialogTitle>
        <DialogDescription className="mb-6">
          Use ingredients in your pantry to create a recipe. The app will
          suggest recipes by using food which has been stored in your pantry for
          a while or recipes which are easy to cook.
        </DialogDescription>
        <Button
          variant="secondary"
          size="default"
          className="w-full transition"
          asChild
        >
          <Link href="">Create Recipe</Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
