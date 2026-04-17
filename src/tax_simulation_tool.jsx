import { useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

function calcSalaryDeduction(s) {
  if (s <= 1625000) return 550000;
  if (s <= 1800000) return Math.floor(s * 0.4 - 100000);
  if (s <= 3600000) return Math.floor(s * 0.3 + 80000);
  if (s <= 6600000) return Math.floor(s * 0.2 + 440000);
  if (s <= 8500000) return Math.floor(s * 0.1 + 1100000);
  return 1950000;
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

const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Noto Sans JP', sans-serif; background: #f4f6fb; color: #1a1a2e; font-size: 14px; }
  .app { max-width: 1100px; margin: 0 auto; padding: 16px; }
  .header { background: #1a2a4a; color: #fff; border-radius: 12px; padding: 20px 28px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
  .header h1 { font-size: 18px; font-weight: 500; }
  .header p { font-size: 12px; opacity: .7; margin-top: 2px; }
  .print-btn { background: #c9a84c; color: #1a2a4a; border: none; padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
  .print-btn:hover { background: #d4b567; }
  .grid { display: grid; grid-template-columns: 360px 1fr; gap: 16px; align-items: start; }
  .panel { background: #fff; border: 1px solid #e8ecf2; border-radius: 12px; padding: 20px; }
  .section-title { font-size: 11px; font-weight: 600; color: #6b7a99; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e8ecf2; }
  .field { margin-bottom: 12px; }
  .field label { display: block; font-size: 12px; color: #6b7a99; margin-bottom: 4px; }
  .field input[type=number], .field select { width: 100%; padding: 7px 10px; border: 1px solid #dde2ed; border-radius: 8px; background: #fff; color: #1a1a2e; font-size: 13px; }
  .field input[type=number]:focus, .field select:focus { outline: none; border-color: #1a2a4a; }
  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .property-card { border: 1px solid #e8ecf2; border-radius: 8px; padding: 14px; margin-bottom: 10px; }
  .property-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .property-name-input { border: none; background: none; font-weight: 600; font-size: 13px; color: #1a1a2e; width: 100%; }
  .remove-btn { background: none; border: none; color: #aab; cursor: pointer; font-size: 18px; padding: 0; line-height: 1; }
  .remove-btn:hover { color: #c0392b; }
  .prop-income-label { font-size: 12px; color: #2a7a4f; text-align: right; margin-top: 4px; font-weight: 500; }
  .add-btn { width: 100%; padding: 8px; border: 1px dashed #c0c8da; border-radius: 8px; background: none; color: #6b7a99; cursor: pointer; font-size: 13px; margin-top: 4px; }
  .add-btn:hover { background: #f4f6fb; color: #1a1a2e; }
  .savings-card { background: #1a2a4a; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 16px; }
  .savings-label { color: rgba(255,255,255,.65); font-size: 12px; margin-bottom: 6px; }
  .savings-amount { color: #c9a84c; font-size: 38px; font-weight: 600; }
  .savings-sub { color: rgba(255,255,255,.5); font-size: 11px; margin-top: 6px; }
  .compare-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px; }
  .compare-table th { background: #f4f6fb; padding: 10px 12px; text-align: left; font-weight: 600; font-size: 11px; color: #6b7a99; }
  .compare-table th:not(:first-child) { text-align: right; }
  .compare-table td { padding: 9px 12px; border-bottom: 1px solid #f0f2f7; }
  .compare-table td:not(:first-child) { text-align: right; }
  .compare-table .total-row td { border-top: 2px solid #dde2ed; font-weight: 600; font-size: 14px; border-bottom: none; }
  .badge-before { background: #e8f0fe; color: #2c4a8a; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
  .badge-after { background: #fff8e6; color: #8a6000; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
  .diff-neg { color: #2a7a4f; font-weight: 600; }
  .diff-pos { color: #c0392b; font-weight: 600; }
  .chart-wrap { height: 220px; margin-bottom: 16px; }
  .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
  .detail-card { background: #f4f6fb; border-radius: 8px; padding: 14px; }
  .detail-card-title { font-size: 11px; color: #6b7a99; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
  .detail-row { display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; }
  .detail-row span:last-child { font-weight: 500; }
  .footer-note { font-size: 11px; color: #aab; line-height: 1.6; padding-top: 12px; border-top: 1px solid #e8ecf2; }
  @media print {
    body { background: #fff; }
    .app { padding: 0; max-width: 100%; }
    .grid { grid-template-columns: 1fr; }
    .left-panel { display: none; }
    .right-panel { border: none; border-radius: 0; padding: 0; box-shadow: none; }
    .header, .savings-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; border-radius: 0; }
    .print-btn { display: none; }
  }
`;

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
    setProperties((p) => [
      ...p,
      { id: Date.now(), name: `物件${String.fromCharCode(65 + p.length)}`, rentalIncome: 0, mgmt: 0, loan: 0, fat: 0, depr: 0, other: 0 },
    ]);
  const removeProp = (id) => setProperties((p) => p.filter((x) => x.id !== id));
  const updateProp = (id, f, v) => setProperties((p) => p.map((x) => (x.id === id ? { ...x, [f]: Number(v) } : x)));
  const updatePropName = (id, v) => setProperties((p) => p.map((x) => (x.id === id ? { ...x, name: v } : x)));

  const result = useCallback(() => {
    const sd = calcSalaryDeduction(salary);
    const ei = salary - sd;
    const si = siMode === "auto" ? Math.floor(salary * 0.145) : siManual;
    const basic = 480000;
    const spouseD = hasSpouse ? 380000 : 0;
    const depD = deps * 380000;
    const basicR = 430000;

    const tiB = Math.max(0, ei - si - basic - spouseD - depD);
    const itB = calcIncomeTax(tiB);
    const stB = Math.floor(itB * 0.021);
    const rtB = calcResidentTax(Math.max(0, ei - si - basicR - spouseD - depD));
    const totalB = itB + stB + rtB;

    let totalRI = 0, totalExp = 0;
    properties.forEach((p) => {
      totalRI += p.rentalIncome;
      totalExp += p.mgmt + p.loan + p.fat + p.depr + p.other;
    });
    const rei = totalRI - totalExp;
    const totalI = ei + rei;

    const tiA = Math.max(0, totalI - si - basic - spouseD - depD);
    const itA = calcIncomeTax(tiA);
    const stA = Math.floor(itA * 0.021);
    const rtA = calcResidentTax(Math.max(0, totalI - si - basicR - spouseD - depD));
    const totalA = itA + stA + rtA;

    return { ei, sd, si, spouseD, depD, basic, tiB, itB, stB, rtB, totalB, rei, totalRI, totalExp, tiA, itA, stA, rtA, totalA, savings: totalB - totalA };
  }, [salary, hasSpouse, deps, siMode, siManual, properties])();

  const chartData = [
    { name: "給与のみ", 所得税: result.itB + result.stB, 住民税: result.rtB },
    { name: "確定申告後", 所得税: result.itA + result.stA, 住民税: result.rtA },
  ];

  const rows = [
    ["給与収入", salary, salary, 0],
    ["　└ 給与所得控除", result.sd, result.sd, 0],
    ["給与所得", result.ei, result.ei, 0],
    ["不動産所得", null, result.rei, result.rei],
    ["社会保険料控除", result.si, result.si, 0],
    ["基礎控除", result.basic, result.basic, 0],
    ["配偶者控除", result.spouseD, result.spouseD, 0],
    ["扶養控除", result.depD, result.depD, 0],
    ["課税所得", result.tiB, result.tiA, result.tiA - result.tiB],
    ["所得税（復興税含）", result.itB + result.stB, result.itA + result.stA, result.itA + result.stA - result.itB - result.stB],
    ["住民税", result.rtB, result.rtA, result.rtA - result.rtB],
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="header">
          <div>
            <h1>税負担シミュレーション</h1>
            <p>不動産投資による節税効果 試算レポート</p>
          </div>
          <button className="print-btn" onClick={() => window.print()}>印刷 / PDF出力</button>
        </div>

        <div className="grid">
          <div className="left-panel panel">
            <div className="section-title">給与情報</div>
            <div className="field">
              <label>給与収入（年収）</label>
              <input type="number" value={salary} onChange={(e) => setSalary(Number(e.target.value))} />
            </div>
            <div className="field">
              <label>社会保険料</label>
              <select value={siMode} onChange={(e) => setSiMode(e.target.value)}>
                <option value="auto">自動計算（年収×14.5%）</option>
                <option value="manual">手動入力</option>
              </select>
            </div>
            {siMode === "manual" && (
              <div className="field">
                <label>社会保険料（年額）</label>
                <input type="number" value={siManual} onChange={(e) => setSiManual(Number(e.target.value))} />
              </div>
            )}
            <div className="field-row">
              <div className="field">
                <label>配偶者控除</label>
                <select value={hasSpouse ? "yes" : "no"} onChange={(e) => setHasSpouse(e.target.value === "yes")}>
                  <option value="yes">あり（38万）</option>
                  <option value="no">なし</option>
                </select>
              </div>
              <div className="field">
                <label>扶養人数</label>
                <select value={deps} onChange={(e) => setDeps(Number(e.target.value))}>
                  {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}人</option>)}
                </select>
              </div>
            </div>

            <div className="section-title" style={{ marginTop: 16 }}>不動産情報</div>
            {properties.map((p) => (
              <div className="property-card" key={p.id}>
                <div className="property-header">
                  <input
                    className="property-name-input"
                    value={p.name}
                    onChange={(e) => updatePropName(p.id, e.target.value)}
                  />
                  {properties.length > 1 && (
                    <button className="remove-btn" onClick={() => removeProp(p.id)}>×</button>
                  )}
                </div>
                <div className="field-row">
                  <div className="field"><label>家賃収入（年）</label><input type="number" value={p.rentalIncome} onChange={(e) => updateProp(p.id, "rentalIncome", e.target.value)} /></div>
                  <div className="field"><label>管理費・修繕費</label><input type="number" value={p.mgmt} onChange={(e) => updateProp(p.id, "mgmt", e.target.value)} /></div>
                </div>
                <div className="field-row">
                  <div className="field"><label>ローン利息</label><input type="number" value={p.loan} onChange={(e) => updateProp(p.id, "loan", e.target.value)} /></div>
                  <div className="field"><label>固定資産税</label><input type="number" value={p.fat} onChange={(e) => updateProp(p.id, "fat", e.target.value)} /></div>
                </div>
                <div className="field-row">
                  <div className="field"><label>減価償却費</label><input type="number" value={p.depr} onChange={(e) => updateProp(p.id, "depr", e.target.value)} /></div>
                  <div className="field"><label>その他経費</label><input type="number" value={p.other} onChange={(e) => updateProp(p.id, "other", e.target.value)} /></div>
                </div>
                <div className="prop-income-label">
                  不動産所得: {fmt(p.rentalIncome - p.mgmt - p.loan - p.fat - p.depr - p.other)}円
                </div>
              </div>
            ))}
            <button className="add-btn" onClick={addProp}>＋ 物件を追加する</button>
          </div>

          <div className="right-panel panel">
            <div className="savings-card">
              <div className="savings-label">年間節税効果（概算）</div>
              <div className="savings-amount">
                {result.savings >= 0 ? `▼ ${wan(result.savings)}` : `▲ ${wan(Math.abs(result.savings))}`}
              </div>
              <div className="savings-sub">
                所得税 {result.itB + result.stB - (result.itA + result.stA) >= 0 ? "▼" : "▲"}{wan(Math.abs(result.itB + result.stB - result.itA - result.stA))} ／
                住民税 {result.rtB - result.rtA >= 0 ? "▼" : "▲"}{wan(Math.abs(result.rtB - result.rtA))}
              </div>
            </div>

            <table className="compare-table">
              <thead>
                <tr>
                  <th>項目</th>
                  <th><span className="badge-before">給与のみ</span></th>
                  <th><span className="badge-after">確定申告後</span></th>
                  <th>差額</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, before, after, diff], i) => (
                  <tr key={i}>
                    <td>{label}</td>
                    <td>{before === null ? "—" : `${fmt(before)}円`}</td>
                    <td>{fmt(after)}円</td>
                    <td className={diff < 0 ? "diff-neg" : diff > 0 ? "diff-pos" : ""}>
                      {diff === 0 ? "—" : diff < 0 ? `▼${fmt(Math.abs(diff))}円` : `▲${fmt(Math.abs(diff))}円`}
                    </td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td>税負担合計</td>
                  <td>{fmt(result.totalB)}円</td>
                  <td>{fmt(result.totalA)}円</td>
                  <td className={result.savings > 0 ? "diff-neg" : result.savings < 0 ? "diff-pos" : ""}>
                    {result.savings === 0 ? "—" : result.savings > 0 ? `▼${fmt(result.savings)}円` : `▲${fmt(Math.abs(result.savings))}円`}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={52} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => fmt(v / 10000) + "万"} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [`${fmt(v)}円`, n]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="所得税" stackId="a" fill="#2c5282" />
                  <Bar dataKey="住民税" stackId="a" fill="#c9a84c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="detail-grid">
              <div className="detail-card">
                <div className="detail-card-title">不動産収支サマリー</div>
                <div className="detail-row"><span>家賃収入合計</span><span>{fmt(result.totalRI)}円</span></div>
                <div className="detail-row"><span>経費合計</span><span>{fmt(result.totalExp)}円</span></div>
                <div className="detail-row" style={{ borderTop: "1px solid #dde2ed", marginTop: 4, paddingTop: 4 }}>
                  <span>不動産所得</span>
                  <span style={{ color: result.rei < 0 ? "#2a7a4f" : "#1a1a2e" }}>{fmt(result.rei)}円</span>
                </div>
              </div>
              <div className="detail-card">
                <div className="detail-card-title">控除サマリー</div>
                <div className="detail-row"><span>給与所得控除</span><span>{fmt(result.sd)}円</span></div>
                <div className="detail-row"><span>社会保険料控除</span><span>{fmt(result.si)}円</span></div>
                <div className="detail-row"><span>基礎控除</span><span>{fmt(result.basic)}円</span></div>
                {hasSpouse && <div className="detail-row"><span>配偶者控除</span><span>{fmt(result.spouseD)}円</span></div>}
                {deps > 0 && <div className="detail-row"><span>扶養控除</span><span>{fmt(result.depD)}円</span></div>}
              </div>
            </div>

            <div className="footer-note">
              ※本シミュレーションは概算であり、実際の税額と異なる場合があります。所得税は復興特別所得税（2.1%）を含みます。住民税は均等割5,000円を含みます。土地取得ローン利息の損益通算制限など個別事情により異なります。詳細は税理士にご相談ください。
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
