import { ScrubText } from "../motion/ScrubText";
import { Reveal } from "../motion/Reveal";
import { LinkBlock } from "../ui/LinkBlock";

/** Intro: statement headline, short paragraph and a link down to the divisions. */
export function WhoWeAre() {
  return (
    <section id="WhoWeAre" data-chapter="WhoWeAre" data-chapter-theme="dark" className="py-24 dk:py-40">
      <div className="mf-grid">
        <ScrubText
          className="fs-h2 mb-[8.75rem] uppercase text-navy-2 tb:col-end-4 dk:col-start-10 dk:col-end-23 dk:mb-[12.5rem] wide:col-start-14"
          from="#81a0bb"
          to="#2d628c"
        >
          Calder helps ambitious brands rise above the noise.
        </ScrubText>
        <div className="dk:col-start-5 dk:col-end-13 wide:col-start-7">
          <Reveal className="fs-s1 text-navy">
            <p>We are a marketing group of strategists, storytellers, media planners and data specialists. Together we find the clearest route from attention to growth, then stay with you all the way up.</p>
          </Reveal>
          <Reveal className="mt-11 dk:mt-[5.75rem]">
            <LinkBlock href="/#WhatWeDo" label="Our divisions" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
