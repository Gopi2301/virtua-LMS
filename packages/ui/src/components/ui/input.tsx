import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] px-4 py-2 text-sm text-[#ffffff] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#7c7c7c] focus-visible:outline-none focus-visible:border-[#FFF200] focus-visible:ring-2 focus-visible:ring-[#FFF200]/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
