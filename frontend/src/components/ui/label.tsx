import type * as React from "react";
import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    // Generic shadcn label — htmlFor is supplied by callers.
    // biome-ignore lint/a11y/noLabelWithoutControl: paired with inputs via htmlFor in forms
    <label
      className={cn(
        "text-sm font-medium leading-none text-[var(--color-foreground)]",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
