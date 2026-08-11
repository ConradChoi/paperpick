import { type ComponentProps } from "react";

type CheckboxProps = {
  label: string;
} & ComponentProps<"input">;

export function Checkbox({ label, id, className = "", ...props }: CheckboxProps) {
  const inputId = id ?? props.name;
  return (
    <label
      htmlFor={inputId}
      className={`flex items-start gap-2 cursor-pointer select-none ${className}`}
    >
      <input
        type="checkbox"
        id={inputId}
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-line text-brand accent-brand focus:ring-2 focus:ring-brand-tint"
        {...props}
      />
      <span className="text-sm text-ink">{label}</span>
    </label>
  );
}
