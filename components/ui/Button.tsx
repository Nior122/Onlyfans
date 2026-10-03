"use client";

import { forwardRef } from "react";
import { buttonClass, type ButtonSize, type ButtonVariant } from "@/components/ui/buttonClass";

export { buttonClass };
export type { ButtonSize, ButtonVariant };

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/**
 * The only button in the system: three variants, three heights (36px default,
 * 40px for a screen's main action, icon buttons that grow to 40px on touch).
 * Icon sizing is enforced here so every button aligns the same way.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, type = "button", ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClass({ variant, size, className })} {...props} />
  );
});
