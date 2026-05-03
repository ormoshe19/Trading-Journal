
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";

function Dashboard({ trades, startingBalance, setJournals, activeJournal }) {
  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const wins = trades.filter((t) => Number(t.profit || 0) > 0);
  const losses = trades.filter((t) => Number(t.profit || 0) < 0);
  const breakevens = trades.filter(
    (t) => t.direction === "BE" || Number(t.profit || 0) === 0
  );

  const totalProfit = trades.reduce((sum, t) => sum + Number(t.profit || 0), 0);
  const currentEquity = Number(startingBalance || 0) + totalProfit;

  const decidedTradesCount = wins.length + losses.length;
  const winRate = decidedTradesCount
    ? ((wins.length / decidedTradesCount) * 100).toFixed(1)
    : "0.0";

  const avgTrade = trades.length ? totalProfit / trades.length : 0;

  const avgWin = wins.length
    ? wins.reduce((sum, t) => sum + Number(t.profit || 0), 0) / wins.length
    : 0;

  const avgLoss = losses.length
    ? losses.reduce((sum, t) => sum + Number(t.profit || 0), 0) / losses.length
    : 0;

  const grossWins = wins.reduce((sum, t) => sum + Number(t.profit || 0), 0);
  const grossLosses = Math.abs(
    losses.reduce((sum, t) => sum + Number(t.profit || 0), 0)
  );

  const profitFactor = grossLosses
    ? (grossWins / grossLosses).toFixed(2)
    : wins.length > 0
    ? "∞"
    : "0.00";

  const totalFees = trades.reduce(
    (sum, t) => sum + Number(t.commission || 0),
    0
  );

  const totalR = trades.reduce((sum, t) => sum + Number(t.rMultiple || 0), 0);
  const avgR = trades.length ? totalR / trades.length : 0;

  const expectancy =
    decidedTradesCount > 0
      ? Number(winRate) / 100 * avgWin -
        (1 - Number(winRate) / 100) * Math.abs(avgLoss)
      : 0;

  const disciplineScore =
    trades.length > 0
      ? (trades.filter(
          (t) => t.checklist && Object.values(t.checklist).every(Boolean)
        ).length /
          trades.length) *
        100
      : 0;

  let peak = Number(startingBalance || 0);
  let running = Number(startingBalance || 0);
  let maxDd = 0;

  const equityData = useMemo(() => {
    let equity = Number(startingBalance || 0);

    return [...trades].reverse().map((trade, index) => {
      equity += Number(trade.profit || 0);
      return {
        trade: index + 1,
        equity,
      };
    });
  }, [trades, startingBalance]);

  [...trades].reverse().forEach((trade) => {
    running += Number(trade.profit || 0);
    if (running > peak) peak = running;
    const dd = peak - running;
    if (dd > maxDd) maxDd = dd;
  });

  const bestTrade = trades.length
    ? Math.max(...trades.map((t) => Number(t.profit || 0)))
    : 0;

  const worstTrade = trades.length
    ? Math.min(...trades.map((t) => Number(t.profit || 0)))
    : 0;

  const pieData = [
    { name: "Wins", value: wins.length, color: "#59e27c" },
    { name: "Losses", value: losses.length, color: "#ff6b6b" },
    { name: "BE", value: breakevens.length, color: "#64b5ff" },
  ];

  const setupPerformance = useMemo(() => {
    const map = {};

    trades.forEach((trade) => {
      const key = trade.setupTag?.trim() || "Unknown";
      if (!map[key]) {
        map[key] = {
          setup: key,
          pnl: 0,
          trades: 0,
          wins: 0,
          losses: 0,
        };
      }

      const profit = Number(trade.profit || 0);
      map[key].pnl += profit;
      map[key].trades += 1;
      if (profit > 0) map[key].wins += 1;
      if (profit < 0) map[key].losses += 1;
    });

    return Object.values(map)
      .map((item) => ({
        ...item,
        winRate:
          item.wins + item.losses > 0
            ? ((item.wins / (item.wins + item.losses)) * 100).toFixed(0)
            : "0",
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 6);
  }, [trades]);

  const card = {
    background:
      "linear-gradient(180deg, rgba(10,22,40,0.95), rgba(8,18,34,0.99))",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: "22px",
    padding: "18px",
    boxShadow: "0 14px 34px rgba(0,0,0,0.22)",
  };

  const heroCard = {
    ...card,
    padding: "24px",
    background:
      "radial-gradient(circle at top right, rgba(139,92,246,0.13), transparent 30%), radial-gradient(circle at top left, rgba(78,161,255,0.11), transparent 28%), linear-gradient(180deg, rgba(14,28,52,0.98), rgba(8,18,34,0.99))",
  };

  const inputStyle = {
    width: "100%",
    maxWidth: "260px",
    padding: "12px 14px",
    borderRadius: "14px",
    border: "1px solid rgba(113,133,172,0.24)",
    background: "#091323",
    color: "white",
    boxSizing: "border-box",
    outline: "none",
    fontSize: "14px",
    fontWeight: "700",
  };

  const label = {
    color: "#8ea0c4",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "8px",
    letterSpacing: "0.03em",
  };

  const MetricCard = ({ title, value, color = "white", sub = "" }) => (
    <div style={card}>
      <div style={label}>{title}</div>
      <div
        style={{
          fontSize: "26px",
          fontWeight: "950",
          lineHeight: 1.05,
          color,
          letterSpacing: "-0.03em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </div>

      {sub ? (
        <div
          style={{
            marginTop: "8px",
            color: "#8ea0c4",
            fontSize: "12px",
            lineHeight: 1.45,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );

  const positiveColor = "#59e27c";
  const negativeColor = "#ff6b6b";
  const neutralColor = "#64b5ff";

  return (
    <div>
      <div style={{ marginBottom: "22px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            borderRadius: "999px",
            background: "rgba(139,92,246,0.14)",
            border: "1px solid rgba(139,92,246,0.22)",
            color: "#e9ddff",
            fontSize: "13px",
            fontWeight: "800",
            marginBottom: "14px",
          }}
        >
          Smart performance overview
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "46px",
            fontWeight: "950",
            letterSpacing: "-0.04em",
          }}
        >
          Trading Dashboard
        </h1>
      </div>

      <div style={{ ...heroCard, marginBottom: "18px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 0.85fr",
            gap: "20px",
            alignItems: "center",
          }}
        >
          <div>
            <div style={label}>ACCOUNT OVERVIEW</div>

            <div
              style={{
                fontSize: "46px",
                fontWeight: "950",
                marginBottom: "10px",
                letterSpacing: "-0.04em",
              }}
            >
              ${formatMoney(currentEquity)}
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                borderRadius: "999px",
                background:
                  totalProfit >= 0
                    ? "rgba(89,226,124,0.13)"
                    : "rgba(255,107,107,0.13)",
                color: totalProfit >= 0 ? positiveColor : negativeColor,
                fontWeight: "900",
                fontSize: "13px",
                marginBottom: "18px",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {totalProfit >= 0 ? "+" : "-"}$
              {formatMoney(Math.abs(totalProfit))} net result
            </div>

            <div style={label}>STARTING ACCOUNT SIZE</div>

            <input
              style={inputStyle}
              placeholder="Starting Balance"
              value={startingBalance}
             onChange={(e) => {
  setJournals((prev) =>
    prev.map((j) =>
      j.id === activeJournal
        ? { ...j, startingBalance: Number(e.target.value || 0) }
        : j
    )
  );
}}
            />
          </div>

          <div
            style={{
              ...card,
              background:
                "linear-gradient(180deg, rgba(7,15,28,0.94), rgba(9,18,35,0.99))",
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: "950",
                marginBottom: "12px",
              }}
            >
              W / L / BE
            </div>

            <div style={{ width: "100%", height: "210px", position: "relative" }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={74}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="rgba(255,255,255,0.07)"
                    strokeWidth={1}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      background: "#0b1526",
                      border: "1px solid rgba(148,163,184,0.18)",
                      borderRadius: "12px",
                      color: "white",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: "950",
                      lineHeight: 1,
                    }}
                  >
                    {winRate}%
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#94a7cc",
                      marginTop: "5px",
                      fontWeight: "800",
                    }}
                  >
                    WIN RATE
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: "8px", marginTop: "8px" }}>
              {pieData.map((item) => (
                <div
                  key={item.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "13px",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "#d8e3f7",
                      fontWeight: "800",
                    }}
                  >
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "999px",
                        background: item.color,
                        display: "inline-block",
                      }}
                    />
                    {item.name}
                  </span>

                  <span style={{ fontWeight: "950" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "14px",
          marginBottom: "14px",
        }}
      >
        <MetricCard title="Starting Balance" value={`$${formatMoney(startingBalance)}`} />
        <MetricCard
          title="Current Equity"
          value={`$${formatMoney(currentEquity)}`}
          color={currentEquity >= Number(startingBalance || 0) ? positiveColor : negativeColor}
        />
        <MetricCard
          title="Total Profit"
          value={`${totalProfit >= 0 ? "+" : "-"}$${formatMoney(Math.abs(totalProfit))}`}
          color={totalProfit >= 0 ? positiveColor : negativeColor}
        />
        <MetricCard title="Win Rate" value={`${winRate}%`} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "14px",
          marginBottom: "14px",
        }}
      >
        <MetricCard
          title="Avg Trade"
          value={`${avgTrade >= 0 ? "+" : "-"}$${formatMoney(Math.abs(avgTrade))}`}
          color={avgTrade >= 0 ? positiveColor : negativeColor}
        />
        <MetricCard title="Profit Factor" value={profitFactor} />
        <MetricCard title="Avg R" value={`${avgR.toFixed(2)}R`} color={avgR >= 0 ? positiveColor : negativeColor} />
        <MetricCard
          title="Expectancy"
          value={`${expectancy >= 0 ? "+" : "-"}$${formatMoney(Math.abs(expectancy))}`}
          color={expectancy >= 0 ? positiveColor : negativeColor}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "14px",
          marginBottom: "18px",
        }}
      >
        <MetricCard title="Avg Win" value={`$${formatMoney(avgWin)}`} color={positiveColor} />
        <MetricCard title="Avg Loss" value={`-$${formatMoney(Math.abs(avgLoss))}`} color={negativeColor} />
        <MetricCard title="Max Drawdown" value={`$${formatMoney(maxDd)}`} color={negativeColor} />
        <MetricCard
          title="Discipline Score"
          value={`${disciplineScore.toFixed(0)}%`}
          color={
            disciplineScore >= 80
              ? positiveColor
              : disciplineScore >= 50
              ? "#ffd278"
              : negativeColor
          }
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.35fr 0.65fr",
          gap: "14px",
          marginBottom: "18px",
        }}
      >
        <div style={card}>
          <div
            style={{
              fontSize: "22px",
              fontWeight: "950",
              marginBottom: "14px",
              letterSpacing: "-0.02em",
            }}
          >
            Equity Curve
          </div>

          {equityData.length === 0 ? (
            <div style={{ color: "#8ea0c4" }}>
              תוסיף טריידים כדי לראות את הגרף.
            </div>
          ) : (
            <div style={{ width: "100%", height: "310px" }}>
              <ResponsiveContainer>
                <AreaChart
  data={equityData}
  margin={{ top: 20, right: 30, left: 70, bottom: 10 }}
>
                  <defs>
                    <linearGradient
                      id="equityFillDashboard"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.42} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#22314b" />
                  <XAxis dataKey="trade" stroke="#8ea0c4" />
                  <YAxis
  stroke="#8ea0c4"
  width={95}
  tickFormatter={(value) =>
    Number(value).toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })
  }
/>

                  <Tooltip
                    formatter={(value) => [`$${formatMoney(value)}`, "Equity"]}
                    contentStyle={{
                      background: "#0b1526",
                      border: "1px solid rgba(148,163,184,0.18)",
                      borderRadius: "12px",
                      color: "white",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="equity"
                    stroke="#8b5cf6"
                    fill="url(#equityFillDashboard)"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "#8b5cf6",
                      stroke: "white",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div style={card}>
          <div
            style={{
              fontSize: "18px",
              fontWeight: "950",
              marginBottom: "14px",
            }}
          >
            Risk Snapshot
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            <MetricCard title="Best Trade" value={`+$${formatMoney(bestTrade)}`} color={positiveColor} />
            <MetricCard title="Worst Trade" value={`-$${formatMoney(Math.abs(worstTrade))}`} color={negativeColor} />
            <MetricCard title="Total Fees" value={`$${formatMoney(totalFees)}`} />
            <MetricCard title="Total Trades" value={String(trades.length)} />
          </div>
        </div>
      </div>

      <div style={card}>
        <div
          style={{
            fontSize: "22px",
            fontWeight: "950",
            marginBottom: "14px",
            letterSpacing: "-0.02em",
          }}
        >
          Setup Performance
        </div>

        {setupPerformance.length === 0 ? (
          <div style={{ color: "#8ea0c4" }}>
            עדיין אין מספיק דאטה לניתוח סטאפים.
          </div>
        ) : (
          <div style={{ width: "100%", height: "280px" }}>
            <ResponsiveContainer>
              <BarChart
  data={setupPerformance}
  margin={{ top: 20, right: 30, left: 70, bottom: 10 }}
>
                <CartesianGrid strokeDasharray="3 3" stroke="#22314b" />
                <XAxis dataKey="setup" stroke="#8ea0c4" />
                <YAxis
  stroke="#8ea0c4"
  width={95}
  tickFormatter={(value) =>
    Number(value).toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })
  }
/>
                <Tooltip
                  formatter={(value) => [`$${formatMoney(value)}`, "PnL"]}
                  contentStyle={{
                    background: "#0b1526",
                    border: "1px solid rgba(148,163,184,0.18)",
                    borderRadius: "12px",
                    color: "white",
                  }}
                />
                <Bar dataKey="pnl" radius={[10, 10, 0, 0]} fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;