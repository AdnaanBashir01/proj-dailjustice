// ─── Lexi · the Dail Justice legal concierge (rule-based NLU engine) ─────────

import { LAWYERS, lawyersByArea } from "../data/lawyers";

export interface LexiNav {
  label: string;
  view: "home" | "lawyers" | "dashboard";
  tab?: "bookings" | "documents" | "profile";
}

export interface LexiReply {
  text: string;
  chips?: string[];
  lawyerIds?: string[];
  nav?: LexiNav;
}

interface Ctx {
  name?: string;
}

const topRated = (n: number) =>
  [...LAWYERS].sort((a, b) => b.rating - a.rating).slice(0, n).map((l) => l.id);

const areaReply = (area: string, tip: string): LexiReply => {
  const lawyers = lawyersByArea(area);
  const names = lawyers.map((l) => l.name).join(", ");
  return {
    text: `${tip}\n\nFor ${area.toLowerCase()} matters I'd recommend ${names}. You can book a secure video consultation right from here:`,
    lawyerIds: lawyers.slice(0, 2).map((l) => l.id),
    chips: ["How does booking work?", "What are the fees?", "Talk about something else"],
  };
};

interface Rule {
  test: RegExp;
  reply: (ctx: Ctx, input: string) => LexiReply;
}

const RULES: Rule[] = [
  // ── greetings & small talk ──
  {
    test: /\b(hi+|hello+|hey+|namaste|good (morning|afternoon|evening)|yo)\b/i,
    reply: (c) => ({
      text: `Hello${c.name ? ` ${c.name}` : ""}. I'm Lexi, your 24/7 legal concierge at Dail Justice.\n\nI can explain legal topics in plain language, help you find the right lawyer, or guide you through booking, documents and video consultations. What's on your mind?`,
      chips: ["Find me a lawyer", "How does booking work?", "I have a legal question"],
    }),
  },
  {
    test: /\b(who are you|your name|what are you|about you|lexi)\b/i,
    reply: () => ({
      text: "I'm Lexi — the AI legal concierge built into Dail Justice. I answer everyday legal questions, match you with verified advocates, and help with bookings, documents and consultations.\n\nI'm not a lawyer myself, so for advice on your specific case I'll always connect you with a human advocate.",
      chips: ["Find me a lawyer", "What can you do?"],
    }),
  },
  {
    test: /\b(what can you do|help me|features|options|menu)\b/i,
    reply: () => ({
      text: "Here's what I can do for you:\n\n• Explain legal topics — bail, FIRs, notices, divorce process & more\n• Match you with a verified lawyer for your exact issue\n• Walk you through booking a video consultation\n• Help you upload case documents to your private vault",
      chips: ["Find me a lawyer", "Explain bail", "Upload documents"],
    }),
  },
  {
    test: /\b(thank|thanks|thnx|great|awesome|perfect)\b/i,
    reply: (c) => ({
      text: `You're most welcome${c.name ? `, ${c.name}` : ""}. Justice shouldn't feel intimidating — I'm here whenever you need me.`,
      chips: ["Find me a lawyer", "One more question"],
    }),
  },
  {
    test: /\b(bye|goodbye|see you|good ?night)\b/i,
    reply: () => ({
      text: "Take care. Remember — the right legal advice at the right time changes outcomes. I'm online 24/7 whenever you need me.",
      chips: ["Book before I go"],
    }),
  },

  // ── urgent ──
  {
    test: /\b(arrest|arrested|emergency|urgent|police (came|called|station)|detained|jail)\b/i,
    reply: () => ({
      text: "If you or someone you know may be arrested, act now:\n\n1. You have the right to remain silent and the right to a lawyer (Art. 22, Constitution).\n2. Memorise one family member's number — you must be allowed a call.\n3. Ask for the grounds of arrest in writing.\n4. Do not sign anything you haven't read.\n\nBook an urgent video consult with a criminal defence advocate — Adv. Meera Krishnan responds in ~15 minutes.",
      lawyerIds: ["meera-krishnan"],
      chips: ["Explain anticipatory bail", "What is an FIR?"],
    }),
  },

  // ── platform how-to ──
  {
    test: /\b(how (do|does|to)|book|booking|appointment|schedule|consult|consultation|hire|process|work)\b/i,
    reply: () => ({
      text: "Booking a lawyer on Dail Justice takes under a minute:\n\n1. Tap 'Find a lawyer' and filter by practice area\n2. Pick a date & time slot that suits you\n3. Choose video, phone or in-person\n4. Confirm — your lawyer receives your notes instantly\n\nEverything shows up under Dashboard → My Bookings, where you can join the video call or reschedule.",
      nav: { label: "Browse verified lawyers", view: "lawyers" },
      chips: ["What are the fees?", "Can I cancel a booking?"],
    }),
  },
  {
    test: /\b(fee|fees|cost|price|charge|charges|expensive|cheap|payment|pay)\b/i,
    reply: () => ({
      text: "Fees on Dail Justice are fully transparent — you see the exact amount before you book, never after:\n\n• Video consultations: ₹1,500 – ₹3,000 (set by each advocate)\n• Phone calls: 20% less than video\n• In-person meetings: 25% more\n\nThere are no hidden commissions, and you pay only for confirmed sessions.",
      chips: ["Find me a lawyer", "Can I cancel a booking?"],
    }),
  },
  {
    test: /\b(cancel|reschedule|refund|postpone)\b/i,
    reply: () => ({
      text: "Life happens — you can cancel any upcoming booking from Dashboard → My Bookings with one tap. Cancelled sessions close instantly and can be re-booked for another slot at no penalty.\n\nNeed to move the time instead? Just cancel and pick a new slot — it takes seconds.",
      nav: { label: "Go to my bookings", view: "dashboard", tab: "bookings" },
      chips: ["Book a new slot", "What are the fees?"],
    }),
  },
  {
    test: /\b(document|documents|upload|file|files|paper|papers|agreement copy|evidence|vault)\b/i,
    reply: () => ({
      text: "Your Document Vault keeps every case paper in one private place — agreements, notices, ID proofs, evidence PDFs.\n\nHead to Dashboard → Documents and drag in PDFs or images (up to ~1.5 MB each, stored only in your browser's private vault). You can download or delete them anytime, and sharing them in your consultation notes helps your lawyer prepare.",
      nav: { label: "Open my document vault", view: "dashboard", tab: "documents" },
      chips: ["How does booking work?", "Is my data private?"],
    }),
  },
  {
    test: /\b(video|camera|online (call|meeting)|zoom|meet|call setup|join)\b/i,
    reply: () => ({
      text: "Video consultations happen right inside Dail Justice — no extra apps. You'll need:\n\n• A device with a camera & mic\n• A quiet, private spot\n• Your documents uploaded beforehand\n\nWhen it's time, open Dashboard → My Bookings and tap 'Join video call'. Controls for mic, camera and ending the call are built in.",
      nav: { label: "Go to my bookings", view: "dashboard", tab: "bookings" },
      chips: ["How does booking work?", "Upload documents"],
    }),
  },
  {
    test: /\b(delete|remove|close).*(account|profile)|privacy|private|data safe|secure\b/i,
    reply: () => ({
      text: "Your privacy is sacrosanct here:\n\n• Consultations run on an encrypted session\n• Documents stay in your private vault\n• You own your data — permanently delete your profile anytime from Dashboard → Profile & Settings → Danger Zone. This erases your account, bookings and documents in one step.",
      nav: { label: "Open profile settings", view: "dashboard", tab: "profile" },
      chips: ["Where is my data stored?", "Find me a lawyer"],
    }),
  },

  // ── practice-area matching ──
  {
    test: /\b(divorce|separation|alimony|custody|maintenance|marriage|domestic|dowry|mutual consent)\b/i,
    reply: () =>
      areaReply(
        "Family & Divorce",
        "Family matters need both legal sharpness and emotional intelligence. Quick facts:\n\n• Mutual-consent divorce typically takes 6–18 months; contested ones take longer\n• Custody decisions follow the child's welfare, not parental preference\n• Interim maintenance can be claimed from day one"
      ),
  },
  {
    test: /\b(property|land|flat|plot|tenant|landlord|rent|evict|eviction|possession|registry|title|partition|rera|builder|real estate|house)\b/i,
    reply: () =>
      areaReply(
        "Property & Real Estate",
        "Property is where most Indian litigation lives — prevention is everything:\n\n• Always get a 30-year title search before purchasing\n• Unregistered rental agreements are barely enforceable\n• RERA gives homebuyers fast remedies against builder delays"
      ),
  },
  {
    test: /\b(criminal|theft|stolen|assault|beaten|cheated|cheating case|fir|bail|police|murder|fraud(?! online)|scam call)\b/i,
    reply: () =>
      areaReply(
        "Criminal Defence",
        "For anything criminal, timing decides everything:\n\n• An FIR can be filed at any police station — even a 'zero FIR' outside jurisdiction\n• Regular bail is usually heard within days; anticipatory bail protects you before arrest\n• Never give a statement without your advocate present"
      ),
  },
  {
    test: /\b(startup|company|founder|co-?founder|contract|agreement|partnership|business|incorporat|esop|investor|term ?sheet|trademark|brand)\b/i,
    reply: () =>
      areaReply(
        "Corporate & Startup",
        "Smart legal hygiene early saves startups from fatal disputes later:\n\n• A founders' agreement with vesting prevents 80% of co-founder blowups\n• Register your trademark before you spend on branding\n• Term sheets are negotiable — especially the liquidation preference"
      ),
  },
  {
    test: /\b(cyber|hack|hacked|hacking|online fraud|sextortion|blackmail|social media|instagram|whatsapp|data|privacy|otp|upi fraud|phishing|deepfake)\b/i,
    reply: () =>
      areaReply(
        "Cyber Law",
        "In cyber cases, the first 48 hours matter most:\n\n• Call 1930 immediately for financial cyber fraud — funds can be frozen\n• Preserve screenshots, URLs and transaction IDs as evidence\n• Report content at cybercrime.gov.in — non-consensual images can be taken down fast"
      ),
  },
  {
    test: /\b(consumer|defective|warranty|refund (from|product)|ecommerce|e-commerce|amazon|flipkart|replacement|service centre|insurance claim)\b/i,
    reply: () =>
      areaReply(
        "Consumer Rights",
        "Consumer courts are genuinely fast and affordable:\n\n• Claims up to ₹50 lakh go to the District Commission — no lawyer required, but one helps\n• Deficiency of service includes builder delays & insurance rejections\n• Compensation often includes mental-agony damages"
      ),
  },
  {
    test: /\b(visa|immigration|green ?card|passport|oci|pr |study abroad|deport|work permit|student visa|h1b|canada|uk visa|us visa)\b/i,
    reply: () =>
      areaReply(
        "Immigration",
        "Immigration refusals are usually documentation problems, not dead ends:\n\n• Most consults map 2–3 viable routes; the 'obvious' one is rarely the best\n• OCI, dependent and skilled-worker routes each have hidden timing windows\n• Never submit documents you haven't had reviewed — refusals compound"
      ),
  },
  {
    test: /\b(tax|gst|income ?tax|itr|notice from (it|tax)|capital gain|tds|assessment)\b/i,
    reply: () =>
      areaReply(
        "Tax & Compliance",
        "A tax notice is not an accusation — it's a question. Answer it well:\n\n• Most notices are mismatches (26AS/AIS) fixable with a structured reply\n• Ignoring a notice converts a ₹5,000 issue into a ₹50,000 one\n• Plan capital gains before you sell, never after"
      ),
  },

  // ── legal knowledge base ──
  {
    test: /\b(anticipatory bail|regular bail|what is bail|get bail)\b/i,
    reply: () => ({
      text: "Bail is a court's permission to stay free while your case proceeds.\n\n• Anticipatory bail (Sec. 482 BNSS): sought before arrest, when you apprehend one\n• Regular bail: sought after arrest\n• Courts weigh flight risk, evidence tampering and severity — most bailable matters resolve in days\n\nA criminal advocate can evaluate your odds in one consultation.",
      lawyerIds: ["meera-krishnan"],
      chips: ["What is an FIR?", "This is urgent"],
    }),
  },
  {
    test: /\b(fir|first information report|police complaint|zero fir)\b/i,
    reply: () => ({
      text: "An FIR (First Information Report) is the written record that starts a criminal investigation.\n\n• It's your right — police must register it for cognizable offences\n• 'Zero FIR' lets you file at any station regardless of jurisdiction\n• If refused, write to the SP or approach a Magistrate under Sec. 175 BNSS\n\nKeep a signed copy — free of charge.",
      chips: ["Explain bail", "Find a criminal lawyer"],
      lawyerIds: ["meera-krishnan"],
    }),
  },
  {
    test: /\b(cheque bounce|cheque dishonour|section 138|138 nia)\b/i,
    reply: () => ({
      text: "Cheque bounce (Sec. 138, NI Act) is a criminal offence with teeth:\n\n1. Send a legal demand notice within 30 days of the bank memo\n2. The drawer gets 15 days to pay\n3. If unpaid, file a complaint within the next 30 days\n\nPunishment can be up to 2 years' imprisonment and/or a fine of twice the cheque amount. Timelines are strict — don't sit on it.",
      chips: ["Send a legal notice", "Find me a lawyer"],
      lawyerIds: ["rohan-mehta"],
    }),
  },
  {
    test: /\b(legal notice|send (a )?notice|notice reply|reply to notice)\b/i,
    reply: () => ({
      text: "A legal notice is a formal 'last word' before litigation — and it works surprisingly often:\n\n• It puts your grievance on record with a deadline\n• Many disputes settle right here, saving years of court\n• A well-drafted reply is equally powerful if you've received one\n\nAdvocates on Dail Justice draft & dispatch notices as a fixed-fee service — ask during your consultation.",
      chips: ["Find me a lawyer", "Cheque bounce help"],
    }),
  },
  {
    test: /\b(rti|right to information)\b/i,
    reply: () => ({
      text: "An RTI application lets you demand information from any public authority for ₹10:\n\n• File with the Public Information Officer of the department\n• A reply is mandatory within 30 days (48 hours if life/liberty is at stake)\n• First appeal if ignored — the Information Commission can penalise the PIO\n\nIt's the cheapest legal superpower citizens have.",
      chips: ["Find me a lawyer", "Another question"],
    }),
  },
  {
    test: /\b(will|testament|inheritance|succession|nominee)\b/i,
    reply: () => ({
      text: "A Will is the highest-ROI legal document you'll ever sign:\n\n• Any adult of sound mind can make one — two witnesses are enough\n• Registration is optional but recommended\n• A nominee is only a caretaker; the Will decides who actually inherits\n\nA property lawyer can draft an unambiguous Will in one sitting.",
      lawyerIds: ["vikram-rao"],
      chips: ["Property dispute help", "Find me a lawyer"],
    }),
  },
  {
    test: /\b(salary|fired|terminated|layoff|notice period| pf |provident fund|harassment at work)\b/i,
    reply: () => ({
      text: "Employment issues sit between contract law and labour law:\n\n• Unpaid salary & unlawful termination claims start with a legal notice to the employer\n• The employment agreement's exit clauses decide most outcomes\n• Workplace harassment has a mandatory ICC process your employer must follow\n\nA quick consult tells you whether your case is a negotiation or a fight.",
      lawyerIds: ["arjun-sharma"],
      chips: ["Find me a lawyer", "Send a legal notice"],
    }),
  },

  // ── generic lawyer discovery ──
  {
    test: /\b(lawyer|advocate|attorney|counsel|recommend|suggest|expert|specialist|top rated|best)\b/i,
    reply: () => ({
      text: "Here are our highest-rated advocates right now — all Bar-verified, all with transparent fees. Tell me your issue (e.g. 'property dispute' or 'online fraud') and I'll narrow it to the perfect match:",
      lawyerIds: topRated(2),
      chips: ["Property issue", "Divorce help", "Cyber fraud", "Startup legal help"],
    }),
  },
];

export const INITIAL_CHIPS = [
  "Find me a lawyer",
  "I received a legal notice",
  "How does booking work?",
  "Explain bail simply",
];

export const FALLBACKS: LexiReply[] = [
  {
    text: "I want to make sure I get this right. Could you tell me a little more — is it about a dispute, a document, an arrest, money, family, or something digital?\n\nOr pick one of these to get moving:",
    chips: ["Property issue", "Family matter", "Criminal help", "Cyber fraud", "Just show me lawyers"],
  },
  {
    text: "That's beyond my script, but very likely not beyond our advocates. Tell me the broad area — property, family, criminal, cyber, business, tax or immigration — and I'll connect you to the right specialist immediately.",
    chips: ["Show me top lawyers", "How does booking work?"],
  },
];

export function lexiReply(input: string, ctx: Ctx): LexiReply {
  const clean = input.trim().toLowerCase();

  if (clean === "just show me lawyers" || clean === "show me top lawyers" || clean === "find me a lawyer") {
    return {
      text: "Here are two of our most sought-after advocates this week. Tap 'Book' to grab a slot, or browse the full roster with filters:",
      lawyerIds: topRated(2),
      nav: { label: "Browse all lawyers", view: "lawyers" },
      chips: ["How does booking work?", "What are the fees?"],
    };
  }
  if (clean === "i have a legal question" || clean === "one more question" || clean === "another question") {
    return {
      text: "Go ahead — ask in your own words. For example: 'my landlord won't return my deposit', 'I got an income-tax notice', or 'my account was hacked'.",
      chips: ["Landlord dispute", "Tax notice", "Account hacked"],
    };
  }

  for (const rule of RULES) {
    if (rule.test.test(clean)) return rule.reply(ctx, clean);
  }
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}
