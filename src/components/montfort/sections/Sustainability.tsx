import { ETHICS } from "@/lib/montfort/content";
import { Reveal } from "../motion/Reveal";
import { ScrubText } from "../motion/ScrubText";
import { ChapterIndex, ChapterLine } from "../ui/ChapterIndex";
import styles from "./Sustainability.module.css";

/** Chapter 1: introduction to the sustainability framework and the ethics & compliance copy. */
export function Sustainability() {
  return (
    <section className={`mf-grid ${styles.section}`}>
      <Reveal as="p" className={`fs-h5 ${styles.lead} text-white dk:col-start-3 dk:col-end-14 wide:col-start-7 wide:col-end-14`}>
        We are committed to integrating responsibility into every campaign we create — building brands that respect people and the planet. We recognize the profound and lasting impact our work has on people, communities, and the environment.
      </Reveal>
      <Reveal className="dk:col-start-3 dk:col-end-5 wide:col-start-7 wide:col-end-9">
        <ChapterIndex n={1} />
      </Reveal>
      <Reveal variant="line" className="dk:col-start-12 dk:col-end-23 wide:col-start-13 wide:col-end-22">
        <ChapterLine />
      </Reveal>
      <ScrubText
        className={`fs-h2 ${styles.title} uppercase dk:col-start-3 dk:col-end-22 wide:col-start-7 wide:col-end-22`}
        from="rgba(255,255,255,0.3)"
        to="#ffffff"
      >
        Our ethics and compliance framework
      </ScrubText>
      <Reveal as="p" className={`fs-s1 ${styles.description} text-white dk:col-start-3 dk:col-end-11 wide:col-start-7 wide:col-end-12`}>
        At Calder, we operate under an integrated Sustainability Framework and adhere to strict corporate governance principles that allow us to drive transformative social and environmental progress.
      </Reveal>
      <div className={`${styles.paragraphs} dk:col-start-12 dk:col-end-23 wide:col-start-13 wide:col-end-22`}>
        {ETHICS.map((text) => (
          <Reveal as="p" key={text} className="fs-body text-white">
            {text}
          </Reveal>
        ))}
      </div>
    </section>
  );
}
