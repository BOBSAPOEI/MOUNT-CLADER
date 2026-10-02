import { ArrowIcon } from "./icons";
import styles from "./LinkBlock.module.css";

interface LinkBlockProps {
  href: string;
  label: string;
  tone?: "navy" | "white";
  className?: string;
}

/** Underlined call-to-action with a circular arrow that swaps sides on hover. */
export function LinkBlock({ href, label, tone = "navy", className = "" }: LinkBlockProps) {
  return (
    <a href={href} className={`${styles.link} ${styles[tone]} ${className}`} data-cursor="clickable">
      <div className={`${styles.wrapper} ${styles.wrapperLeft}`}>
        <div className={`${styles.arrow} ${styles.arrowLeft}`}>
          <ArrowIcon />
        </div>
      </div>
      <span className={styles.label}>{label}</span>
      <div className={`${styles.wrapper} ${styles.wrapperRight}`}>
        <div className={`${styles.arrow} ${styles.arrowRight}`}>
          <ArrowIcon />
        </div>
      </div>
    </a>
  );
}
