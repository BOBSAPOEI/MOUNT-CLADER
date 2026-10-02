export const ASSET = "/montfort";

export const DIVISIONS = [
  { href: "/trading/", name: "Montfort Trading", title: "Operating Efficiently by Leading with Innovation." },
  { href: "/capital/", name: "Montfort Capital", title: "Identify and seize opportunities that maximise Value" },
  { href: "/maritime/", name: "Montfort Maritime", title: "Powering Progress, Delivering Energy." },
  { href: "/fort-energy/", name: "Fort Energy", title: "Advancing Innovation in Energy Investments" },
] as const;

export const NAV = [{ href: "/", name: "Montfort Group" }, ...DIVISIONS.map((d) => ({ href: d.href, name: d.name }))];
export const TERMS = [
  { href: "/contact/", name: "Contact" },
  { href: "/#Sustainability", name: "ESG" },
  { href: "/privacy-policy/", name: "Privacy policy" },
  { href: "/terms-of-use/", name: "Terms of use" },
];

export const OFFICES = [
  { name: "Geneva, Switzerland", address: " 3rd & 4th floor\nRue du Mont-Blanc 14\u2028\n1201 Geneva, Switzerland ", phone: "+41 227415900", tel: "+41227415900", email: "gva.reception@mont-fort.com" },
  { name: "Dubai, UAE", address: " 1104 ICD Brookfield Place\nDubai International Financial\nCentre\u2028\nDubai, United Arab Emirates ", phone: "+971 45914032", tel: "+97145914032", email: "uae.reception@mont-fort.com" },
  { name: "Singapore", address: " 0804 Marina One East Tower\n7 Straits View\n018936, Singapore ", phone: "+65 3105 1583", tel: "+6531051583", email: "sing.reception@mont-fort.com" },
];

export const CITIES = [
  { name: "Switzerland", lon: 4, lat: 46.818188 },
  { name: "Denmark", lon: 10, lat: 56 },
  { name: "Istanbul", lon: 24, lat: 41.00824 },
  { name: "United Arab Emirates", lon: 54.35495, lat: 24.48818 },
  { name: "Nairobi", lon: 36.828842, lat: -1.3026148 },
  { name: "Dar es Salam", lon: 39.2803583, lat: -6.8160837 },
  { name: "Cape Town", lon: 18.4172197, lat: -33.9288301 },
  { name: "Mumbai", lon: 72.8281049, lat: 18.9733536 },
  { name: "Karachi", lon: 67.0207055, lat: 24.8546842 },
  { name: "Maputo", lon: 32.56745, lat: -25.966213 },
  { name: "Xiamen", lon: 118.0853479, lat: 24.4801069 },
  { name: "Singapore", lon: 97, lat: 1.352083 },
];

export const SOLUTIONS = [
  { tab: "Environmental", intro: "Reducing our impact on the environment is paramount to our business. Our environmental policies and culture focus on:", items: ["Clean Energy", "Reduced Resource Usage", "Climate Change", "Carbon Emissions", "Carbon Reduction/Offsets"] },
  { tab: "Social", intro: "Our impact on society starts with our employees and extends to our vast network of customers, partners, and stakeholders. We place tremendous importance on:", items: ["Diversified Workforce", "Health, Safety and Security", "Human Rights and Labor Practices", "Community Impact", "Supply Chain Standards"] },
  { tab: "Governance", intro: "Good governance is good business. We set the highest compliance standards, maintain strict policies and procedures, and adhere to international regulations. Our governance structure is supported by:", items: ["Corporate Governance Framework, supported by a centralized policy hub", "Code of Ethics", "Ethics and compliance oversight", "Multiple board and management committees to provide strategic oversight", "Risk Management Framework", "Stringent and digitized onboarding process", "Initial onboarding and annual refresher compliance trainings"] },
];

export const ETHICS = [
  "We ensure compliance with all applicable laws and regulations across our global operations, including those of the UN, EU, Switzerland, UK, US, Singapore, and the UAE.",
  "Prior to engaging with any counterparty, a thorough and rigorous external onboarding process is conducted for all our trade counterparties and vessels we employ.",
  "Any products purchased, sold, or shipped by Montfort are in full compliance with all applicable laws and regulations, including those related to trade, sanctions, and anti-bribery & corruption (ABAC).",
  "Using renowned global compliance platforms, we analyze the counterparty, their corporate structure, and their UBO.",
  "Our processes are thoroughly in line with the leading standards and best practices of international companies.",
  "We use our internally developed, digitized platform to onboard the counterparties. Our goal is to deliver products responsibly and reliably, upholding international standards and prioritizing health, safety, environmental, and social considerations in all our activities.",
];

export interface Pillar {
  label: string;
  body: string;
  /** Slide image at 260 / 400 / 682 px wide. */
  image: { w260: string; w400: string; w682: string };
  logos: readonly { file: string; alt: string }[];
}

export const PILLARS: readonly Pillar[] = [
  {
    label: "Alleviating Poverty",
    body: "With the help of local NGOs, we support the communities where we invest. Montfort has successfully financed clean water projects, initiatives for orphaned children, earthquake relief, food distribution, and medical support for those in need.",
    image: { w260: "m_Z8rUwY.png", w400: "m_Z205R7p.png", w682: "m_Z19s3SG.png" },
    logos: [
      { file: "m_Z1gzCkt.png", alt: "Mercy Ships Logo" },
      { file: "m_NKDpr.png", alt: "Mercy Corps Logo" },
      { file: "m_1cKHS.png", alt: "Kenya Red Cross" },
      { file: "m_CQNdF.png", alt: "Emirates Red Crescent" },
    ],
  },
  {
    label: "Empowering Women",
    body: "We are 'Creating Experts Through Education' in collaboration with The Doyenne Initiative, a non-profit organization that drives female experts to take on industry, education, and government leadership roles.",
    image: { w260: "m_I3KgK.png", w400: "m_Z26602g.png", w682: "m_Z1kL9kK.png" },
    logos: [{ file: "m_1zzaW4.png", alt: "Doyenne Initiative Logo" }],
  },
  {
    label: "Supporting Education",
    body: "We aim to help children secure a future for themselves through the support of education. We provide opportunities for success by building schools, funding scholarship programs and renewable energy projects, and supplying drinking water for schools.",
    image: { w260: "m_Z1LWpJO.png", w400: "m_t4WK6.png", w682: "m_1eoNrB.png" },
    logos: [
      { file: "m_Z1sHDNF.png", alt: "Alsama Logo" },
      { file: "m_W8OKs.png", alt: "Hope for Cancer Kids Logo" },
    ],
  },
];
