import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-zinc-200 bg-zinc-50/25 px-2.5 py-1 text-base transition-all duration-200 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-[inset_0_1px_1.5px_rgba(0,0,0,0.02)] focus-visible:border-zinc-900 focus-visible:ring-3 focus-visible:ring-zinc-950/5 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:border-zinc-800/80 dark:bg-zinc-950/20 dark:shadow-[inset_0_1px_1.5px_rgba(0,0,0,0.1)] dark:focus-visible:border-zinc-300 dark:focus-visible:ring-white/5",
        className
      )}
      {...props}
    />
  )
}

export { Input }
