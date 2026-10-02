import { PAGES } from "../engine/globals";

const TITLES: Record<(typeof PAGES)[number], string> = {
  Homepage: "Calder",
  Trading: "Trading",
  Capital: "Capital",
  Maritime: "Maritime",
  FortEnergy: "Fort Energy",
};

/** Strip of division titles revealed while pressing / dragging on a hero (driven by the engine's slideshow). */
export function HeroTransition() {
  return (
    <div className="hero-transition" data-mf-hero-transition="" data-cursor="draggable" data-cursor-down="dragging">
      <div className="inner">
        {PAGES.map((key) => (
          <div className="title" key={key}>
            <p>{TITLES[key]}</p>
            <div className="spinner">
              <svg className="spinner-inner" fill="none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <g strokeWidth="8">
                  <path d="M 4 100 A 96 96 0 0 1 196 100" stroke="url(#spinner-secondHalf)" />
                  <path d="M 196 100 A 96 96 0 0 1 4 100" stroke="url(#spinner-firstHalf)" />
                </g>
              </svg>
            </div>
          </div>
        ))}
      </div>
      <svg className="spinner-defs" color="#2d628c" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="spinner-secondHalf">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="spinner-firstHalf">
            <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.5" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
