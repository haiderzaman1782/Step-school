"use client";

import * as React from "react";
import * as RadixUI from "@radix-ui/react-popover";

import { cn } from "./utils.js";

const PopoverPrimitive = RadixUI;

function Popover({
  ...props
}) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
  ...props
}) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = "center",
  ...props
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={props.align ? props.align : "center"}
        sideOffset={props.sideOffset ? props.sideOffset : 4}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]-in data-[state=closed]-out data-[state=closed]-out-0 data-[state=open]-in-0 data-[state=closed]-out-95 data-[state=open]-in-95 data-[side=bottom]-in-from-top-2 data-[side=left]-in-from-right-2 data-[side=right]-in-from-left-2 data-[side=top]-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

function PopoverAnchor({
  ...props
}) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };

