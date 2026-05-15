import * as React from "react";
import cn from "@/src/utils/cn";
import { cva, VariantProps } from "class-variance-authority";

const bentoCardVariants = cva(
  "relative rounded-2xl bg-background border border-gray-300",
  {
    variants: {
      variant: {
        default: "",
        skeleton: "",
      },
      size: {
        hero: "col-span-3 row-span-4",
        wide: "col-span-3 row-span-2",
        square: "col-span-2 row-span-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "square",
    },
  },
);

export type BentoCardProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof bentoCardVariants> & {
    title: string;
  };

const BentoCard = React.forwardRef<HTMLDivElement, BentoCardProps>(
  ({ children, className, title, variant, size, ...props }, ref) => (
    <div
      className={cn(bentoCardVariants({ variant, size }), className)}
      ref={ref}
      {...props}
    >
      <h2 className="absolute bottom-4 left-4 text-2xl">{title}</h2>
      {children}
    </div>
  ),
);

BentoCard.displayName = "Bento Card";

export { BentoCard, bentoCardVariants };
