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
        hero: "col-span-1 sm:col-span-2 lg:col-span-3 row-span-2 sm:row-span-3 lg:row-span-4",
        wide: "col-span-1 sm:col-span-2 lg:col-span-3 row-span-2",
        square:
          "col-span-1 sm:col-span-1 lg:col-span-2 row-span-2 sm:row-span-3",
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
      <h2 className="absolute bottom-6 left-6 text-xl">{title}</h2>
      {children}
    </div>
  ),
);

BentoCard.displayName = "Bento Card";

export { BentoCard, bentoCardVariants };
