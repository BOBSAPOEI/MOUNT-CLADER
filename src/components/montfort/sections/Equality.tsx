import { Reveal } from "../motion/Reveal";
import { ScrubText } from "../motion/ScrubText";
import { ChapterIndex, ChapterLine } from "../ui/ChapterIndex";
import styles from "./Equality.module.css";

/** Chapter 3: "Equal by default". */
export function Equality() {
  return (
    <section id="Equality" className={`mf-grid ${styles.section}`}>
      <Reveal className="dk:col-start-3 dk:col-end-5 wide:col-start-7 wide:col-end-9">
        <ChapterIndex n={3} />
      </Reveal>
      <Reveal variant="line" className="dk:col-start-12 dk:col-end-23 wide:col-start-13 wide:col-end-22">
        <ChapterLine />
      </Reveal>
      <ScrubText
        className={`fs-h2 ${styles.title} uppercase dk:col-start-3 dk:col-end-22 wide:col-start-7 wide:col-end-22`}
        from="rgba(255,255,255,0.3)"
        to="#ffffff"
      >
        Equal by default
      </ScrubText>
      <Reveal className={`fs-s1 ${styles.description} text-white dk:col-start-3 dk:col-end-11 wide:col-start-7 wide:col-end-12`}>
        The best ideas come from teams that reflect the audiences they serve.
      </Reveal>
      <Reveal className="fs-body text-white dk:col-start-12 dk:col-end-23 wide:col-start-13 wide:col-end-22">
        We hire for talent and perspective, pay the same for the same role and open every leadership position to everyone. Mentoring and flexible working help our people grow without choosing between career and life.
      </Reveal>
    </section>
  );
}
