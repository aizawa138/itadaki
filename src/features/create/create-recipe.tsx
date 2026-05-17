"use client";

import {
  DialogContent,
  Dialog,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog/dialog";
import { Button } from "@/src/components/ui/button/button";

export default function CreateRecipe() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          + Create Recipe
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="mb-4 text-tertiary">How to create?</DialogTitle>
        <DialogDescription className="mb-6">
          Start off with uploading your receipt to the pantry. The app will
          generate a recipe depending on the items in your pantry.
        </DialogDescription>

        <Button variant="secondary" size="default" className="w-full">
          Create Recipe
        </Button>
      </DialogContent>
    </Dialog>
  );
}
