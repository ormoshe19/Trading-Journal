import React, { useMemo } from "react";

function Analytics({ trades = [] }) {
  const money = (n) => `$${Number(n || 0).toFixed(2)}`;
  const pct = (n) => `${Number(n || 0).toFixed(1)}%`;

  const data = useMemo(() => {
    const closed = trades
      .filter((t) => Number(t.profit) !== 0)
      .sort((a, b) => new Date(a.createdAt || a.tradeDate || 0) - new Date(b.createdAt || b.tradeDate || 0));

    const sum = (arr, key) => arr.reduce((s, t) => s + Number(t[key] || 0), 0);
    const avg = (arr, key) => (arr.length ? sum(arr, key) / arr.length : 0);

    const wins = closed.filter((t) => Number(t.profit) > 0);
    const losses = closed.filter((t) => Number(t.profit) < 0);

    const total = closed.length;
    const totalPnL = sum(closed, "profit");
    const winRate = total ? (wins.length / total) * 100 : 0;
    const avgWin = avg(wins, "profit");
    const avgLoss = avg(losses, "profit");
    const grossWin = sum(wins, "profit");
    const grossLoss = Math.abs(sum(losses, "profit"));
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 999 : 0;
    const expectancy = total ? totalPnL / total : 0;
    const payoffRatio = Math.abs(avgLoss) > 0 ? avgWin / Math.abs(avgLoss) : 0;

    let equity = [];
    let running = 0;
    let peak = 0;
    let maxDrawdown = 0;

    closed.forEach((t, i) => {
      running += Number(t.profit || 0);
      peak = Math.max(peak, running);
      const dd = running - peak;
      maxDrawdown = Math.min(maxDrawdown, dd);
      equity.push({
        index: i + 1,
        equity: running,
        drawdown: dd,
        profit: Number(t.profit || 0),
      });
    });

    const groupBy = (key) => {
      const map = {};
      closed.forEach((t) => {
        const k = t[key] || "Unknown";
        if (!map[k]) map[k] = [];
        map[k].push(t);
      });

      return Object.entries(map)
        .map(([name, arr]) => {
          const w = arr.filter((t) => Number(t.profit) > 0);
          const l = arr.filter((t) => Number(t.profit) < 0);
          const pnl = sum(arr, "profit");
          const wr = arr.length ? (w.length / arr.length) * 100 : 0;
          const exp = arr.length ? pnl / arr.length : 0;
          const gw = sum(w, "profit");
          const gl = Math.abs(sum(l, "profit"));
          const pf = gl > 0 ? gw / gl : gw > 0 ? 999 : 0;
          const confidence = Math.min(100, arr.length * 8 + Math.max(exp, 0) * 0.15 + Math.max(pf - 1, 0) * 18);

          return {
            name,
            trades: arr.length,
            pnl,
            winRate: wr,
            expectancy: exp,
            profitFactor: pf,
            confidence,
          };
        })
        .sort((a, b) => b.pnl - a.pnl);
    };

    const mistakeMap = {};
    closed.forEach((t) => {
      (t.mistakes || []).forEach((m) => {
        if (!mistakeMap[m]) mistakeMap[m] = { count: 0, pnl: 0 };
        mistakeMap[m].count += 1;
        mistakeMap[m].pnl += Number(t.profit || 0);
      });
    });

    const mistakes = Object.entries(mistakeMap)
      .map(([name, v]) => ({ name, ...v, avgCost: v.count ? v.pnl / v.count : 0 }))
      .sort((a, b) => a.pnl - b.pnl);

    const hourMap = {};
    closed.forEach((t) => {
      const hour = String(t.entryTime || "").slice(0, 2) || "Unknown";
      if (!hourMap[hour]) hourMap[hour] = [];
      hourMap[hour].push(t);
    });

    const hours = Object.entries(hourMap)
      .map(([hour, arr]) => {
        const w = arr.filter((t) => Number(t.profit) > 0);
        return {
          hour,
          trades: arr.length,
          pnl: sum(arr, "profit"),
          winRate: arr.length ? (w.length / arr.length) * 100 : 0,
          expectancy: arr.length ? sum(arr, "profit") / arr.length : 0,
        };
      })
      .sort((a, b) => b.pnl - a.pnl);

    const bySetup = groupBy("setupTag");
    const byDirection = groupBy("direction");
    const byJournal = groupBy("journalId");

    const bestSetup = bySetup[0];
    const worstSetup = [...bySetup].sort((a, b) => a.pnl - b.pnl)[0];
    const worstMistake = mistakes[0];
    const bestHour = hours[0];
    const worstHour = [...hours].sort((a, b) => a.pnl - b.pnl)[0];

    const edgeScore = Math.max(
      0,
      Math.min(
        100,
        profitFactor * 24 +
          payoffRatio * 14 +
          Math.max(expectancy, 0) * 0.18 +
          winRate * 0.22 -
          Math.abs(maxDrawdown) * 0.02
      )
    );

    let riskRecommendation = "Standard risk only.";
    if (edgeScore >= 75 && profitFactor >= 1.7 && expectancy > 0) {
      riskRecommendation = "Strong edge detected. Consider scaling only after consistency stays stable.";
    } else if (edgeScore >= 55 && profitFactor >= 1.25) {
      riskRecommendation = "Moderate edge. Keep risk stable and focus on best setups.";
    } else {
      riskRecommendation = "Weak or unstable edge. Reduce risk and eliminate leaks before scaling.";
    }

    const worstLeak =
      worstMistake && worstMistake.pnl < 0
        ? `${worstMistake.name} is the biggest leak with ${money(worstMistake.pnl)} total damage.`
        : "No major mistake leak detected yet.";

    return {
      closed,
      total,
      wins: wins.length,
      losses: losses.length,
      totalPnL,
      winRate,
      avgWin,
      avgLoss,
      payoffRatio,
      expectancy,
      profitFactor,
      equity,
      maxDrawdown,
      bySetup,
      byDirection,
      byJournal,
      mistakes,
      hours,
      bestSetup,
      worstSetup,
      worstMistake,
      bestHour,
      worstHour,
      edgeScore,
      riskRecommendation,
      worstLeak,
    };
  }, [trades]);

  const card = {
    background: "rgba(15,23,42,0.72)",
    border: "1px solid rgba(148,163,184,0.15)",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
  };

  const muted = { color: "#94a3b8", fontSize: "13px" };
  const green = { color: "#4ade80" };
  const red = { color: "#fb7185" };
  const yellow = { color: "#facc15" };

  const Stat = ({ label, value, good }) => (
    <div style={card}>
      <div style={muted}>{label}</div>
      <h2 style={good === true ? green : good === false ? red : { color: "#fff" }}>{value}</h2>
    </div>
  );

  const Table = ({ rows, columns }) => (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", color: "#e5e7eb" }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{
                  textAlign: "left",
                  padding: "10px",
                  color: "#94a3b8",
                  borderBottom: "1px solid rgba(148,163,184,0.18)",
                  fontSize: "12px",
                }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 10).map((r, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td
                  key={c.key}
                  style={{
                    padding: "10px",
                    borderBottom: "1px solid rgba(148,163,184,0.08)",
                    fontSize: "13px",
                  }}
                >
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const MiniBars = ({ rows, valueKey = "pnl", labelKey = "name" }) => {
    const max = Math.max(...rows.map((r) => Math.abs(Number(r[valueKey] || 0))), 1);

    return (
      <div style={{ display: "grid", gap: "10px" }}>
        {rows.slice(0, 8).map((r, i) => {
          const val = Number(r[valueKey] || 0);
          const width = `${Math.max(4, (Math.abs(val) / max) * 100)}%`;

          return (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#e5e7eb", fontSize: "13px" }}>
                <span>{r[labelKey]}</span>
                <span style={val >= 0 ? green : red}>{money(val)}</span>
              </div>
              <div style={{ height: "8px", background: "rgba(148,163,184,0.12)", borderRadius: "999px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width,
                    background: val >= 0 ? "#22c55e" : "#ef4444",
                    borderRadius: "999px",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const EquityCurve = ({ points }) => {
    if (!points.length) return <div style={muted}>No closed trades yet.</div>;

    const width = 700;
    const height = 220;
    const values = points.map((p) => p.equity);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 1);
    const range = max - min || 1;

    const path = points
      .map((p, i) => {
        const x = points.length === 1 ? 0 : (i / (points.length - 1)) * width;
        const y = height - ((p.equity - min) / range) * height;
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "240px" }}>
        <path d={path} fill="none" stroke="#8b5cf6" strokeWidth="4" />
        <line
          x1="0"
          x2={width}
          y1={height - ((0 - min) / range) * height}
          y2={height - ((0 - min) / range) * height}
          stroke="rgba(148,163,184,0.25)"
          strokeDasharray="6 6"
        />
      </svg>
    );
  };

  if (!trades.length) {
    return (
      <div style={card}>
        <h2 style={{ color: "#fff" }}>Trader Performance Lab</h2>
        <p style={muted}>No trades yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "18px" }}>
      <div>
        <div style={{ color: "#94a3b8", fontWeight: 800 }}>EDGE INTELLIGENCE SYSTEM</div>
        <h1 style={{ color: "#fff", margin: "4px 0 0" }}>Trader Performance Lab</h1>
        <p style={muted}>Find your real edge, expose leaks, and know what to scale or cut.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "14px" }}>
        <Stat label="Net PnL" value={money(data.totalPnL)} good={data.totalPnL >= 0} />
        <Stat label="Edge Score" value={`${data.edgeScore.toFixed(0)}/100`} good={data.edgeScore >= 60} />
        <Stat label="Expectancy / Trade" value={money(data.expectancy)} good={data.expectancy >= 0} />
        <Stat
          label="Profit Factor"
          value={data.profitFactor === 999 ? "∞" : data.profitFactor.toFixed(2)}
          good={data.profitFactor >= 1.4}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "18px" }}>
        <div style={card}>
          <h3 style={{ color: "#fff" }}>Equity Curve</h3>
          <EquityCurve points={data.equity} />
          <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
            <span style={muted}>Closed Trades: {data.total}</span>
            <span style={data.maxDrawdown < 0 ? red : green}>Max Drawdown: {money(data.maxDrawdown)}</span>
            <span style={muted}>Win Rate: {pct(data.winRate)}</span>
          </div>
        </div>

        <div style={card}>
          <h3 style={{ color: "#fff" }}>Risk Recommendation</h3>
          <p style={{ color: "#e5e7eb", lineHeight: 1.7 }}>{data.riskRecommendation}</p>
          <div style={{ marginTop: "14px", padding: "12px", borderRadius: "12px", background: "rgba(239,68,68,0.12)" }}>
            <div style={red}>Worst Leak</div>
            <div style={{ color: "#e5e7eb", marginTop: "6px" }}>{data.worstLeak}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
        <div style={card}>
          <h3 style={{ color: "#fff" }}>AI Diagnosis</h3>
          <div style={{ display: "grid", gap: "10px", color: "#e5e7eb", lineHeight: 1.7 }}>
            <div>
              Best setup: <b style={green}>{data.bestSetup?.name || "No setup data"}</b>{" "}
              ({money(data.bestSetup?.pnl || 0)})
            </div>
            <div>
              Weakest setup: <b style={red}>{data.worstSetup?.name || "No setup data"}</b>{" "}
              ({money(data.worstSetup?.pnl || 0)})
            </div>
            <div>
              Best hour: <b style={green}>{data.bestHour?.hour || "-"}</b> | Worst hour:{" "}
              <b style={red}>{data.worstHour?.hour || "-"}</b>
            </div>
            <div>
              Payoff Ratio: <b style={yellow}>{data.payoffRatio.toFixed(2)}</b> | Avg Win:{" "}
              <b style={green}>{money(data.avgWin)}</b> | Avg Loss:{" "}
              <b style={red}>{money(data.avgLoss)}</b>
            </div>
          </div>
        </div>

        <div style={card}>
          <h3 style={{ color: "#fff" }}>Rules Engine</h3>
          <ul style={{ color: "#e5e7eb", lineHeight: 1.8, paddingLeft: "20px" }}>
            {data.worstMistake && <li>Avoid trades when {data.worstMistake.name} appears.</li>}
            {data.bestSetup && <li>Prioritize {data.bestSetup.name} when context is clean.</li>}
            {data.worstHour && <li>Reduce risk or stop trading around {data.worstHour.hour}:00.</li>}
            {data.profitFactor < 1.2 && <li>Do not increase size until Profit Factor improves.</li>}
            {data.edgeScore >= 70 && <li>Edge is present. Focus on consistency, not more trades.</li>}
          </ul>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
        <div style={card}>
          <h3 style={{ color: "#fff" }}>Setup Edge Ranking</h3>
          <Table
            rows={data.bySetup}
            columns={[
              { key: "name", label: "Setup" },
              { key: "trades", label: "Trades" },
              { key: "pnl", label: "PnL", render: (r) => <span style={r.pnl >= 0 ? green : red}>{money(r.pnl)}</span> },
              { key: "winRate", label: "WR", render: (r) => pct(r.winRate) },
              { key: "confidence", label: "Confidence", render: (r) => pct(r.confidence) },
            ]}
          />
        </div>

        <div style={card}>
          <h3 style={{ color: "#fff" }}>Mistake Cost Map</h3>
          <Table
            rows={data.mistakes}
            columns={[
              { key: "name", label: "Mistake" },
              { key: "count", label: "Count" },
              { key: "pnl", label: "Damage", render: (r) => <span style={r.pnl >= 0 ? green : red}>{money(r.pnl)}</span> },
              { key: "avgCost", label: "Avg Cost", render: (r) => <span style={r.avgCost >= 0 ? green : red}>{money(r.avgCost)}</span> },
            ]}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
        <div style={card}>
          <h3 style={{ color: "#fff" }}>Best / Worst Trading Hours</h3>
          <MiniBars rows={data.hours} valueKey="pnl" labelKey="hour" />
        </div>

        <div style={card}>
          <h3 style={{ color: "#fff" }}>Long vs Short</h3>
          <Table
            rows={data.byDirection}
            columns={[
              { key: "name", label: "Direction" },
              { key: "trades", label: "Trades" },
              { key: "pnl", label: "PnL", render: (r) => <span style={r.pnl >= 0 ? green : red}>{money(r.pnl)}</span> },
              { key: "profitFactor", label: "PF", render: (r) => (r.profitFactor === 999 ? "∞" : r.profitFactor.toFixed(2)) },
              { key: "expectancy", label: "EXP", render: (r) => money(r.expectancy) },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

export default Analytics;