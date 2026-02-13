"use client";

import * as React from "react";
import * as RadixUI from "@radix-ui/react-avatar";

const AvatarPrimitive = RadixUI;

function Avatar({
  className,
  children,
  ...props
}) {
  return (
    <AvatarPrimitive.Root
      className={className} {...props} >
      {children}
    </AvatarPrimitive.Root>
  );
}

function AvatarImage({
  className,
  children,
  ...props
}) {
  return (
    <AvatarPrimitive.Image
      className={className} {...props} >
      {children}
    </AvatarPrimitive.Image>
  );
}

function AvatarFallback({
  className,
  children,
  ...props
}) {
  return (
    <AvatarPrimitive.Fallback
      className={className} {...props} >
      {children}
    </AvatarPrimitive.Fallback>
  );
}

export { Avatar, AvatarImage, AvatarFallback };

