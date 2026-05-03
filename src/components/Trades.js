import React, { useMemo, useState } from "react";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const defaultChecklist = {
  bias: false,
  liquidity: false,
  confirmation: false,
  risk: false,
};

function Trades({
  trades,
  setTrades,
  startingBalance = 50000,
  analyticsMode = false,
  activeJournal = "main",
}) {
  const [asset, setAsset] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [direction, setDirection] = useState("Long");
  const [tradeDate, setTradeDate] = useState("");
  const [entryTime, setEntryTime] = useState("");
  const [exitTime, setExitTime] = useState("");
  const [notes, setNotes] = useState("");
  const [commission, setCommission] = useState("");
  const [positionSize, setPositionSize] = useState("");
  const [setupTag, setSetupTag] = useState("");
  const [imageData, setImageData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [expandedTradeId, setExpandedTradeId] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [mistakes, setMistakes] = useState([]);
  const [checklist, setChecklist] = useState(defaultChecklist);
  const [isDragging, setIsDragging] = useState(false);
  const [fullImage, setFullImage] = useState(null);
const [imageFiles, setImageFiles] = useState([]);

const uploadImage = async () => {
  if (!imageData || imageData.length === 0) return [];

  const urls = [];

  for (const item of imageData) {
    const response = await fetch(item);
    const blob = await response.blob();

    const storageRef = ref(storage, "trades/" + Date.now() + "-" + Math.random());
    await uploadBytes(storageRef, blob);

    const url = await getDownloadURL(storageRef);
    urls.push(url);
  }

  return urls;
};

  const card = {
    background: "linear-gradient(180deg, rgba(10,22,40,0.96), rgba(8,18,34,0.98))",
    border: "1px solid rgba(107,123,160,0.16)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
  };

  const softCard = {
    background: "rgba(11,21,38,0.72)",
    border: "1px solid rgba(148,163,184,0.1)",
    borderRadius: "14px",
    padding: "14px",
  };

  const inputStyle = {
    width: "100%",
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

  const labelStyle = {
    color: "#8ea0c4",
    fontSize: "12px",
    marginBottom: "6px",
    fontWeight: "700",
  };

  const TinyButton = (bg, color = "white") => ({
    background: bg,
    color,
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "10px 14px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "14px",
  });

  const filterButton = (active) => ({
    border: active
      ? "1px solid rgba(139,92,246,0.35)"
      : "1px solid rgba(148,163,184,0.16)",
    background: active
      ? "linear-gradient(135deg, rgba(139,92,246,0.28), rgba(78,161,255,0.22))"
      : "rgba(11,21,38,0.7)",
    color: "white",
    padding: "10px 14px",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: "800",
  });

  const formatMoney = (num) =>
    Number(num || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const mistakesList = [
    "Early Entry",
    "FOMO Entry",
    "Early Exit",
    "No Confirmation",
    "Moved Stop Loss",
    "Overtrade",
    "Revenge Trade",
    "Bad Risk Management",
    "No confluence",
    "Bad entry timing",
  ];

  const checklistItems = [
    { key: "bias", label: "Market Bias Confirmed" },
    { key: "liquidity", label: "Liquidity Taken" },
    { key: "confirmation", label: "Entry Confirmation" },
    { key: "risk", label: "Risk Defined" },
  ];

  const getPointValue = (rawAsset) => {
    const a = String(rawAsset || "").toUpperCase();
    if (a.includes("MNQ")) return 2;
    if (a.includes("NQ")) return 20;
    if (a.includes("MES")) return 5;
    if (a.includes("ES")) return 50;
    if (a.includes("MYM")) return 0.5;
    if (a.includes("YM")) return 5;
    if (a.includes("M2K")) return 5;
    if (a.includes("RTY")) return 50;
    return 1;
  };

  const resetForm = () => {
    setAsset("");
    setEntryPrice("");
    setExitPrice("");
    setStopPrice("");
    setDirection("Long");
    setTradeDate("");
    setEntryTime("");
    setExitTime("");
    setNotes("");
    setCommission("");
    setPositionSize("");
    setSetupTag("");
    setImageData([]);
    setMistakes([]);
    setChecklist(defaultChecklist);
    setEditingId(null);
  };

  const toggleMistake = (m) => {
    setMistakes((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const parseNumber = (value) => Number(value || 0);

  const getDecidedWinRate = (group) => {
    const wins = group.filter((t) => Number(t.profit || 0) > 0).length;
    const losses = group.filter((t) => Number(t.profit || 0) < 0).length;
    const decided = wins + losses;
    return decided ? (wins / decided) * 100 : 0;
  };

  const getTradeStatsBySetup = (allTrades, tag) => {
    if (!tag) return null;
    const group = allTrades.filter(
      (t) =>
        t.setupTag &&
        String(t.setupTag).trim().toLowerCase() === String(tag).trim().toLowerCase()
    );
    if (!group.length) return null;

    return {
      trades: group.length,
      totalProfit: group.reduce((s, t) => s + Number(t.profit || 0), 0),
      winRate: getDecidedWinRate(group),
      avgR: group.reduce((s, t) => s + Number(t.rMultiple || 0), 0) / group.length,
    };
  };

  const getTradeStatsByHour = (allTrades, time) => {
    if (!time) return null;
    const hour = String(time).slice(0, 2);
    const group = allTrades.filter((t) => String(t.entryTime || "").slice(0, 2) === hour);
    if (!group.length) return null;

    return {
      trades: group.length,
      totalProfit: group.reduce((s, t) => s + Number(t.profit || 0), 0),
      winRate: getDecidedWinRate(group),
      avgR: group.reduce((s, t) => s + Number(t.rMultiple || 0), 0) / group.length,
      hour,
    };
  };

  const getDirectionStats = (allTrades, dir) => {
    const group = allTrades.filter((t) => t.direction === dir);
    if (!group.length) return null;

    return {
      trades: group.length,
      totalProfit: group.reduce((s, t) => s + Number(t.profit || 0), 0),
      winRate: getDecidedWinRate(group),
      avgR: group.reduce((s, t) => s + Number(t.rMultiple || 0), 0) / group.length,
    };
  };

  const getChecklistScore = (trade) => {
    if (!trade.checklist) return 0;
    return Object.values(trade.checklist).filter(Boolean).length;
  };

  const getDisciplineScoreForTrade = (trade) => {
    let score = 10;
    const mistakeCount = trade.mistakes?.length || 0;
    const checklistCompleted = getChecklistScore(trade);

    score -= mistakeCount;
    if (checklistCompleted < 4) score -= 2;
    if (trade.mistakes?.includes("FOMO Entry")) score -= 1;
    if (trade.mistakes?.includes("Revenge Trade")) score -= 2;
    if (trade.mistakes?.includes("Moved Stop Loss")) score -= 2;
    if (trade.mistakes?.includes("Bad Risk Management")) score -= 2;

    return Math.max(1, Math.min(10, score));
  };

  const generateAdvancedAIInsights = (trade, allTrades) => {
    const insights = [];

    const profit = Number(trade.profit || 0);
    const rr = Number(trade.riskReward || 0);
    const rMultiple = Number(trade.rMultiple || 0);
    const setupStats = getTradeStatsBySetup(allTrades, trade.setupTag);
    const hourStats = getTradeStatsByHour(allTrades, trade.entryTime);
    const directionStats = getDirectionStats(allTrades, trade.direction);
    const pointValue = getPointValue(trade.asset);
    const mistakesCount = trade.mistakes?.length || 0;
    const checklistCompleted = getChecklistScore(trade);

    const avgProfit =
      allTrades.reduce((s, t) => s + Number(t.profit || 0), 0) /
      Math.max(allTrades.length, 1);

    const avgR =
      allTrades.reduce((s, t) => s + Number(t.rMultiple || 0), 0) /
      Math.max(allTrades.length, 1);

    if (profit > 0) {
      insights.push(
        profit > avgProfit
          ? "This trade outperformed your average result. Execution was strong relative to your baseline."
          : "This trade closed green, but it was not meaningfully above your normal performance. Review if more was available."
      );
    } else if (profit < 0) {
      insights.push(
        profit < avgProfit
          ? "This trade underperformed your average result. Review entry quality, confirmation, and risk control."
          : "This was a losing trade, but it was not unusually bad compared to your baseline. Focus on process, not emotion."
      );
    } else {
      insights.push("Break-even result. Capital was protected, but review whether the trade was managed too tightly.");
    }

    if (rr >= 2) {
      insights.push("Reward profile was strong. This type of asymmetry is worth prioritizing when execution is clean.");
    } else if (rr >= 1) {
      insights.push("Reward profile was acceptable, but improving target planning could increase expectancy.");
    } else if (rr > 0) {
      insights.push("Reward profile was weak. The upside did not justify much room for error.");
    }

    if (rMultiple > avgR) {
      insights.push("You extracted more value than your typical trade. Management was above your current average.");
    } else if (rMultiple < avgR) {
      insights.push("You captured less value than your usual trade. Review whether the entry, exit, or patience was the weak point.");
    }

    if (rMultiple >= 2) {
      insights.push("Capturing 2R+ suggests strong trade management and patience.");
    } else if (rMultiple >= 1) {
      insights.push("Capturing at least 1R is solid, but check whether the trade had room for a larger move.");
    } else if (rMultiple < 0) {
      insights.push("Negative R outcome. This usually points to timing, invalidation, or discipline breakdown.");
    }

    if (checklistCompleted < 4) {
      insights.push(
        `Checklist discipline issue: only ${checklistCompleted}/4 pre-trade conditions were completed. This lowers setup quality.`
      );
    } else {
      insights.push("Full checklist completed. This trade followed your pre-trade process.");
    }

    if (mistakesCount >= 2) {
      insights.push(`Multiple mistakes were tagged (${mistakesCount}). The result should be judged mainly as an execution issue.`);
    } else if (mistakesCount === 1) {
      insights.push(`Primary mistake: ${trade.mistakes[0]}. Reducing this one leak could improve consistency quickly.`);
    } else {
      insights.push("No mistake tags were logged. Process quality appears cleaner on this trade.");
    }

    if (trade.mistakes?.includes("FOMO Entry")) {
      insights.push("FOMO detected. This usually means the entry came after the move already started instead of before confirmation.");
    }

    if (trade.mistakes?.includes("Early Entry")) {
      insights.push("Early entry detected. Wait for the setup to confirm instead of anticipating too aggressively.");
    }

    if (trade.mistakes?.includes("Early Exit")) {
      insights.push("Early exit detected. Compare your exit against the original target and structure.");
    }

    if (trade.mistakes?.includes("Moved Stop Loss")) {
      insights.push("Stop movement detected. This is a high-risk behavior because it breaks predefined invalidation.");
    }

    if (trade.mistakes?.includes("Overtrade")) {
      insights.push("Overtrade detected. Trade quality often drops when frequency rises without strict selectivity.");
    }

    if (setupStats && setupStats.trades >= 2) {
      insights.push(
        setupStats.totalProfit > 0
          ? `Setup context: "${trade.setupTag}" is currently positive in this journal: $${formatMoney(setupStats.totalProfit)} over ${setupStats.trades} trades, ${setupStats.winRate.toFixed(1)}% win rate.`
          : `Setup context: "${trade.setupTag}" is currently underperforming over ${setupStats.trades} trades. Reduce size until execution improves.`
      );
    }

    if (hourStats && hourStats.trades >= 2) {
      insights.push(
        hourStats.totalProfit > 0
          ? `Time context: your ${hourStats.hour}:00 window is currently profitable. This may be a valid time-based edge.`
          : `Time context: trades around ${hourStats.hour}:00 are currently weak in your data. Consider avoiding this window until proven otherwise.`
      );
    }

    if (directionStats && directionStats.trades >= 2) {
      insights.push(
        `${trade.direction} context: $${formatMoney(directionStats.totalProfit)} across ${directionStats.trades} trades, ${directionStats.winRate.toFixed(1)}% win rate.`
      );
    }

    if (trade.asset) {
      insights.push(`Instrument context: ${trade.asset} uses point value ${pointValue}. Small execution errors can have large PnL impact.`);
    }

    if (trade.notes?.trim()) {
      insights.push("Good journaling behavior: written notes were added, which improves review quality.");
    }

    insights.push(`Discipline Score: ${getDisciplineScoreForTrade(trade)}/10`);

    return insights;
  };

  const analyzeTradeLocally = (tradeId) => {
    setTrades((prev) =>
      prev.map((trade) =>
        trade.id === tradeId
          ? {
              ...trade,
              aiInsights: generateAdvancedAIInsights(trade, prev),
              aiCoachScore: getDisciplineScoreForTrade(trade),
            }
          : trade
      )
    );
  };

const handleFileChange = (files) => {
  const fileArray = Array.from(files || []);

  setImageFiles((prev) => [...prev, ...fileArray]);

  fileArray.forEach((file) => {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageData((prev) => [...prev, reader.result]);
    };
    reader.readAsDataURL(file);
  });
};

const handleDrop = (e) => {
  e.preventDefault();
  setIsDragging(false);
  handleFileChange(e.dataTransfer.files);
};

const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

const removeImage = (indexToRemove) => {
  setImageData((prev) => prev.filter((_, index) => index !== indexToRemove));
};

const handlePaste = (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  for (let item of items) {
    if (item.type.includes("image")) {
      const file = item.getAsFile();
      handleFileChange([file]);
    }
  }
};

  const handleSave = async () => {
    // optional warning only (no blocking)
if (!Object.values(checklist).every(Boolean)) {
  console.warn("Checklist not fully completed");
}

    const entry = parseNumber(entryPrice);
    const exit = parseNumber(exitPrice);
    const stop = parseNumber(stopPrice);
    const fees = parseNumber(commission);
    const size = parseNumber(positionSize || 1);
    const pointValue = getPointValue(asset);

    if (!asset.trim() || !entry || (!exit && direction !== "BE")) return;

    const rawMove =
      direction === "Long"
        ? exit - entry
        : direction === "Short"
        ? entry - exit
        : 0;

    const riskPerUnit =
      direction === "Long"
        ? entry - stop
        : direction === "Short"
        ? stop - entry
        : 0;

    const grossProfit = rawMove * size * pointValue;
    const riskAmount = riskPerUnit * size * pointValue;
    const netProfit = direction === "BE" ? 0 - fees : grossProfit - fees;
    const rMultiple = riskAmount > 0 ? netProfit / riskAmount : 0;
    const calculatedRR =
      riskAmount > 0 ? Math.abs(grossProfit) / Math.max(riskAmount, 1e-9) : 0;
    const pnlPercent =
      Number(startingBalance || 0) > 0
        ? (netProfit / Number(startingBalance || 0)) * 100
        : 0;

    const previousAI = editingId
      ? trades.find((t) => t.id === editingId)?.aiInsights || []
      : [];

const imageUrls = await uploadImage();
    const tradeData = {
      id: editingId || Date.now(),
      journalId: activeJournal,
      asset: asset.trim(),
      entryPrice: entry,
      exitPrice: exit,
      stopPrice: stop,
      direction,
      tradeDate,
      entryTime,
      exitTime,
      notes: notes.trim(),
      images: imageUrls,
      mistakes,
      checklist,
      commission: fees,
      aiInsights: previousAI,
      positionSize: size,
      setupTag: setupTag.trim(),
      grossProfit,
      riskAmount,
      rMultiple,
      riskReward: calculatedRR,
      profit: netProfit,
      pnlPercent: direction === "BE" ? 0 : pnlPercent,
      createdAt: new Date().toISOString(),
    };

    const finalizedTrade = {
      ...tradeData,
      aiInsights: generateAdvancedAIInsights(tradeData, [
        tradeData,
        ...trades.filter((t) => t.id !== tradeData.id),
      ]),
      aiCoachScore: getDisciplineScoreForTrade(tradeData),
    };

if (editingId) {
  setTrades((prev) => {
    const updated = prev.map((trade) =>
      trade.id === editingId ? finalizedTrade : trade
    );
    localStorage.setItem("trades", JSON.stringify(updated));
    return updated;
  });
} else {
  setTrades((prev) => {
    const updated = [finalizedTrade, ...prev];
    localStorage.setItem("trades", JSON.stringify(updated));
    return updated;
  });
}

    resetForm();
  };

  const editTrade = (trade) => {
    setAsset(trade.asset || "");
    setEntryPrice(String(trade.entryPrice ?? ""));
    setExitPrice(String(trade.exitPrice ?? ""));
    setStopPrice(String(trade.stopPrice ?? ""));
    setDirection(trade.direction || "Long");
    setTradeDate(trade.tradeDate || "");
    setEntryTime(trade.entryTime || "");
    setExitTime(trade.exitTime || "");
    setNotes(trade.notes || "");
    setImageData(
  Array.isArray(trade.imageData)
    ? trade.imageData
    : trade.imageData
    ? [trade.imageData]
    : []
);

setCommission(String(trade.commission ?? ""));
    setPositionSize(String(trade.positionSize ?? ""));
    setSetupTag(trade.setupTag || "");
    setMistakes(trade.mistakes || []);
    setChecklist(trade.checklist || defaultChecklist);
    setEditingId(trade.id);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteTrade = (tradeId) => {
    setTrades((prev) => prev.filter((trade) => trade.id !== tradeId));
    if (expandedTradeId === tradeId) setExpandedTradeId(null);
  };

  const toggleExpandedTrade = (tradeId) => {
    setExpandedTradeId((prev) => (prev === tradeId ? null : tradeId));
  };

  const exportCSV = () => {
    const headers = [
      "Date",
      "Asset",
      "Direction",
      "Entry",
      "Exit",
      "Stop",
      "Profit",
      "RMultiple",
      "RiskReward",
      "PositionSize",
      "Commission",
      "Setup",
      "Checklist Completed",
      "Mistakes",
    ];

    const rows = trades.map((t) => [
      t.tradeDate || "",
      t.asset || "",
      t.direction || "",
      t.entryPrice ?? "",
      t.exitPrice ?? "",
      t.stopPrice ?? "",
      t.profit ?? "",
      t.rMultiple ?? "",
      t.riskReward ?? "",
      t.positionSize ?? "",
      t.commission ?? "",
      t.setupTag || "",
      `${getChecklistScore(t)}/4`,
      (t.mistakes || []).join(" | "),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((item) => `"${String(item).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trades.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredTrades = useMemo(() => {
    if (filter === "ALL") return trades;
    if (filter === "LONG") return trades.filter((t) => t.direction === "Long");
    if (filter === "SHORT") return trades.filter((t) => t.direction === "Short");
    if (filter === "BE") return trades.filter((t) => t.direction === "BE");
    if (filter === "WIN") return trades.filter((t) => Number(t.profit || 0) > 0);
    if (filter === "LOSS") return trades.filter((t) => Number(t.profit || 0) < 0);
    return trades;
  }, [trades, filter]);

  const disciplineScore =
    filteredTrades.length > 0
      ? (filteredTrades.filter(
          (t) => t.checklist && Object.values(t.checklist).every(Boolean)
        ).length /
          filteredTrades.length) *
        100
      : 0;

  const summary = useMemo(() => {
    const totalProfit = filteredTrades.reduce((s, t) => s + Number(t.profit || 0), 0);
    const wins = filteredTrades.filter((t) => Number(t.profit || 0) > 0).length;
    const losses = filteredTrades.filter((t) => Number(t.profit || 0) < 0).length;
    const be = filteredTrades.filter(
      (t) => t.direction === "BE" || Number(t.profit || 0) === 0
    ).length;
    const decidedTradesCount = wins + losses;

    return {
      totalProfit,
      wins,
      losses,
      be,
      winRate: decidedTradesCount
        ? ((wins / decidedTradesCount) * 100).toFixed(1)
        : "0.0",
    };
  }, [filteredTrades]);

  return (
  <div onPaste={handlePaste}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ color: "#8ea0c4", fontSize: "14px", marginBottom: "6px" }}>
          Execution tracking and AI-assisted review
        </div>
        <h1 style={{ margin: 0, fontSize: "40px" }}>
          {analyticsMode ? "Analytics" : "Trades"}
        </h1>
      </div>

      {!analyticsMode && (
        <div style={{ ...card, marginBottom: "16px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "14px",
              marginBottom: "14px",
            }}
          >
            <div>
              <div style={labelStyle}>Asset</div>
              <input style={inputStyle} value={asset} onChange={(e) => setAsset(e.target.value)} placeholder="MNQ / NQ / MES / ES" />
            </div>

            <div>
              <div style={labelStyle}>Direction</div>
              <select style={inputStyle} value={direction} onChange={(e) => setDirection(e.target.value)}>
                <option value="Long">Long</option>
                <option value="Short">Short</option>
                <option value="BE">BE</option>
              </select>
            </div>

            <div>
              <div style={labelStyle}>Setup / Strategy Tag</div>
              <input style={inputStyle} value={setupTag} onChange={(e) => setSetupTag(e.target.value)} placeholder="5M IFVG / Sweep / Reclaim" />
            </div>

            <div>
              <div style={labelStyle}>Entry Price</div>
              <input style={inputStyle} value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} placeholder="Entry" />
            </div>

            <div>
              <div style={labelStyle}>Exit Price</div>
              <input style={inputStyle} value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} placeholder="Exit" />
            </div>

            <div>
              <div style={labelStyle}>Stop Price</div>
              <input style={inputStyle} value={stopPrice} onChange={(e) => setStopPrice(e.target.value)} placeholder="Stop" />
            </div>

            <div>
              <div style={labelStyle}>Date</div>
              <input type="date" style={inputStyle} value={tradeDate} onChange={(e) => setTradeDate(e.target.value)} />
            </div>

            <div>
              <div style={labelStyle}>Entry Time</div>
              <input type="time" style={inputStyle} value={entryTime} onChange={(e) => setEntryTime(e.target.value)} />
            </div>

            <div>
              <div style={labelStyle}>Exit Time</div>
              <input type="time" style={inputStyle} value={exitTime} onChange={(e) => setExitTime(e.target.value)} />
            </div>

            <div>
              <div style={labelStyle}>Commission / Fees</div>
              <input style={inputStyle} value={commission} onChange={(e) => setCommission(e.target.value)} placeholder="Fees" />
            </div>

            <div>
              <div style={labelStyle}>Position Size</div>
              <input style={inputStyle} value={positionSize} onChange={(e) => setPositionSize(e.target.value)} placeholder="Contracts / Size" />
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
  <div style={labelStyle}>Notes</div>

  <textarea
    style={{
      ...inputStyle,
      minHeight: "100px",
      resize: "vertical",
      marginBottom: "12px",
    }}
    placeholder="Notes"
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
  />
</div>

          <div
            style={{
              ...card,
              marginBottom: "16px",
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            {mistakesList.map((m) => (
              <div
                key={m}
                onClick={() => toggleMistake(m)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "999px",
                  cursor: "pointer",
                  background: mistakes.includes(m) ? "rgba(255,91,91,0.2)" : "#0b1526",
                  border: "1px solid rgba(148,163,184,0.2)",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                {m}
              </div>
            ))}
          </div>

          <div style={{ ...card, marginBottom: "16px" }}>
            <div style={{ ...labelStyle, marginBottom: "12px" }}>Pre-Trade Checklist</div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "10px",
              }}
            >
              {checklistItems.map((item) => (
                <div
                  key={item.key}
                  onClick={() =>
                    setChecklist((prev) => ({
                      ...prev,
                      [item.key]: !prev[item.key],
                    }))
                  }
                  style={{
                    padding: "12px 14px",
                    borderRadius: "14px",
                    cursor: "pointer",
                    background: checklist[item.key]
                      ? "rgba(89,226,124,0.18)"
                      : "rgba(11,21,38,0.72)",
                    border: checklist[item.key]
                      ? "1px solid rgba(89,226,124,0.35)"
                      : "1px solid rgba(148,163,184,0.16)",
                    color: checklist[item.key] ? "#b6ffca" : "#d8e3f7",
                    fontSize: "14px",
                    fontWeight: "800",
                  }}
                >
                  {checklist[item.key] ? "✓ " : ""}{item.label}
                </div>
              ))}
            </div>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{
              background: isDragging ? "#122342" : "rgba(11,21,38,0.78)",
              border: isDragging ? "2px solid #60a5fa" : "2px dashed rgba(148,163,184,0.2)",
              borderRadius: "16px",
              padding: "18px",
              marginBottom: "14px",
              textAlign: "center",
            }}
          >
            <div style={{ fontWeight: "800", marginBottom: "6px" }}>Drag & Drop image here</div>
            <div style={{ color: "#8ea0c4", fontSize: "13px", marginBottom: "10px" }}>
              Click to upload, drag images here, or paste with Ctrl+V
            </div>
            <input
  type="file"
  accept="image/*"
  multiple
  onChange={(e) => handleFileChange(e.target.files)}
/>
          </div>

{imageData && imageData.length > 0 && (
  <div
    style={{
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      marginBottom: "14px",
    }}
  >
    {imageData.map((img, i) => (
      <div key={i} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => removeImage(i)}
          style={{
            position: "absolute",
            top: "-8px",
            right: "-8px",
            width: "24px",
            height: "24px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.25)",
            background: "#331212",
            color: "#ffb4b4",
            cursor: "pointer",
            fontWeight: "900",
            zIndex: 2,
          }}
        >
          ×
        </button>

        <img
          src={img}
          alt="trade"
          style={{
            width: "120px",
            height: "90px",
            objectFit: "cover",
            borderRadius: "10px",
            cursor: "pointer",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
          onClick={() => setFullImage(img)}
        />
      </div>
   ))}
  </div>
)}

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button onClick={handleSave} style={TinyButton("linear-gradient(135deg, rgba(139,92,246,0.95), rgba(78,161,255,0.9))")}>
              {editingId ? "Update Trade" : "Save Trade"}
            </button>

            <button onClick={resetForm} style={TinyButton("#162237", "white")}>
              Clear
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          ...card,
          marginBottom: "16px",
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <button style={filterButton(filter === "ALL")} onClick={() => setFilter("ALL")}>All</button>
        <button style={filterButton(filter === "LONG")} onClick={() => setFilter("LONG")}>Long</button>
        <button style={filterButton(filter === "SHORT")} onClick={() => setFilter("SHORT")}>Short</button>
        <button style={filterButton(filter === "BE")} onClick={() => setFilter("BE")}>BE</button>
        <button style={filterButton(filter === "WIN")} onClick={() => setFilter("WIN")}>Wins</button>
        <button style={filterButton(filter === "LOSS")} onClick={() => setFilter("LOSS")}>Losses</button>

        <div style={{ marginLeft: "auto" }}>
          <button onClick={exportCSV} style={TinyButton("#6ddf7f", "#062612")}>
            Export CSV
          </button>
        </div>
      </div>

      <div style={{ ...card, marginBottom: "16px" }}>
        <div style={{ fontSize: "22px", fontWeight: "800", marginBottom: "14px" }}>
          {analyticsMode ? "Analytics Summary" : "Trades Summary"}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: "12px",
          }}
        >
          <div style={softCard}>
            <div style={labelStyle}>Total PnL</div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: "900",
                color: summary.totalProfit >= 0 ? "#59e27c" : "#ff6b6b",
              }}
            >
              {summary.totalProfit >= 0 ? "+" : ""}${formatMoney(summary.totalProfit)}
            </div>
          </div>

          <div style={softCard}>
            <div style={labelStyle}>Win Rate</div>
            <div style={{ fontSize: "28px", fontWeight: "900" }}>{summary.winRate}%</div>
          </div>

          <div style={softCard}>
            <div style={labelStyle}>Discipline Score</div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: "900",
                color:
                  disciplineScore >= 80
                    ? "#59e27c"
                    : disciplineScore >= 50
                    ? "#ffd278"
                    : "#ff6b6b",
              }}
            >
              {disciplineScore.toFixed(0)}%
            </div>
          </div>

          <div style={softCard}>
            <div style={labelStyle}>Wins / Losses / BE</div>
            <div style={{ fontSize: "24px", fontWeight: "900" }}>
              {summary.wins} / {summary.losses} / {summary.be}
            </div>
          </div>

          <div style={softCard}>
            <div style={labelStyle}>Trades</div>
            <div style={{ fontSize: "28px", fontWeight: "900" }}>
              {filteredTrades.length}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: "16px" }}>
        {filteredTrades.map((trade) => {
          const isExpanded = expandedTradeId === trade.id;
          const profitColor =
            Number(trade.profit || 0) > 0
              ? "#59e27c"
              : Number(trade.profit || 0) < 0
              ? "#ff6b6b"
              : "#64b5ff";

          return (
            <div key={trade.id} style={{ ...card, borderLeft: `4px solid ${profitColor}` }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "14px",
                  alignItems: "start",
                }}
              >
                <div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ fontSize: "18px", fontWeight: "900" }}>{trade.asset}</div>

                    <div
                      style={{
                        padding: "5px 10px",
                        borderRadius: "999px",
                        background:
                          trade.direction === "Long"
                            ? "rgba(89,226,124,0.16)"
                            : trade.direction === "Short"
                            ? "rgba(255,107,107,0.16)"
                            : "rgba(100,181,255,0.18)",
                        color:
                          trade.direction === "Long"
                            ? "#59e27c"
                            : trade.direction === "Short"
                            ? "#ff8b8b"
                            : "#64b5ff",
                        fontSize: "12px",
                        fontWeight: "800",
                      }}
                    >
                      {trade.direction}
                    </div>

                    {trade.setupTag ? (
                      <div
                        style={{
                          padding: "5px 10px",
                          borderRadius: "999px",
                          background: "rgba(139,92,246,0.18)",
                          color: "#d1c4ff",
                          fontSize: "12px",
                          fontWeight: "800",
                        }}
                      >
                        {trade.setupTag}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ fontWeight: "800", marginBottom: "8px", fontSize: "16px" }}>
                    Entry: {trade.entryPrice} | Stop: {trade.stopPrice} | Exit: {trade.exitPrice} | Profit:{" "}
                    <span style={{ color: profitColor }}>
                      {Number(trade.profit || 0) > 0 ? "+" : ""}${formatMoney(trade.profit)}
                    </span>
                  </div>

                  <div style={{ color: "#d8e3f7", fontSize: "13px" }}>
                    Date: {trade.tradeDate || "-"} | Time: {trade.entryTime || "-"} → {trade.exitTime || "-"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button onClick={() => toggleExpandedTrade(trade.id)} style={TinyButton("#162237", "white")}>
                    {isExpanded ? "Hide" : "View"}
                  </button>

                  <button onClick={() => editTrade(trade)} style={TinyButton("#3a2a08", "#ffd278")}>
                    Edit
                  </button>

                  <button onClick={() => deleteTrade(trade.id)} style={TinyButton("#331212", "#ff9b9b")}>
                    Delete
                  </button>

                  <button onClick={() => analyzeTradeLocally(trade.id)} style={TinyButton("#6c5ce7", "white")}>
                    Analyze AI
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(148,163,184,0.12)", display: "grid", gap: "12px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px" }}>
                    <div style={softCard}>
                      <div style={labelStyle}>Position Size</div>
                      <div style={{ fontSize: "18px", fontWeight: "800" }}>{trade.positionSize ?? "-"}</div>
                    </div>

                    <div style={softCard}>
                      <div style={labelStyle}>Fees</div>
                      <div style={{ fontSize: "18px", fontWeight: "800" }}>${formatMoney(trade.commission)}</div>
                    </div>

                    <div style={softCard}>
                      <div style={labelStyle}>Risk / Reward</div>
                      <div style={{ fontSize: "18px", fontWeight: "800" }}>{Number(trade.riskReward || 0).toFixed(2)}</div>
                    </div>

                    <div style={softCard}>
                      <div style={labelStyle}>R Multiple</div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: Number(trade.rMultiple || 0) >= 0 ? "#59e27c" : "#ff6b6b" }}>
                        {Number(trade.rMultiple || 0).toFixed(2)}R
                      </div>
                    </div>
                  </div>

                  <div style={softCard}>
                    <div style={{ color: "#8ea0c4", fontSize: "12px", marginBottom: "8px" }}>
                      Pre-Trade Checklist
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px", color: "#d8e3f7", fontSize: "13px", fontWeight: "700" }}>
                      <div>Bias: {trade.checklist?.bias ? "Yes" : "No"}</div>
                      <div>Liquidity: {trade.checklist?.liquidity ? "Yes" : "No"}</div>
                      <div>Confirmation: {trade.checklist?.confirmation ? "Yes" : "No"}</div>
                      <div>Risk: {trade.checklist?.risk ? "Yes" : "No"}</div>
                    </div>
                  </div>

    {trade.notes ? (
  <div style={softCard}>
    <div style={{ color: "#8ea0c4", fontSize: "12px", marginBottom: "8px" }}>
      Notes
    </div>

    <div
      style={{
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        lineHeight: 1.7,
        direction: "rtl",
        unicodeBidi: "plaintext",
        textAlign: "right",
      }}
    >
      {trade.notes}
    </div>
  </div>
) : null}

                  {trade.aiInsights && trade.aiInsights.length > 0 ? (
                    <div
                      style={{
                        background: "rgba(108, 92, 231, 0.1)",
                        border: "1px solid rgba(108, 92, 231, 0.3)",
                        borderRadius: "10px",
                        padding: "12px",
                        marginTop: "10px",
                      }}
                    >
                      <div style={{ color: "#a29bfe", fontSize: "12px", marginBottom: "8px", fontWeight: "bold" }}>
                        AI Insights
                      </div>

                      <ul style={{ paddingLeft: "18px", margin: 0, color: "#dfe7f7", lineHeight: 1.6 }}>
                        {trade.aiInsights.map((insight, i) => (
                          <li key={i}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {typeof trade.aiCoachScore === "number" ? (
                    <div style={softCard}>
                      <div style={{ color: "#8ea0c4", fontSize: "12px", marginBottom: "8px" }}>AI Coach Score</div>
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: "900",
                          color:
                            trade.aiCoachScore >= 8
                              ? "#59e27c"
                              : trade.aiCoachScore >= 6
                              ? "#ffd278"
                              : "#ff8b8b",
                        }}
                      >
                        {trade.aiCoachScore}/10
                      </div>
                    </div>
                  ) : null}

                  {trade.mistakes?.length > 0 ? (
                    <div style={softCard}>
                      <div style={{ color: "#8ea0c4", fontSize: "12px", marginBottom: "8px" }}>Mistakes</div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {trade.mistakes.map((m, i) => (
                          <div
                            key={i}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "999px",
                              background: "rgba(255,91,91,0.2)",
                              border: "1px solid rgba(255,91,91,0.18)",
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "#ffd1d1",
                            }}
                          >
                            {m}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                 {trade.images && trade.images.length > 0 && (
  <div style={softCard}>
    <div style={{ color: "#8ea0c4", fontSize: "12px", marginBottom: "8px" }}>
      Screenshots
    </div>

    <div
      style={{
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
      }}
    >
      {trade.images.map((img, i) => (
        <img
          key={i}
          src={img}
          alt="trade"
          onClick={() => setFullImage(img)}
          style={{
            width: "140px",
            height: "100px",
            objectFit: "cover",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        />
      ))}
    </div>
  </div>
)}

                </div>
              )}
            </div>
          );
        })}
      </div>


      {fullImage && (
        <div
          onClick={() => setFullImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.78)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px",
          }}
        >
          <img
            src={fullImage}
            alt="full"
            style={{
              maxWidth: "95vw",
              maxHeight: "90vh",
              borderRadius: "14px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default Trades;