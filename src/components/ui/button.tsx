import { type ComponentProps } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  secondary: "bg-white text-brand border border-brand hover:bg-brand-tint",
  ghost: "bg-transparent text-brand hover:bg-brand-tint",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-4 py-2",
  md: "text-[15px] px-5 py-3",
  lg: "text-base px-6 py-3.5",
};

const base =
  "inline-flex items-center justify-center rounded-md font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none";

type ButtonOwnProps = {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonOwnProps & ComponentProps<"button">) {
  return (
    <button
      className={`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonOwnProps & ComponentProps<typeof Link>) {
  return (
    <Link
      className={`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}
