import styles from "./ChapterIndex.module.css";

/** Diamond-framed chapter number shown at the top of each dark chapter. */
export function ChapterIndex({ n, className = "" }: { n: number; className?: string }) {
  return (
    <div className={`${styles.index} fs-label ${className}`}>
      <span>{n}</span>
    </div>
  );
}

/** Hairline rule that sits to the right of the chapter diamond. */
export function ChapterLine({ className = "" }: { className?: string }) {
  return <div className={`${styles.line} ${className}`} />;
}
