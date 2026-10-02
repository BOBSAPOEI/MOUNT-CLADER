"use client";

import { useState } from "react";
import { ASSET, PILLARS, type Pillar } from "@/lib/montfort/content";
import { Reveal } from "../motion/Reveal";
import { ScrubText } from "../motion/ScrubText";
import { ChapterIndex, ChapterLine } from "../ui/ChapterIndex";
import styles from "./Social.module.css";

const img = (file: string) => `${ASSET}/images/${file}`;

function Logos({ pillar }: { pillar: Pillar }) {
  return (
    <div className={styles.logos}>
      {pillar.logos.map((l) => (
        <div key={l.file} className={styles.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img(l.file)} alt={l.alt} draggable={false} />
        </div>
      ))}
    </div>
  );
}

/** Chapter 4: CSR pillars shown as a three-slide carousel with synced copy. */
export function Social() {
  const [active, setActive] = useState(0);
  const position = (i: number) => (i === active ? "active" : i === (active + 1) % PILLARS.length ? "next" : "prev");

  return (
    <section className={styles.section}>
      <div className={`mf-grid ${styles.head}`}>
        <Reveal className="dk:col-start-3 dk:col-end-5 wide:col-start-7 wide:col-end-9">
          <ChapterIndex n={4} />
        </Reveal>
        <Reveal variant="line" className="dk:col-start-12 dk:col-end-23 wide:col-start-13 wide:col-end-22">
          <ChapterLine />
        </Reveal>
        <ScrubText
          className={`fs-h2 ${styles.title} uppercase dk:col-start-3 dk:col-end-22 wide:col-start-7 wide:col-end-22`}
          from="rgba(255,255,255,0.3)"
          to="#ffffff"
        >
          OUR PLEDGE TO CORPORATE SOCIAL RESPONSIBILITY
        </ScrubText>
        <Reveal as="p" className="fs-s1 mb-20 text-white dk:col-start-12 dk:col-end-23 dk:mb-[9.625rem] wide:col-start-13 wide:col-end-22">
          Giving back to our communities is an imperative part of the work we do. Montfort Group’s CSR efforts are centered around three pillars: supporting education, alleviating poverty, and empowering women.
        </Reveal>
      </div>
      <div className="mf-grid-bleed dk:grid">
        <div className={`${styles.slides} dk:col-start-7 dk:col-end-22 wide:col-start-9 wide:col-end-22`} data-cursor="draggable">
          {PILLARS.map((p, i) => (
            <div key={p.label} className={styles.slide} data-pos={position(i)} onClick={() => setActive(i)}>
              <div className={styles.image}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img(p.image.w682)}
                  srcSet={`${img(p.image.w260)} 260w, ${img(p.image.w400)} 400w, ${img(p.image.w682)} 682w`}
                  sizes="(max-width: 768px) 260px, (max-width: 1024px) 400px, 682px"
                  alt={`Slide ${i + 1}`}
                  width={682}
                  height={392}
                  draggable={false}
                />
              </div>
              <div className={styles.mobileCopy}>
                <h3 className={`${styles.label} fs-label text-white`}>{p.label}</h3>
                <p className={`${styles.body} fs-body text-white`}>{p.body}</p>
                <Logos pillar={p} />
              </div>
            </div>
          ))}
        </div>
        <div className={`${styles.nav} dk:col-start-6 dk:col-end-10 wide:col-start-10 wide:col-end-13`}>
          {PILLARS.map((p, i) => (
            <button key={p.label} className={styles.navButton} onClick={() => setActive(i)} aria-label={`Show slide ${i + 1}`} data-cursor="clickable">
              <div className={`${styles.dot} ${i === active ? styles.active : ""}`} />
            </button>
          ))}
        </div>
        <div className={`${styles.copy} dk:col-start-11 dk:col-end-22 wide:col-start-13 wide:col-end-22`}>
          {PILLARS.map((p, i) => (
            <div key={p.label} className={`${styles.copyItem} ${i === active ? styles.active : ""}`} style={i === 0 ? { position: "relative" } : undefined}>
              <h3 className={`${styles.label} fs-label text-white`}>{p.label}</h3>
              <p className={`${styles.body} fs-body text-white`}>{p.body}</p>
              <Logos pillar={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
