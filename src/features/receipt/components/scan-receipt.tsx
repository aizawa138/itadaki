"use client";

import Image from "next/image";
import { useState } from "react";
import uploadIcon from "@/public/add_photo_alternate_outlined.svg";

export default function ScanReceipt() {
  const [previewUrl, setPreviewUrl] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    const image = URL.createObjectURL(file);
    setPreviewUrl(image);
  };
  return (
    <>
      <label
        htmlFor="receipt"
        className={`w-full border border-gray-300 rounded-2xl bg-background text-foreground hover:cursor-pointer flex flex-col items-center justify-center text-lg h-100 font-semibold ${previewUrl ? "hidden" : "block"}`}
      >
        <Image src={uploadIcon} alt="Upload image" width={50} height={50} />
        <p>Upload your receipt here</p>
      </label>
      <input
        type="file"
        className={`w-full border border-gray-300 rounded-2xl bg-background text-foreground hover:cursor-pointer text-xl h-100 font-semibold items-center justify-center hidden`}
        required
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        name="receipt"
        id="receipt"
        capture="environment"
        onChange={(e) => handleInputChange(e)}
      />
      {previewUrl ? (
        <label
          htmlFor="receipt"
          className="group relative rounded-2xl border border-gray-300"
        >
          <Image
            src={previewUrl}
            alt="Receipt image"
            width={100}
            height={200}
            className="w-full h-100 object-fill rounded-2xl hover:opacity-60 transition hover:cursor-pointer"
          />
          <Image
            src={uploadIcon}
            alt="Upload image"
            width={50}
            height={50}
            className="absolute transition opacity-0 group-hover:opacity-80 translate-x-[-50%] translate-y-[-50%] top-1/2 left-1/2"
          />
        </label>
      ) : (
        ""
      )}
    </>
  );
}
