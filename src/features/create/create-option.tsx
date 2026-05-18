import { StaticImageData } from "next/image";
import Image from "next/image";
import cn from "@/src/utils/cn";

type CreateOptionProps = {
  title: string;
  children: React.ReactNode;
  src: StaticImageData;
  onClick: () => void;
  className?: string;
};

export default function CreateOption({
  title,
  children,
  src,
  onClick,
  className,
}: CreateOptionProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-300 w-full sm:w-1/2 max-w-lg transition hover:cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      <Image
        src={src}
        alt="Image of create option"
        className="rounded-t-xl object-cover w-full h-32"
        width={640}
        height={256}
      />
      <div className="p-3 bg-background">
        <h2 className="text-lg text-foreground font-semibold mb-1">{title}</h2>
        <p className="text-gray-600 text-xs">{children}</p>
      </div>
    </div>
  );
}
