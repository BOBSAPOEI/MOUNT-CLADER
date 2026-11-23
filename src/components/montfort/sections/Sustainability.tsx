import { ETHICS } from "@/lib/montfort/content";
import { Reveal } from "../motion/Reveal";
import { ScrubText } from "../motion/ScrubText";
import { ChapterIndex, ChapterLine } from "../ui/ChapterIndex";
import styles from "./Sustainability.module.css";

/** Chapter 1: the responsibility introduction and the six principles of how we do business. */
export function Sustainability() {
  return (
    <section className={`mf-grid ${styles.section}`}>
      <Reveal as="p" className={`fs-h5 ${styles.lead} text-white dk:col-start-3 dk:col-end-14 wide:col-start-7 wide:col-end-14`}>
        Marketing shapes what people see, buy and believe. We take that influence seriously, and hold our work to standards that our clients, their audiences and our own people can be proud of.
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
        How we do business
      </ScrubText>
      <Reveal as="p" className={`fs-s1 ${styles.description} text-white dk:col-start-3 dk:col-end-11 wide:col-start-7 wide:col-end-12`}>
        Clear principles, applied every day, not just written down once.
      </Reveal>
      <div className={`${styles.paragraphs} dk:col-start-12 dk:col-end-23 wide:col-start-13 wide:col-end-22`}>
        {ETHICS.map((e) => (
          <Reveal as="p" key={e.title} className="fs-body text-white">
            <strong className={styles.principle}>{e.title}</strong> {e.body}
          </Reveal>
        ))}
      </div>
    </section>
  );
}
