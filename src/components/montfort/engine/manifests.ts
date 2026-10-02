import type { Manifest } from "./core/Assets";

/** Loaded once for every page. */
export const GLOBAL_MANIFEST: Manifest = {
  textures: {
    noise: { path: "/assets/textures/noise.webp" },
    perlinNoise: { path: "/assets/textures/perlinNoise.webp" },
    noiseNormal: { path: "/assets/textures/noise-solid-normal.webp" },
    rockNormal: { path: "/assets/textures/rock_normal.webp" },
    voronoi: { path: "/assets/textures/voronoi.webp" },
  },
  envMaps: { envMap: { path: "/assets/textures/envmap-min.exr" } },
  models: { mountains: { path: "/assets/models/mountains.glb" } },
};

/** Per-page assets (mountain textures, page env). */
export const PAGE_MANIFESTS: Record<string, Manifest> = {
  Homepage: {
    textures: {
      homepageLightmap: { path: "/assets/textures/homepage/homepage-lightmap.webp" },
      snowRockMix: { path: "/assets/textures/snowRockMix.webp" },
      snow: { path: "/assets/textures/homepage/snow_diffuse.webp" },
      snowyRock: { path: "/assets/textures/rock_diffuse.webp" },
    },
    models: { homepage: { path: "/assets/models/homepage/Homepage.glb" } },
  },
  Trading: {
    textures: {
      snow: { path: "/assets/textures/homepage/snow_diffuse.webp" },
      rock: { path: "/assets/textures/rock_diffuse.webp" },
      snowRockMix: { path: "/assets/textures/snowRockMix.webp" },
      tradingLightmap: { path: "/assets/textures/trading/trading-lightmap.webp" },
    },
  },
  Capital: {
    textures: {
      capitalLightmap: { path: "/assets/textures/capital/capital-lightmap.webp" },
      snowRockMix: { path: "/assets/textures/snowRockMix.webp" },
      grass: { path: "/assets/textures/grass_diffuse.webp" },
      snow: { path: "/assets/textures/homepage/snow_diffuse.webp" },
    },
    models: { capital: { path: "/assets/models/capital/capital-min.glb" } },
  },
  Maritime: {
    textures: {
      maritimeLightmap: { path: "/assets/textures/maritime/maritime-lightmap.webp" },
      grass: { path: "/assets/textures/grass_diffuse.webp" },
      rock: { path: "/assets/textures/rock_diffuse.webp" },
      waterNormal: { path: "/assets/textures/maritime/water-normal.webp" },
    },
    models: { maritime: { path: "/assets/models/maritime/maritime.glb" } },
  },
  FortEnergy: {
    models: { fortEnergy: { path: "/assets/models/fort-energy/fort-energy.glb" } },
  },
};

/** Per-chapter assets. */
export const CHAPTER_MANIFESTS: Record<string, Record<string, Manifest>> = {
  Trading: {
    Hero: { models: { raycaster: { path: "/assets/models/trading/raycaster.glb" } } },
    Oil: { models: { oilMetals: { path: "/assets/models/trading/oil-metals.glb" } } },
    Metals: { models: { oilMetals: { path: "/assets/models/trading/oil-metals.glb" } } },
  },
  Maritime: {
    MaritimeChapter: { models: { boat: { path: "/assets/models/maritime/boat.glb" } } },
  },
  Capital: {
    CapitalChapter: { models: { grassModel: { path: "/assets/models/capital/grass-min.glb" } } },
  },
  FortEnergy: {
    FortEnergyChapter: { models: { energyChapter: { path: "/assets/models/fort-energy/energy-chapter.glb" } } },
  },
};
