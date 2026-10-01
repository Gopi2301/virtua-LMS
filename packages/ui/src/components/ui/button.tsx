import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold gap-2 rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary-focus)] rounded-md",
        secondary:
          "bg-[#1f1f1f] text-[#ffffff] hover:bg-[#272727] border border-[#3a3a3a] rounded-md",
        outline:
          "border border-[#4d4d4d] bg-transparent text-[#ffffff] hover:bg-[#1f1f1f] hover:border-[#7c7c7c] rounded-md",
        destructive:
          "bg-[#f3727f]/15 border border-[#f3727f]/40 text-[#f3727f] hover:bg-[#f3727f]/25 rounded-md",
        ghost:
          "text-[#b3b3b3] hover:text-[#ffffff] hover:bg-[#1f1f1f] rounded-md",
        link: "text-[var(--color-primary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2.5 text-sm",
        sm: "h-9 rounded-md px-4 text-sm font-medium",
        lg: "h-13 rounded-md px-8 text-base font-semibold",
        icon: "h-10 w-10 rounded-md p-0 flex items-center justify-center",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
