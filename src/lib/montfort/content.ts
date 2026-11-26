export const ASSET = "/montfort";

/** The four divisions: header and menu name, and the one-line promise shown on the homepage and each hero. */
export const DIVISIONS = [
  { href: "/digital/", name: "Calder Digital", title: "Performance that compounds, channel after channel." },
  { href: "/content/", name: "Calder Content", title: "Stories people stop for, share and remember." },
  { href: "/media/", name: "Calder Media", title: "The right audience, at the right moment." },
  { href: "/data/", name: "Calder Data", title: "Measurement you can trust. Insight you can use." },
] as const;

export const NAV = [{ href: "/", name: "Calder Group" }, ...DIVISIONS.map((d) => ({ href: d.href, name: d.name }))];
/** Secondary links (footer, menu). Only pages that exist in this site are listed. */
export const TERMS = [{ href: "/#Sustainability", name: "Responsibility" }];

/** Footer offices. Street addresses, phone numbers and e-mail are left out until Calder's real details are known. */
export const OFFICES = [
  { name: "Jakarta, Indonesia", role: "Group headquarters", focus: "Strategy, content and data" },
  { name: "Singapore", role: "Asia-Pacific hub", focus: "Digital performance and media" },
  { name: "Dubai, UAE", role: "Middle East hub", focus: "Media and partnerships" },
];

/** Labels placed on the 3D globe (visible while they face the camera). */
export const CITIES = [
  { name: "London", lon: -0.1276, lat: 51.5072 },
  { name: "Milan", lon: 9.19, lat: 45.4642 },
  { name: "Istanbul", lon: 28.9784, lat: 41.0082 },
  { name: "Cairo", lon: 31.2357, lat: 30.0444 },
  { name: "Lagos", lon: 3.3792, lat: 6.5244 },
  { name: "Nairobi", lon: 36.8219, lat: -1.2921 },
  { name: "Johannesburg", lon: 28.0473, lat: -26.2041 },
  { name: "Dubai", lon: 55.2708, lat: 25.2048 },
  { name: "Mumbai", lon: 72.8777, lat: 19.076 },
  { name: "Hong Kong", lon: 114.1694, lat: 22.3193 },
  { name: "Singapore", lon: 103.8198, lat: 1.3521 },
  { name: "Jakarta", lon: 106.8456, lat: -6.2088 },
];

/** Responsibility tabs. Item order follows the icon set (five, five and seven icons). */
export const SOLUTIONS = [
  {
    tab: "Environmental",
    intro: "Every campaign has a footprint. We work to make ours smaller through:",
    items: ["Renewable-powered studios", "Low-waste productions", "Climate-aware campaigns", "Measured media emissions", "Carbon reduction and offsets"],
  },
  {
    tab: "Social",
    intro: "Our influence reaches far beyond our own office. We focus on:",
    items: ["A diverse, inclusive team", "Wellbeing and fair workloads", "Fair pay and human rights", "Pro bono work for communities", "Inclusive, respectful advertising"],
  },
  {
    tab: "Governance",
    intro: "Trust is built on structure, not slogans. Our governance includes:",
    items: [
      "A group-wide policy framework",
      "A code of ethics for every employee",
      "Independent compliance oversight",
      "Board and management committees",
      "Risk management in every division",
      "Verified client and partner onboarding",
      "Annual training for every team member",
    ],
  },
];

/** How we do business: each principle is a short title and one sentence. */
export const ETHICS = [
  { title: "Honest claims.", body: "Every claim in a Calder campaign is checked before it goes live, and we never promise what a product cannot deliver." },
  { title: "Privacy first.", body: "We collect only the data a campaign needs, keep it secure and follow the data-protection laws of every market we work in." },
  { title: "Brand safety.", body: "Media runs only where our clients would be proud to appear, checked by independent verification tools." },
  { title: "Known partners.", body: "Every client, supplier and publisher passes the same onboarding checks before we work together." },
  { title: "No bribery, ever.", body: "No gifts, fees or favors that could sway a decision, on either side of the table." },
  { title: "Open books.", body: "Clients see where their budget goes: every fee, every placement and every result." },
];

export interface Pillar {
  label: string;
  body: string;
  /** Slide image at 260 / 400 / 682 px wide. */
  image: { w260: string; w400: string; w682: string };
  logos: readonly { file: string; alt: string }[];
}

/** Giving back: three slides with copy of similar length, so the text block keeps its height between slides. */
export const PILLARS: readonly Pillar[] = [
  {
    label: "Communities",
    body: "We donate campaigns, design and media space to local charities working on clean water, food and disaster relief, so their message reaches the people who can help.",
    image: { w260: "m_Z8rUwY.png", w400: "m_Z205R7p.png", w682: "m_Z19s3SG.png" },
    logos: [],
  },
  {
    label: "Women in Leadership",
    body: "Mentoring, scholarships and a leadership program help women build careers in marketing, creative and technology, and take the seats where decisions are made.",
    image: { w260: "m_I3KgK.png", w400: "m_Z26602g.png", w682: "m_Z1kL9kK.png" },
    logos: [],
  },
  {
    label: "Education",
    body: "We teach digital and creative skills in schools, fund scholarships and offer paid internships in our studios, giving young people a real first step into the industry.",
    image: { w260: "m_Z1LWpJO.png", w400: "m_t4WK6.png", w682: "m_1eoNrB.png" },
    logos: [],
  },
];
