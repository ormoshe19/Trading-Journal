import React, { useMemo } from "react";

const card = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px",
  padding: "16px",
  backdropFilter: "blur(6px)",
  boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
};

const title = {
  color: "#94a3b8",
  fontSize: "12px",
  marginBottom: "6px",
  fontWeight: "700",
};

const value = {
  fontSize: "22px",
  fontWeight: "900",
  letterSpacing: "-0.02em",
};

const sectionTitle = {
  fontSize: "20px",
  fontWeight: "900",
  margin: 0,
};

function formatMoney(num) {
  return Number(num || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getTradeDateKey(trade) {
  return trade.tradeDate || (trade.createdAt ? String(trade.createdAt).slice(0, 10) : "");
}

function getHour(trade) {
  if (!trade.entryTime) return null;
  return String(trade.entryTime).split(":")[0];
}

function getTradeGrade(trade) {
  let score = 70;

  const rr = Number(trade.riskReward || 0);
  const rMultiple = Number(trade.rMultiple || 0);
  const profit = Number(trade.profit || 0);
  const mistakes = trade.mistakes || [];

  if (rr >= 2) score += 10;
  else if (rr >= 1) score += 4;
  else if (rr > 0 && rr < 1) score -= 8;

  if (rMultiple >= 2) score += 12;
  else if (rMultiple >= 1) score += 8;
  else if (rMultiple > 0) score += 2;
  else if (rMultiple < 0) score -= 10;

  if (profit > 0) score += 4;
  if (profit < 0) score -= 2;

  if (mistakes.length === 0) score += 8;
  if (mistakes.length >= 1) score -= 6;
  if (mistakes.length >= 2) score -= 6;
  if (mistakes.length >= 3) score -= 8;

  if (mistakes.includes("FOMO Entry")) score -= 12;
  if (mistakes.includes("Revenge Trade")) score -= 14;
  if (mistakes.includes("Moved Stop Loss")) score -= 12;
  if (mistakes.includes("Overtrade")) score -= 10;
  if (mistakes.includes("Early Entry")) score -= 8;
  if (mistakes.includes("Early Exit")) score -= 5;
  if (mistakes.includes("Bad Risk Management")) score -= 14;
  if (mistakes.includes("No Confirmation")) score -= 8;

  score = Math.max(1, Math.min(100, score));

  let grade = "C";
  if (score >= 92) grade = "A+";
  else if (score >= 84) grade = "A";
  else if (score >= 72) grade = "B";
  else if (score >= 58) grade = "C";
  else grade = "F";

  return { score, grade };
}

export default function AIDashboard({ trades }) {
  const data = useMemo(() => {
    if (!trades || trades.length === 0) return null;

    const valid = trades.filter((t) => t && t.profit !== undefined);
    if (!valid.length) return null;

    const gradedTrades = valid.map((trade) => {
      const grading = getTradeGrade(trade);
      return {
        ...trade,
        tradeScore: grading.score,
        tradeGrade: grading.grade,
      };
    });

    const totalProfit = gradedTrades.reduce((sum, t) => sum + Number(t.profit || 0), 0);
    const wins = gradedTrades.filter((t) => Number(t.profit || 0) > 0);
    const losses = gradedTrades.filter((t) => Number(t.profit || 0) < 0);
    const decidedTradesCount = wins.length + losses.length;
const winRate = decidedTradesCount
  ? (wins.length / decidedTradesCount) * 100
  : 0;

    const avgR =
      gradedTrades.reduce((sum, t) => sum + Number(t.rMultiple || 0), 0) /
      gradedTrades.length;

    const avgTradeScore =
      gradedTrades.reduce((sum, t) => sum + Number(t.tradeScore || 0), 0) /
      gradedTrades.length;

    const gradeCounts = {
      "A+": 0,
      A: 0,
      B: 0,
      C: 0,
      F: 0,
    };

    gradedTrades.forEach((t) => {
      gradeCounts[t.tradeGrade] += 1;
    });

    const topQualityTrades = [...gradedTrades]
      .sort((a, b) => b.tradeScore - a.tradeScore)
      .slice(0, 5);

    const worstQualityTrades = [...gradedTrades]
      .sort((a, b) => a.tradeScore - b.tradeScore)
      .slice(0, 5);

    // ---------- SETUP PERFORMANCE ----------
    const setupMap = {};
    gradedTrades.forEach((t) => {
      const setup = t.setupTag?.trim() || "Unknown";

      if (!setupMap[setup]) {
        setupMap[setup] = {
          trades: 0,
          wins: 0,
          pnl: 0,
          totalR: 0,
          totalScore: 0,
        };
      }

      setupMap[setup].trades += 1;
      if (Number(t.profit || 0) > 0) setupMap[setup].wins += 1;
      setupMap[setup].pnl += Number(t.profit || 0);
      setupMap[setup].totalR += Number(t.rMultiple || 0);
      setupMap[setup].totalScore += Number(t.tradeScore || 0);
    });

    const setupRows = Object.entries(setupMap)
      .map(([setup, s]) => {
        const wr = (s.wins / s.trades) * 100;
        const avgSetupR = s.totalR / s.trades;
        const avgScore = s.totalScore / s.trades;

        let recommendation = "Neutral";
        if (s.trades >= 3 && wr >= 55 && avgSetupR > 0.3 && s.pnl > 0) {
          recommendation = "Increase Size";
        } else if (s.trades >= 3 && (wr < 45 || avgSetupR < 0 || s.pnl < 0)) {
          recommendation = "Reduce / Avoid";
        }

        return {
          setup,
          trades: s.trades,
          winRate: wr,
          pnl: s.pnl,
          avgR: avgSetupR,
          avgScore,
          recommendation,
        };
      })
      .sort((a, b) => b.pnl - a.pnl);

    const bestSetup = setupRows.find((x) => x.trades >= 2) || null;
    const worstSetup =
      [...setupRows].reverse().find((x) => x.trades >= 2) || null;

    // ---------- HOUR PERFORMANCE ----------
    const hourMap = {};
    gradedTrades.forEach((t) => {
      const hour = getHour(t);
      if (!hour) return;

      if (!hourMap[hour]) {
        hourMap[hour] = {
          trades: 0,
          wins: 0,
          pnl: 0,
          totalR: 0,
        };
      }

      hourMap[hour].trades += 1;
      if (Number(t.profit || 0) > 0) hourMap[hour].wins += 1;
      hourMap[hour].pnl += Number(t.profit || 0);
      hourMap[hour].totalR += Number(t.rMultiple || 0);
    });

    const hourRows = Object.entries(hourMap)
      .map(([hour, s]) => ({
        hour,
        trades: s.trades,
        winRate: (s.wins / s.trades) * 100,
        pnl: s.pnl,
        avgR: s.totalR / s.trades,
      }))
      .sort((a, b) => b.pnl - a.pnl);

    const bestHour = hourRows.find((x) => x.trades >= 2) || null;

    // ---------- DAILY TRADE COUNT PERFORMANCE ----------
    const dayBuckets = {};
    gradedTrades.forEach((t) => {
      const key = getTradeDateKey(t);
      if (!key) return;

      if (!dayBuckets[key]) dayBuckets[key] = [];
      dayBuckets[key].push(t);
    });

    Object.values(dayBuckets).forEach((dayTrades) => {
      dayTrades.sort((a, b) => {
        const aTime = `${a.tradeDate || ""} ${a.entryTime || "00:00"}`;
        const bTime = `${b.tradeDate || ""} ${b.entryTime || "00:00"}`;
        return new Date(aTime) - new Date(bTime);
      });
    });

    const tradeNumberMap = {};
    Object.values(dayBuckets).forEach((dayTrades) => {
      dayTrades.forEach((trade, idx) => {
        const tradeNum = idx + 1;
        if (!tradeNumberMap[tradeNum]) {
          tradeNumberMap[tradeNum] = {
            trades: 0,
            wins: 0,
            pnl: 0,
          };
        }

        tradeNumberMap[tradeNum].trades += 1;
        if (Number(trade.profit || 0) > 0) tradeNumberMap[tradeNum].wins += 1;
        tradeNumberMap[tradeNum].pnl += Number(trade.profit || 0);
      });
    });

    const tradeNumberRows = Object.entries(tradeNumberMap)
      .map(([tradeNum, s]) => ({
        tradeNum: Number(tradeNum),
        trades: s.trades,
        winRate: (s.wins / s.trades) * 100,
        pnl: s.pnl,
      }))
      .sort((a, b) => a.tradeNum - b.tradeNum);

    let optimalTradesPerDay = null;
    if (tradeNumberRows.length > 0) {
      optimalTradesPerDay = tradeNumberRows[0].tradeNum;
      for (let i = 1; i < tradeNumberRows.length; i += 1) {
        if (tradeNumberRows[i].pnl >= 0) {
          optimalTradesPerDay = tradeNumberRows[i].tradeNum;
        } else {
          break;
        }
      }
    }

    // ---------- MISTAKES ----------
    const mistakeMap = {};
    gradedTrades.forEach((t) => {
      (t.mistakes || []).forEach((m) => {
        if (!mistakeMap[m]) {
          mistakeMap[m] = { count: 0, lossImpact: 0 };
        }
        mistakeMap[m].count += 1;
        if (Number(t.profit || 0) < 0) {
          mistakeMap[m].lossImpact += Math.abs(Number(t.profit || 0));
        }
      });
    });

    const expensiveMistake =
      Object.entries(mistakeMap)
        .map(([mistake, s]) => ({
          mistake,
          count: s.count,
          lossImpact: s.lossImpact,
        }))
        .sort((a, b) => b.lossImpact - a.lossImpact)[0] || null;

    // ---------- PSYCHOLOGY / RECOVERY ----------
    const last5 = [...gradedTrades].slice(0, 5);
    const last3 = [...gradedTrades].slice(0, 3);

    const recentLosses = last3.filter((t) => Number(t.profit || 0) < 0).length;
    const recentMistakeTrades = last5.filter((t) => (t.mistakes || []).length > 0).length;

    const fomoCount = gradedTrades.filter((t) => (t.mistakes || []).includes("FOMO Entry")).length;
    const revengeCount = gradedTrades.filter((t) => (t.mistakes || []).includes("Revenge Trade")).length;
    const overtradeCount = gradedTrades.filter((t) => (t.mistakes || []).includes("Overtrade")).length;
    const movedStopCount = gradedTrades.filter((t) => (t.mistakes || []).includes("Moved Stop Loss")).length;

    let recoveryMode = false;
    const recoveryReasons = [];

    if (recentLosses >= 3) {
      recoveryMode = true;
      recoveryReasons.push("3 losses in the last 3 trades");
    }

    if (recentMistakeTrades >= 3) {
      recoveryMode = true;
      recoveryReasons.push("too many recent mistake-tagged trades");
    }

    if (avgR < 0) {
      recoveryMode = true;
      recoveryReasons.push("average R is negative");
    }

    if (revengeCount >= 1) {
      recoveryMode = true;
      recoveryReasons.push("revenge behavior detected");
    }

    if (overtradeCount >= 2) {
      recoveryMode = true;
      recoveryReasons.push("overtrading pattern detected");
    }

    const recoveryRules = [];
    if (recoveryMode) {
      recoveryRules.push("Cut size by 50% on the next trades.");
      recoveryRules.push(
        `Do not exceed ${Math.min(optimalTradesPerDay || 2, 2)} trades per day until stability returns.`
      );
      recoveryRules.push("Trade only your best setup.");
      recoveryRules.push("No revenge trades, no moved stop loss, no FOMO entries.");
      recoveryRules.push("Stop trading for the day after 2 consecutive losses.");
    }

    const recoveryExitConditions = [];
    if (recoveryMode) {
      recoveryExitConditions.push("2 green trades in a row");
      recoveryExitConditions.push("No mistake tags across the next 3 trades");
      recoveryExitConditions.push("Average R back above 0 over recent trades");
    }

    // ---------- PROFIT MAXIMIZER ENGINE ----------
    const maximizer = [];

    if (bestSetup) {
      if (bestSetup.recommendation === "Increase Size") {
        maximizer.push(
          `Best edge: "${bestSetup.setup}" | ${bestSetup.winRate.toFixed(
            0
          )}% WR | Avg R ${bestSetup.avgR.toFixed(2)} | Recommendation: increase size selectively.`
        );
      } else {
        maximizer.push(
          `Top setup by data is "${bestSetup.setup}", but it still needs cleaner execution before aggressive sizing.`
        );
      }
    }

    if (worstSetup && worstSetup.setup !== bestSetup?.setup) {
      maximizer.push(
        `Weakest setup: "${worstSetup.setup}" | ${worstSetup.winRate.toFixed(
          0
        )}% WR | Avg R ${worstSetup.avgR.toFixed(
          2
        )} | Recommendation: reduce exposure or avoid for now.`
      );
    }

    if (bestHour) {
      maximizer.push(
        `Best time window: around ${bestHour.hour}:00 | ${bestHour.winRate.toFixed(
          0
        )}% WR | $${formatMoney(bestHour.pnl)} total. Focus more trades there.`
      );
    }

    if (optimalTradesPerDay) {
      maximizer.push(
        `Optimal daily trade count: ${optimalTradesPerDay}. Performance tends to drop after that threshold.`
      );
    }

    if (expensiveMistake && expensiveMistake.lossImpact > 0) {
      maximizer.push(
        `Most expensive leak: "${expensiveMistake.mistake}" | Damage: $${formatMoney(
          expensiveMistake.lossImpact
        )}. Fixing this may improve PnL faster than adding more trades.`
      );
    }

    if (avgR < 0) {
      maximizer.push(
        "Your average R is still negative. Priority should be eliminating weak trades, not increasing frequency."
      );
    } else if (avgR > 0.5) {
      maximizer.push(
        "You already have positive expectancy. The next growth lever is selective size increase on your best edge only."
      );
    }

    return {
      totalTrades: gradedTrades.length,
      totalProfit,
      winRate,
      avgR,
      avgTradeScore,
      gradeCounts,
      topQualityTrades,
      worstQualityTrades,
      bestSetup,
      worstSetup,
      bestHour,
      optimalTradesPerDay,
      expensiveMistake,
      setupRows,
      tradeNumberRows,
      maximizer,
      wins: wins.length,
      losses: losses.length,
      recoveryMode,
      recoveryReasons,
      recoveryRules,
      recoveryExitConditions,
      fomoCount,
      revengeCount,
      overtradeCount,
      movedStopCount,
    };
  }, [trades]);

  if (!data) {
    return <div style={{ color: "#94a3b8" }}>No AI data yet</div>;
  }

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <h2 style={sectionTitle}>🧠 AI Profit Maximizer</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "14px",
        }}
      >
        <div style={card}>
          <div style={title}>Average Trade Grade</div>
          <div style={value}>{data.avgTradeScore.toFixed(0)}/100</div>
        </div>

        <div style={card}>
          <div style={title}>A+/A Trades</div>
          <div style={{ ...value, color: "#4ade80" }}>
            {data.gradeCounts["A+"] + data.gradeCounts["A"]}
          </div>
        </div>

        <div style={card}>
          <div style={title}>C/F Trades</div>
          <div style={{ ...value, color: "#f87171" }}>
            {data.gradeCounts["C"] + data.gradeCounts["F"]}
          </div>
        </div>

        <div style={card}>
          <div style={title}>Optimal Trades / Day</div>
          <div style={value}>{data.optimalTradesPerDay || "N/A"}</div>
        </div>
      </div>

      <div
        style={{
          ...card,
          border: data.recoveryMode
            ? "1px solid rgba(248,113,113,0.28)"
            : "1px solid rgba(34,197,94,0.24)",
          background: data.recoveryMode
            ? "linear-gradient(135deg, rgba(248,113,113,0.10), rgba(251,191,36,0.08))"
            : "linear-gradient(135deg, rgba(34,197,94,0.10), rgba(59,130,246,0.08))",
        }}
      >
        <div
          style={{
            ...title,
            color: data.recoveryMode ? "#fecaca" : "#bbf7d0",
            fontSize: "13px",
            marginBottom: "10px",
          }}
        >
          {data.recoveryMode ? "🚨 Recovery Mode ON" : "✅ Recovery Mode OFF"}
        </div>

        {data.recoveryMode ? (
          <>
            <div style={{ marginBottom: "12px", fontWeight: "800" }}>
              Why it was triggered:
            </div>
            <ul style={{ marginTop: 0, paddingLeft: "18px", lineHeight: 1.8 }}>
              {data.recoveryReasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>

            <div style={{ marginTop: "12px", marginBottom: "12px", fontWeight: "800" }}>
              Rules now:
            </div>
            <ul style={{ marginTop: 0, paddingLeft: "18px", lineHeight: 1.8 }}>
              {data.recoveryRules.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>

            <div style={{ marginTop: "12px", marginBottom: "12px", fontWeight: "800" }}>
              Exit Recovery when:
            </div>
            <ul style={{ marginTop: 0, paddingLeft: "18px", lineHeight: 1.8 }}>
              {data.recoveryExitConditions.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>
          </>
        ) : (
          <div style={{ color: "#d1fae5", lineHeight: 1.7 }}>
            You are currently stable. No protection mode is needed right now.
          </div>
        )}
      </div>

      <div
        style={{
          ...card,
          border: "1px solid rgba(34,197,94,0.24)",
          background:
            "linear-gradient(135deg, rgba(34,197,94,0.10), rgba(59,130,246,0.08))",
        }}
      >
        <div style={{ ...title, color: "#bbf7d0", fontSize: "13px", marginBottom: "10px" }}>
          💰 Profit Maximizer Recommendations
        </div>

        <ul style={{ margin: 0, paddingLeft: "18px", lineHeight: 1.8 }}>
          {data.maximizer.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "14px",
        }}
      >
        <div style={card}>
          <div style={title}>Best Quality Trades</div>
          <div style={{ display: "grid", gap: "8px" }}>
            {data.topQualityTrades.map((trade, i) => (
              <div
                key={`${trade.id}-${i}`}
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  fontWeight: "700",
                }}
              >
                {trade.asset || "Trade"} · {trade.tradeGrade} · {trade.tradeScore}/100
                <div style={{ color: "#cbd5e1", fontSize: "13px", marginTop: "4px" }}>
                  {trade.setupTag || "Unknown"} · ${formatMoney(trade.profit)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={title}>Worst Quality Trades</div>
          <div style={{ display: "grid", gap: "8px" }}>
            {data.worstQualityTrades.map((trade, i) => (
              <div
                key={`${trade.id}-${i}`}
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  fontWeight: "700",
                }}
              >
                {trade.asset || "Trade"} · {trade.tradeGrade} · {trade.tradeScore}/100
                <div style={{ color: "#cbd5e1", fontSize: "13px", marginTop: "4px" }}>
                  {trade.setupTag || "Unknown"} · ${formatMoney(trade.profit)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "14px",
        }}
      >
        <div style={card}>
          <div style={title}>A+</div>
          <div style={{ ...value, color: "#4ade80" }}>{data.gradeCounts["A+"]}</div>
        </div>

        <div style={card}>
          <div style={title}>A</div>
          <div style={{ ...value, color: "#86efac" }}>{data.gradeCounts["A"]}</div>
        </div>

        <div style={card}>
          <div style={title}>B</div>
          <div style={{ ...value, color: "#facc15" }}>{data.gradeCounts["B"]}</div>
        </div>

        <div style={card}>
          <div style={title}>C</div>
          <div style={{ ...value, color: "#fb923c" }}>{data.gradeCounts["C"]}</div>
        </div>

        <div style={card}>
          <div style={title}>F</div>
          <div style={{ ...value, color: "#f87171" }}>{data.gradeCounts["F"]}</div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "14px",
        }}
      >
        <div style={card}>
          <div style={title}>Best Setup To Scale</div>
          {data.bestSetup ? (
            <>
              <div style={value}>{data.bestSetup.setup}</div>
              <div style={{ marginTop: "8px", color: "#cbd5e1", lineHeight: 1.7 }}>
                Win Rate: {data.bestSetup.winRate.toFixed(0)}%
                <br />
                Avg R: {data.bestSetup.avgR.toFixed(2)}
                <br />
                Avg Score: {data.bestSetup.avgScore.toFixed(0)}
                <br />
                PnL: ${formatMoney(data.bestSetup.pnl)}
                <br />
                Recommendation: {data.bestSetup.recommendation}
              </div>
            </>
          ) : (
            <div style={{ color: "#cbd5e1" }}>Not enough setup data yet.</div>
          )}
        </div>

        <div style={card}>
          <div style={title}>Setup To Reduce / Avoid</div>
          {data.worstSetup ? (
            <>
              <div style={value}>{data.worstSetup.setup}</div>
              <div style={{ marginTop: "8px", color: "#cbd5e1", lineHeight: 1.7 }}>
                Win Rate: {data.worstSetup.winRate.toFixed(0)}%
                <br />
                Avg R: {data.worstSetup.avgR.toFixed(2)}
                <br />
                Avg Score: {data.worstSetup.avgScore.toFixed(0)}
                <br />
                PnL: ${formatMoney(data.worstSetup.pnl)}
                <br />
                Recommendation: {data.worstSetup.recommendation}
              </div>
            </>
          ) : (
            <div style={{ color: "#cbd5e1" }}>Not enough setup data yet.</div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: "14px",
        }}
      >
        <div style={card}>
          <div style={title}>FOMO Count</div>
          <div style={value}>{data.fomoCount}</div>
        </div>

        <div style={card}>
          <div style={title}>Revenge Count</div>
          <div style={value}>{data.revengeCount}</div>
        </div>

        <div style={card}>
          <div style={title}>Overtrade Count</div>
          <div style={value}>{data.overtradeCount}</div>
        </div>

        <div style={card}>
          <div style={title}>Moved Stop Count</div>
          <div style={value}>{data.movedStopCount}</div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "14px",
        }}
      >
        <div style={card}>
          <div style={title}>Best Trading Hour</div>
          {data.bestHour ? (
            <>
              <div style={value}>{data.bestHour.hour}:00</div>
              <div style={{ marginTop: "8px", color: "#cbd5e1", lineHeight: 1.7 }}>
                Win Rate: {data.bestHour.winRate.toFixed(0)}%
                <br />
                Avg R: {data.bestHour.avgR.toFixed(2)}
                <br />
                PnL: ${formatMoney(data.bestHour.pnl)}
              </div>
            </>
          ) : (
            <div style={{ color: "#cbd5e1" }}>Not enough hour data yet.</div>
          )}
        </div>

        <div style={card}>
          <div style={title}>Most Expensive Mistake</div>
          {data.expensiveMistake ? (
            <>
              <div style={value}>{data.expensiveMistake.mistake}</div>
              <div style={{ marginTop: "8px", color: "#fca5a5", lineHeight: 1.7 }}>
                Count: {data.expensiveMistake.count}
                <br />
                Loss Impact: ${formatMoney(data.expensiveMistake.lossImpact)}
              </div>
            </>
          ) : (
            <div style={{ color: "#cbd5e1" }}>No mistake data yet.</div>
          )}
        </div>
      </div>

      <div style={card}>
        <div style={{ ...title, marginBottom: "10px" }}>Trade Count Performance</div>
        <div style={{ display: "grid", gap: "8px" }}>
          {data.tradeNumberRows.map((row) => (
            <div
              key={row.tradeNum}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 1fr 1fr",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                fontSize: "14px",
                fontWeight: "700",
              }}
            >
              <div>Trade #{row.tradeNum}</div>
              <div>WR: {row.winRate.toFixed(0)}%</div>
              <div>PnL: ${formatMoney(row.pnl)}</div>
              <div>Samples: {row.trades}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={{ ...title, marginBottom: "10px" }}>Setup Ranking</div>
        <div style={{ display: "grid", gap: "8px" }}>
          {data.setupRows.map((row) => (
            <div
              key={row.setup}
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                fontSize: "14px",
                fontWeight: "700",
              }}
            >
              <div>{row.setup}</div>
              <div>{row.winRate.toFixed(0)}% WR</div>
              <div>{row.avgR.toFixed(2)}R</div>
              <div>{row.avgScore.toFixed(0)} score</div>
              <div>${formatMoney(row.pnl)}</div>
              <div
                style={{
                  color:
                    row.recommendation === "Increase Size"
                      ? "#4ade80"
                      : row.recommendation === "Reduce / Avoid"
                      ? "#f87171"
                      : "#e5e7eb",
                }}
              >
                {row.recommendation}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}