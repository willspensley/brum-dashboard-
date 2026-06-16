import { useState, useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  PALETTE & STATIC CONFIG                                            */
/* ------------------------------------------------------------------ */
const C = {
  paper: "#F4F5F7",
  ink: "#1B2333",
  sub: "#5A6473",
  faint: "#8B93A1",
  line: "#E3E6EB",
  card: "#FFFFFF",
  surplus: "#1F7A5C",
  surplusBg: "#E7F1EC",
  deficit: "#B0473C",
  deficitBg: "#F6EAE8",
  gold: "#B08A3E",
  revenue: "#2F6E61",
  services: "#5C7A99",
};

// Benefit categories shown in the per-ward breakdown
const BEN = [
  { key: "universalCredit", label: "Universal Credit", color: "#2B4A6F" },
  { key: "statePension", label: "State Pension", color: "#5C7A99" },
  { key: "disability", label: "Disability (PIP / DLA / AA)", color: "#3E7C77" },
  { key: "childBenefit", label: "Child Benefit", color: "#C18A3D" },
  { key: "pensionCredit", label: "Pension Credit", color: "#94A3B0" },
  { key: "carers", label: "Carer's Allowance", color: "#7A9A7E" },
  { key: "councilTaxSupportOther", label: "Council Tax Support & other", color: "#B4BAC2" },
];

// ILLUSTRATIVE PLACEHOLDER DATA — real ward names, invented figures.
// Per head, per year (£). benefitPerHead and net are derived in code.
const wardsRaw = [
  { name: "Sparkbrook & Balsall Heath East", population: 31000, age: { children: 28, working: 64, pension: 8 },
    revenuePerHead: 5400, servicePerHead: 9600,
    benefits: { universalCredit: 4200, statePension: 750, disability: 820, childBenefit: 470, pensionCredit: 150, carers: 120, councilTaxSupportOther: 190 },
    note: "Young population with many large families, plus working-age worklessness. A major gainer from the removal of the two-child limit." },
  { name: "Aston", population: 30000, age: { children: 27, working: 65, pension: 8 },
    revenuePerHead: 5500, servicePerHead: 9400,
    benefits: { universalCredit: 4000, statePension: 800, disability: 800, childBenefit: 440, pensionCredit: 160, carers: 110, councilTaxSupportOther: 180 },
    note: "Young, high-deprivation ward; spend is dominated by working-age UC and child-related support." },
  { name: "Lozells", population: 28000, age: { children: 27, working: 64, pension: 9 },
    revenuePerHead: 5600, servicePerHead: 9300,
    benefits: { universalCredit: 3800, statePension: 850, disability: 780, childBenefit: 430, pensionCredit: 170, carers: 110, councilTaxSupportOther: 170 },
    note: "Diverse, young population; UC and disability support are the largest components." },
  { name: "Bordesley & Highgate", population: 29000, age: { children: 26, working: 65, pension: 9 },
    revenuePerHead: 5800, servicePerHead: 9100,
    benefits: { universalCredit: 3700, statePension: 880, disability: 760, childBenefit: 410, pensionCredit: 170, carers: 100, councilTaxSupportOther: 170 },
    note: "Inner-city deprivation; working-age benefits dominate the local spend." },
  { name: "Kingstanding", population: 25000, age: { children: 23, working: 59, pension: 18 },
    revenuePerHead: 7400, servicePerHead: 8800,
    benefits: { universalCredit: 2900, statePension: 1800, disability: 700, childBenefit: 270, pensionCredit: 220, carers: 90, councilTaxSupportOther: 130 },
    note: "Older working-class ward; State Pension and disability support sit alongside working-age UC." },
  { name: "Ladywood", population: 24000, age: { children: 24, working: 68, pension: 8 },
    revenuePerHead: 6800, servicePerHead: 8600,
    benefits: { universalCredit: 3200, statePension: 650, disability: 680, childBenefit: 360, pensionCredit: 130, carers: 80, councilTaxSupportOther: 150 },
    note: "City-centre ward; a mix of low-income households and newer professional residents lifts the revenue base." },
  { name: "Erdington", population: 26000, age: { children: 22, working: 61, pension: 17 },
    revenuePerHead: 8200, servicePerHead: 8500,
    benefits: { universalCredit: 2600, statePension: 1750, disability: 620, childBenefit: 260, pensionCredit: 200, carers: 80, councilTaxSupportOther: 120 },
    note: "Mixed ward, close to the regional average for working-age support." },
  { name: "Acocks Green", population: 26000, age: { children: 21, working: 62, pension: 17 },
    revenuePerHead: 9800, servicePerHead: 8000,
    benefits: { universalCredit: 2000, statePension: 1650, disability: 480, childBenefit: 250, pensionCredit: 120, carers: 70, councilTaxSupportOther: 90 },
    note: "Broadly average ward with a balanced age profile." },
  { name: "Bournville & Cotteridge", population: 25000, age: { children: 20, working: 62, pension: 18 },
    revenuePerHead: 10600, servicePerHead: 7900,
    benefits: { universalCredit: 1700, statePension: 1700, disability: 430, childBenefit: 250, pensionCredit: 100, carers: 70, councilTaxSupportOther: 70 },
    note: "Moderately affluent; close to the UK-average net position." },
  { name: "Moseley", population: 24000, age: { children: 19, working: 64, pension: 17 },
    revenuePerHead: 11800, servicePerHead: 7600,
    benefits: { universalCredit: 1400, statePension: 1550, disability: 380, childBenefit: 240, pensionCredit: 80, carers: 60, councilTaxSupportOther: 60 },
    note: "Affluent, mixed ward; high earnings roughly offset the spending it receives." },
  { name: "Sutton Four Oaks", population: 22000, age: { children: 18, working: 55, pension: 27 },
    revenuePerHead: 13600, servicePerHead: 7900,
    benefits: { universalCredit: 700, statePension: 3300, disability: 560, childBenefit: 210, pensionCredit: 90, carers: 60, councilTaxSupportOther: 30 },
    note: "Affluent, older ward. Benefit spend is pension-driven, yet high earnings keep it a net contributor — the clearest example of why age alone doesn't decide the result." },
  { name: "Edgbaston", population: 23000, age: { children: 17, working: 67, pension: 16 },
    revenuePerHead: 14200, servicePerHead: 7300,
    benefits: { universalCredit: 1000, statePension: 1550, disability: 330, childBenefit: 230, pensionCredit: 60, carers: 50, councilTaxSupportOther: 30 },
    note: "Affluent ward with a large student and professional population; a strong revenue base." },
  { name: "Harborne", population: 24000, age: { children: 18, working: 66, pension: 16 },
    revenuePerHead: 14600, servicePerHead: 7200,
    benefits: { universalCredit: 900, statePension: 1600, disability: 320, childBenefit: 240, pensionCredit: 50, carers: 50, councilTaxSupportOther: 30 },
    note: "Affluent, professional ward; high income tax and National Insurance receipts." },
];

// Derive benefit total + net fiscal balance
const wards = wardsRaw.map((w) => {
  const benefitPerHead = BEN.reduce((s, b) => s + (w.benefits[b.key] || 0), 0);
  const net = w.revenuePerHead - benefitPerHead - w.servicePerHead;
  return { ...w, benefitPerHead, net };
});

// Population-weighted average net (the figure that would reconcile to the region)
const totalPop = wards.reduce((s, w) => s + w.population, 0);
const avgNet = wards.reduce((s, w) => s + w.net * w.population, 0) / totalPop;

const PROVENANCE = [
  { layer: "Population (denominator)", what: "Ward resident population, split by age band", source: "ONS small-area population estimates", status: "real" },
  { layer: "Benefit caseloads", what: "UC, PIP, DLA, AA, State Pension, Pension Credit counts per ward", source: "DWP Stat-Xplore", status: "login" },
  { layer: "Benefit £ value", what: "Award amounts applied to caseloads, then calibrated to the real LA total", source: "Stat-Xplore amount-paid + DWP Benefit Expenditure & Caseload Tables (LA)", status: "modelled" },
  { layer: "Child Benefit", what: "Recipients and children covered", source: "HMRC Child Benefit statistics", status: "real" },
  { layer: "Council Tax Support", what: "Local CTS caseload and award value", source: "Birmingham City Council data / FOI", status: "login" },
  { layer: "Council Tax raised", what: "Properties by band × band charge", source: "VOA band counts + BCC council-tax base", status: "real" },
  { layer: "Income Tax & NI (revenue)", what: "Allocated to wards via an earnings proxy", source: "HMRC subnational statistics + Census / ASHE", status: "modelled" },
  { layer: "VAT & duties (revenue)", what: "Allocated via a consumption proxy", source: "ONS regional indirect tax + modelled split", status: "modelled" },
  { layer: "Health & social care (services)", what: "Allocated via each ward's age profile", source: "NHS ICB allocations + HM Treasury CRA", status: "modelled" },
  { layer: "Education (services)", what: "Allocated via number of school-age children", source: "DfE school census", status: "real" },
  { layer: "Regional reconciliation", what: "Sum of all wards tied back to the West Midlands total", source: "ONS Country & Regional Public Sector Finances", status: "real" },
];

const STATUS_META = {
  real: { label: "Live source", color: C.surplus, bg: C.surplusBg },
  modelled: { label: "Modelled estimate", color: C.gold, bg: "#F6F0E2" },
  login: { label: "Behind login — placeholder", color: C.deficit, bg: C.deficitBg },
};

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */
const gbp = (n) => (n < 0 ? "\u2212" : "") + "\u00A3" + Math.abs(Math.round(n)).toLocaleString("en-GB");
const gbpK = (n) => (n < 0 ? "\u2212" : "") + "\u00A3" + (Math.abs(n) / 1000).toFixed(1) + "k";

/* ------------------------------------------------------------------ */
/*  SMALL COMPONENTS                                                   */
/* ------------------------------------------------------------------ */
function StatusDot({ status }) {
  const m = STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-1.5" style={{ fontSize: 11.5, color: m.color, fontWeight: 600 }}>
      <span style={{ width: 7, height: 7, borderRadius: 99, background: m.color, display: "inline-block" }} />
      {m.label}
    </span>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-md p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div style={{ fontSize: 11, color: C.sub, letterSpacing: 0.2, textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 19, fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", fontWeight: 600, color: accent || C.ink, marginTop: 3 }}>{value}</div>
    </div>
  );
}

/* Divergent, centered-on-zero balance bars for every ward */
function BalanceBars({ data, selected, onSelect }) {
  const gMin = Math.min(0, ...data.map((w) => w.net));
  const gMax = Math.max(0, ...data.map((w) => w.net));
  const range = gMax - gMin || 1;
  const pct = (x) => ((x - gMin) / range) * 100;
  const zero = pct(0);

  return (
    <div>
      <div className="flex flex-col" style={{ gap: 3 }}>
        {data.map((w) => {
          const isSel = w.name === selected;
          const pos = w.net >= 0;
          const left = pos ? zero : pct(w.net);
          const width = Math.max(0.6, pos ? pct(w.net) - zero : zero - pct(w.net));
          return (
            <button
              key={w.name}
              onClick={() => onSelect(w.name)}
              className="group flex items-center w-full text-left rounded"
              style={{ gap: 8, padding: "3px 4px", background: isSel ? "#EEF1F5" : "transparent", border: "none", cursor: "pointer", transition: "background 120ms" }}
            >
              <span
                title={w.name}
                style={{ width: 142, flexShrink: 0, fontSize: 11.5, lineHeight: 1.15, color: isSel ? C.ink : C.sub, fontWeight: isSel ? 700 : 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {w.name}
              </span>
              <span className="relative flex-1" style={{ height: 18 }}>
                <span style={{ position: "absolute", left: `${zero}%`, top: -2, bottom: -2, width: 1.5, background: C.gold, opacity: 0.65 }} />
                <span
                  className="bw-bar"
                  style={{ position: "absolute", top: 2, bottom: 2, left: `${left}%`, width: `${width}%`, background: pos ? C.surplus : C.deficit, opacity: isSel ? 1 : 0.82, borderRadius: 2 }}
                />
              </span>
              <span style={{ width: 64, flexShrink: 0, textAlign: "right", fontSize: 12, fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", fontWeight: 600, color: pos ? C.surplus : C.deficit }}>
                {gbpK(w.net)}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex justify-between" style={{ marginTop: 8, paddingLeft: 150, paddingRight: 68, fontSize: 10.5, color: C.faint, fontFamily: "ui-monospace, monospace" }}>
        <span>{gbpK(gMin)}</span>
        <span style={{ color: C.gold }}>£0</span>
        <span>{gbpK(gMax)}</span>
      </div>
    </div>
  );
}

/* Per-ward benefit breakdown as a ledger-style bar list */
function BenefitBreakdown({ ward }) {
  const rows = BEN.map((b) => ({ ...b, value: ward.benefits[b.key] || 0 })).sort((a, b) => b.value - a.value);
  const max = Math.max(...rows.map((r) => r.value)) || 1;
  return (
    <div className="flex flex-col" style={{ gap: 7 }}>
      {rows.map((r) => (
        <div key={r.key} className="flex items-center" style={{ gap: 10 }}>
          <span style={{ width: 150, flexShrink: 0, fontSize: 11.5, color: C.sub }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: r.color, marginRight: 6 }} />
            {r.label}
          </span>
          <span className="relative flex-1" style={{ height: 16, background: "#F0F2F5", borderRadius: 3 }}>
            <span className="bw-bar" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(r.value / max) * 100}%`, background: r.color, borderRadius: 3 }} />
          </span>
          <span style={{ width: 52, textAlign: "right", fontSize: 12, fontFamily: "ui-monospace, monospace", fontWeight: 600, color: C.ink }}>{gbp(r.value)}</span>
        </div>
      ))}
      <div className="flex items-center" style={{ gap: 10, marginTop: 4, paddingTop: 8, borderTop: `1px solid ${C.line}` }}>
        <span style={{ width: 150, flexShrink: 0, fontSize: 11.5, fontWeight: 700, color: C.ink }}>Total benefit spend</span>
        <span className="flex-1" />
        <span style={{ width: 52, textAlign: "right", fontSize: 12.5, fontFamily: "ui-monospace, monospace", fontWeight: 700, color: C.ink }}>{gbp(ward.benefitPerHead)}</span>
      </div>
    </div>
  );
}

/* Waterfall: Revenue − Benefits − Services = Net */
function Bridge({ ward }) {
  const R = ward.revenuePerHead;
  const B = ward.benefitPerHead;
  const S = ward.servicePerHead;
  const net = ward.net;
  const sMin = Math.min(0, net);
  const sMax = R;
  const range = sMax - sMin || 1;
  const pct = (v) => ((v - sMin) / range) * 100;
  const rows = [
    { label: "Revenue raised", sign: "+", value: R, from: 0, to: R, color: C.revenue },
    { label: "Less: benefit payments", sign: "\u2212", value: B, from: R - B, to: R, color: C.deficit },
    { label: "Less: service spend", sign: "\u2212", value: S, from: net, to: R - B, color: C.services },
    { label: "Net fiscal balance", sign: net >= 0 ? "+" : "\u2212", value: Math.abs(net), from: Math.min(0, net), to: Math.max(0, net), color: net >= 0 ? C.surplus : C.deficit, bold: true },
  ];
  return (
    <div className="flex flex-col" style={{ gap: 9 }}>
      {rows.map((r, i) => (
        <div key={i} className="flex items-center" style={{ gap: 10 }}>
          <span style={{ width: 150, flexShrink: 0, fontSize: 11.5, color: r.bold ? C.ink : C.sub, fontWeight: r.bold ? 700 : 500 }}>{r.label}</span>
          <span className="relative flex-1" style={{ height: r.bold ? 22 : 18 }}>
            <span style={{ position: "absolute", left: `${pct(0)}%`, top: -3, bottom: -3, width: 1, borderLeft: `1px dashed ${C.gold}`, opacity: 0.6 }} />
            <span className="bw-bar" style={{ position: "absolute", top: 1, bottom: 1, left: `${pct(r.from)}%`, width: `${Math.max(0.5, pct(r.to) - pct(r.from))}%`, background: r.color, opacity: r.bold ? 1 : 0.85, borderRadius: 2 }} />
          </span>
          <span style={{ width: 70, textAlign: "right", fontSize: 12, fontFamily: "ui-monospace, monospace", fontWeight: r.bold ? 700 : 600, color: r.color }}>
            {r.sign}{gbp(r.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function AgeBar({ ward }) {
  const segs = [
    { k: "children", label: "Children", color: "#C18A3D", v: ward.age.children },
    { k: "working", label: "Working age", color: "#2B4A6F", v: ward.age.working },
    { k: "pension", label: "Pension age", color: "#5C7A99", v: ward.age.pension },
  ];
  return (
    <div>
      <div className="flex w-full overflow-hidden" style={{ height: 22, borderRadius: 4, border: `1px solid ${C.line}` }}>
        {segs.map((s) => (
          <div key={s.k} className="bw-bar" style={{ width: `${s.v}%`, background: s.color }} title={`${s.label} ${s.v}%`} />
        ))}
      </div>
      <div className="flex flex-wrap" style={{ gap: 14, marginTop: 8 }}>
        {segs.map((s) => (
          <span key={s.k} style={{ fontSize: 11.5, color: C.sub }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: s.color, marginRight: 5 }} />
            {s.label} <strong style={{ color: C.ink, fontFamily: "ui-monospace, monospace" }}>{s.v}%</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN                                                               */
/* ------------------------------------------------------------------ */
export default function App() {
  const [selectedName, setSelectedName] = useState("Sparkbrook & Balsall Heath East");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 30); return () => clearTimeout(t); }, []);

  const sorted = [...wards].sort((a, b) => a.net - b.net);
  const ward = wards.find((w) => w.name === selectedName) || wards[0];
  const isContributor = ward.net >= 0;
  const ucShare = Math.round((ward.benefits.universalCredit / ward.benefitPerHead) * 100);
  const spShare = Math.round((ward.benefits.statePension / ward.benefitPerHead) * 100);

  return (
    <div className="bw-dash" style={{ background: C.paper, color: C.ink, minHeight: "100%", fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", padding: 20 }}>
      <style>{`
        .bw-dash * { box-sizing: border-box; }
        .bw-bar { transition: width 480ms cubic-bezier(.22,.61,.36,1), left 480ms cubic-bezier(.22,.61,.36,1); }
        .bw-fade { opacity: 0; transform: translateY(8px); transition: opacity 500ms ease, transform 500ms ease; }
        .bw-fade.in { opacity: 1; transform: none; }
        .bw-dash button:focus-visible { outline: 2px solid ${C.gold}; outline-offset: 2px; border-radius: 4px; }
        @media (prefers-reduced-motion: reduce) {
          .bw-bar, .bw-fade { transition: none !important; }
          .bw-fade { opacity: 1; transform: none; }
        }
      `}</style>

      <div style={{ maxWidth: 1180, margin: "0 auto" }} className={`bw-fade ${mounted ? "in" : ""}`}>

        {/* Header */}
        <div style={{ borderTop: `3px solid ${C.gold}`, paddingTop: 16 }}>
          <div style={{ fontSize: 11.5, letterSpacing: 1.4, textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>
            Birmingham · Public finance prototype
          </div>
          <h1 style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', serif", fontSize: 30, fontWeight: 700, margin: "6px 0 4px", letterSpacing: -0.3 }}>
            Ward Net Fiscal Balance
          </h1>
          <p style={{ fontSize: 14, color: C.sub, maxWidth: 720, lineHeight: 1.5, margin: 0 }}>
            What each ward raises in tax set against what it receives in benefits and services — the area-level version of “net contributor” and “net recipient.” Select a ward to break the figure down.
          </p>
        </div>

        {/* Prototype banner */}
        <div className="rounded-md" style={{ marginTop: 16, padding: "11px 14px", background: "#FBF4E4", border: `1px solid #E9D9B0`, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700, color: C.gold, fontSize: 13 }}>DEMO</span>
          <p style={{ margin: 0, fontSize: 12.5, color: "#6B5A2E", lineHeight: 1.45 }}>
            <strong>Illustrative prototype — every £ figure here is a placeholder</strong> chosen to show how the model behaves, not a real result. Ward names and the shape of the contrast are realistic. See the provenance table at the bottom for which inputs are live, modelled, or still behind a login.
          </p>
        </div>

        {/* Ward selector */}
        <div className="flex items-center flex-wrap" style={{ gap: 10, marginTop: 18, marginBottom: 10 }}>
          <label htmlFor="wardpick" style={{ fontSize: 12.5, fontWeight: 600, color: C.sub }}>Ward</label>
          <select
            id="wardpick"
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
            style={{ fontSize: 13.5, padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.line}`, background: C.card, color: C.ink, minWidth: 240, fontWeight: 600 }}
          >
            {[...wards].sort((a, b) => a.name.localeCompare(b.name)).map((w) => (
              <option key={w.name} value={w.name}>{w.name}</option>
            ))}
          </select>
          <span style={{ fontSize: 12, color: C.faint }}>or click any bar on the left</span>
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gap: 18, gridTemplateColumns: "1fr", alignItems: "start" }} className="bw-grid">
          {/* Hero: all wards */}
          <section className="rounded-lg" style={{ background: C.card, border: `1px solid ${C.line}`, padding: 16 }}>
            <h2 style={{ fontSize: 14.5, fontWeight: 700, margin: "0 0 2px" }}>Net fiscal balance per head, by ward</h2>
            <p style={{ fontSize: 11.5, color: C.sub, margin: "0 0 14px" }}>
              <span style={{ color: C.deficit, fontWeight: 700 }}>● In the red</span> = net recipient ·
              <span style={{ color: C.surplus, fontWeight: 700 }}> ● In the black</span> = net contributor
            </p>
            <BalanceBars data={sorted} selected={selectedName} onSelect={setSelectedName} />
            <p style={{ fontSize: 11, color: C.faint, marginTop: 14, lineHeight: 1.5, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
              Population-weighted average across this sample: <strong style={{ color: C.deficit, fontFamily: "ui-monospace, monospace" }}>{gbp(avgNet)}</strong>/head. In the real model this average is reconciled to the published ONS West Midlands figure. This 13-ward sample deliberately skews toward inner-city wards, so it runs deeper into deficit than the full city would.
            </p>
          </section>

          {/* Detail */}
          <section className="flex flex-col" style={{ gap: 14 }}>
            {/* Headline net + badge */}
            <div className="rounded-lg" style={{ background: isContributor ? C.surplusBg : C.deficitBg, border: `1px solid ${isContributor ? "#CADFD4" : "#ECD2CD"}`, padding: 16 }}>
              <div className="flex items-start justify-between flex-wrap" style={{ gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 600 }}>{ward.name}</div>
                  <div style={{ fontSize: 34, fontFamily: "ui-monospace, monospace", fontWeight: 700, color: isContributor ? C.surplus : C.deficit, lineHeight: 1.1, marginTop: 2 }}>
                    {gbp(ward.net)}<span style={{ fontSize: 14, color: C.sub, fontWeight: 500 }}> /head</span>
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: isContributor ? C.surplus : C.deficit, padding: "5px 11px", borderRadius: 99, whiteSpace: "nowrap" }}>
                  {isContributor ? "Net contributor" : "Net recipient"}
                </span>
              </div>
            </div>

            {/* Stat row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }} className="bw-stats">
              <Stat label="Population" value={ward.population.toLocaleString("en-GB")} />
              <Stat label="Benefits / head" value={gbp(ward.benefitPerHead)} accent={C.deficit} />
              <Stat label="Revenue / head" value={gbp(ward.revenuePerHead)} accent={C.revenue} />
              <Stat label="Services / head" value={gbp(ward.servicePerHead)} accent={C.services} />
            </div>

            {/* Bridge */}
            <div className="rounded-lg" style={{ background: C.card, border: `1px solid ${C.line}`, padding: 16 }}>
              <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: "0 0 3px" }}>How the net position is built</h3>
              <p style={{ fontSize: 11.5, color: C.sub, margin: "0 0 14px" }}>Per head, per year. The dashed line marks £0.</p>
              <Bridge ward={ward} />
            </div>
          </section>
        </div>

        {/* Second row: breakdown + age */}
        <div style={{ display: "grid", gap: 18, gridTemplateColumns: "1fr", marginTop: 18 }} className="bw-grid2">
          <section className="rounded-lg" style={{ background: C.card, border: `1px solid ${C.line}`, padding: 16 }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: "0 0 14px" }}>Benefit spend by type — {ward.name}</h3>
            <BenefitBreakdown ward={ward} />
          </section>

          <section className="rounded-lg" style={{ background: C.card, border: `1px solid ${C.line}`, padding: 16 }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: "0 0 14px" }}>Age structure & what's driving the result</h3>
            <AgeBar ward={ward} />
            <p style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.55, marginTop: 14, marginBottom: 10 }}>{ward.note}</p>
            <div className="rounded-md" style={{ background: C.paper, padding: "10px 12px", fontSize: 12, color: C.sub, lineHeight: 1.5 }}>
              Of this ward's benefit spend, <strong style={{ color: "#2B4A6F", fontFamily: "ui-monospace, monospace" }}>{ucShare}%</strong> is Universal Credit and <strong style={{ color: "#5C7A99", fontFamily: "ui-monospace, monospace" }}>{spShare}%</strong> is State Pension — a quick read on whether the position is driven by working-age need or by an older population.
            </div>
          </section>
        </div>

        {/* Interpretation caveat */}
        <div className="rounded-lg" style={{ marginTop: 18, padding: "16px 18px", background: "#1B2333", color: "#E7EAEF" }}>
          <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: "0 0 8px", color: "#fff" }}>How to read this — before drawing conclusions</h3>
          <p style={{ fontSize: 12.5, lineHeight: 1.6, margin: 0, color: "#C5CCD6" }}>
            A “net recipient” ward is usually telling you about its <strong style={{ color: "#fff" }}>age structure and economic base, not the character of its residents</strong>. In the official ONS data, about <strong style={{ color: "#fff" }}>89% of retired people</strong> live in net-recipient households versus around <strong style={{ color: "#fff" }}>46% of non-retired people</strong> — almost everyone is a net recipient as a child and in retirement, and a net contributor during working life. The State Pension, the single largest transfer, goes to people who paid in across a full career, so it should never be read as a “loss.” And because Income Tax, NI and VAT can only be split to ward level by modelling, the revenue figures here are estimates, not official statistics.
          </p>
        </div>

        {/* Provenance */}
        <section className="rounded-lg" style={{ marginTop: 18, background: C.card, border: `1px solid ${C.line}`, padding: 16, overflowX: "auto" }}>
          <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: "0 0 4px" }}>Data sources & provenance</h3>
          <p style={{ fontSize: 11.5, color: C.sub, margin: "0 0 14px" }}>Every layer of the calculation, and whether each input is a live source, a modelled estimate, or still behind a login in this prototype.</p>
          <div style={{ minWidth: 640 }}>
            <div className="flex items-center" style={{ gap: 10, padding: "0 0 8px", borderBottom: `2px solid ${C.line}`, fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.4, color: C.faint, fontWeight: 700 }}>
              <span style={{ width: 170, flexShrink: 0 }}>Layer</span>
              <span style={{ flex: 1.3 }}>What it provides</span>
              <span style={{ flex: 1.4 }}>Source</span>
              <span style={{ width: 150, flexShrink: 0 }}>Status</span>
            </div>
            {PROVENANCE.map((p, i) => (
              <div key={i} className="flex items-center" style={{ gap: 10, padding: "9px 0", borderBottom: `1px solid ${C.line}`, fontSize: 12 }}>
                <span style={{ width: 170, flexShrink: 0, fontWeight: 600, color: C.ink }}>{p.layer}</span>
                <span style={{ flex: 1.3, color: C.sub, lineHeight: 1.35 }}>{p.what}</span>
                <span style={{ flex: 1.4, color: C.sub, lineHeight: 1.35 }}>{p.source}</span>
                <span style={{ width: 150, flexShrink: 0 }}><StatusDot status={p.status} /></span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <p style={{ fontSize: 11, color: C.faint, marginTop: 18, lineHeight: 1.5 }}>
          Prototype for structure only · Figures illustrative · Real inputs: DWP Stat-Xplore, DWP Benefit Expenditure &amp; Caseload Tables, HMRC Child Benefit &amp; subnational tax statistics, ONS small-area population estimates, ONS Country &amp; Regional Public Sector Finances, ONS Effects of Taxes &amp; Benefits on Household Income, VOA, Birmingham City Council.
        </p>
      </div>

      {/* responsive: widen to two/columns on larger screens via media query in style */}
      <style>{`
        @media (min-width: 900px) {
          .bw-dash .bw-grid { grid-template-columns: 2fr 3fr !important; }
          .bw-dash .bw-grid2 { grid-template-columns: 1fr 1fr !important; }
          .bw-dash .bw-stats { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
