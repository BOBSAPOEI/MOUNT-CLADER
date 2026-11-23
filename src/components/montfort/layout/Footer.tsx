import { NAV, OFFICES, TERMS } from "@/lib/montfort/content";
import { FooterLogo } from "../ui/icons";
import styles from "./Footer.module.css";

/** White site footer: division links, the three offices, logo and copyright. */
export function Footer() {
  return (
    <footer id="footer" className={styles.footer} data-chapter-theme="dark">
      <div className="mf-grid">
        <div className={`${styles.left} dk:col-start-3 dk:col-end-10 ml:col-end-9 wide:col-start-4 wide:col-end-10`}>
          <ul className={styles.links}>
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="fs-cta-s">
                  {n.name}
                </a>
              </li>
            ))}
          </ul>
          <ul className={styles.legals}>
            {TERMS.map((t) => (
              <li key={t.href}>
                <a href={t.href} className="fs-cta-s">
                  {t.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className={`${styles.right} dk:col-start-3 ml:col-start-10 ml:col-end-24 wide:col-start-11 wide:col-end-21`}>
          {OFFICES.map((o) => (
            <div key={o.name} className={styles.office}>
              <div>
                <h2>{o.name}</h2>
                <p className={`${styles.role} fs-body-s`}>{o.role}</p>
              </div>
              <p className={`${styles.focus} fs-body-s`}>{o.focus}</p>
            </div>
          ))}
        </div>
        <div className={`${styles.line} dk:col-start-3 dk:col-end-24 wide:col-start-4 wide:col-end-21`} />
        <div className={`${styles.legal} dk:col-start-3 dk:col-end-10 ml:col-end-9 wide:col-start-4 wide:col-end-10`}>
          <FooterLogo width={243} height={37} />
        </div>
        <p className={`${styles.copyright} fs-body-s dk:col-start-3 dk:col-end-24 ml:col-start-10 wide:col-start-11 wide:col-end-21`}>© 2026 Calder Group. All rights reserved.</p>
      </div>
    </footer>
  );
}
