// Demo data layer for the Organizations sub-panel.
//
// When DEMO_MODE is true, an axios adapter intercepts any request whose URL
// path begins with `/organizations` (and a couple of helper paths used by the
// Members tab's user picker) and serves data from an in-memory store. Every
// other API call passes through to the real network adapter, untouched.
//
// State is persisted to sessionStorage under DEMO_STORAGE_KEY so edits stick
// across page navigations and refreshes within the tab session.
//
// To disable: set DEMO_MODE to false, or delete this file plus the
// `installOrganizationsDemoAdapter()` call in main.jsx.

import axios from "axios";

export const DEMO_MODE = false;

const DEMO_STORAGE_KEY = "organizationsDemoStore_v1";

const genId = (prefix = "d") =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;

const isoDaysFromNow = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

// ─── Seed data ────────────────────────────────────────────────────────────
const seed = () => {
  const orgIds = {
    lifeline: "demo_org_lifeline",
    hope: "demo_org_hopeforall",
    greentech: "demo_org_greentech",
    xavier: "demo_org_xavier",
    cityHospital: "demo_org_cityhospital",
    bharatSchool: "demo_org_bharatschool",
    healthDept: "demo_org_healthdept",
    oldorg: "demo_org_oldorg",
    sunrise: "demo_org_sunrise",
    techhelp: "demo_org_techhelp",
  };

  const fakeUsers = [
    { _id: "demo_u_001", name: "Aarti Sharma", email: "aarti.sharma@example.com" },
    { _id: "demo_u_002", name: "Rohit Mehra", email: "rohit.mehra@example.com" },
    { _id: "demo_u_003", name: "Priya Kapoor", email: "priya.kapoor@example.com" },
    { _id: "demo_u_004", name: "Vikram Singh", email: "vikram.singh@example.com" },
    { _id: "demo_u_005", name: "Neha Iyer", email: "neha.iyer@example.com" },
    { _id: "demo_u_006", name: "Arjun Das", email: "arjun.das@example.com" },
    { _id: "demo_u_007", name: "Sneha Reddy", email: "sneha.reddy@example.com" },
    { _id: "demo_u_008", name: "Karan Joshi", email: "karan.joshi@example.com" },
    { _id: "demo_u_009", name: "Meera Nair", email: "meera.nair@example.com" },
    { _id: "demo_u_010", name: "Ravi Kumar", email: "ravi.kumar@example.com" },
  ];

  const organizations = [
    {
      _id: orgIds.lifeline,
      name: "Lifeline NGO",
      type: "NGO",
      description: "Mumbai-based blood donation NGO running quarterly camps across the metro.",
      contactName: "Sanjana Pillai",
      contactEmail: "contact@lifeline-ngo.org",
      contactPhone: "+91 98765 11122",
      address: "Plot 14, Andheri West, Mumbai 400053",
      website: "https://lifeline-ngo.org",
      partnershipSince: "2022-03-15T00:00:00.000Z",
      partnershipNotes: "Founding partner — three flagship camps per year.",
      active: true,
      verified: true,
      verificationRejected: false,
      verifiedAt: "2022-04-02T10:15:00.000Z",
      verifiedBy: { name: "Admin (Seed)" },
      verificationNotes: "FCRA + 12A documents verified. Audit reports cross-checked.",
    },
    {
      _id: orgIds.hope,
      name: "HopeForAll Foundation",
      type: "NGO",
      description: "Delhi-NCR foundation focused on rural blood awareness drives.",
      contactName: "Imran Khan",
      contactEmail: "office@hopeforall.in",
      contactPhone: "+91 99887 22233",
      address: "B-22, Greater Kailash 2, New Delhi 110048",
      website: "https://hopeforall.in",
      partnershipSince: "2023-01-10T00:00:00.000Z",
      partnershipNotes: "Strong volunteer pipeline from local colleges.",
      active: true,
      verified: true,
      verificationRejected: false,
      verifiedAt: "2023-02-05T14:30:00.000Z",
      verificationNotes: "Verified after FCRA renewal proof received.",
    },
    {
      _id: orgIds.greentech,
      name: "GreenTech Industries",
      type: "Company",
      description: "Mid-size IT services firm running employee CSR blood drives.",
      contactName: "Pooja Verma",
      contactEmail: "csr@greentech-india.com",
      contactPhone: "+91 90909 33344",
      address: "Tower 4, Cyber City, Gurugram 122002",
      website: "https://greentech-india.com",
      partnershipSince: "2023-06-20T00:00:00.000Z",
      partnershipNotes: "CSR allocation ~₹6 lakh/yr earmarked for blood programs.",
      active: true,
      verified: true,
      verificationRejected: false,
      verifiedAt: "2023-07-01T09:00:00.000Z",
      verificationNotes: "CSR policy and CIN verified.",
    },
    {
      _id: orgIds.xavier,
      name: "St. Xavier's University",
      type: "University",
      description: "Student volunteer base of ~200 across NSS chapters.",
      contactName: "Dr. Anand Rao",
      contactEmail: "nss@xavier-univ.ac.in",
      contactPhone: "+91 80808 44455",
      address: "Park Street, Kolkata 700016",
      website: "https://xavier-univ.ac.in",
      partnershipSince: "2024-08-01T00:00:00.000Z",
      partnershipNotes: "Annual freshers' donation drive in September.",
      active: true,
      verified: true,
      verificationRejected: false,
      verifiedAt: "2024-08-12T11:20:00.000Z",
    },
    {
      _id: orgIds.cityHospital,
      name: "City General Hospital",
      type: "Hospital",
      description: "300-bed multi-specialty hospital — interested in inventory partnership.",
      contactName: "Dr. Latha Krishnan",
      contactEmail: "bloodbank@citygeneral.org",
      contactPhone: "+91 70707 55566",
      address: "Ring Road, Bengaluru 560034",
      website: "https://citygeneral.org",
      partnershipSince: "",
      partnershipNotes: "Awaiting board approval before signing MoU.",
      active: true,
      verified: false,
      verificationRejected: false,
      verificationNotes: "Documents requested on 12-Apr; awaiting registration certificate.",
    },
    {
      _id: orgIds.bharatSchool,
      name: "Bharat Vidya School",
      type: "School",
      description: "Secondary school running awareness sessions for senior students.",
      contactName: "Mrs. Geeta Pandey",
      contactEmail: "principal@bharatvidya.edu.in",
      contactPhone: "+91 91234 56700",
      address: "Sector 18, Noida 201301",
      website: "",
      partnershipSince: "",
      partnershipNotes: "",
      active: true,
      verified: false,
      verificationRejected: false,
    },
    {
      _id: orgIds.healthDept,
      name: "Dept of Health, City Council",
      type: "Government",
      description: "Coordinates state-level blood drives and emergency response.",
      contactName: "Mr. Ashok Pillai (Joint Secy.)",
      contactEmail: "dohealth.city@gov.in",
      contactPhone: "+91 11 2334 5566",
      address: "Civic Centre, Block B, Pune 411001",
      website: "",
      partnershipSince: "2021-11-01T00:00:00.000Z",
      partnershipNotes: "Government MoU renewed annually in November.",
      active: true,
      verified: true,
      verificationRejected: false,
      verifiedAt: "2021-11-08T08:00:00.000Z",
    },
    {
      _id: orgIds.oldorg,
      name: "OldOrg Pvt Ltd",
      type: "Company",
      description: "Earlier partner — verification rejected after audit irregularities.",
      contactName: "Mr. Raj Malhotra",
      contactEmail: "info@oldorg.in",
      contactPhone: "+91 98888 77766",
      address: "Connaught Place, New Delhi 110001",
      website: "",
      partnershipSince: "2020-05-10T00:00:00.000Z",
      partnershipNotes: "Inactive since 2024.",
      active: false,
      verified: false,
      verificationRejected: true,
      verificationNotes: "Verification rejected — CSR utilisation reports could not be reconciled.",
    },
    {
      _id: orgIds.sunrise,
      name: "Sunrise NGO",
      type: "NGO",
      description: "Newer NGO — Pune chapter, focus on first-time donors.",
      contactName: "Tanya Mehta",
      contactEmail: "hello@sunrise-ngo.in",
      contactPhone: "+91 98700 99887",
      address: "Koregaon Park, Pune 411001",
      website: "https://sunrise-ngo.in",
      partnershipSince: "",
      partnershipNotes: "Onboarding in progress.",
      active: true,
      verified: false,
      verificationRejected: false,
    },
    {
      _id: orgIds.techhelp,
      name: "TechHelp Foundation",
      type: "NGO",
      description: "Tech-focused NGO — historically supported the donor-app rollout.",
      contactName: "Ramesh Subramanian",
      contactEmail: "ramesh@techhelp.org",
      contactPhone: "+91 89898 12345",
      address: "HSR Layout, Bengaluru 560102",
      website: "https://techhelp.org",
      partnershipSince: "2022-07-01T00:00:00.000Z",
      partnershipNotes: "Active engagement paused for 2025.",
      active: false,
      verified: true,
      verificationRejected: false,
      verifiedAt: "2022-07-10T12:00:00.000Z",
    },
  ];

  const members = {
    [orgIds.lifeline]: [
      {
        _id: genId("m"), user: fakeUsers[0], role: "Lead", joinedAt: "2022-03-20T00:00:00.000Z",
        phone: "+91 98765 11111", lastActiveAt: isoDaysFromNow(-1),
        notes: "Primary point of contact for all Mumbai operations. Authorised to sign MoUs.",
        activity: [
          { when: isoDaysFromNow(-2), text: "Led briefing for Mumbai Monsoon Mega Drive" },
          { when: isoDaysFromNow(-15), text: "Signed MoU renewal with City General Hospital" },
          { when: isoDaysFromNow(-40), text: "Verified 8 new volunteers onboarded" },
        ],
      },
      {
        _id: genId("m"), user: fakeUsers[1], role: "Coordinator", joinedAt: "2022-04-12T00:00:00.000Z",
        phone: "+91 98765 11222", lastActiveAt: isoDaysFromNow(-3),
        notes: "Handles drive logistics — venue booking, equipment, registrations.",
        activity: [
          { when: isoDaysFromNow(-3), text: "Confirmed 4 venues for Andheri Corporate Park Drive" },
          { when: isoDaysFromNow(-21), text: "Closed registrations for Winter 2024 drive" },
        ],
      },
      {
        _id: genId("m"), user: fakeUsers[2], role: "Member", joinedAt: "2023-01-05T00:00:00.000Z",
        phone: "+91 98765 11333", lastActiveAt: isoDaysFromNow(-9),
        notes: "Donor outreach via WhatsApp groups (~1.2k contacts).",
        activity: [
          { when: isoDaysFromNow(-9), text: "Pushed donor reminders for upcoming camp" },
          { when: isoDaysFromNow(-60), text: "Added 42 new donor contacts" },
        ],
      },
      {
        _id: genId("m"), user: fakeUsers[3], role: "Volunteer", joinedAt: "2024-02-18T00:00:00.000Z",
        phone: "+91 98765 11444", lastActiveAt: isoDaysFromNow(-30),
        notes: "Weekend volunteer — student at IIT Bombay.",
        activity: [
          { when: isoDaysFromNow(-30), text: "Volunteered at college awareness session" },
        ],
      },
    ],
    [orgIds.hope]: [
      {
        _id: genId("m"), user: fakeUsers[4], role: "Lead", joinedAt: "2023-01-15T00:00:00.000Z",
        phone: "+91 99887 22001", lastActiveAt: isoDaysFromNow(-2),
        notes: "Founder. Leads strategy for rural campaigns.",
        activity: [{ when: isoDaysFromNow(-2), text: "Kickoff for Rural Outreach Phase 1" }],
      },
      {
        _id: genId("m"), user: fakeUsers[5], role: "Member", joinedAt: "2023-05-22T00:00:00.000Z",
        phone: "+91 99887 22002", lastActiveAt: isoDaysFromNow(-7),
        notes: "", activity: [],
      },
      {
        _id: genId("m"), user: fakeUsers[6], role: "Volunteer", joinedAt: "2024-09-10T00:00:00.000Z",
        phone: "+91 99887 22003", lastActiveAt: isoDaysFromNow(-12),
        notes: "Joined via Delhi University NSS pipeline.", activity: [],
      },
    ],
    [orgIds.greentech]: [
      {
        _id: genId("m"), user: fakeUsers[7], role: "Lead", joinedAt: "2023-06-25T00:00:00.000Z",
        phone: "+91 90909 33001", lastActiveAt: isoDaysFromNow(-5),
        notes: "Head of CSR. Approves drive budgets up to ₹2 lakh.",
        activity: [{ when: isoDaysFromNow(-5), text: "Approved Q3 CSR allocation" }],
      },
      {
        _id: genId("m"), user: fakeUsers[8], role: "Coordinator", joinedAt: "2023-08-01T00:00:00.000Z",
        phone: "+91 90909 33002", lastActiveAt: isoDaysFromNow(-14),
        notes: "Liaises with HR for employee participation.", activity: [],
      },
    ],
    [orgIds.xavier]: [
      {
        _id: genId("m"), user: fakeUsers[9], role: "Coordinator", joinedAt: "2024-08-05T00:00:00.000Z",
        phone: "+91 80808 44001", lastActiveAt: isoDaysFromNow(-20),
        notes: "Faculty advisor for NSS chapter.", activity: [],
      },
    ],
    [orgIds.healthDept]: [
      {
        _id: genId("m"), user: fakeUsers[0], role: "Lead", joinedAt: "2021-11-10T00:00:00.000Z",
        phone: "+91 11 2334 5500", lastActiveAt: isoDaysFromNow(-1),
        notes: "Government liaison. Same person as Lifeline Lead — dual capacity.", activity: [],
      },
    ],
  };

  const drives = {
    [orgIds.lifeline]: [
      {
        _id: genId("dr"),
        title: "Mumbai Monsoon Mega Drive",
        type: "Blood Donation",
        description: "Annual rainy-season city-wide blood collection campaign.",
        startDate: isoDaysFromNow(-10),
        endDate: isoDaysFromNow(2),
        target: 800,
        status: "active",
      },
      {
        _id: genId("dr"),
        title: "Andheri Corporate Park Drive",
        type: "CSR",
        description: "Quarterly drive across 5 corporate parks in Andheri West.",
        startDate: isoDaysFromNow(30),
        endDate: isoDaysFromNow(33),
        target: 400,
        status: "planned",
      },
      {
        _id: genId("dr"),
        title: "Winter Awareness Drive",
        type: "Awareness",
        description: "Door-to-door pamphlet drive in Western suburbs.",
        startDate: isoDaysFromNow(-120),
        endDate: isoDaysFromNow(-100),
        target: null,
        status: "completed",
      },
    ],
    [orgIds.hope]: [
      {
        _id: genId("dr"),
        title: "Delhi University Donor Drive",
        type: "Blood Donation",
        description: "Partnered with DU NSS chapters for a 3-day collection drive.",
        startDate: isoDaysFromNow(-3),
        endDate: isoDaysFromNow(0),
        target: 350,
        status: "active",
      },
      {
        _id: genId("dr"),
        title: "Rural Awareness Tour",
        type: "Awareness",
        description: "Travelling awareness booth across 8 rural districts.",
        startDate: isoDaysFromNow(60),
        endDate: isoDaysFromNow(90),
        target: null,
        status: "planned",
      },
    ],
    [orgIds.greentech]: [
      {
        _id: genId("dr"),
        title: "GreenTech Q2 CSR Drive",
        type: "CSR",
        description: "Employee CSR drive across Gurugram and Noida offices.",
        startDate: isoDaysFromNow(-45),
        endDate: isoDaysFromNow(-43),
        target: 200,
        status: "completed",
      },
    ],
    [orgIds.xavier]: [
      {
        _id: genId("dr"),
        title: "Freshers' Donation Day",
        type: "Blood Donation",
        description: "Annual freshers' welcome drive.",
        startDate: isoDaysFromNow(110),
        endDate: isoDaysFromNow(110),
        target: 150,
        status: "planned",
      },
    ],
  };

  const campaigns = {
    [orgIds.lifeline]: [
      {
        _id: genId("ca"),
        title: "#DonateBlood2026",
        type: "Awareness",
        channel: "Mixed",
        description: "Year-long social media + hoardings awareness push.",
        startDate: isoDaysFromNow(-20),
        endDate: isoDaysFromNow(330),
        budget: 850000,
        audienceTarget: 250000,
        status: "running",
        resultsNotes: "300k impressions in first 3 weeks across IG + LinkedIn.",
      },
      {
        _id: genId("ca"),
        title: "First-Time Donor Recruitment",
        type: "Recruitment",
        channel: "Online",
        description: "Targeted ads to 18-25 audience in Mumbai region.",
        startDate: isoDaysFromNow(15),
        endDate: isoDaysFromNow(75),
        budget: 220000,
        audienceTarget: 50000,
        status: "scheduled",
        resultsNotes: "",
      },
      {
        _id: genId("ca"),
        title: "Winter 2024 Awareness",
        type: "Seasonal",
        channel: "Offline",
        description: "Print posters and radio spots.",
        startDate: isoDaysFromNow(-150),
        endDate: isoDaysFromNow(-110),
        budget: 180000,
        audienceTarget: 80000,
        status: "completed",
        resultsNotes: "Approx 90k reach, 412 first-time donors registered.",
      },
    ],
    [orgIds.hope]: [
      {
        _id: genId("ca"),
        title: "Rural Outreach Phase 1",
        type: "Awareness",
        channel: "Offline",
        description: "Posters and street-play awareness across 8 districts.",
        startDate: isoDaysFromNow(-5),
        endDate: isoDaysFromNow(55),
        budget: 320000,
        audienceTarget: 120000,
        status: "running",
        resultsNotes: "",
      },
    ],
    [orgIds.greentech]: [
      {
        _id: genId("ca"),
        title: "CSR Storytelling LinkedIn Series",
        type: "Awareness",
        channel: "Online",
        description: "Employee testimonial series on LinkedIn.",
        startDate: isoDaysFromNow(-90),
        endDate: isoDaysFromNow(-30),
        budget: 50000,
        audienceTarget: 20000,
        status: "completed",
        resultsNotes: "12 posts, 38k impressions.",
      },
    ],
  };

  const collaborations = {
    [orgIds.lifeline]: [
      {
        _id: genId("co"),
        ngo: { _id: orgIds.hope, name: "HopeForAll Foundation" },
        ngoId: orgIds.hope,
        scope: "Joint Delhi-Mumbai donor mobilisation drive.",
        startDate: "2024-09-01T00:00:00.000Z",
        endDate: "",
        status: "active",
        notes: "Quarterly sync calls; shared donor app analytics.",
      },
      {
        _id: genId("co"),
        ngo: { _id: orgIds.techhelp, name: "TechHelp Foundation" },
        ngoId: orgIds.techhelp,
        scope: "Donor app feature collaboration (legacy).",
        startDate: "2022-08-01T00:00:00.000Z",
        endDate: "2024-12-31T00:00:00.000Z",
        status: "ended",
        notes: "Wrapped up after the donor app rollout completed.",
      },
    ],
    [orgIds.greentech]: [
      {
        _id: genId("co"),
        ngo: { _id: orgIds.lifeline, name: "Lifeline NGO" },
        ngoId: orgIds.lifeline,
        scope: "CSR funds channelled to Lifeline's Mumbai drives.",
        startDate: "2023-07-01T00:00:00.000Z",
        endDate: "",
        status: "active",
        notes: "₹6 lakh/yr CSR allocation. Reviewed annually.",
      },
    ],
    [orgIds.xavier]: [
      {
        _id: genId("co"),
        ngo: { _id: orgIds.hope, name: "HopeForAll Foundation" },
        ngoId: orgIds.hope,
        scope: "Volunteer pipeline + freshers' drive logistics.",
        startDate: "2024-08-15T00:00:00.000Z",
        endDate: "",
        status: "proposed",
        notes: "Awaiting university sign-off on data sharing.",
      },
    ],
    [orgIds.healthDept]: [
      {
        _id: genId("co"),
        ngo: { _id: orgIds.lifeline, name: "Lifeline NGO" },
        ngoId: orgIds.lifeline,
        scope: "Emergency response MoU for Mumbai region.",
        startDate: "2022-01-10T00:00:00.000Z",
        endDate: "",
        status: "active",
        notes: "Government MoU — renewed Nov annually.",
      },
    ],
  };

  return { organizations, members, drives, campaigns, collaborations, fakeUsers };
};

// ─── Persistence ──────────────────────────────────────────────────────────
const loadState = () => {
  try {
    const raw = sessionStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Refresh fakeUsers (not persisted-critical, comes from seed)
      if (!parsed.fakeUsers) parsed.fakeUsers = seed().fakeUsers;
      return parsed;
    }
  } catch (e) {
    console.warn("Failed to load demo store, re-seeding:", e);
  }
  const fresh = seed();
  sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
};

const saveState = (s) => {
  try { sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(s)); }
  catch (e) { console.warn("Demo store save failed:", e); }
};

let state = null;
const ensureState = () => { if (!state) state = loadState(); return state; };

export const resetOrganizationsDemoData = () => {
  state = seed();
  saveState(state);
};

// ─── Helpers ──────────────────────────────────────────────────────────────
const ok = (data) => ({ data: { data } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const withCounts = (org, s) => ({
  ...org,
  membersCount: (s.members[org._id] || []).length,
  drivesCount: (s.drives[org._id] || []).length,
  campaignsCount: (s.campaigns[org._id] || []).length,
});

// Matches /organizations, /organizations/:id, /organizations/:id/<sub>...
const ORG_LIST_RE = /\/organizations\/?(\?.*)?$/;
const ORG_DETAIL_RE = /\/organizations\/([^/?]+)\/?(\?.*)?$/;
const ORG_SUB_RE = /\/organizations\/([^/]+)\/(members|drives|campaigns|collaborations)(?:\/([^/?]+))?\/?(\?.*)?$/;

const parseBody = (data) => {
  if (!data) return {};
  if (typeof data === "string") {
    try { return JSON.parse(data); } catch { return {}; }
  }
  return data;
};

// ─── Request router ───────────────────────────────────────────────────────
const handleDemo = async (config) => {
  await sleep(60); // tiny delay to feel like a network call
  const s = ensureState();
  const method = (config.method || "get").toLowerCase();
  const fullUrl = config.url || "";
  // Strip baseURL/origin so the regex only sees the path + query.
  const path = fullUrl.replace(/^https?:\/\/[^/]+/, "").replace(/^.*\/api/, "/api").replace(/^\/api/, "");

  // ── /organizations/:id/{sub}[/:subId] ─────────────────────────────────
  const subMatch = path.match(ORG_SUB_RE);
  if (subMatch) {
    const [, orgId, sub, subId] = subMatch;
    s[sub][orgId] = s[sub][orgId] || [];
    const list = s[sub][orgId];
    const body = parseBody(config.data);

    if (method === "get") {
      // Special case: collaborations need ngo populated
      if (sub === "collaborations") {
        const populated = list.map((c) => ({
          ...c,
          ngo: c.ngo || s.organizations.find((o) => o._id === c.ngoId) || null,
        }));
        return ok({ [sub]: populated });
      }
      return ok({ [sub]: list });
    }

    if (method === "post") {
      let item;
      if (sub === "members") {
        const user =
          body.user ||
          s.fakeUsers.find((u) => u._id === body.userId) ||
          { _id: body.userId, name: "Unknown", email: "unknown@example.com" };
        item = { _id: genId("m"), user, role: body.role || "Member", joinedAt: new Date().toISOString() };
      } else if (sub === "collaborations") {
        const ngo = s.organizations.find((o) => o._id === body.ngoId) || null;
        item = { _id: genId("co"), ...body, ngo };
      } else {
        item = { _id: genId(sub === "drives" ? "dr" : "ca"), ...body };
      }
      list.push(item);
      saveState(s);
      return ok({ [sub.slice(0, -1)]: item });
    }

    if (method === "patch" && subId) {
      const idx = list.findIndex((x) => x._id === subId);
      if (idx === -1) throw notFound(path);
      list[idx] = { ...list[idx], ...body };
      if (sub === "collaborations" && body.ngoId) {
        list[idx].ngo = s.organizations.find((o) => o._id === body.ngoId) || null;
      }
      saveState(s);
      return ok({ [sub.slice(0, -1)]: list[idx] });
    }

    if (method === "delete" && subId) {
      s[sub][orgId] = list.filter((x) => x._id !== subId);
      saveState(s);
      return ok({ ok: true });
    }
  }

  // ── /organizations/:id ────────────────────────────────────────────────
  const detailMatch = path.match(ORG_DETAIL_RE);
  if (detailMatch && !ORG_LIST_RE.test(path)) {
    const orgId = detailMatch[1];
    const idx = s.organizations.findIndex((o) => o._id === orgId);
    if (idx === -1 && method !== "delete") throw notFound(path);

    if (method === "get") return ok({ organization: withCounts(s.organizations[idx], s) });

    if (method === "patch") {
      const body = parseBody(config.data);
      s.organizations[idx] = { ...s.organizations[idx], ...body };
      saveState(s);
      return ok({ organization: withCounts(s.organizations[idx], s) });
    }

    if (method === "delete") {
      s.organizations = s.organizations.filter((o) => o._id !== orgId);
      delete s.members[orgId];
      delete s.drives[orgId];
      delete s.campaigns[orgId];
      delete s.collaborations[orgId];
      saveState(s);
      return ok({ ok: true });
    }
  }

  // ── /organizations (list / create) ────────────────────────────────────
  if (ORG_LIST_RE.test(path)) {
    if (method === "get") {
      const qs = new URL(fullUrl, "http://x").searchParams;
      const typeF = qs.get("type");
      const activeF = qs.get("active");
      const search = (qs.get("searchText") || "").toLowerCase();
      let items = s.organizations.slice();
      if (typeF && typeF !== "All") items = items.filter((o) => o.type === typeF);
      if (activeF === "true") items = items.filter((o) => o.active);
      if (activeF === "false") items = items.filter((o) => !o.active);
      if (search) items = items.filter((o) => o.name.toLowerCase().includes(search));
      return ok({ items: items.map((o) => withCounts(o, s)) });
    }
    if (method === "post") {
      const body = parseBody(config.data);
      const newOrg = {
        _id: genId("org"),
        ...body,
        verified: false,
        verificationRejected: false,
      };
      s.organizations.unshift(newOrg);
      saveState(s);
      return ok({ organization: withCounts(newOrg, s) });
    }
  }

  // Not a path we handle here — let the request fall through to real network.
  return null;
};

const notFound = (path) => {
  const err = new Error(`Demo: not found ${path}`);
  err.response = { status: 404, data: { error: "Not found (demo)" } };
  return err;
};

// ─── Adapter install ──────────────────────────────────────────────────────
//
// We install a *request* interceptor (not a global adapter override). It
// inspects the URL and, only for /organizations* and the /users user-picker
// path, swaps in a per-request adapter that resolves with demo data. Every
// other request keeps axios's default adapter and hits the real network.
let installed = false;

const isDemoPath = (url) => {
  const path = (url || "").replace(/^https?:\/\/[^/]+/, "");
  // Only /organizations* paths are intercepted by the adapter. The Members
  // tab's user picker calls demoSearchUsers() directly instead of going
  // through /users, so we don't clobber the real Users admin page.
  return /\/organizations(\/|$|\?)/.test(path);
};

// Exported for the Members tab's "Add Member" search input.
export const demoSearchUsers = async (query) => {
  await sleep(60);
  const s = ensureState();
  const q = (query || "").toLowerCase().trim();
  if (!q) return s.fakeUsers.slice(0, 10);
  return s.fakeUsers.filter(
    (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  );
};

const demoAdapter = (config) =>
  handleDemo(config).then((result) => {
    if (result) {
      return {
        data: result.data,
        status: 200,
        statusText: "OK",
        headers: {},
        config,
        request: {},
      };
    }
    // Path matched the outer guard but no handler matched — return 404 so
    // the calling component sees a clean error instead of hanging.
    const err = new Error("Demo: unhandled route");
    err.config = config;
    err.response = { status: 404, data: { error: "Not handled (demo)" }, config };
    throw err;
  });

export const installOrganizationsDemoAdapter = () => {
  if (!DEMO_MODE || installed) return;
  installed = true;

  axios.interceptors.request.use((config) => {
    if (isDemoPath(config.url)) {
      config.adapter = demoAdapter;
    }
    return config;
  });
};
