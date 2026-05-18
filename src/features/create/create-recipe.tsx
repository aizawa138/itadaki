"use client";

import {
  DialogContent,
  Dialog,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog/dialog";
import { Button } from "@/src/components/ui/button/button";
import CreateOption from "./create-option";
import selectReceipt from "@/public/Select Receipt.svg";
import selectPantry from "@/public/Select Pantry.svg";
import { useState } from "react";

export default function CreateRecipe() {
  const [modeSelected, setModeSelected] = useState(false);
  const [isReceipt, setIsReceipt] = useState(false);

  const handleReceiptClick = () => {
    if (isReceipt) {
      setIsReceipt(false);
      setModeSelected(false);
    } else {
      setIsReceipt(true);
      setModeSelected(true);
    }
  };

  const handlePantryClick = () => {
    if (!isReceipt && modeSelected) {
      setIsReceipt(false);
      setModeSelected(false);
    } else {
      setIsReceipt(false);
      setModeSelected(true);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          + Create Recipe
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogTitle className="mb-4 text-tertiary">How to create?</DialogTitle>
        <DialogDescription className="mb-6">
          Start off with uploading your receipt to the pantry. The app will
          generate a recipe depending on the items in your pantry.
        </DialogDescription>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <CreateOption
            href="/scan"
            src={selectReceipt}
            title="From Receipts"
            onClick={handleReceiptClick}
            className={`${isReceipt && modeSelected ? "outline-2 outline-blue-500" : "outline-0"}`}
          >
            Create a recipe by scanning receipts that you have. The groceries on
            your receipt will be sent to the pantry to create your recipe.
          </CreateOption>
          <CreateOption
            href="/pantry"
            src={selectPantry}
            title="From Pantry"
            onClick={handlePantryClick}
            className={`${!isReceipt && modeSelected ? "outline-2 outline-blue-500" : "outline-0"}`}
          >
            Create a recipe by analyzing what ingredients you have. The
            groceries in the pantry will be reduced once you have created the
            recipe.
          </CreateOption>
        </div>
        <Button
          variant="secondary"
          size="default"
          className="w-full transition"
          disabled={!modeSelected}
        >
          Create Recipe
        </Button>
      </DialogContent>
    </Dialog>
  );
}
