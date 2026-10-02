import { ScrubText } from "../motion/ScrubText";
import { Reveal } from "../motion/Reveal";
import { LinkBlock } from "../ui/LinkBlock";

/** "Who we are" intro: statement headline, short paragraph and link. */
export function WhoWeAre() {
  return (
    <section id="WhoWeAre" data-chapter="WhoWeAre" data-chapter-theme="dark" className="py-24 dk:py-40">
      <div className="mf-grid">
        <ScrubText
          className="fs-h2 mb-[8.75rem] uppercase text-navy-2 tb:col-end-4 dk:col-start-10 dk:col-end-23 dk:mb-[12.5rem] wide:col-start-14"
          from="#81a0bb"
          to="#2d628c"
        >
          Calder is a global commodity trading and asset investment company.
        </ScrubText>
        <div className="dk:col-start-5 dk:col-end-13 wide:col-start-7">
          <Reveal className="fs-s1 text-navy">
            <p>We trade, refine, store, and transport energy and commodities. We also invest in related assets and provide innovative services with integrity and efficiency to create long-term value for our clients.</p>
          </Reveal>
          <Reveal className="mt-11 dk:mt-[5.75rem]">
            <LinkBlock href="/who-we-are/" label="Who we are" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
