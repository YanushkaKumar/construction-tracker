import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-transparent",
    "bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all duration-200 ease-out",
    "outline-none select-none cursor-pointer",
    "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1",
    "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40",
    "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background border-transparent shadow-surface " +
          "hover:brightness-110 hover:shadow-elevated " +
          "dark:bg-foreground dark:text-background",
        primary:
          "bg-gradient-to-b from-primary to-primary/95 text-primary-foreground " +
          "border border-primary/20 shadow-[0_1px_2px_rgba(0,0,0,0.07),inset_0_1px_0_rgba(255,255,255,0.12)] " +
          "hover:brightness-105 hover:shadow-elevated active:brightness-95",
        outline:
          "border border-border/60 bg-card text-foreground/80 shadow-surface " +
          "hover:bg-accent hover:text-foreground hover:border-border",
        secondary:
          "border border-border/40 bg-accent/50 text-foreground/80 shadow-surface " +
          "hover:bg-accent hover:text-foreground",
        ghost:
          "text-muted-foreground hover:bg-accent hover:text-foreground border-transparent",
        destructive:
          "bg-danger-subtle text-danger border border-danger/25 " +
          "hover:bg-danger-subtle hover:border-danger/40 " +
          "active:bg-danger/15",
        success:
          "bg-success-subtle text-success border border-success/25 " +
          "hover:bg-success-subtle hover:border-success/40",
        warning:
          "bg-warning-subtle text-warning border border-warning/25 " +
          "hover:bg-warning-subtle hover:border-warning/40",
        link:
          "text-primary underline-offset-4 hover:underline border-transparent p-0 h-auto",
        premium:
          "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 shadow-elevated " +
          "hover:brightness-110 hover:shadow-modal",
      },
      size: {
        default: "h-9 px-3.5 text-[13.5px] [&_svg:not([class*='size-'])]:size-4",
        xs:      "h-7 px-2.5 text-[11px] rounded-lg [&_svg:not([class*='size-'])]:size-3",
        sm:      "h-8 px-3 text-[12.5px] rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        lg:      "h-10 px-5 text-[14.5px] [&_svg:not([class*='size-'])]:size-4.5",
        xl:      "h-12 px-6 text-[15px] rounded-xl [&_svg:not([class*='size-'])]:size-5",
        icon:    "size-9 [&_svg:not([class*='size-'])]:size-4",
        "icon-xs": "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8 rounded-lg [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-10 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps
  extends ButtonPrimitive.Props,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  loadingText?: string;
}

function Button({
  className,
  variant = "default",
  size = "default",
  loading,
  loadingText,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      disabled={disabled || loading}
      aria-busy={loading ?? undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading && (
        <Loader2
          className="animate-spin !size-3.5 -ml-0.5"
          aria-hidden="true"
        />
      )}
      {loading && loadingText ? loadingText : children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
