import { Footer } from "@/components/montfort/layout/Footer";
import { Equality } from "@/components/montfort/sections/Equality";
import { GlobalConnectivity } from "@/components/montfort/sections/GlobalConnectivity";
import { Hero } from "@/components/montfort/sections/Hero";
import { Social } from "@/components/montfort/sections/Social";
import { Solutions } from "@/components/montfort/sections/Solutions";
import { Sustainability } from "@/components/montfort/sections/Sustainability";
import { WhatWeDo } from "@/components/montfort/sections/WhatWeDo";
import { WhoWeAre } from "@/components/montfort/sections/WhoWeAre";

export default function Home() {
  return (
    <>
      <main data-scene="Homepage">
        <div id="TopChapters" data-chapter="TopChapters" data-chapter-first="true">
          <Hero />
          <WhoWeAre />
          <WhatWeDo />
          <GlobalConnectivity />
        </div>
        <div id="Sustainability" data-chapter="Sustainability" data-chapter-theme="light">
          <Sustainability />
          <Solutions />
          <Equality />
          <Social />
        </div>
      </main>
      <Footer />
    </>
  );
}
