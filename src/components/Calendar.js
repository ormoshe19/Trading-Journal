import React, { useMemo, useState } from "react";

function Calendar({ trades }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();
  const monthKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, "0")}`;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const years = [];
  for (let y = 2024; y <= 2032; y += 1) years.push(y);

  const moneyText = {
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.03em",
    lineHeight: 1.08,
    wordBreak: "break-word",
  };

  const tradesByDate = useMemo(() => {
    const grouped = {};

    trades.forEach((trade) => {
      const key =
        trade.tradeDate || (trade.createdAt ? trade.createdAt.slice(0, 10) : "");
      if (!key) return;

      if (!grouped[key]) {
        grouped[key] = {
          date: key,
          pnl: 0,
          trades: 0,
          wins: 0,
          losses: 0,
          be: 0,
          list: [],
        };
      }

      const profit = Number(trade.profit || 0);
      grouped[key].pnl += profit;
      grouped[key].trades += 1;
      grouped[key].list.push(trade);

      if (profit > 0) grouped[key].wins += 1;
      else if (profit < 0) grouped[key].losses += 1;
      else grouped[key].be += 1;
    });

    return grouped;
  }, [trades]);

  const monthlyTrades = useMemo(() => {
    return Object.values(tradesByDate).filter((day) =>
      day.date.startsWith(monthKey)
    );
  }, [tradesByDate, monthKey]);

  const monthlyProfit = monthlyTrades.reduce((sum, day) => sum + day.pnl, 0);
  const monthlyDays = monthlyTrades.length;
  const monthlyTradeCount = monthlyTrades.reduce((sum, day) => sum + day.trades, 0);
  const monthlyWins = monthlyTrades.reduce((sum, day) => sum + day.wins, 0);
  const monthlyLosses = monthlyTrades.reduce((sum, day) => sum + day.losses, 0);
  const monthlyBE = monthlyTrades.reduce((sum, day) => sum + day.be, 0);
  const monthlyDecided = monthlyWins + monthlyLosses;
  const monthlyWinRate = monthlyDecided
    ? ((monthlyWins / monthlyDecided) * 100).toFixed(1)
    : "0.0";

  const bestDay = monthlyTrades.length
    ? monthlyTrades.reduce((best, day) => (day.pnl > best.pnl ? day : best), monthlyTrades[0])
    : null;

  const worstDay = monthlyTrades.length
    ? monthlyTrades.reduce((worst, day) => (day.pnl < worst.pnl ? day : worst), monthlyTrades[0])
    : null;

  const maxAbsPnL = Math.max(...monthlyTrades.map((day) => Math.abs(day.pnl)), 1);

  const sortedMonthlyDays = [...monthlyTrades].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  let currentGreenStreak = 0;
  let bestGreenStreak = 0;
  let currentRedStreak = 0;
  let bestRedStreak = 0;

  sortedMonthlyDays.forEach((day) => {
    if (day.pnl > 0) {
      currentGreenStreak += 1;
      currentRedStreak = 0;
      bestGreenStreak = Math.max(bestGreenStreak, currentGreenStreak);
    } else if (day.pnl < 0) {
      currentRedStreak += 1;
      currentGreenStreak = 0;
      bestRedStreak = Math.max(bestRedStreak, currentRedStreak);
    } else {
      currentGreenStreak = 0;
      currentRedStreak = 0;
    }
  });

  const calendarRows = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonthIndex, 1);
    const firstWeekday = firstDay.getDay();
    const startDate = new Date(currentYear, currentMonthIndex, 1 - firstWeekday);

    const allDays = [];

    for (let i = 0; i < 42; i += 1) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);

      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(d.getDate()).padStart(2, "0")}`;

      allDays.push({
        iso,
        dayNumber: d.getDate(),
        isCurrentMonth: d.getMonth() === currentMonthIndex,
        data: tradesByDate[iso] || null,
      });
    }

    const rows = [];

    for (let i = 0; i < allDays.length; i += 7) {
      const weekDays = allDays.slice(i, i + 7);

      const summary = weekDays.reduce(
        (acc, day) => {
          if (!day.isCurrentMonth || !day.data) return acc;

          acc.pnl += day.data.pnl;
          acc.days += 1;
          acc.trades += day.data.trades;
          acc.wins += day.data.wins;
          acc.losses += day.data.losses;
          acc.be += day.data.be;

          return acc;
        },
        { pnl: 0, days: 0, trades: 0, wins: 0, losses: 0, be: 0 }
      );

      rows.push({
        week: rows.length + 1,
        days: weekDays,
        summary,
      });
    }

    return rows;
  }, [currentYear, currentMonthIndex, tradesByDate]);

  const selectedDayData = selectedDate ? tradesByDate[selectedDate] || null : null;

  const goPrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDate(null);
    setIsModalOpen(false);
  };

  const goNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDate(null);
    setIsModalOpen(false);
  };

  const goThisMonth = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(null);
    setIsModalOpen(false);
  };

  const handleMonthChange = (e) => {
    setCurrentMonth(new Date(currentYear, Number(e.target.value), 1));
    setSelectedDate(null);
    setIsModalOpen(false);
  };

  const handleYearChange = (e) => {
    setCurrentMonth(new Date(Number(e.target.value), currentMonthIndex, 1));
    setSelectedDate(null);
    setIsModalOpen(false);
  };

  const getPnlColor = (pnl) => {
    if (pnl > 0) return "#35e07f";
    if (pnl < 0) return "#ff5f68";
    return "#7ab8ff";
  };

  const getHeatBackground = (pnl) => {
    const intensity = Math.min(Math.abs(pnl) / maxAbsPnL, 1);
    const alpha = 0.18 + intensity * 0.46;

    if (pnl > 0) {
      return `linear-gradient(180deg, rgba(34,197,94,${alpha}), rgba(9,26,20,0.98))`;
    }

    if (pnl < 0) {
      return `linear-gradient(180deg, rgba(239,68,68,${alpha}), rgba(32,12,15,0.98))`;
    }

    return "linear-gradient(180deg, rgba(59,130,246,0.18), rgba(10,22,40,0.98))";
  };

  const shellCard = {
    background:
      "radial-gradient(circle at top right, rgba(139,92,246,0.10), transparent 32%), linear-gradient(180deg, rgba(10,22,40,0.96), rgba(8,18,34,0.99))",
    border: "1px solid rgba(107,123,160,0.16)",
    borderRadius: "24px",
    padding: "18px",
    boxShadow: "0 16px 38px rgba(0,0,0,0.26)",
  };

  const topPill = (bg, color) => ({
    padding: "8px 12px",
    borderRadius: "999px",
    background: bg,
    color,
    fontSize: "13px",
    fontWeight: "850",
    border: "1px solid rgba(255,255,255,0.07)",
    whiteSpace: "nowrap",
  });

  const navButton = {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "white",
    cursor: "pointer",
    fontWeight: "850",
    fontSize: "17px",
  };

  const selectStyle = {
    padding: "9px 11px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.08)",
    fontWeight: "750",
    outline: "none",
  };

  const weekdayCell = {
    borderRadius: "14px",
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "10px",
    textAlign: "center",
    color: "#dfe7f7",
    fontSize: "13px",
    fontWeight: "850",
  };

  const miniStatCard = {
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "16px",
    padding: "12px",
  };

  const getDayCardStyle = (day) => {
    const base = {
      minHeight: "112px",
      borderRadius: "16px",
      padding: "10px",
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(9,18,35,0.78)",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      transition: "0.18s ease",
      cursor: day.data ? "pointer" : "default",
      overflow: "hidden",
    };

    if (!day.isCurrentMonth) {
      return {
        ...base,
        opacity: 0.24,
        background: "rgba(8,14,28,0.45)",
      };
    }

    if (!day.data) return base;

    return {
      ...base,
      background: getHeatBackground(day.data.pnl),
      border:
        day.data.pnl > 0
          ? "1px solid rgba(105,227,143,0.23)"
          : day.data.pnl < 0
          ? "1px solid rgba(255,107,107,0.22)"
          : "1px solid rgba(101,183,255,0.20)",
      outline:
        selectedDate === day.iso
          ? "2px solid rgba(255,255,255,0.18)"
          : "none",
    };
  };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
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
            fontWeight: "850",
            marginBottom: "14px",
          }}
        >
          Pro heatmap performance calendar
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "44px",
            fontWeight: "900",
            letterSpacing: "-0.04em",
          }}
        >
          Calendar
        </h1>
      </div>

      <div style={shellCard}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "16px",
            alignItems: "center",
            marginBottom: "18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <button style={navButton} onClick={goPrevMonth}>‹</button>

            <div style={{ fontSize: "28px", fontWeight: "900", minWidth: "190px" }}>
              {currentMonth.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </div>

            <button style={navButton} onClick={goNextMonth}>›</button>

            <button
              style={{
                ...topPill("rgba(255,255,255,0.05)", "white"),
                cursor: "pointer",
              }}
              onClick={goThisMonth}
            >
              This month
            </button>

            <select value={currentMonthIndex} onChange={handleMonthChange} style={selectStyle}>
              {monthNames.map((month, index) => (
                <option key={month} value={index} style={{ background: "#0b1526" }}>
                  {month}
                </option>
              ))}
            </select>

            <select value={currentYear} onChange={handleYearChange} style={selectStyle}>
              {years.map((year) => (
                <option key={year} value={year} style={{ background: "#0b1526" }}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <div
              style={topPill(
                monthlyProfit >= 0
                  ? "rgba(105,227,143,0.14)"
                  : "rgba(255,107,107,0.14)",
                monthlyProfit >= 0 ? "#69e38f" : "#ff6b6b"
              )}
            >
              {monthlyProfit >= 0 ? "+" : "-"}${formatMoney(Math.abs(monthlyProfit))}
            </div>

            <div style={topPill("rgba(101,183,255,0.14)", "#a9d6ff")}>
              {monthlyWinRate}% WR
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div style={miniStatCard}>
            <div style={{ color: "#8ea0c4", fontSize: "12px", fontWeight: "800" }}>Monthly PnL</div>
            <div style={{ ...moneyText, color: getPnlColor(monthlyProfit), fontSize: "20px", fontWeight: "900" }}>
              {monthlyProfit >= 0 ? "+" : "-"}${formatMoney(Math.abs(monthlyProfit))}
            </div>
          </div>

          <div style={miniStatCard}>
            <div style={{ color: "#8ea0c4", fontSize: "12px", fontWeight: "800" }}>Trade Days</div>
            <div style={{ fontSize: "20px", fontWeight: "900" }}>{monthlyDays}</div>
          </div>

          <div style={miniStatCard}>
            <div style={{ color: "#8ea0c4", fontSize: "12px", fontWeight: "800" }}>Trades</div>
            <div style={{ fontSize: "20px", fontWeight: "900" }}>{monthlyTradeCount}</div>
          </div>

          <div style={miniStatCard}>
            <div style={{ color: "#8ea0c4", fontSize: "12px", fontWeight: "800" }}>Best / Worst</div>
            <div style={{ fontSize: "14px", fontWeight: "850", lineHeight: 1.5 }}>
              <span style={{ color: "#69e38f" }}>
                +${formatMoney(Math.max(bestDay?.pnl || 0, 0))}
              </span>{" "}
              /{" "}
              <span style={{ color: "#ff6b6b" }}>
                -${formatMoney(Math.abs(Math.min(worstDay?.pnl || 0, 0)))}
              </span>
            </div>
          </div>

          <div style={miniStatCard}>
            <div style={{ color: "#8ea0c4", fontSize: "12px", fontWeight: "800" }}>Streaks</div>
            <div style={{ fontSize: "14px", fontWeight: "850", lineHeight: 1.5 }}>
              🟢 {bestGreenStreak} / 🔴 {bestRedStreak}
            </div>
          </div>
        </div>

        <div
          style={{
            height: "44px",
            display: "flex",
            alignItems: "flex-end",
            gap: "3px",
            marginBottom: "18px",
            padding: "10px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {sortedMonthlyDays.length === 0 ? (
            <div style={{ color: "#8ea0c4", fontSize: "12px", fontWeight: "750" }}>
              Add trades to generate monthly performance bars.
            </div>
          ) : (
            sortedMonthlyDays.map((day) => {
              const height = Math.max(6, (Math.abs(day.pnl) / maxAbsPnL) * 34);

              return (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.pnl >= 0 ? "+" : "-"}$${formatMoney(Math.abs(day.pnl))}`}
                  style={{
                    width: "6px",
                    height: `${height}px`,
                    borderRadius: "999px",
                    background: getPnlColor(day.pnl),
                    opacity: 0.9,
                  }}
                />
              );
            })
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Week"].map((day) => (
            <div key={day} style={weekdayCell}>
              {day}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gap: "8px" }}>
          {calendarRows.map((row) => (
            <div
              key={row.week}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
                gap: "8px",
              }}
            >
              {row.days.map((day) => {
                const pnl = day.data?.pnl ?? 0;
                const tradesCount = day.data?.trades ?? 0;
                const wins = day.data?.wins ?? 0;
                const losses = day.data?.losses ?? 0;
                const decided = wins + losses;
                const winRate = decided ? ((wins / decided) * 100).toFixed(0) : "0";

                return (
                  <div
                    key={day.iso}
                    style={getDayCardStyle(day)}
                    onMouseEnter={(e) => {
                      if (day.data) e.currentTarget.style.transform = "translateY(-3px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                    onClick={() => {
                      if (day.data) {
                        setSelectedDate(day.iso);
                        setIsModalOpen(true);
                      }
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div
                        style={{
                          fontSize: "17px",
                          fontWeight: "850",
                          color: day.isCurrentMonth ? "white" : "#95a3bd",
                        }}
                      >
                        {day.dayNumber}
                      </div>

                      {day.data ? (
                        <div
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "999px",
                            background: getPnlColor(pnl),
                            marginTop: "6px",
                          }}
                        />
                      ) : null}
                    </div>

                    {day.isCurrentMonth && day.data ? (
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            ...moneyText,
                            fontSize: "clamp(12px, 0.9vw, 15px)",
                            fontWeight: "900",
                            color: getPnlColor(pnl),
                          }}
                        >
                          {pnl > 0 ? "+" : "-"}${formatMoney(Math.abs(pnl))}
                        </div>

                        <div style={{ color: "#eef4ff", fontSize: "11px", fontWeight: "750" }}>
                          {tradesCount} {tradesCount === 1 ? "trade" : "trades"}
                        </div>

                        <div style={{ color: "#d5deef", fontSize: "11px", fontWeight: "650" }}>
                          {winRate}% WR
                        </div>
                      </div>
                    ) : (
                      <div />
                    )}
                  </div>
                );
              })}

              <div
                style={{
                  minHeight: "112px",
                  borderRadius: "16px",
                  padding: "10px",
                  background: getHeatBackground(row.summary.pnl),
                  border:
                    row.summary.pnl > 0
                      ? "1px solid rgba(105,227,143,0.23)"
                      : row.summary.pnl < 0
                      ? "1px solid rgba(255,107,107,0.22)"
                      : "1px solid rgba(101,183,255,0.20)",
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  overflow: "hidden",
                }}
              >
                <div style={{ color: "#d8e3f7", fontSize: "12px", fontWeight: "850" }}>
                  Week {row.week}
                </div>

                <div
                  style={{
                    ...moneyText,
                    color: getPnlColor(row.summary.pnl),
                    fontSize: "clamp(12px, 0.9vw, 15px)",
                    fontWeight: "900",
                  }}
                >
                  {row.summary.pnl > 0 ? "+" : "-"}${formatMoney(Math.abs(row.summary.pnl))}
                </div>

                <div style={{ color: "#d3deee", fontSize: "11px", lineHeight: 1.45 }}>
                  {row.summary.days} days
                  <br />
                  {row.summary.trades} trades
                  <br />
                  W {row.summary.wins} / L {row.summary.losses} / BE {row.summary.be}
                </div>
              </div>
            </div>
          ))}
        </div>

        {isModalOpen && selectedDayData && (
          <div
            onClick={() => setIsModalOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.62)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 999,
              padding: "20px",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "90%",
                maxWidth: "760px",
                maxHeight: "82vh",
                overflowY: "auto",
                background:
                  "radial-gradient(circle at top right, rgba(139,92,246,0.12), transparent 32%), linear-gradient(180deg, #0b1526, #081222)",
                borderRadius: "24px",
                padding: "20px",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <div style={{ fontSize: "23px", fontWeight: "900" }}>
                    {selectedDayData.date}
                  </div>
                  <div style={{ color: "#8ea0c4", fontSize: "13px", marginTop: "4px" }}>
                    {selectedDayData.trades} trades · W {selectedDayData.wins} / L{" "}
                    {selectedDayData.losses} / BE {selectedDayData.be}
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    padding: "7px 12px",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "850",
                  }}
                >
                  ✕
                </button>
              </div>

              <div
                style={{
                  ...moneyText,
                  fontSize: "26px",
                  fontWeight: "900",
                  color: getPnlColor(selectedDayData.pnl),
                  marginBottom: "16px",
                }}
              >
                {selectedDayData.pnl > 0 ? "+" : "-"}$
                {formatMoney(Math.abs(selectedDayData.pnl))}
              </div>

              <div style={{ display: "grid", gap: "12px" }}>
                {selectedDayData.list.map((trade) => {
                  const profit = Number(trade.profit || 0);

                  return (
                    <div
                      key={trade.id}
                      style={{
                        background: "rgba(11,21,38,0.82)",
                        border: "1px solid rgba(148,163,184,0.10)",
                        borderRadius: "16px",
                        padding: "14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "10px",
                          flexWrap: "wrap",
                          marginBottom: "8px",
                        }}
                      >
                        <div style={{ fontWeight: "850" }}>
                          {trade.asset} · {trade.direction}
                        </div>

                        <div style={{ ...moneyText, color: getPnlColor(profit), fontWeight: "900" }}>
                          {profit > 0 ? "+" : "-"}${formatMoney(Math.abs(profit))}
                        </div>
                      </div>

                      <div style={{ fontSize: "13px", color: "#d8e3f7", lineHeight: 1.7 }}>
                        Entry: <b>{trade.entryPrice}</b> | Stop: <b>{trade.stopPrice}</b> | Exit:{" "}
                        <b>{trade.exitPrice}</b>
                        <br />
                        Time: {trade.entryTime || "-"} → {trade.exitTime || "-"}
                        {trade.setupTag ? (
                          <>
                            <br />
                            Setup: <b>{trade.setupTag}</b>
                          </>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Calendar;