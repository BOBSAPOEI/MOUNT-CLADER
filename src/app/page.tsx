import { SiteChrome } from "@/components/montfort/layout/SiteChrome";
import { Footer } from "@/components/montfort/layout/Footer";
import { Scene } from "@/components/montfort/scene/Scene";
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
      <Scene />
      <SiteChrome />
      <main>
        <div id="TopChapters">
          <Hero />
          <WhoWeAre />
          <WhatWeDo />
          <GlobalConnectivity />
        </div>
        <div id="Sustainability" data-chapter-theme="light">
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
