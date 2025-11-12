import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95 relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 border border-white/20 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none [&>*]:relative [&>*]:z-10",
        destructive:
          "bg-gradient-to-b from-destructive to-destructive/90 text-white shadow-lg shadow-destructive/25 hover:shadow-xl hover:shadow-destructive/30 border border-white/20 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none [&>*]:relative [&>*]:z-10",
        outline:
          "border-2 border-white/30 dark:border-white/20 bg-white/40 dark:bg-white/5 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/30 hover:bg-white/60 dark:hover:bg-white/10 hover:shadow-xl before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/30 before:to-transparent dark:before:from-white/5 before:pointer-events-none [&>*]:relative [&>*]:z-10 text-foreground",
        secondary:
          "bg-gradient-to-b from-secondary to-secondary/90 text-secondary-foreground shadow-lg shadow-secondary/20 hover:shadow-xl border border-white/20 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none [&>*]:relative [&>*]:z-10",
        ghost:
          "hover:bg-white/40 dark:hover:bg-white/10 backdrop-blur-sm",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md gap-1.5 px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-9",
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

