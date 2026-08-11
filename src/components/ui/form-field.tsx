import { type ComponentProps } from "react";

type FormFieldProps = {
  label: string;
  name: string;
  error?: string;
  helperText?: string;
} & Omit<ComponentProps<"input">, "name">;

export function FormField({
  label,
  name,
  error,
  helperText,
  className = "",
  ...props
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-[13px] font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        className={`rounded-md border px-4 py-3 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand-tint ${
          error ? "border-error" : "border-line"
        } ${className}`}
        aria-invalid={!!error}
        aria-describedby={error || helperText ? `${name}-helper` : undefined}
        {...props}
      />
      {(error || helperText) && (
        <p
          id={`${name}-helper`}
          className={`text-xs ${error ? "text-error" : "text-ink-muted"}`}
        >
          {error ?? helperText}
        </p>
      )}
    </div>
  );
}

export function TextAreaField({
  label,
  name,
  error,
  helperText,
  className = "",
  ...props
}: {
  label: string;
  name: string;
  error?: string;
  helperText?: string;
} & Omit<ComponentProps<"textarea">, "name">) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-[13px] font-medium text-ink">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={4}
        className={`rounded-md border px-4 py-3 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand-tint resize-none ${
          error ? "border-error" : "border-line"
        } ${className}`}
        aria-invalid={!!error}
        {...props}
      />
      {(error || helperText) && (
        <p className={`text-xs ${error ? "text-error" : "text-ink-muted"}`}>
          {error ?? helperText}
        </p>
      )}
    </div>
  );
}
