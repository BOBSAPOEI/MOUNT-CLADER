import { Reveal } from "../motion/Reveal";
import { ScrubText } from "../motion/ScrubText";
import { ChapterIndex, ChapterLine } from "../ui/ChapterIndex";
import styles from "./Equality.module.css";

/** Chapter 3: commitment to equality. */
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
        OUR COMMITMENT TO EQUALITY
      </ScrubText>
      <Reveal className={`fs-s1 ${styles.description} text-white dk:col-start-3 dk:col-end-11 wide:col-start-7 wide:col-end-12`}>
        We strive to create an environment where everyone can thrive and contribute to our success.
      </Reveal>
      <Reveal className="fs-body text-white dk:col-start-12 dk:col-end-23 wide:col-start-13 wide:col-end-22">
        Our people come from many nationalities and backgrounds, bringing diverse perspectives to every brief. We are committed to equality at every level, from our studios to our leadership team, and we actively support women into leadership roles across marketing, creative, and technology.
      </Reveal>
    </section>
  );
}
