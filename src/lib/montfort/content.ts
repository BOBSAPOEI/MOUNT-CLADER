export const ASSET = "/montfort";

export const DIVISIONS = [
  { href: "/digital/", name: "Calder Digital", title: "Growing Brands Efficiently, Leading with Data." },
  { href: "/content/", name: "Calder Content", title: "Creating stories that capture attention and build value" },
  { href: "/media/", name: "Calder Media", title: "Amplifying Brands, Delivering Reach." },
  { href: "/data/", name: "Calder Data", title: "Advancing Innovation in Marketing Intelligence" },
] as const;

export const NAV = [{ href: "/", name: "Calder Group" }, ...DIVISIONS.map((d) => ({ href: d.href, name: d.name }))];
/** Secondary links (footer, menu). Only pages that exist in this site are listed. */
export const TERMS = [{ href: "/#Sustainability", name: "ESG" }];

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
  { tab: "Environmental", intro: "Reducing our impact on the environment is paramount to our business. From production to media delivery, our environmental policies and culture focus on:", items: ["Clean Energy", "Low-Impact Production", "Climate-Conscious Campaigns", "Carbon-Efficient Media", "Carbon Reduction/Offsets"] },
  { tab: "Social", intro: "Our impact on society starts with our employees and extends to our vast network of clients, partners, audiences, and stakeholders. We place tremendous importance on:", items: ["Diversified Workforce", "Wellbeing, Health and Safety", "Human Rights and Labor Practices", "Community Impact", "Responsible and Inclusive Advertising"] },
  { tab: "Governance", intro: "Good governance is good business. We set the highest compliance standards, maintain strict policies and procedures, and adhere to international regulations. Our governance structure is supported by:", items: ["Corporate Governance Framework, supported by a centralized policy hub", "Code of Ethics", "Ethics, compliance and data privacy oversight", "Multiple board and management committees to provide strategic oversight", "Risk Management Framework", "Stringent and digitized client onboarding process", "Initial onboarding and annual refresher compliance trainings"] },
];

export const ETHICS = [
  "We ensure compliance with all applicable laws and regulations across our global operations, including advertising standards, consumer protection, and data protection laws such as the GDPR.",
  "Prior to engaging with any client or partner, a thorough and rigorous onboarding process is conducted for all our clients, suppliers, and media partners.",
  "Every campaign planned, produced, or placed by Calder is in full compliance with all applicable laws and regulations, including those related to advertising claims, privacy, sanctions, and anti-bribery & corruption (ABAC).",
  "Using renowned global compliance platforms, we analyze the counterparty, their corporate structure, and their UBO.",
  "Our processes are thoroughly in line with the leading standards and best practices of international companies.",
  "We use our internally developed, digitized platform to onboard clients and partners. Our goal is to deliver campaigns responsibly and reliably, upholding international standards and prioritizing honesty, privacy, inclusion, and social considerations in all our activities.",
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
    body: "With the help of local NGOs, we support the communities where we work. Calder donates creative, media, and digital expertise to campaigns for clean water, children's welfare, disaster relief, food distribution, and medical support for those in need.",
    image: { w260: "m_Z8rUwY.png", w400: "m_Z205R7p.png", w682: "m_Z19s3SG.png" },
    logos: [],
  },
  {
    label: "Empowering Women",
    body: "We are 'Creating Experts Through Education', running mentoring, scholarship, and leadership programs that help women build careers in marketing, creative, and technology, and take on leadership roles in our industry.",
    image: { w260: "m_I3KgK.png", w400: "m_Z26602g.png", w682: "m_Z1kL9kK.png" },
    logos: [],
  },
  {
    label: "Supporting Education",
    body: "We aim to help young people secure a future for themselves through the support of education. We provide opportunities for success by funding scholarships, teaching digital and creative skills in schools, and offering internships across our studios.",
    image: { w260: "m_Z1LWpJO.png", w400: "m_t4WK6.png", w682: "m_1eoNrB.png" },
    logos: [],
  },
];
