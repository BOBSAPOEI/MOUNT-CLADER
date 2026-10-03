import { DIVISIONS } from "@/lib/montfort/content";
import { Reveal } from "../motion/Reveal";
import { ScrubText } from "../motion/ScrubText";
import { LinkBlock } from "../ui/LinkBlock";
import { ReadMore } from "../ui/ReadMore";
import styles from "./WhatWeDo.module.css";

/** Divisions overview: headline, expandable intro and the four business divisions. */
export function WhatWeDo() {
  return (
    <section id="WhatWeDo" data-chapter="WhatWeDo" className="pt-24 dk:pt-40" style={{ paddingBottom: "calc(100 * var(--lvh) + 13.25rem)" }}>
      <div data-chapter-theme="dark">
        <div className="mf-grid">
          <ScrubText
            className="fs-h2 mb-[8.75rem] uppercase text-navy-2 tb:col-end-4 dk:col-start-5 dk:col-end-19 dk:mb-[12.5rem] wide:col-start-7 wide:col-end-17"
            from="#81a0bb"
            to="#2d628c"
          >
            We provide marketing solutions with integrity and efficiency through our different business divisions.
          </ScrubText>
          <div className="tb:col-start-2 dk:col-start-14 dk:col-end-22 wide:col-start-15 wide:col-end-21">
            <Reveal>
              <ReadMore lines={4} tone="secondary" textClassName="text-navy">
                <p className="fs-s1">
                  Calder&apos;s interlinked divisions complement each other, providing integrated services that leverage their combined expertise. This synergy enhances our operational efficiency, enabling us to drive collective success for brands worldwide and deliver exceptional value to our stakeholders.
                </p>
              </ReadMore>
            </Reveal>
          </div>
        </div>
      </div>
      <div data-chapter-theme="light">
        <div className={`mf-grid ${styles.divisions}`}>
          {DIVISIONS.map((d, i) => {
            const left = i % 2 === 0;
            return (
              <div
                key={d.href}
                className={`${styles.item} ${left ? "tb:col-start-1 tb:col-end-4 dk:col-start-5 dk:col-end-18 wide:col-start-7 wide:col-end-14" : "tb:col-start-2 tb:col-end-5 dk:col-start-12 dk:col-end-24 wide:col-start-16 wide:col-end-23"}`}
                style={{ gridRow: i + 2 }}
              >
                <Reveal className={styles.index}>
                  <span className="fs-label">{i + 1}</span>
                </Reveal>
                <div className={styles.content}>
                  <Reveal as="h3" className="fs-h4 text-white">
                    {d.name}
                  </Reveal>
                  <ScrubText as="h4" className="fs-h3 text-white" from="rgba(255,255,255,0.3)" to="#ffffff">
                    {d.title}
                  </ScrubText>
                  <Reveal className={styles.link}>
                    <LinkBlock href={d.href} label={d.name} tone="white" />
                  </Reveal>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
