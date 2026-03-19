import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex flex-1 w-0 max-h-8",
        "placeholder:text-muted-foreground/70 selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input rounded-md border bg-transparent px-2 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm overflow-x-auto overflow-y-hidden text-left file:mr-2",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:border-invalid",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
