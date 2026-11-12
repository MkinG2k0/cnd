export function AppLoader({
  label = "Загрузка…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={["app-loader", className].filter(Boolean).join(" ")}
      role="status"
      aria-live="polite"
    >
      <span className="app-loader-spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
