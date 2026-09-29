import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFF200]/40 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#F3E700] text-black font-bold uppercase tracking-[1.4px] hover:bg-[#FFF200] rounded-full shadow-[0_4px_14px_rgba(243,231,0,0.25)] hover:shadow-[0_6px_20px_rgba(255,242,0,0.35)]",
        secondary:
          "bg-[#1f1f1f] text-[#ffffff] hover:bg-[#272727] border border-[#3a3a3a] rounded-full shadow-sm",
        outline:
          "border border-[#4d4d4d] bg-transparent text-[#ffffff] hover:bg-[#1f1f1f] hover:border-[#7c7c7c] rounded-full",
        destructive:
          "bg-[#f3727f]/15 border border-[#f3727f]/40 text-[#f3727f] hover:bg-[#f3727f]/25 rounded-full",
        ghost:
          "text-[#b3b3b3] hover:text-[#ffffff] hover:bg-[#1f1f1f] rounded-full",
        link:
          "text-[#F3E700] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2.5 text-sm",
        sm: "h-9 rounded-full px-4 text-xs font-semibold uppercase tracking-[1.2px]",
        lg: "h-13 rounded-full px-8 text-base font-bold uppercase tracking-[1.5px]",
        icon: "h-10 w-10 rounded-full p-0 flex items-center justify-center",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
