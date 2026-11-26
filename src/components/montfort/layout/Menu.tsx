import { NAV, TERMS } from "@/lib/montfort/content";
import { ArrowIcon } from "../ui/icons";
import styles from "./Menu.module.css";

/** Full-screen navigation overlay opened from the header's menu button. */
export function Menu({ open, active = 0, onNavigate }: { open: boolean; active?: number; onNavigate: () => void }) {
  return (
    <div className={`${styles.menu} ${open ? styles.active : ""}`} aria-hidden={!open}>
      <div className={`mf-grid ${styles.gridNav}`}>
        <nav className={`${styles.nav} col-start-1 col-end-5 tb:col-start-2 dk:col-start-5 dk:col-end-14 wide:col-start-6`}>
          <ul>
            {NAV.map((n, i) => (
              <li key={n.href}>
                <a href={n.href} className={`${styles.navLink} ${i === active ? styles.current : ""}`} onClick={onNavigate} tabIndex={open ? 0 : -1} data-cursor="clickable">
                  <div className={styles.circle}>
                    <ArrowIcon />
                  </div>
                  <div className={styles.text}>
                    <span>{n.name}</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className={`mf-grid ${styles.gridTerms}`}>
        <div className={`${styles.terms} col-start-3 col-end-5 tb:col-start-1 dk:col-start-3 dk:col-end-20 wide:col-start-4`}>
          <ul>
            {TERMS.map((t) => (
              <li key={t.href}>
                <a href={t.href} onClick={onNavigate} tabIndex={open ? 0 : -1} data-cursor="clickable">
                  <span>{t.name}</span>
                  <span>{t.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className={styles.overlay} />
    </div>
  );
}
