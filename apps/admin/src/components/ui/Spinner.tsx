export default function Spinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="spinner-center" role="status" aria-live="polite" aria-label={label}>
      <div className="spinner" />
      <span className="spinner-label">{label}</span>
    </div>
  );
}
