"use client";

import { useState } from "react";
import { SOLUTIONS } from "@/lib/montfort/content";
import { Reveal } from "../motion/Reveal";
import { ScrubText } from "../motion/ScrubText";
import { ChapterIndex, ChapterLine } from "../ui/ChapterIndex";
import { ReadMore } from "../ui/ReadMore";
import { SOLUTION_ICONS } from "../ui/solution-icons";
import styles from "./Solutions.module.css";

/** Chapter 2: sustainable energy solutions with Environmental / Social / Governance tabs. */
export function Solutions() {
  const [active, setActive] = useState(0);
  let iconIndex = 0;

  return (
    <section className={styles.section}>
      <div className={`mf-grid ${styles.head}`}>
        <Reveal className="dk:col-start-3 dk:col-end-5 wide:col-start-7 wide:col-end-9">
          <ChapterIndex n={2} />
        </Reveal>
        <Reveal variant="line" className="dk:col-start-12 dk:col-end-23 wide:col-start-13 wide:col-end-22">
          <ChapterLine />
        </Reveal>
        <ScrubText
          className={`fs-h2 ${styles.title} uppercase dk:col-start-3 dk:col-end-22 wide:col-start-7 wide:col-end-22`}
          from="rgba(255,255,255,0.3)"
          to="#ffffff"
        >
          DELIVERING SUSTAINABLE ENERGY SOLUTIONS
        </ScrubText>
      </div>
      <div className="mf-grid-bleed">
        <div className={`fs-s1 ${styles.description} dk:col-start-4 dk:col-end-11 wide:col-start-7 wide:col-end-12`}>
          <Reveal>
            <ReadMore lines={7} tone="grey" textClassName="fs-body text-white">
              <p>
                We are dedicated to fostering a future where energy is both sustainable and accessible. Our strategy includes innovative practices to reduce environmental impact and promote renewable energy sources. By connecting people, ingenuity, and resources with a shared vision of value and prosperity, we aim to create a resilient energy ecosystem. This includes optimizing supply chains, investing in clean energy projects, and adhering to high environmental standards. Through these efforts, we drive sustainable growth and positively impact the global energy landscape.
              </p>
            </ReadMore>
          </Reveal>
        </div>
        <div className={`${styles.container} dk:col-start-12 dk:col-end-23 wide:col-start-13 wide:col-end-22`}>
          <div className={styles.tabs} role="tablist">
            {SOLUTIONS.map((s, i) => (
              <button key={s.tab} role="tab" aria-selected={i === active} className={`${styles.tab} fs-label text-white ${i === active ? styles.active : ""}`} onClick={() => setActive(i)} data-cursor="clickable">
                {s.tab}
              </button>
            ))}
          </div>
          <div className={styles.panels}>
            {SOLUTIONS.map((s, i) => (
              <div key={s.tab} role="tabpanel" className={`${styles.panel} ${i === active ? styles.active : ""}`} aria-hidden={i !== active}>
                <p className="fs-body text-white">{s.intro}</p>
                <div className={styles.items}>
                  {s.items.map((item) => {
                    const Icon = SOLUTION_ICONS[iconIndex++];
                    return (
                      <div key={item} className={styles.item}>
                        <div className={styles.icon}>
                          <Icon />
                        </div>
                        <p className="fs-body-s text-white">{item}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
