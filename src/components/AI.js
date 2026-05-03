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

function getWeekStart(dateLike) {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export default function AIDashboard({ trades }) {
  const data = useMemo(() => {
    if (!trades || trades.length === 0) return null;

    const valid = trades.filter((t) => t && t.profit !== undefined);
    if (!valid.length) return null;

    const wins = valid.filter((t) => Number(t.profit || 0) > 0);
    const losses = valid.filter((t) => Number(t.profit || 0) < 0);
    const beTrades = valid.filter(
      (t) => t.direction === "BE" || Number(t.profit || 0) === 0
    );

    const totalProfit = valid.reduce((acc, t) => acc + Number(t.profit || 0), 0);
    const winRate = wins.length / (valid.length || 1);

    const longTrades = valid.filter((t) => t.direction === "Long");
    const shortTrades = valid.filter((t) => t.direction === "Short");

    const longProfit = longTrades.reduce((acc, t) => acc + Number(t.profit || 0), 0);
    const shortProfit = shortTrades.reduce((acc, t) => acc + Number(t.profit || 0), 0);

    const avgR =
      valid.reduce((acc, t) => acc + Number(t.rMultiple || 0), 0) /
      (valid.length || 1);

    const avgRR =
      valid.reduce((acc, t) => acc + Number(t.riskReward || 0), 0) /
      (valid.length || 1);

    const avgCoachScore =
      valid.reduce((acc, t) => acc + Number(t.aiCoachScore || 0), 0) /
      (valid.length || 1);

    const setupMap = {};
    valid.forEach((t) => {
      const tag = t.setupTag?.trim() || "Unknown";
      if (!setupMap[tag]) {
        setupMap[tag] = { wins: 0, total: 0, pnl: 0 };
      }
      if (Number(t.profit || 0) > 0) setupMap[tag].wins += 1;
      setupMap[tag].total += 1;
      setupMap[tag].pnl += Number(t.profit || 0);
    });

    let bestSetup = "N/A";
    let bestSetupRate = 0;
    let bestSetupPnl = 0;

    Object.entries(setupMap).forEach(([tag, stat]) => {
      const rate = stat.wins / stat.total;
      if (rate > bestSetupRate && stat.total >= 2) {
        bestSetupRate = rate;
        bestSetup = tag;
        bestSetupPnl = stat.pnl;
      }
    });

    const hourMap = {};
    valid.forEach((t) => {
      if (!t.entryTime) return;
      const h = t.entryTime.split(":")[0];
      if (!hourMap[h]) {
        hourMap[h] = { wins: 0, total: 0, pnl: 0 };
      }
      if (Number(t.profit || 0) > 0) hourMap[h].wins += 1;
      hourMap[h].total += 1;
      hourMap[h].pnl += Number(t.profit || 0);
    });

    let bestHour = "N/A";
    let bestHourRate = 0;
    let bestHourPnl = 0;

    Object.entries(hourMap).forEach(([hour, stat]) => {
      const rate = stat.wins / stat.total;
      if (rate > bestHourRate && stat.total >= 2) {
        bestHourRate = rate;
        bestHour = hour;
        bestHourPnl = stat.pnl;
      }
    });

    const dayMap = {};
    valid.forEach((t) => {
      const rawDate = t.tradeDate || t.createdAt;
      if (!rawDate) return;
      const d = new Date(rawDate);
      if (Number.isNaN(d.getTime())) return;
      const dayName = d.toLocaleDateString("en-US", { weekday: "long" });

      if (!dayMap[dayName]) {
        dayMap[dayName] = { wins: 0, total: 0, pnl: 0 };
      }
      if (Number(t.profit || 0) > 0) dayMap[dayName].wins += 1;
      dayMap[dayName].total += 1;
      dayMap[dayName].pnl += Number(t.profit || 0);
    });

    let bestDay = "N/A";
    let bestDayRate = 0;
    let bestDayPnl = 0;

    Object.entries(dayMap).forEach(([day, stat]) => {
      const rate = stat.wins / stat.total;
      if (rate > bestDayRate && stat.total >= 2) {
        bestDayRate = rate;
        bestDay = day;
        bestDayPnl = stat.pnl;
      }
    });

    const mistakeMap = {};
    valid.forEach((t) => {
      (t.mistakes || []).forEach((m) => {
        if (!mistakeMap[m]) {
          mistakeMap[m] = { count: 0, pnl: 0, losses: 0 };
        }
        mistakeMap[m].count += 1;
        mistakeMap[m].pnl += Number(t.profit || 0);
        if (Number(t.profit || 0) < 0) {
          mistakeMap[m].losses += Math.abs(Number(t.profit || 0));
        }
      });
    });

    let worstMistake = "None";
    let worstMistakeCount = 0;
    let worstMistakeLossImpact = 0;

    Object.entries(mistakeMap).forEach(([m, stat]) => {
      if (stat.count > worstMistakeCount) {
        worstMistake = m;
        worstMistakeCount = stat.count;
        worstMistakeLossImpact = stat.losses;
      }
    });

    let mostExpensiveMistake = "None";
    let highestLossImpact = 0;

    Object.entries(mistakeMap).forEach(([m, stat]) => {
      if (stat.losses > highestLossImpact) {
        mostExpensiveMistake = m;
        highestLossImpact = stat.losses;
      }
    });

    const fomoCount = valid.filter((t) => (t.mistakes || []).includes("FOMO Entry")).length;
    const overtradeCount = valid.filter((t) => (t.mistakes || []).includes("Overtrade")).length;
    const revengeCount = valid.filter((t) => (t.mistakes || []).includes("Revenge Trade")).length;
    const earlyEntryCount = valid.filter((t) => (t.mistakes || []).includes("Early Entry")).length;
    const earlyExitCount = valid.filter((t) => (t.mistakes || []).includes("Early Exit")).length;
    const movedStopCount = valid.filter((t) => (t.mistakes || []).includes("Moved Stop Loss")).length;

    const recentTrades = [...valid].slice(0, 8);
    const recentLossStreak = [];
    let streak = 0;
    for (let i = 0; i < recentTrades.length; i += 1) {
      const p = Number(recentTrades[i].profit || 0);
      if (p < 0) {
        streak += 1;
        recentLossStreak.push(recentTrades[i]);
      } else {
        break;
      }
    }

    const dailyMap = {};
    valid.forEach((t) => {
      const key = t.tradeDate || (t.createdAt ? String(t.createdAt).slice(0, 10) : "");
      if (!key) return;
      if (!dailyMap[key]) {
        dailyMap[key] = { pnl: 0, trades: 0 };
      }
      dailyMap[key].pnl += Number(t.profit || 0);
      dailyMap[key].trades += 1;
    });

    const activeDays = Object.values(dailyMap);
    const greenDays = activeDays.filter((d) => d.pnl > 0).length;
    const redDays = activeDays.filter((d) => d.pnl < 0).length;
    const blueDays = activeDays.filter((d) => d.pnl === 0).length;

    const psychologyFlags = [];
    if (fomoCount >= 2) psychologyFlags.push(`FOMO showed up ${fomoCount} times.`);
    if (overtradeCount >= 2) psychologyFlags.push(`Overtrading appeared ${overtradeCount} times.`);
    if (revengeCount >= 1) psychologyFlags.push(`Revenge-trading behavior was tagged ${revengeCount} time(s).`);
    if (earlyEntryCount >= 2) psychologyFlags.push(`Early entries keep repeating (${earlyEntryCount} times).`);
    if (earlyExitCount >= 2) psychologyFlags.push(`You may be cutting trades too early (${earlyExitCount} times).`);
    if (movedStopCount >= 1) psychologyFlags.push(`Stop movement was logged ${movedStopCount} time(s).`);

    const coach = [];

    if (winRate < 0.4) {
      coach.push("You are forcing too many low-quality trades. Reduce volume and raise selectivity.");
    } else if (winRate > 0.6) {
      coach.push("Your win rate is strong. You likely have an edge — focus on scaling with discipline.");
    }

    if (totalProfit < 0) {
      coach.push("You are net negative right now. The fix is likely execution quality, not more screen time.");
    } else if (totalProfit > 0) {
      coach.push("You are net positive. The next step is protecting what already works and removing weak patterns.");
    }

    if (bestHour !== "N/A") {
      coach.push(`Your strongest time window is around ${bestHour}:00. Protect that edge and avoid random hours.`);
    }

    if (bestDay !== "N/A") {
      coach.push(`Your best trading day is ${bestDay}. Compare what you do differently on that day.`);
    }

    if (bestSetup !== "N/A") {
      coach.push(`Your best setup currently is "${bestSetup}". Build more of your playbook around it.`);
    }

    if (worstMistake !== "None") {
      coach.push(`Your most repeated weakness is "${worstMistake}". This is likely one of your biggest leaks.`);
    }

    if (mostExpensiveMistake !== "None") {
      coach.push(`The most expensive behavioral error is "${mostExpensiveMistake}". That leak is costing real money.`);
    }

    if (longProfit > shortProfit && longTrades.length >= 2) {
      coach.push("Long trades are outperforming short trades. Your read on bullish structure may be stronger right now.");
    } else if (shortProfit > longProfit && shortTrades.length >= 2) {
      coach.push("Short trades are outperforming long trades. Your downside timing looks better than your long execution.");
    }

    if (recentLossStreak.length >= 3) {
      coach.push("You are coming off a loss streak. Reduce size and avoid revenge behavior until rhythm returns.");
    }

    if (avgCoachScore < 5) {
      coach.push("Average AI coach score is low. Focus on process quality before trying to increase size.");
    } else if (avgCoachScore >= 7) {
      coach.push("Average AI coach score is healthy. Your process quality is improving.");
    }

    if (avgRR < 1) {
      coach.push("Average risk/reward is weak. Improve trade selection and target planning.");
    }

    if (avgR < 0) {
      coach.push("Average R is negative. Your system is currently giving back more than it produces.");
    }

    const edgeSummary = [];
    if (bestSetup !== "N/A") edgeSummary.push(`Best setup: ${bestSetup}`);
    if (bestHour !== "N/A") edgeSummary.push(`Best hour: ${bestHour}:00`);
    if (bestDay !== "N/A") edgeSummary.push(`Best day: ${bestDay}`);
    edgeSummary.push(
      longProfit === shortProfit
        ? "Direction edge: Neutral"
        : longProfit > shortProfit
        ? "Direction edge: Long"
        : "Direction edge: Short"
    );

    const weekGroups = {};
    valid.forEach((t) => {
      const rawDate = t.tradeDate || t.createdAt;
      if (!rawDate) return;
      const weekStart = getWeekStart(rawDate);
      if (!weekStart) return;
      const key = weekStart.toISOString().slice(0, 10);

      if (!weekGroups[key]) {
        weekGroups[key] = {
          key,
          trades: [],
        };
      }
      weekGroups[key].trades.push(t);
    });

    const weekly = Object.values(weekGroups)
      .map((w) => {
        const weekTrades = w.trades;
        const weekProfit = weekTrades.reduce((acc, t) => acc + Number(t.profit || 0), 0);
        const weekWins = weekTrades.filter((t) => Number(t.profit || 0) > 0).length;
        const weekLosses = weekTrades.filter((t) => Number(t.profit || 0) < 0).length;
        const weekBE = weekTrades.filter(
          (t) => t.direction === "BE" || Number(t.profit || 0) === 0
        ).length;
        const weekWinRate = weekWins / (weekTrades.length || 1);

        const weekMistakeMap = {};
        const weekSetupMap = {};

        weekTrades.forEach((t) => {
          (t.mistakes || []).forEach((m) => {
            if (!weekMistakeMap[m]) weekMistakeMap[m] = { count: 0, lossImpact: 0 };
            weekMistakeMap[m].count += 1;
            if (Number(t.profit || 0) < 0) {
              weekMistakeMap[m].lossImpact += Math.abs(Number(t.profit || 0));
            }
          });

          const tag = t.setupTag?.trim() || "Unknown";
          if (!weekSetupMap[tag]) {
            weekSetupMap[tag] = { pnl: 0, wins: 0, total: 0 };
          }
          weekSetupMap[tag].pnl += Number(t.profit || 0);
          if (Number(t.profit || 0) > 0) weekSetupMap[tag].wins += 1;
          weekSetupMap[tag].total += 1;
        });

        let topWeekMistake = "None";
        let topWeekMistakeLoss = 0;
        Object.entries(weekMistakeMap).forEach(([m, s]) => {
          if (s.lossImpact > topWeekMistakeLoss) {
            topWeekMistake = m;
            topWeekMistakeLoss = s.lossImpact;
          }
        });

        let topWeekSetup = "N/A";
        let topWeekSetupPnl = -Infinity;
        Object.entries(weekSetupMap).forEach(([tag, s]) => {
          if (s.pnl > topWeekSetupPnl) {
            topWeekSetup = tag;
            topWeekSetupPnl = s.pnl;
          }
        });

        const rules = [];
        if (weekProfit < 0) {
          rules.push("Cut trade frequency and wait for A+ setups only.");
        } else {
          rules.push("Keep leaning into the setups that already worked this week.");
        }

        if (topWeekMistake !== "None") {
          rules.push(`Do not repeat "${topWeekMistake}" next week.`);
        } else {
          rules.push("Preserve discipline — mistakes were not the main issue this week.");
        }

        if (weekWinRate < 0.5) {
          rules.push("Be more selective on entries and do not rush confirmation.");
        } else {
          rules.push("Protect your edge by keeping size consistent and avoiding emotional trades.");
        }

        return {
          key: w.key,
          profit: weekProfit,
          trades: weekTrades.length,
          wins: weekWins,
          losses: weekLosses,
          be: weekBE,
          winRate: weekWinRate,
          topWeekMistake,
          topWeekMistakeLoss,
          topWeekSetup,
          topWeekSetupPnl,
          rules: rules.slice(0, 3),
        };
      })
      .sort((a, b) => b.key.localeCompare(a.key));

    const latestWeek = weekly[0] || null;

    return {
      totalProfit,
      winRate,
      totalTrades: valid.length,
      wins: wins.length,
      losses: losses.length,
      beTrades: beTrades.length,
      avgR,
      avgRR,
      avgCoachScore,
      bestSetup,
      bestSetupRate,
      bestSetupPnl,
      bestHour,
      bestHourRate,
      bestHourPnl,
      bestDay,
      bestDayRate,
      bestDayPnl,
      worstMistake,
      worstMistakeCount,
      worstMistakeLossImpact,
      mostExpensiveMistake,
      highestLossImpact,
      longProfit,
      shortProfit,
      longTrades: longTrades.length,
      shortTrades: shortTrades.length,
      greenDays,
      redDays,
      blueDays,
      coach,
      psychologyFlags,
      edgeSummary,
      latestWeek,
      weekly,
    };
  }, [trades]);

  if (!data) {
    return <div style={{ color: "#94a3b8" }}>No AI data yet</div>;
  }

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <h2 style={sectionTitle}>🧠 AI Intelligence</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "14px",
        }}
      >
        <div style={card}>
          <div style={title}>Win Rate</div>
          <div style={value}>{(data.winRate * 100).toFixed(0)}%</div>
        </div>

        <div style={card}>
          <div style={title}>Total Profit</div>
          <div
            style={{
              ...value,
              color: data.totalProfit >= 0 ? "#4ade80" : "#f87171",
            }}
          >
            ${data.totalProfit.toFixed(2)}
          </div>
        </div>

        <div style={card}>
          <div style={title}>Average R</div>
          <div
            style={{
              ...value,
              color: data.avgR >= 0 ? "#4ade80" : "#f87171",
            }}
          >
            {data.avgR.toFixed(2)}R
          </div>
        </div>

        <div style={card}>
          <div style={title}>AI Coach Score</div>
          <div
            style={{
              ...value,
              color:
                data.avgCoachScore >= 7
                  ? "#4ade80"
                  : data.avgCoachScore >= 5
                  ? "#fbbf24"
                  : "#f87171",
            }}
          >
            {data.avgCoachScore.toFixed(1)}/10
          </div>
        </div>
      </div>

      <div
        style={{
          ...card,
          border: "1px solid rgba(109,75,255,0.35)",
          background:
            "linear-gradient(135deg, rgba(109,75,255,0.16), rgba(78,161,255,0.12))",
        }}
      >
        <div style={{ ...title, color: "#d5c7ff", fontSize: "13px", marginBottom: "10px" }}>
          🧠 AI Coach
        </div>

        <ul style={{ margin: 0, paddingLeft: "18px", lineHeight: 1.75 }}>
          {data.coach.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>

      {data.latestWeek && (
        <div
          style={{
            ...card,
            border: "1px solid rgba(34,197,94,0.22)",
            background:
              "linear-gradient(135deg, rgba(34,197,94,0.10), rgba(59,130,246,0.08))",
          }}
        >
          <div style={{ ...title, color: "#bbf7d0", fontSize: "13px", marginBottom: "10px" }}>
            📅 Weekly Coach Report
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
              marginBottom: "14px",
            }}
          >
            <div>
              <div style={title}>Week</div>
              <div style={value}>{data.latestWeek.key}</div>
            </div>

            <div>
              <div style={title}>Week Result</div>
              <div
                style={{
                  ...value,
                  color: data.latestWeek.profit >= 0 ? "#4ade80" : "#f87171",
                }}
              >
                ${data.latestWeek.profit.toFixed(2)}
              </div>
            </div>

            <div>
              <div style={title}>Week Win Rate</div>
              <div style={value}>{(data.latestWeek.winRate * 100).toFixed(0)}%</div>
            </div>

            <div>
              <div style={title}>Trades</div>
              <div style={value}>{data.latestWeek.trades}</div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                padding: "14px",
              }}
            >
              <div style={title}>Top Setup This Week</div>
              <div style={value}>{data.latestWeek.topWeekSetup}</div>
              <div style={{ marginTop: "6px", color: "#cbd5e1", fontSize: "13px" }}>
                ${Number(data.latestWeek.topWeekSetupPnl || 0).toFixed(2)}
              </div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                padding: "14px",
              }}
            >
              <div style={title}>Most Costly Mistake This Week</div>
              <div style={value}>{data.latestWeek.topWeekMistake}</div>
              <div style={{ marginTop: "6px", color: "#fca5a5", fontSize: "13px" }}>
                ${Number(data.latestWeek.topWeekMistakeLoss || 0).toFixed(2)} impact
              </div>
            </div>
          </div>

          <div>
            <div style={{ ...title, marginBottom: "8px" }}>3 Rules For Next Week</div>
            <ul style={{ margin: 0, paddingLeft: "18px", lineHeight: 1.75 }}>
              {data.latestWeek.rules.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "14px",
        }}
      >
        <div style={card}>
          <div style={{ ...title, marginBottom: "10px" }}>Best Edge</div>
          <div style={{ display: "grid", gap: "8px" }}>
            {data.edgeSummary.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  fontWeight: "700",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={{ ...title, marginBottom: "10px" }}>Psychology Flags</div>
          {data.psychologyFlags.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: "18px", lineHeight: 1.75 }}>
              {data.psychologyFlags.map((flag, i) => (
                <li key={i}>{flag}</li>
              ))}
            </ul>
          ) : (
            <div style={{ color: "#cbd5e1" }}>No major psychological patterns flagged yet.</div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "14px",
        }}
      >
        <div style={card}>
          <div style={title}>Best Setup</div>
          <div style={value}>{data.bestSetup}</div>
          <div style={{ marginTop: "6px", color: "#cbd5e1", fontSize: "13px" }}>
            {(data.bestSetupRate * 100).toFixed(0)}% win rate · ${data.bestSetupPnl.toFixed(2)}
          </div>
        </div>

        <div style={card}>
          <div style={title}>Best Hour</div>
          <div style={value}>{data.bestHour === "N/A" ? "N/A" : `${data.bestHour}:00`}</div>
          <div style={{ marginTop: "6px", color: "#cbd5e1", fontSize: "13px" }}>
            {(data.bestHourRate * 100).toFixed(0)}% win rate · ${data.bestHourPnl.toFixed(2)}
          </div>
        </div>

        <div style={card}>
          <div style={title}>Best Day</div>
          <div style={value}>{data.bestDay}</div>
          <div style={{ marginTop: "6px", color: "#cbd5e1", fontSize: "13px" }}>
            {(data.bestDayRate * 100).toFixed(0)}% win rate · ${data.bestDayPnl.toFixed(2)}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "14px",
        }}
      >
        <div style={card}>
          <div style={title}>Worst Mistake</div>
          <div style={value}>{data.worstMistake}</div>
          <div style={{ marginTop: "6px", color: "#fca5a5", fontSize: "13px" }}>
            {data.worstMistakeCount} times · ${data.worstMistakeLossImpact.toFixed(2)} loss impact
          </div>
        </div>

        <div style={card}>
          <div style={title}>Most Expensive Mistake</div>
          <div style={value}>{data.mostExpensiveMistake}</div>
          <div style={{ marginTop: "6px", color: "#fca5a5", fontSize: "13px" }}>
            ${data.highestLossImpact.toFixed(2)} total damage
          </div>
        </div>

        <div style={card}>
          <div style={title}>Avg Risk / Reward</div>
          <div style={value}>{data.avgRR.toFixed(2)}</div>
          <div style={{ marginTop: "6px", color: "#cbd5e1", fontSize: "13px" }}>
            Based on all logged trades
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "14px",
        }}
      >
        <div style={card}>
          <div style={title}>Long Trades</div>
          <div style={value}>{data.longTrades}</div>
          <div style={{ marginTop: "6px", color: data.longProfit >= 0 ? "#4ade80" : "#f87171", fontSize: "13px" }}>
            ${data.longProfit.toFixed(2)}
          </div>
        </div>

        <div style={card}>
          <div style={title}>Short Trades</div>
          <div style={value}>{data.shortTrades}</div>
          <div style={{ marginTop: "6px", color: data.shortProfit >= 0 ? "#4ade80" : "#f87171", fontSize: "13px" }}>
            ${data.shortProfit.toFixed(2)}
          </div>
        </div>

        <div style={card}>
          <div style={title}>Green Days</div>
          <div style={{ ...value, color: "#4ade80" }}>{data.greenDays}</div>
        </div>

        <div style={card}>
          <div style={title}>Red / BE Days</div>
          <div style={value}>
            {data.redDays} / {data.blueDays}
          </div>
        </div>
      </div>
    </div>
  );
}