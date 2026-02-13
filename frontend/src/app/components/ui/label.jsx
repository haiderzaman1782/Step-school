import * as React from "react";
import * as RadixUI from "@radix-ui/react-label";
import { cn } from "./utils.js";

const LabelPrimitive = RadixUI;

function Label({ className, ...props }) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  );
}

export { Label };

