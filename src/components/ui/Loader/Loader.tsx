import styles from "./Loader.module.css";

type LoaderProps = {
  size?: number;
  className?: string;
  label?: string;
};

export default function Loader({
  size = 36,
  className = "",
  label = "Loading",
}: LoaderProps) {
  return (
    <div
      className={`${styles.loader} ${className}`.trim()}
      style={{ width: size, height: size }}
      role="status"
      aria-label={label}
    />
  );
}
