type Style = "neutral" | "info" | "success" | "error" | "warning";

const styleClasses: Record<Style, string> = {
  neutral: "bg-surface-muted text-ink-muted",
  info: "bg-brand-tint text-brand",
  success: "bg-success-tint text-success",
  error: "bg-error-tint text-error",
  warning: "bg-warning-tint text-warning",
};

export function Badge({
  style = "neutral",
  children,
}: {
  style?: Style;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${styleClasses[style]}`}
    >
      {children}
    </span>
  );
}
