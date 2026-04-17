import { useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

function calcSalaryDeduction(s) {
  if (s <= 1900000) return 650000;
  if (s <= 3600000) return Math.floor(s * 0.3 + 80000);
  if (s <= 6600000) return Math.floor(s * 0.2 + 440000);
  if (s <= 8500000) return Math.floor(s * 0.1 + 1100000);
  return 1950000;
}

function calcBasicDeduction(n) {
  if (n <= 1320000)  return 950000;
  if (n <= 3360000)  return 880000;
  if (n <= 4890000)  return 680000;
  if (n <= 6550000)  return 630000;
  if (n <= 23500000) return 580000;
  if (n <= 24000000) return 480000;
  if (n <= 24500000) return 160000;
  return 0;
}

function calcIncomeTax(n) {
  if (n <= 0) return 0;
  const brackets = [
    [1950000, 0.05, 0],
    [3300000, 0.10, 97500],
    [6950000, 0.20, 427500],
    [9000000, 0.23, 636000],
    [18000000, 0.33, 1536000],
    [40000000, 0.40, 2796000],
    [Infinity, 0.45, 4796000],
  ];
  for (const [lim, r, d] of brackets) {
    if (n <= lim) return Math.max(0, Math.floor(n * r - d));
  }
  return 0;
}

function calcResidentTax(n) {
  if (n <= 0) return 5000;
  return Math.floor(n * 0.10) + 5000;
}

function fmt(n) { return Math.round(n).toLocaleString("ja-JP"); }
function wan(n) { return (Math.round(n / 10000)).toLocaleString("ja-JP") + "万円"; }

export default function TaxSimulator() {
  const [salary, setSalary] = useState(6000000);
  const [hasSpouse, setHasSpouse] = useState(true);
  const [deps, setDeps] = useState(1);
  const [siMode, setSiMode] = useState("auto");
  const [siManual, setSiManual] = useState(900000);
  const [properties, setProperties] = useState([
    { id: 1, name: "物件A", rentalIncome: 1200000, mgmt: 120000, loan: 300000, fat: 80000, depr: 500000, other: 50000 },
  ]);

  const addProp = () =>
    setProperties(p => [...p, { id: Date.now(), name: `物件${String.fromCharCode(65 + p.length)}`, rentalIncome: 0, mgmt: 0, loan: 0, fat: 0, depr: 0, other: 0 }]);
  const removeProp = id => setProperties(p => p.filter(x => x.id !== id));
  const updateProp = (id, f, v) => setProperties(p => p.map(x => x.id === id ? { ...x, [f]: Number(v) } : x));
  const updatePropName = (id, v) => setProperties(p => p.map(x => x.id === id ? { ...x, name: v } : x));

  const result = useCallback(() => {
    const sd = calcSalaryDeduction(salary);
    const ei = salary - sd;
    const si = siMode === "auto" ? Math.floor(salary * 0.145) : siManual;
    const spouseD = hasSpouse ? 380000 : 0;
    const depD = deps * 380000;
    const basicR = 430000;

    let totalRI = 0, totalExp = 0;
    properties.forEach(p => {
      totalRI += p.rentalIncome;
      totalExp += p.mgmt + p.loan + p.fat + p.depr + p.other;
    });
    const rei = totalRI - totalExp;
    const totalI = ei + rei;

    const basicB = calcBasicDeduction(ei);
    const basicA = calcBasicDeduction(totalI);

    const tiB = Math.max(0, ei - si - basicB - spouseD - depD);
    const itB = calcIncomeTax(tiB);
    const stB = Math.floor(itB * 0.021);
    const rtB = calcResidentTax(Math.max(0, ei - si - basicR - spouseD - depD));
    const totalB = itB + stB + rtB;

    const tiA = Math.max(0, totalI - si - basicA - spouseD - depD);
    const itA = calcIncomeTax(tiA);
    const stA = Math.floor(itA * 0.021);
    const rtA = calcResidentTax(Math.max(0, totalI - si - basicR - spouseD - depD));
    const totalA = itA + stA + rtA;

    return { ei, sd, si, spouseD, depD, basicB, basicA, basicR, tiB, itB, stB, rtB, totalB, rei, totalRI, totalExp, tiA, itA, stA, rtA, totalA, savings: totalB - totalA };
  }, [salary, hasSpouse, deps, siMode, siManual, properties])();

  const downloadHTML = () => {
    const rows2 = rows.map(([label, before, after, diff]) => `
      <tr>
        <td>${label}</td>
        <td>${before === null ? "—" : fmt(before) + "円"}</td>
        <td>${fmt(after)}円</td>
        <td style="color:${diff < 0 ? "#2a7a4f" : diff > 0 ? "#c0392b" : "#666"};font-weight:${diff !== 0 ? 600 : 400}">
          ${diff === 0 ? "—" : diff < 0 ? `▼${fmt(Math.abs(diff))}円` : `▲${fmt(Math.abs(diff))}円`}
        </td>
      </tr>`).join("");

    const html = `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8"><title>税負担シミュレーション</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Noto Sans JP',sans-serif;background:#f4f6fb;color:#1a1a2e;font-size:14px;padding:24px}
  .header{background:#1a2a4a;color:#fff;border-radius:12px;padding:20px 28px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center}
  h1{font-size:18px;font-weight:500}.sub{font-size:12px;opacity:.7;margin-top:2px}
  .btn{background:#c9a84c;color:#1a2a4a;border:none;padding:8px 20px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer}
  .hero{background:#1a2a4a;border-radius:12px;padding:24px;text-align:center;margin-bottom:20px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .hero-label{color:rgba(255,255,255,.65);font-size:12px;margin-bottom:6px}
  .hero-amount{color:#c9a84c;font-size:38px;font-weight:600}
  .hero-sub{color:rgba(255,255,255,.5);font-size:11px;margin-top:6px}
  table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px}
  th{background:#f4f6fb;padding:10px 12px;text-align:left;font-size:11px;color:#6b7a99;font-weight:600}
  th:not(:first-child){text-align:right}
  td{padding:9px 12px;border-bottom:1px solid #f0f2f7}
  td:not(:first-child){text-align:right}
  .note{font-size:11px;color:#aab;line-height:1.6;padding-top:12px;border-top:1px solid #e8ecf2}
  @media print{.btn{display:none}}
</style></head><body>
<div class="header">
  <div><h1>税負担シミュレーション</h1><p class="sub">不動産投資による節税効果 試算レポート</p></div>
  <button class="btn" onclick="window.print()">🖨️ 印刷 / PDF出力</button>
</div>
<div class="hero">
  <div class="hero-label">年間節税効果（概算）</div>
  <div class="hero-amount">${result.savings >= 0 ? `▼ ${wan(result.savings)}` : `▲ ${wan(Math.abs(result.savings))}`}</div>
  <div class="hero-sub">所得税 ${result.itB+result.stB-(result.itA+result.stA) >= 0 ? "▼" : "▲"}${wan(Math.abs(result.itB+result.stB-result.itA-result.stA))} ／ 住民税 ${result.rtB-result.rtA >= 0 ? "▼" : "▲"}${wan(Math.abs(result.rtB-result.rtA))}</div>
</div>
<table>
  <thead><tr><th>項目</th><th>給与のみ</th><th>確定申告後</th><th>差額</th></tr></thead>
  <tbody>${rows2}
    <tr style="font-weight:600;font-size:14px;border-top:2px solid #dde2ed">
      <td>税負担合計</td><td style="text-align:right">${fmt(result.totalB)}円</td><td style="text-align:right">${fmt(result.totalA)}円</td>
      <td style="text-align:right;color:${result.savings>0?"#2a7a4f":result.savings<0?"#c0392b":"inherit"}">${result.savings===0?"—":result.savings>0?`▼${fmt(result.savings)}円`:`▲${fmt(Math.abs(result.savings))}円`}</td>
    </tr>
  </tbody>
</table>
<div class="note">※本シミュレーションは概算です。詳細は税理士にご相談ください。</div>
</body></html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "税負担シミュレーション.html"; a.click();
    URL.revokeObjectURL(url);
  };

  const rows = [
    ["給与収入", salary, salary, 0],
    ["　└ 給与所得控除", result.sd, result.sd, 0],
    ["給与所得", result.ei, result.ei, 0],
    ["不動産所得", null, result.rei, result.rei],
    ["社会保険料控除", result.si, result.si, 0],
    ["基礎控除", result.basicB, result.basicA, result.basicA - result.basicB],
    ["配偶者控除", result.spouseD, result.spouseD, 0],
    ["扶養控除", result.depD, result.depD, 0],
    ["課税所得", result.tiB, result.tiA, result.tiA - result.tiB],
    ["所得税（復興税含）", result.itB + result.stB, result.itA + result.stA, result.itA + result.stA - result.itB - result.stB],
    ["住民税", result.rtB, result.rtA, result.rtA - result.rtB],
  ];

  const chartData = [
    { name: "給与のみ", 所得税: result.itB + result.stB, 住民税: result.rtB },
    { name: "確定申告後", 所得税: result.itA + result.stA, 住民税: result.rtA },
  ];

  const F = { width: "100%", padding: "6px 10px", border: "1px solid #dde2ed", borderRadius: 8, fontSize: 13 };

  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif", background: "#f4f6fb", minHeight: "100vh", color: "#1a1a2e", fontSize: 14 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
        <div style={{ background: "#1a2a4a", color: "#fff", borderRadius: 12, padding: "20px 28px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500 }}>税負担シミュレーション</div>
            <div style={{ fontSize: 12, opacity: .7, marginTop: 2 }}>不動産投資による節税効果 試算レポート</div>
          </div>
          <button onClick={downloadHTML} style={{ background: "#c9a84c", color: "#1a2a4a", border: "none", padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            📥 レポートをDL
          </button>
        </div>

        <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16, alignItems: "start" }}>
          <div className="left-panel" style={{ background: "#fff", border: "1px solid #e8ecf2", borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7a99", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #e8ecf2" }}>給与情報</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, color: "#6b7a99", marginBottom: 4 }}>給与収入（年収）</label>
              <input type="number" value={salary} onChange={e => setSalary(Number(e.target.value))} style={F} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, color: "#6b7a99", marginBottom: 4 }}>社会保険料</label>
              <select value={siMode} onChange={e => setSiMode(e.target.value)} style={F}>
                <option value="auto">自動計算（年収×14.5%）</option>
                <option value="manual">手動入力</option>
              </select>
            </div>
            {siMode === "manual" && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, color: "#6b7a99", marginBottom: 4 }}>社会保険料（年額）</label>
                <input type="number" value={siManual} onChange={e => setSiManual(Number(e.target.value))} style={F} />
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#6b7a99", marginBottom: 4 }}>配偶者控除</label>
                <select value={hasSpouse ? "yes" : "no"} onChange={e => setHasSpouse(e.target.value === "yes")} style={F}>
                  <option value="yes">あり（38万）</option>
                  <option value="no">なし</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#6b7a99", marginBottom: 4 }}>扶養人数</label>
                <select value={deps} onChange={e => setDeps(Number(e.target.value))} style={F}>
                  {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n}人</option>)}
                </select>
              </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7a99", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #e8ecf2", marginTop: 16 }}>不動産情報</div>
            {properties.map(p => (
              <div key={p.id} style={{ border: "1px solid #e8ecf2", borderRadius: 8, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <input value={p.name} onChange={e => updatePropName(p.id, e.target.value)} style={{ border: "none", background: "none", fontWeight: 600, fontSize: 13, color: "#1a1a2e", width: "100%" }} />
                  {properties.length > 1 && <button onClick={() => removeProp(p.id)} style={{ background: "none", border: "none", color: "#aab", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>}
                </div>
                {[["家賃収入（年）","rentalIncome","管理費・修繕費","mgmt"],["ローン利息","loan","固定資産税","fat"],["減価償却費","depr","その他経費","other"]].map(([l1,f1,l2,f2], i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <div><label style={{ display: "block", fontSize: 12, color: "#6b7a99", marginBottom: 4 }}>{l1}</label><input type="number" value={p[f1]} onChange={e => updateProp(p.id, f1, e.target.value)} style={{ ...F, fontSize: 12 }} /></div>
                    <div><label style={{ display: "block", fontSize: 12, color: "#6b7a99", marginBottom: 4 }}>{l2}</label><input type="number" value={p[f2]} onChange={e => updateProp(p.id, f2, e.target.value)} style={{ ...F, fontSize: 12 }} /></div>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: "#2a7a4f", textAlign: "right", marginTop: 4, fontWeight: 500 }}>
                  不動産所得: {fmt(p.rentalIncome - p.mgmt - p.loan - p.fat - p.depr - p.other)}円
                </div>
              </div>
            ))}
            <button onClick={addProp} style={{ width: "100%", padding: 8, border: "1px dashed #c0c8da", borderRadius: 8, background: "none", color: "#6b7a99", cursor: "pointer", fontSize: 13 }}>＋ 物件を追加する</button>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e8ecf2", borderRadius: 12, padding: 20 }}>
            <div style={{ background: "#1a2a4a", borderRadius: 12, padding: 24, textAlign: "center", marginBottom: 16 }}>
              <div style={{ color: "rgba(255,255,255,.65)", fontSize: 12, marginBottom: 6 }}>年間節税効果（概算）</div>
              <div style={{ color: "#c9a84c", fontSize: 38, fontWeight: 600 }}>
                {result.savings >= 0 ? `▼ ${wan(result.savings)}` : `▲ ${wan(Math.abs(result.savings))}`}
              </div>
              <div style={{ color: "rgba(255,255,255,.5)", fontSize: 11, marginTop: 6 }}>
                所得税 {result.itB+result.stB-(result.itA+result.stA) >= 0 ? "▼" : "▲"}{wan(Math.abs(result.itB+result.stB-result.itA-result.stA))} ／
                住民税 {result.rtB-result.rtA >= 0 ? "▼" : "▲"}{wan(Math.abs(result.rtB-result.rtA))}
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 16 }}>
              <thead>
                <tr>
                  <th style={{ background: "#f4f6fb", padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 11, color: "#6b7a99" }}>項目</th>
                  <th style={{ background: "#f4f6fb", padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: 11, color: "#6b7a99" }}><span style={{ background: "#e8f0fe", color: "#2c4a8a", padding: "2px 8px", borderRadius: 6 }}>給与のみ</span></th>
                  <th style={{ background: "#f4f6fb", padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: 11, color: "#6b7a99" }}><span style={{ background: "#fff8e6", color: "#8a6000", padding: "2px 8px", borderRadius: 6 }}>確定申告後</span></th>
                  <th style={{ background: "#f4f6fb", padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: 11, color: "#6b7a99" }}>差額</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, before, after, diff], i) => (
                  <tr key={i}>
                    <td style={{ padding: "9px 12px", borderBottom: "1px solid #f0f2f7" }}>{label}</td>
                    <td style={{ padding: "9px 12px", borderBottom: "1px solid #f0f2f7", textAlign: "right" }}>{before === null ? "—" : `${fmt(before)}円`}</td>
                    <td style={{ padding: "9px 12px", borderBottom: "1px solid #f0f2f7", textAlign: "right" }}>{fmt(after)}円</td>
                    <td style={{ padding: "9px 12px", borderBottom: "1px solid #f0f2f7", textAlign: "right", color: diff < 0 ? "#2a7a4f" : diff > 0 ? "#c0392b" : undefined, fontWeight: diff !== 0 ? 600 : undefined }}>
                      {diff === 0 ? "—" : diff < 0 ? `▼${fmt(Math.abs(diff))}円` : `▲${fmt(Math.abs(diff))}円`}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: "9px 12px", borderTop: "2px solid #dde2ed", fontWeight: 600, fontSize: 14 }}>税負担合計</td>
                  <td style={{ padding: "9px 12px", borderTop: "2px solid #dde2ed", fontWeight: 600, fontSize: 14, textAlign: "right" }}>{fmt(result.totalB)}円</td>
                  <td style={{ padding: "9px 12px", borderTop: "2px solid #dde2ed", fontWeight: 600, fontSize: 14, textAlign: "right" }}>{fmt(result.totalA)}円</td>
                  <td style={{ padding: "9px 12px", borderTop: "2px solid #dde2ed", fontWeight: 600, fontSize: 14, textAlign: "right", color: result.savings > 0 ? "#2a7a4f" : result.savings < 0 ? "#c0392b" : undefined }}>
                    {result.savings === 0 ? "—" : result.savings > 0 ? `▼${fmt(result.savings)}円` : `▲${fmt(Math.abs(result.savings))}円`}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ height: 220, marginBottom: 16 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={52} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => fmt(v / 10000) + "万"} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [`${fmt(v)}円`, n]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="所得税" stackId="a" fill="#2c5282" />
                  <Bar dataKey="住民税" stackId="a" fill="#c9a84c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div style={{ background: "#f4f6fb", borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, color: "#6b7a99", marginBottom: 8, fontWeight: 600, textTransform: "uppercase" }}>不動産収支サマリー</div>
                {[["家賃収入合計", result.totalRI], ["経費合計", result.totalExp]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}><span>{l}</span><span style={{ fontWeight: 500 }}>{fmt(v)}円</span></div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", borderTop: "1px solid #dde2ed", marginTop: 4, paddingTop: 4 }}>
                  <span>不動産所得</span><span style={{ fontWeight: 500, color: result.rei < 0 ? "#2a7a4f" : "#1a1a2e" }}>{fmt(result.rei)}円</span>
                </div>
              </div>
              <div style={{ background: "#f4f6fb", borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, color: "#6b7a99", marginBottom: 8, fontWeight: 600, textTransform: "uppercase" }}>控除サマリー</div>
                {[["給与所得控除", result.sd], ["社会保険料控除", result.si], ["基礎控除（給与のみ）", result.basicB], ["基礎控除（申告後）", result.basicA], ...(hasSpouse ? [["配偶者控除", result.spouseD]] : []), ...(deps > 0 ? [["扶養控除", result.depD]] : [])].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}><span>{l}</span><span style={{ fontWeight: 500 }}>{fmt(v)}円</span></div>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 11, color: "#aab", lineHeight: 1.6, paddingTop: 12, borderTop: "1px solid #e8ecf2" }}>
              ※本シミュレーションは概算であり、実際の税額と異なる場合があります。所得税は復興特別所得税（2.1%）を含みます。住民税は均等割5,000円を含みます。詳細は税理士にご相談ください。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
