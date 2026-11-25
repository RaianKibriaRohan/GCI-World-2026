// Builds the GCI Final Assignment deck from the notebook outputs in ../analysis/figures
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const sharp = require("sharp");
const { icon } = require("./icons");
const fa = require("react-icons/fa");

const FIG = path.join(__dirname, "..", "analysis", "figures");
const OUT = path.join(__dirname, "Renew_and_Upgrade_Proposal.pptx");

// ---------- data from notebook ----------
function readCsv(f) {
  const [head, ...rows] = fs.readFileSync(path.join(FIG, f), "utf8").trim().split(/\r?\n/);
  return { head: head.split(","), rows: rows.map((r) => r.split(",")) };
}
const imp = Object.fromEntries(readCsv("impact_summary.csv").rows.map(([k, v]) => [k, parseFloat(v)]));
const mr = readCsv("model_results.csv");
const M = Object.fromEntries(mr.rows.map((r) => [r[0], Object.fromEntries(mr.head.slice(1).map((h, i) => [h, parseFloat(r[i + 1])]))]));
const sg = readCsv("segments.csv");
const SEG = Object.fromEntries(sg.rows.map((r) => [r[0], Object.fromEntries(sg.head.slice(1).map((h, i) => [h, parseFloat(r[i + 1])]))]));
const segShare = (key) => Object.entries(SEG).find(([k]) => k.startsWith(key))[1].share;

const lgbm = M["LightGBM"];
const pct = (x, d = 0) => (x * 100).toFixed(d) + "%";
const money = (x) => "$" + (x / 1e6).toFixed(2) + "M";
const n0 = (x) => Math.round(x).toLocaleString("en-US");

// ---------- theme ----------
const THEME = {
  name: "Renew Signal",
  headFontFace: "Calibri",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1B1F24", lt1: "FFFFFF", dk2: "1F3A5F", lt2: "EEF2F7",
    accent1: "E07A1F", accent2: "1F3A5F", accent3: "2A9D8F", accent4: "8A94A6", accent5: "F4C59A", accent6: "C0392B",
    hlink: "1F3A5F", folHlink: "5B6B82",
  },
};
const HEX = { navy: "1F3A5F", orange: "E07A1F", teal: "2A9D8F", grey: "8A94A6", light: "EEF2F7", ink: "1B1F24", muted: "5B6B82", white: "FFFFFF", peach: "FCEBDD" };

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "Renew & Upgrade – Churn PoC for Company A";
pres.author = "GCI World 2026 participant";
const C = pres.SchemeColor;

// ---------- layouts ----------
pres.defineSlideMaster({
  title: "TITLE_DARK",
  background: { color: HEX.navy },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.0, w: 11.5, h: 1.4, fontSize: 54, bold: true, color: C.background1, valign: "bottom", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 3.55, w: 11.5, h: 1.2, fontSize: 24, color: C.background2, valign: "top", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: HEX.white },
  margin: [0.5, 0.5, 0.6, 0.5],
  slideNumber: { x: 12.3, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: C.accent4, align: "right" },
  objects: [
    { placeholder: { options: { name: "kicker", type: "body", x: 0.5, y: 0.28, w: 9, h: 0.3, fontSize: 12, bold: true, color: C.accent1, charSpacing: 1, margin: 0 }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.58, w: 12.3, h: 0.85, fontSize: 24, bold: true, color: C.text2, valign: "top", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "source", type: "body", x: 0.5, y: 6.98, w: 11.5, h: 0.32, fontSize: 10, color: C.accent4, valign: "middle", margin: 0 }, text: "" } },
  ],
});

// ---------- helpers ----------
async function img(slide, file, x, y, w, h, name) {
  const p = path.join(FIG, file);
  const { width, height } = await sharp(p).metadata();
  const r = Math.min(w / width, h / height);
  const iw = width * r, ih = height * r;
  slide.addImage({ path: p, x: x + (w - iw) / 2, y: y + (h - ih) / 2, w: iw, h: ih, objectName: name, altText: name });
}
function head(slide, kicker, title, source) {
  slide.addText(kicker.toUpperCase(), { placeholder: "kicker" });
  slide.addText(title, { placeholder: "title" });
  if (source) slide.addText(source, { placeholder: "source" });
}
function card(slide, x, y, w, h, fill = HEX.light, name = "card") {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: fill }, rectRadius: 0.08, objectName: name });
}
async function iconCircle(slide, I, x, y, d = 0.6, bg = HEX.orange) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: bg }, line: { color: bg }, objectName: "icon circle" });
  slide.addImage({ data: await icon(I, "#FFFFFF"), x: x + d * 0.22, y: y + d * 0.22, w: d * 0.56, h: d * 0.56, objectName: "icon" });
}
function txt(slide, text, o) {
  slide.addText(text, { isTextBox: true, fontFace: "Calibri", color: HEX.ink, fontSize: 14, valign: "top", margin: 0, ...o });
}
function takeaway(slide, text, y = 6.2, h = 0.62) {
  card(slide, 0.5, y, 12.33, h, HEX.peach, "takeaway");
  txt(slide, text, { x: 0.75, y, w: 11.9, h, valign: "middle", fontSize: 15, color: HEX.ink });
}

(async () => {
  // ===== 1. Title =====
  let s = pres.addSlide({ masterName: "TITLE_DARK" });
  s.addText("Renew & Upgrade", { placeholder: "title" });
  s.addText("Using machine learning to stop Company A's customers leaving at contract renewal", { placeholder: "body" });
  await iconCircle(s, fa.FaSignal, 0.8, 0.9, 0.8, HEX.orange);
  txt(s, "Proof-of-Concept proposal for Company A's executive team", { x: 0.8, y: 5.6, w: 9, h: 0.4, fontSize: 16, color: "CADCFC" });
  txt(s, "GCI World 2026 · Final Assignment · November 2026", { x: 0.8, y: 6.0, w: 9, h: 0.4, fontSize: 14, color: "CADCFC" });

  // ===== 2. Executive summary =====
  s = pres.addSlide({ masterName: "CONTENT" });
  head(s, "Executive summary", "Customers leave when their contract ends and their phone ages — a targeted renewal offer recovers this value",
    "Figures computed on Company A's 100,000-customer dataset; impact per campaign cycle (see slide 13 for assumptions).");
  const ex = [
    [fa.FaExclamationTriangle, "The problem", "64%", "churn at months 11–12 of service, double that of new customers (32%)"],
    [fa.FaMobileAlt, "The driver", "58%", "churn when the handset is 2+ years old, vs 42% for phones under 6 months"],
    [fa.FaBrain, "The model", lgbm["Test ROC-AUC"].toFixed(2), `ROC-AUC (LightGBM); its top-20% risk list churns at ${pct(lgbm["Precision@top20%"])}`],
    [fa.FaDollarSign, "The value", "+" + money(imp.base_net), `net per cycle per 100k customers; ROI ${pct(imp.base_roi)}, break-even at ${pct(imp.breakeven)} save rate`],
  ];
  for (let i = 0; i < 4; i++) {
    const x = 0.5 + i * 3.13, y = 1.65, w = 2.93, h = 3.85;
    card(s, x, y, w, h);
    await iconCircle(s, ex[i][0], x + 0.25, y + 0.25, 0.6, i === 3 ? HEX.teal : HEX.orange);
    txt(s, ex[i][1], { x: x + 0.25, y: y + 1.0, w: w - 0.5, h: 0.35, fontSize: 15, bold: true, color: HEX.muted });
    txt(s, ex[i][2], { x: x + 0.25, y: y + 1.4, w: w - 0.5, h: 0.9, fontSize: 44, bold: true, color: i === 3 ? HEX.teal : HEX.navy, fit: "shrink" });
    txt(s, ex[i][3], { x: x + 0.25, y: y + 2.35, w: w - 0.5, h: 1.35, fontSize: 14 });
  }
  takeaway(s, [
    { text: "Decision requested: ", options: { bold: true, color: HEX.orange } },
    { text: "approve a 3-month A/B pilot of the “Renew & Upgrade” programme on the 20% highest-risk customers." },
  ], 5.75, 0.75);

  // ===== 3. Market =====
  s = pres.addSlide({ masterName: "CONTENT" });
  head(s, "1 · Market analysis", "A saturated market: growth now comes from keeping customers, not winning new ones",
    "Sources: [1] CTIA 2025 Annual Survey · [2] T-Mobile US 10-K FY2024 · [3] Assurant via RCR Wireless 2024 · [4] Gallo, HBR 2014");
  const mk = [
    ["579M", "US wireless connections in 2024 — 1.7 per person. Almost everyone already has a phone plan.", "[1]"],
    ["0.86%", "Monthly postpaid phone churn at a market leader. Best-in-class operators lose only ~10% of customers a year.", "[2]"],
    ["3.7 yrs", "Average age of a traded-in phone (record high). Upgrade cycles are getting longer, so phones grow old.", "[3]"],
    ["5–25×", "How much more it costs to win a new customer than to keep an existing one.", "[4]"],
  ];
  for (let i = 0; i < 4; i++) {
    const x = 0.5 + (i % 2) * 3.85, y = 1.6 + Math.floor(i / 2) * 2.35;
    card(s, x, y, 3.65, 2.15);
    txt(s, mk[i][0], { x: x + 0.25, y: y + 0.2, w: 3.15, h: 0.75, fontSize: 36, bold: true, color: HEX.navy });
    txt(s, [{ text: mk[i][1] + " " }, { text: mk[i][2], options: { color: HEX.muted, fontSize: 11 } }], { x: x + 0.25, y: y + 0.95, w: 3.2, h: 1.1, fontSize: 14 });
  }
  card(s, 8.35, 1.6, 4.48, 4.5, HEX.navy, "so-what panel");
  txt(s, "What this means for Company A", { x: 8.65, y: 1.85, w: 3.9, h: 0.4, fontSize: 18, bold: true, color: HEX.white });
  txt(s, [
    { text: "Every lost customer must be replaced at a much higher cost, so retention is the cheapest growth lever.", options: { bullet: true, breakLine: true } },
    { text: "Contract renewal and handset upgrade are the moments when customers compare operators.", options: { bullet: true, breakLine: true } },
    { text: "Company A's observed churn (≈50% in the 31–60-day window of this sample) is far above the market benchmark. There is clear room to improve.", options: { bullet: true, breakLine: true } },
    { text: "Retention money must be targeted: offers to everyone waste budget on customers who would stay anyway.", options: { bullet: true } },
  ], { x: 8.65, y: 2.4, w: 3.95, h: 3.6, fontSize: 14, color: HEX.white, paraSpaceAfter: 8 });

  // ===== 4. Data =====
  s = pres.addSlide({ masterName: "CONTENT" });
  head(s, "2 · EDA — the data", "100,000 customers, 100 columns: usage and handset data are rich, household data is patchy",
    "Source: Company A dataset (Client.csv, Record.csv); analysis notebook section 2.1.");
  const boxes = [["Client.csv", "50 columns", "account, handset, household"], ["Record.csv", "51 columns", "usage, billing, call quality, churn"]];
  for (let i = 0; i < 2; i++) {
    card(s, 0.5, 1.6 + i * 1.25, 2.6, 1.05);
    txt(s, boxes[i][0], { x: 0.7, y: 1.7 + i * 1.25, w: 2.3, h: 0.35, fontSize: 16, bold: true, color: HEX.navy });
    txt(s, boxes[i][1] + " · " + boxes[i][2], { x: 0.7, y: 2.05 + i * 1.25, w: 2.3, h: 0.55, fontSize: 12, color: HEX.muted });
  }
  s.addShape(pres.shapes.RIGHT_ARROW, { x: 3.25, y: 2.25, w: 0.55, h: 0.45, fill: { color: HEX.orange }, line: { color: HEX.orange } });
  card(s, 3.95, 1.85, 1.9, 1.3, HEX.navy);
  txt(s, [{ text: "100,000 × 100", options: { bold: true, breakLine: true, fontSize: 16 } }, { text: "joined on Customer_ID (1:1, no duplicates)", options: { fontSize: 11 } }],
    { x: 4.05, y: 1.95, w: 1.7, h: 1.1, color: HEX.white, valign: "middle", align: "center" });
  txt(s, [
    { text: "Target is balanced: ", options: { bold: true } }, { text: "49.6% churned, which is far above real-world rates. The sample was likely rebalanced, so we use ROC-AUC and lift, and rescale money in the pilot.", options: { breakLine: true } },
    { text: "Cleaning: ", options: { bold: true } }, { text: "133 negative handset ages and 28 negative charges set to missing; 21 text columns encoded.", options: { breakLine: true } },
    { text: "Missing as signal: ", options: { bold: true } }, { text: "kept “missing” as its own category instead of guessing values." },
  ], { x: 0.5, y: 4.25, w: 5.4, h: 2.5, fontSize: 14, paraSpaceAfter: 8 });
  await img(s, "missing.png", 6.2, 1.5, 6.6, 5.3, "Missing values chart");

  // ===== 5. EDA – renewal cliff & handset age =====
  s = pres.addSlide({ masterName: "CONTENT" });
  head(s, "2 · EDA — pain points", "Two churn hot spots: the 11–12-month renewal cliff and ageing handsets",
    "Source: Company A dataset, 100,000 customers; notebook section 2.3. Dashed line = average churn rate.");
  await img(s, "eda_tenure_handset.png", 0.5, 1.5, 12.33, 4.55, "Churn by tenure and handset age");
  takeaway(s, [
    { text: "Inference: ", options: { bold: true, color: HEX.orange } },
    { text: "churn doubles (32% → 64%) when the first-year commitment ends, and rises steadily as the phone ages (42% → 58%). Both happen at predictable moments, so Company A can act before them." },
  ]);

  // ===== 6. EDA – handset quality & hypotheses =====
  s = pres.addSlide({ masterName: "CONTENT" });
  head(s, "2 · EDA — hypotheses", "Old, cheap and low-spec phones in the renewal window form the highest-risk group",
    "Source: Company A dataset; notebook section 2.3. Revenue level and care-call counts were also tested but separate churners only weakly.");
  await img(s, "eda_handset_quality.png", 0.5, 1.45, 7.6, 3.1, "Churn by handset price and capability");
  await img(s, "eda_heatmap.png", 8.3, 1.45, 4.5, 3.1, "Heatmap tenure x handset age");
  const hyp = [
    ["H1 · Renewal timing", "Customers re-shop when their contract ends, so an offer must arrive before month 11."],
    ["H2 · Handset refresh", "An old or basic phone makes rivals' new-phone deals attractive, so a timely upgrade keeps them."],
    ["H3 · Many weak signals", "No single variable separates churners well (best single-feature AUC 0.57), so ML is needed to combine them."],
  ];
  for (let i = 0; i < 3; i++) {
    const x = 0.5 + i * 4.18;
    card(s, x, 4.75, 3.97, 2.05);
    txt(s, hyp[i][0], { x: x + 0.25, y: 4.9, w: 3.5, h: 0.4, fontSize: 16, bold: true, color: HEX.navy });
    txt(s, hyp[i][1], { x: x + 0.25, y: 5.35, w: 3.5, h: 1.35, fontSize: 14 });
  }

  // ===== 7. Problem definition =====
  s = pres.addSlide({ masterName: "CONTENT" });
  head(s, "3 · Problem definition", "We predict who will leave in 31–60 days, giving a 30-day window to act",
    "Target definition from Company A's data dictionary (churn = churned 31–60 days after the observation date).");
  const steps = [
    [fa.FaBullseye, "Business objective", "Cut churn and lost revenue at the lowest retention cost"],
    [fa.FaHandshake, "Decision", "Each month: whom to contact, and with which offer"],
    [fa.FaUserTimes, "Target (y)", "churn = 1 if the customer leaves 31–60 days after observation"],
    [fa.FaProjectDiagram, "ML task", "Binary classification → churn-risk score per customer"],
    [fa.FaRulerCombined, "Metric", "ROC-AUC (ranking quality) + precision in the top-20% list"],
  ];
  for (let i = 0; i < 5; i++) {
    const x = 0.5 + i * 2.5;
    card(s, x, 1.6, 2.3, 2.75);
    await iconCircle(s, steps[i][0], x + 0.2, 1.8, 0.6, HEX.orange);
    txt(s, steps[i][1], { x: x + 0.2, y: 2.55, w: 1.95, h: 0.35, fontSize: 15, bold: true, color: HEX.navy });
    txt(s, steps[i][2], { x: x + 0.2, y: 2.95, w: 1.95, h: 1.35, fontSize: 13 });
  }
  // timeline
  txt(s, "Prediction timeline", { x: 0.5, y: 4.65, w: 4, h: 0.35, fontSize: 15, bold: true, color: HEX.navy });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 5.15, w: 5.6, h: 0.6, fill: { color: HEX.navy }, line: { color: HEX.navy } });
  txt(s, "Features: past usage, billing, handset (up to observation date)", { x: 0.6, y: 5.15, w: 5.4, h: 0.6, fontSize: 13, color: HEX.white, valign: "middle", align: "center" });
  s.addShape(pres.shapes.RECTANGLE, { x: 6.2, y: 5.15, w: 3.0, h: 0.6, fill: { color: HEX.teal }, line: { color: HEX.teal } });
  txt(s, "Days 1–30: act (offer)", { x: 6.2, y: 5.15, w: 3.0, h: 0.6, fontSize: 13, color: HEX.white, valign: "middle", align: "center", bold: true });
  s.addShape(pres.shapes.RECTANGLE, { x: 9.3, y: 5.15, w: 3.53, h: 0.6, fill: { color: HEX.orange }, line: { color: HEX.orange } });
  txt(s, "Days 31–60: churn window (y)", { x: 9.3, y: 5.15, w: 3.53, h: 0.6, fontSize: 13, color: HEX.white, valign: "middle", align: "center", bold: true });
  txt(s, "Why ROC-AUC rather than accuracy: the campaign contacts a fixed budget of customers, so what matters is ranking the riskiest first. Accuracy at a 0.5 cut-off is reported too, since classes are balanced.",
    { x: 0.5, y: 5.95, w: 12.3, h: 0.8, fontSize: 13, color: HEX.muted });

  // ===== 8. Feature engineering & method =====
  s = pres.addSlide({ masterName: "CONTENT" });
  head(s, "4 · Feature engineering", "We turned raw columns into business signals and tested three models fairly",
    "Methods: scikit-learn [7], LightGBM [5]. Notebook sections 4–5.");
  const fe = [
    ["Usage trend (3m ÷ lifetime)", "Is the customer using the phone less?"],
    ["Revenue trend (3m ÷ lifetime)", "Is the bill falling (downgrading)?"],
    ["Handset age ÷ tenure", "Never upgraded since joining?"],
    ["In renewal window (11–12m)", "Flag for the EDA renewal cliff"],
    ["Dropped/blocked call rate", "Network quality the customer felt"],
    ["Overage share of bill", "Bill shock from the wrong plan"],
    ["Care calls per 100 calls", "Friction with the company"],
    ["Revenue per minute", "Paying more than they use"],
  ];
  const rows = [[{ text: "New feature", options: { bold: true, color: HEX.white, fill: { color: HEX.navy } } }, { text: "Business question it answers", options: { bold: true, color: HEX.white, fill: { color: HEX.navy } } }]]
    .concat(fe.map((r, i) => r.map((t) => ({ text: t, options: { fill: { color: i % 2 ? HEX.white : HEX.light } } }))));
  s.addTable(rows, { x: 0.5, y: 1.55, w: 6.6, colW: [3.1, 3.5], fontSize: 13, fontFace: "Calibri", color: HEX.ink, border: { type: "none" }, rowH: 0.43, valign: "middle" });
  const pipe = [
    [fa.FaBroom, "Clean", "Negative values set to missing · missing kept as a category · ID removed · ethnicity excluded (fairness)"],
    [fa.FaCodeBranch, "Split", "80% train / 20% untouched hold-out test · 5-fold stratified cross-validation"],
    [fa.FaBalanceScale, "Compare", "Logistic Regression (linear baseline) · Random Forest · LightGBM (gradient boosting)"],
    [fa.FaShieldAlt, "Leakage check", "Best single feature reaches only 0.57 AUC, so no column gives the answer away"],
  ];
  for (let i = 0; i < 4; i++) {
    const y = 1.55 + i * 1.3;
    await iconCircle(s, pipe[i][0], 7.5, y + 0.1, 0.6, i === 2 ? HEX.teal : HEX.orange);
    txt(s, pipe[i][1], { x: 8.3, y: y + 0.05, w: 4.5, h: 0.35, fontSize: 15, bold: true, color: HEX.navy });
    txt(s, pipe[i][2], { x: 8.3, y: y + 0.4, w: 4.5, h: 0.85, fontSize: 13 });
  }

  // ===== 9. Model results =====
  s = pres.addSlide({ masterName: "CONTENT" });
  head(s, "5 · Experiments", `LightGBM ranks churners best: ROC-AUC ${lgbm["Test ROC-AUC"].toFixed(3)} on unseen customers`,
    "Hold-out test set = 20,000 customers never used in training. Models: [5][7].");
  await img(s, "model_comparison.png", 0.5, 1.5, 8.0, 3.6, "Model comparison");
  const mrow = (n) => [n, M[n]["CV ROC-AUC"].toFixed(3), M[n]["Test ROC-AUC"].toFixed(3), pct(M[n]["Test accuracy"], 1), pct(M[n]["Precision@top20%"], 1)];
  const hdr = ["Model", "CV ROC-AUC", "Test ROC-AUC", "Accuracy", "Precision top 20%"].map((t) => ({ text: t, options: { bold: true, color: HEX.white, fill: { color: HEX.navy } } }));
  const body = ["Logistic Regression", "Random Forest", "LightGBM"].map((n) => mrow(n).map((t) => ({ text: t, options: n === "LightGBM" ? { bold: true, fill: { color: HEX.peach } } : { fill: { color: HEX.light } } })));
  s.addTable([hdr, ...body], { x: 0.5, y: 5.25, w: 8.0, colW: [2.2, 1.35, 1.45, 1.3, 1.7], fontSize: 13, fontFace: "Calibri", color: HEX.ink, border: { type: "none" }, rowH: 0.36, align: "center", valign: "middle" });
  card(s, 8.8, 1.5, 4.03, 5.3, HEX.light);
  txt(s, [
    { text: "Model: ", options: { bold: true } }, { text: "LightGBM", options: { breakLine: true } },
    { text: "Metric: ", options: { bold: true } }, { text: "ROC-AUC", options: { breakLine: true } },
    { text: "Score: ", options: { bold: true } }, { text: `${lgbm["Test ROC-AUC"].toFixed(3)} test · ${lgbm["CV ROC-AUC"].toFixed(3)} 5-fold CV` },
  ], { x: 9.05, y: 1.75, w: 3.6, h: 1.0, fontSize: 15, color: HEX.navy });
  txt(s, [
    { text: "In plain words: ", options: { bold: true, color: HEX.orange } },
    { text: `pick one leaver and one stayer at random; the model ranks the leaver as riskier ${pct(lgbm["Test ROC-AUC"])} of the time (a coin flip scores 50%).`, options: { breakLine: true } },
    { text: "Why LightGBM: ", options: { bold: true, color: HEX.orange } },
    { text: "it handles missing values and categories natively and captures combinations such as renewal window × old phone.", options: { breakLine: true } },
    { text: "Reliable: ", options: { bold: true, color: HEX.orange } },
    { text: "CV and test scores match, so the model is not overfitted." },
  ], { x: 9.05, y: 2.95, w: 3.6, h: 3.7, fontSize: 14, paraSpaceAfter: 8 });

  // ===== 10. Risk ranking =====
  s = pres.addSlide({ masterName: "CONTENT" });
  head(s, "5 · Experiments — usefulness", "The risk score concentrates churners: the top 10% leave 4× as often as the bottom 10%",
    "Hold-out test set (20,000 customers), LightGBM risk score split into 10 equal groups.");
  await img(s, "risk_deciles.png", 0.5, 1.5, 7.6, 5.3, "Churn by risk decile");
  const st = [
    [pct(lgbm["Precision@top20%"]), "of the top-20% list actually churn (vs 49.6% average)"],
    [lgbm["Lift@top20%"].toFixed(2) + "×", "lift: each offer reaches 1.5× more real leavers than random targeting"],
    [pct(lgbm["Recall@top20%"]), "of all churners are caught by contacting just 20% of the base"],
  ];
  for (let i = 0; i < 3; i++) {
    const y = 1.55 + i * 1.75;
    card(s, 8.4, y, 4.43, 1.55);
    txt(s, st[i][0], { x: 8.65, y: y + 0.15, w: 3.9, h: 0.7, fontSize: 36, bold: true, color: i === 0 ? HEX.orange : HEX.navy });
    txt(s, st[i][1], { x: 8.65, y: y + 0.85, w: 3.95, h: 0.65, fontSize: 13 });
  }

  // ===== 11. Drivers =====
  s = pres.addSlide({ masterName: "CONTENT" });
  head(s, "5 · Experiments — insights", "The strongest risk signals are levers Company A controls: usage, handset and timing",
    "Explainability: SHAP values on 4,000 test customers [6]. Orange = actionable by Company A.");
  await img(s, "shap_importance.png", 0.5, 1.45, 7.0, 5.4, "SHAP importance");
  const lev = [
    [fa.FaChartLine, "Falling usage", "A drop in minutes vs the 3-month average is the #1 early-warning signal → trigger outreach automatically."],
    [fa.FaMobileAlt, "Handset age & price", "Old, cheap phones raise risk → offer a subsidised upgrade before rivals do."],
    [fa.FaCalendarAlt, "Months in service", "Risk peaks as the first contract ends → time the offer at month 10, before the window opens."],
  ];
  for (let i = 0; i < 3; i++) {
    const y = 1.55 + i * 1.75;
    card(s, 7.8, y, 5.03, 1.55);
    await iconCircle(s, lev[i][0], 8.0, y + 0.2, 0.6, HEX.orange);
    txt(s, lev[i][1], { x: 8.8, y: y + 0.15, w: 3.9, h: 0.35, fontSize: 15, bold: true, color: HEX.navy });
    txt(s, lev[i][2], { x: 8.8, y: y + 0.5, w: 3.9, h: 1.0, fontSize: 13 });
  }

  // ===== 12. Proposal =====
  s = pres.addSlide({ masterName: "CONTENT" });
  head(s, "6 · Business proposal", "“Renew & Upgrade”: a monthly, model-driven retention programme",
    "Track shares = reasons among the top-20% flagged customers in the hold-out test set (notebook section 7).");
  const flow = [
    [fa.FaDatabase, "1 · Score", "Every month, score all customers with the churn model"],
    [fa.FaFilter, "2 · Flag", "Select the riskiest 20% (≈20,000 per 100k customers)"],
    [fa.FaRoute, "3 · Route", "Choose the offer from the customer's main risk reason"],
    [fa.FaSyncAlt, "4 · Learn", "Compare against a control group; retrain the model quarterly"],
  ];
  for (let i = 0; i < 4; i++) {
    const x = 0.5 + i * 3.13;
    await iconCircle(s, flow[i][0], x, 1.6, 0.6, HEX.navy);
    txt(s, flow[i][1], { x: x + 0.75, y: 1.6, w: 2.2, h: 0.35, fontSize: 15, bold: true, color: HEX.navy });
    txt(s, flow[i][2], { x: x + 0.75, y: 1.95, w: 2.2, h: 0.85, fontSize: 13 });
    if (i < 3) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + 2.85, y: 1.75, w: 0.25, h: 0.3, fill: { color: HEX.grey }, line: { color: HEX.grey } });
  }
  const tracks = [
    [fa.FaGift, "Upgrade offer", segShare("Old handset"), "Handset 1+ year old", "Discounted new phone (avg $100 subsidy) in exchange for a new 12-month commitment"],
    [fa.FaHandshake, "Loyalty renewal", segShare("Renewal window"), "Months 11–12, newer phone", "Early-renewal bonus (bill credit) offered at month 10, before the contract ends"],
    [fa.FaHeadset, "Plan right-sizing", segShare("Other"), "Other risk reasons (usage drop, bill)", "Proactive call to move the customer to a better-fitting plan"],
  ];
  for (let i = 0; i < 3; i++) {
    const x = 0.5 + i * 4.18, y = 3.05;
    card(s, x, y, 3.97, 2.9, i === 0 ? HEX.peach : HEX.light);
    await iconCircle(s, tracks[i][0], x + 0.25, y + 0.25, 0.65, i === 0 ? HEX.orange : HEX.teal);
    txt(s, pct(tracks[i][2]), { x: x + 1.1, y: y + 0.2, w: 2.6, h: 0.7, fontSize: 36, bold: true, color: i === 0 ? HEX.orange : HEX.teal });
    txt(s, tracks[i][1], { x: x + 0.25, y: y + 1.05, w: 3.5, h: 0.4, fontSize: 17, bold: true, color: HEX.navy });
    txt(s, [{ text: "Who: ", options: { bold: true } }, { text: tracks[i][3], options: { breakLine: true } }, { text: "Action: ", options: { bold: true } }, { text: tracks[i][4] }],
      { x: x + 0.25, y: y + 1.5, w: 3.5, h: 1.35, fontSize: 14, paraSpaceAfter: 6 });
  }
  takeaway(s, [{ text: "Why it works: ", options: { bold: true, color: HEX.orange } }, { text: "the offer reaches the right customer at the moment they decide (contract end, ageing phone), and only the customers the model flags as likely to leave." }], 6.15, 0.65);

  // ===== 13. Impact =====
  s = pres.addSlide({ masterName: "CONTENT" });
  head(s, "6 · Business proposal — impact", `+${money(imp.base_net)} net value per cycle for every 100,000 customers — ${money(imp.base_net - imp.rand_net)} more than untargeted offers`,
    `Assumptions: save rate 20%; value of a save = median monthly bill of flagged churners ($${imp.arpu.toFixed(2)}) × 12 months; cost = $5 outreach + 30% take-up × $100 subsidy = $${imp.cost_per.toFixed(0)} per flagged customer.`);
  const wf = [
    ["Customers flagged (top 20%)", n0(imp.flagged), HEX.ink],
    [`Real leavers reached (precision ${pct(imp.precision)})`, n0(imp.base_reached), HEX.ink],
    ["Customers saved (20% save rate)", n0(imp.base_saved), HEX.ink],
    [`Revenue kept (× $${n0(imp.value_per_save)} each)`, "+" + money(imp.base_gain), HEX.teal],
    [`Programme cost (× $${imp.cost_per.toFixed(0)} each)`, "−" + money(imp.base_cost), "C0392B"],
  ];
  wf.forEach(([l, v, c], i) => {
    const y = 1.55 + i * 0.66;
    card(s, 0.5, y, 5.6, 0.56, HEX.light);
    txt(s, l, { x: 0.7, y, w: 3.8, h: 0.56, valign: "middle", fontSize: 14 });
    txt(s, v, { x: 4.3, y, w: 1.6, h: 0.56, valign: "middle", align: "right", fontSize: 16, bold: true, color: c });
  });
  card(s, 0.5, 4.95, 5.6, 0.85, HEX.navy);
  txt(s, "Net impact per cycle", { x: 0.7, y: 4.95, w: 3.2, h: 0.85, valign: "middle", fontSize: 16, bold: true, color: HEX.white });
  txt(s, "+" + money(imp.base_net), { x: 3.7, y: 4.95, w: 2.2, h: 0.85, valign: "middle", align: "right", fontSize: 28, bold: true, color: "F4C59A" });
  txt(s, [
    { text: `ROI ${pct(imp.base_roi)} · churn ${pct(imp.churn_before, 1)} → ${pct(imp.churn_after, 1)} · `, options: {} },
    { text: `break-even save rate ${pct(imp.breakeven, 1)}`, options: { bold: true, color: HEX.orange } },
  ], { x: 0.5, y: 5.95, w: 5.6, h: 0.75, fontSize: 14 });
  await img(s, "sensitivity.png", 6.4, 1.5, 6.43, 5.3, "Sensitivity of net impact to save rate");

  // ===== 14. Risks & next steps =====
  s = pres.addSlide({ masterName: "CONTENT" });
  head(s, "7 · Next steps", "Validate with a 3-month A/B pilot before rolling out to all customers",
    "Pass/fail rule fixed in advance: scale up only if the pilot save rate beats the break-even rate.");
  const risks = [
    ["Sample is rebalanced (≈50% churn)", "Absolute $ scale with the real churn rate; the pilot measures true save rate and lift"],
    [`Offers reach stayers (${pct(1 - imp.precision)} of the list)`, "Control group measures real uplift; raise the threshold if the lift is small"],
    ["Model drifts as the market changes", "Monthly AUC monitoring and quarterly retraining"],
    ["Unfair or biased targeting", "Ethnicity excluded; audit offer rates by region and credit class"],
  ];
  const rrows = [[{ text: "Risk", options: { bold: true, color: HEX.white, fill: { color: HEX.navy } } }, { text: "Mitigation", options: { bold: true, color: HEX.white, fill: { color: HEX.navy } } }]]
    .concat(risks.map((r, i) => r.map((t) => ({ text: t, options: { fill: { color: i % 2 ? HEX.white : HEX.light } } }))));
  s.addTable(rrows, { x: 0.5, y: 1.55, w: 6.4, colW: [2.7, 3.7], fontSize: 13, fontFace: "Calibri", color: HEX.ink, border: { type: "none" }, rowH: [0.45, 0.9, 0.9, 0.9, 0.9], valign: "middle" });
  const tl = [
    ["Month 1", "Score all customers; split the flagged list 90% offer / 10% control"],
    ["Months 2–3", "Run the three offer tracks; track churn in both groups"],
    ["Month 4", `Go/no-go: scale up if save rate > ${pct(imp.breakeven, 0)} (break-even)`],
    ["Ongoing", "Automated monthly scoring and KPI dashboard; quarterly retraining"],
  ];
  for (let i = 0; i < 4; i++) {
    const y = 1.55 + i * 1.3;
    s.addShape(pres.shapes.OVAL, { x: 7.35, y: y + 0.08, w: 0.45, h: 0.45, fill: { color: i === 2 ? HEX.orange : HEX.navy }, line: { color: i === 2 ? HEX.orange : HEX.navy } });
    if (i < 3) s.addShape(pres.shapes.LINE, { x: 7.575, y: y + 0.55, w: 0, h: 0.83, line: { color: HEX.grey, width: 1.5 } });
    txt(s, tl[i][0], { x: 8.05, y: y + 0.05, w: 4.7, h: 0.35, fontSize: 15, bold: true, color: HEX.navy });
    txt(s, tl[i][1], { x: 8.05, y: y + 0.42, w: 4.7, h: 0.8, fontSize: 13 });
  }

  // ===== 15. References =====
  s = pres.addSlide({ masterName: "CONTENT" });
  head(s, "Sources cited in this deck", "References");
  const refs = [
    "[1] CTIA (2025). 2025 Annual Survey Highlights. https://mma.prnewswire.com/media/2767258/2025_Annual_Survey_Highlights.pdf",
    "[2] T-Mobile US, Inc. (2025). Form 10-K for fiscal year 2024 (postpaid phone churn). https://www.sec.gov/Archives/edgar/data/1283699/000128369925000012/tmus-20241231.htm",
    "[3] RCR Wireless (2024). Consumers are holding onto smartphones 'longer than ever': Assurant. https://www.rcrwireless.com/20240822/featured/consumers-are-holding-onto-smartphones-longer-than-ever-assurant",
    "[4] Gallo, A. (2014). The Value of Keeping the Right Customers. Harvard Business Review. https://hbr.org/2014/10/the-value-of-keeping-the-right-customers",
    "[5] Ke, G. et al. (2017). LightGBM: A Highly Efficient Gradient Boosting Decision Tree. NeurIPS 30.",
    "[6] Lundberg, S. M. & Lee, S.-I. (2017). A Unified Approach to Interpreting Model Predictions (SHAP). NeurIPS 30.",
    "[7] Pedregosa, F. et al. (2011). Scikit-learn: Machine Learning in Python. JMLR 12, 2825–2830.",
    "[8] Matsuo-Iwasawa Lab, Univ. of Tokyo (2026). GCI World Final Assignment materials: Company A dataset, tutorial notebook, Practical Guide.",
    "[9] Anthropic (2026). Claude Code (desktop app): AI assistant used for code, analysis and slide drafting. Transcript available on request.",
  ];
  txt(s, refs.map((r, i) => ({ text: r, options: { breakLine: i < refs.length - 1 } })), { x: 0.5, y: 1.5, w: 12.3, h: 5.3, fontSize: 13, paraSpaceAfter: 9 });

  await pres.writeFile({ fileName: OUT });
  const { applyTheme } = require("./apply_theme.js");
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
