export interface Lawyer {
  id: string;
  name: string;
  photo: string;
  title: string;
  areas: string[];
  experience: number; // years
  rating: number;
  reviews: number;
  fee: number; // base video consultation fee (INR)
  languages: string[];
  courts: string;
  education: string;
  about: string;
  blurb: string; // one-line card summary
  tags: string[]; // specialty chips
  mode: "Online" | "In-person" | "Online & In-person";
  casesWon: number;
  responseTime: string;
  city: string;
}

export const REMOTE_VIDEO =
  "https://videos.pexels.com/video-files/7792540/7792540-hd_1920_1080_25fps.mp4";

export const PRACTICE_AREAS = [
  "Criminal Defence",
  "Family & Divorce",
  "Property & Real Estate",
  "Corporate & Startup",
  "Cyber Law",
  "Consumer Rights",
  "Immigration",
  "Tax & Compliance",
];

export const LAWYERS: Lawyer[] = [
  {
    id: "meera-krishnan",
    name: "Adv. Meera Krishnan",
    photo:
      "https://images.pexels.com/photos/31869537/pexels-photo-31869537.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    title: "Senior Criminal Defence Counsel",
    areas: ["Criminal Defence"],
    experience: 14,
    rating: 4.9,
    reviews: 212,
    fee: 2500,
    languages: ["English", "Hindi", "Tamil"],
    courts: "High Court of Madras · Sessions Courts",
    education: "B.A. LL.B (Hons.), NLSIU Bangalore",
    about:
      "Meera has defended over 600 criminal matters — from bail applications to full trials — with a calm, methodical courtroom style. She is known for honest case assessments on the very first call.",
    blurb: "Composed courtroom strategist for urgent criminal matters and fair, fast bail outcomes.",
    tags: ["Bail", "FIR", "Trials"],
    mode: "Online & In-person",
    casesWon: 512,
    responseTime: "~15 min",
    city: "Chennai",
  },
  {
    id: "arjun-sharma",
    name: "Adv. Arjun Sharma",
    photo:
      "https://images.pexels.com/photos/37148308/pexels-photo-37148308.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    title: "Corporate & Startup Counsel",
    areas: ["Corporate & Startup"],
    experience: 11,
    rating: 4.8,
    reviews: 187,
    fee: 3000,
    languages: ["English", "Hindi"],
    courts: "Delhi High Court · NCLT",
    education: "LL.B, Symbiosis Law School · CS (ICSI)",
    about:
      "Arjun advises founders on term sheets, ESOPs, SHA/SSA drafting and due-diligence. 40+ startups currently retain him as outside general counsel.",
    blurb: "Straight-talking counsel for founders who want to move fast without legal risk.",
    tags: ["Startups", "Contracts", "Funding"],
    mode: "Online",
    casesWon: 340,
    responseTime: "~20 min",
    city: "New Delhi",
  },
  {
    id: "sana-qureshi",
    name: "Adv. Sana Qureshi",
    photo:
      "https://images.pexels.com/photos/29852895/pexels-photo-29852895.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    title: "Family & Matrimonial Lawyer",
    areas: ["Family & Divorce"],
    experience: 9,
    rating: 4.9,
    reviews: 243,
    fee: 1500,
    languages: ["English", "Hindi", "Urdu"],
    courts: "Family Courts, Mumbai · Bombay High Court",
    education: "LL.B, Government Law College, Mumbai",
    about:
      "Sana handles divorce, custody, maintenance and mediation with unusual empathy. 7 out of 10 of her matters settle without a contested trial — saving clients years of litigation.",
    blurb: "Calm, practical guidance for sensitive family matters and peaceful resolutions.",
    tags: ["Divorce", "Custody", "Mediation"],
    mode: "Online & In-person",
    casesWon: 298,
    responseTime: "~10 min",
    city: "Mumbai",
  },
  {
    id: "vikram-rao",
    name: "Adv. Vikram Rao",
    photo:
      "https://images.pexels.com/photos/10657877/pexels-photo-10657877.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    title: "Property & Real Estate Specialist",
    areas: ["Property & Real Estate"],
    experience: 17,
    rating: 4.7,
    reviews: 165,
    fee: 2200,
    languages: ["English", "Hindi", "Telugu"],
    courts: "City Civil Courts, Hyderabad · RERA Authority",
    education: "LL.B, Osmania University",
    about:
      "Vikram has vetted 1,200+ property titles and resolved disputes across RERA, partition suits and landlord-tenant matters. If you're buying property, talk to him before you pay a rupee.",
    blurb: "Title-first property lawyer who has vetted 1,200+ deals — before you sign anything.",
    tags: ["Title check", "RERA", "Tenancy"],
    mode: "In-person",
    casesWon: 431,
    responseTime: "~30 min",
    city: "Hyderabad",
  },
  {
    id: "ananya-iyer",
    name: "Adv. Ananya Iyer",
    photo:
      "https://images.pexels.com/photos/26728094/pexels-photo-26728094.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    title: "Cyber Law & Data Privacy Counsel",
    areas: ["Cyber Law"],
    experience: 7,
    rating: 4.8,
    reviews: 129,
    fee: 2000,
    languages: ["English", "Hindi", "Malayalam"],
    courts: "Adjudicating Officer (IT Act) · Kerala High Court",
    education: "B.Tech + LL.B, IIT Kharagpur · RGSOIPL",
    about:
      "An engineer-turned-lawyer, Ananya handles online fraud, sextortion, account hacking, DPDP compliance and takedowns. She speaks both tech and law fluently.",
    blurb: "Engineer-turned-lawyer for hacks, online fraud and rapid content takedowns.",
    tags: ["Online fraud", "Takedowns", "Privacy"],
    mode: "Online",
    casesWon: 176,
    responseTime: "~5 min",
    city: "Bengaluru",
  },
  {
    id: "rohan-mehta",
    name: "Adv. Rohan Mehta",
    photo:
      "https://images.pexels.com/photos/17049771/pexels-photo-17049771.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    title: "Consumer Rights Advocate",
    areas: ["Consumer Rights"],
    experience: 6,
    rating: 4.6,
    reviews: 98,
    fee: 1500,
    languages: ["English", "Hindi", "Gujarati"],
    courts: "District & State Consumer Commissions, Ahmedabad",
    education: "LL.B, Gujarat University",
    about:
      "From defective products to builder delays and insurance claim rejections, Rohan fights consumer cases on a fixed, transparent fee — often recovering 3–5x the claim value.",
    blurb: "Fixed-fee consumer fighter who turns defective products into real compensation.",
    tags: ["Refunds", "Builders", "Insurance"],
    mode: "Online",
    casesWon: 154,
    responseTime: "~25 min",
    city: "Ahmedabad",
  },
  {
    id: "kavitha-nair",
    name: "Adv. Kavitha Nair",
    photo:
      "https://images.pexels.com/photos/30004325/pexels-photo-30004325.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    title: "Immigration & Visa Counsel",
    areas: ["Immigration"],
    experience: 12,
    rating: 4.8,
    reviews: 201,
    fee: 2800,
    languages: ["English", "Malayalam", "Hindi"],
    courts: "Kerala High Court · MEA Tribunals",
    education: "LL.M (International Law), University of Edinburgh",
    about:
      "Kavitha has guided 900+ visa, OCI, deportation-appeal and study-abroad matters across the US, UK, Canada and the Gulf. She maps your strongest route in one session.",
    blurb: "Visa strategist mapping your strongest route across four continents.",
    tags: ["Visas", "OCI", "Appeals"],
    mode: "Online",
    casesWon: 388,
    responseTime: "~40 min",
    city: "Kochi",
  },
  {
    id: "dev-patel",
    name: "Adv. Dev Patel",
    photo:
      "https://images.pexels.com/photos/37148344/pexels-photo-37148344.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    title: "Tax & Compliance Counsel",
    areas: ["Tax & Compliance"],
    experience: 10,
    rating: 4.7,
    reviews: 143,
    fee: 2000,
    languages: ["English", "Hindi", "Gujarati"],
    courts: "ITAT Ahmedabad · Gujarat High Court",
    education: "LL.B + CMA, MS University, Vadodara",
    about:
      "Dev replies to income-tax and GST notices, plans salary & capital-gains tax, and represents clients at assessment. Known for turning scary notices into routine paperwork.",
    blurb: "Notice-whisperer who turns scary tax letters into routine paperwork.",
    tags: ["Tax notice", "GST", "ITR"],
    mode: "Online & In-person",
    casesWon: 265,
    responseTime: "~35 min",
    city: "Vadodara",
  },
];

export const lawyerById = (id: string) => LAWYERS.find((l) => l.id === id);

export const lawyersByArea = (area: string) =>
  LAWYERS.filter((l) => l.areas.includes(area)).sort((a, b) => b.rating - a.rating);

export type ConsultType = "video" | "phone" | "person";

export const TIME_SLOTS = [
  "09:30 AM",
  "11:00 AM",
  "12:30 PM",
  "02:00 PM",
  "03:30 PM",
  "05:00 PM",
  "06:30 PM",
  "08:00 PM",
];

export interface DayOption {
  iso: string;
  dow: string;
  day: string;
  month: string;
}

export function nextDays(count: number): DayOption[] {
  const out: DayOption[] = [];
  const base = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push({
      iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`,
      dow: d.toLocaleDateString("en-IN", { weekday: "short" }),
      day: String(d.getDate()).padStart(2, "0"),
      month: d.toLocaleDateString("en-IN", { month: "short" }),
    });
  }
  return out;
}

/** Deterministic hash so UI states stay stable per lawyer */
function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997;
  return h;
}

/** ~60% of lawyers show as "Available today" */
export function isAvailableToday(lawyerId: string): boolean {
  return hashId(lawyerId) % 10 < 6;
}

/** Deterministically mark ~30% of slots as already taken for realism */
export function isSlotTaken(lawyerId: string, iso: string, slot: string): boolean {
  return hashId(`${lawyerId}|${iso}|${slot}`) % 10 < 3;
}

export function feeFor(lawyer: Lawyer, type: ConsultType): number {
  const mult = type === "video" ? 1 : type === "phone" ? 0.8 : 1.25;
  return Math.round((lawyer.fee * mult) / 50) * 50;
}

export const CONSULT_LABEL: Record<ConsultType, string> = {
  video: "Video consultation",
  phone: "Phone call",
  person: "In-person meeting",
};
