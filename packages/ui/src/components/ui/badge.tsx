import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)]",
        secondary:
          "border-[#4d4d4d] bg-[#1f1f1f] text-[#ffffff] hover:bg-[#252525]",
        destructive:
          "border-transparent bg-[#f3727f]/20 text-[#f3727f] border-[#f3727f]/30",
        outline: "border-[#4d4d4d] text-[#b3b3b3]",
        success:
          "border-transparent bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]",
        warning: "border-[#ffa42b]/30 bg-[#ffa42b]/10 text-[#ffa42b]",
        info: "border-[#539df5]/30 bg-[#539df5]/10 text-[#539df5]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
