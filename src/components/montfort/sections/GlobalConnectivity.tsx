import { CITIES } from "@/lib/montfort/content";
import { ScrubText } from "../motion/ScrubText";
import styles from "./GlobalConnectivity.module.css";

/** Globe chapter: headline over the 3D earth, with city labels tracked onto it by the scene. */
export function GlobalConnectivity() {
  return (
    <section id="GlobalConnectivity" data-chapter-theme="light" data-cursor="draggable" className={styles.section}>
      <div className="mf-grid">
        <ScrubText
          className="fs-h2 uppercase tb:col-end-4 dk:col-start-7 dk:col-end-22 wide:col-start-10"
          from="rgba(255,255,255,0.3)"
          to="#ffffff"
        >
          Established in the world’s major trade hubs and financial markets with over 15 global offices, we connect and serve both emerging and mature markets worldwide.
        </ScrubText>
      </div>
      {CITIES.map((c) => (
        <p key={c.name} className={`${styles.point} fs-cta-s uppercase`} data-point data-longitude={c.lon} data-latitude={c.lat}>
          <span>{c.name}</span>
        </p>
      ))}
    </section>
  );
}
