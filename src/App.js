
import React, { useEffect, useState } from "react";
import "./App.css";
import Dashboard from "./components/Dashboard";
import Trades from "./components/Trades";
import Calendar from "./components/Calendar";
import AIDashboard from "./components/AIDashboard";
import Analytics from "./components/Analytics";

import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";

import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

import Welcome from "./components/Welcome";

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("activeTab") || "dashboard";
  });

const [showWelcome, setShowWelcome] = useState(true);

  const [journals, setJournals] = useState(() => {
    const saved = localStorage.getItem("journals");
    return saved
      ? JSON.parse(saved)
      : [{ id: "main", name: "Main Journal", startingBalance: 50000 }];
  });

  const [activeJournal, setActiveJournal] = useState(() => {
    return localStorage.getItem("activeJournal") || "main";
  });

  const [trades, setTrades] = useState(() => {
    const saved = localStorage.getItem("trades");
    return saved ? JSON.parse(saved) : [];
  });

const currentJournal = journals.find(j => j.id === activeJournal);
const startingBalance = currentJournal?.startingBalance ?? 50000;

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [user, setUser] = useState(null);

const [authMode, setAuthMode] = useState("login");
const [confirmPassword, setConfirmPassword] = useState("");

const [cloudLoaded, setCloudLoaded] = useState(false);

useEffect(() => {
  if (!user) return;

  const loadCloudData = async () => {
    const snap = await getDoc(doc(db, "users", user.uid));

    if (snap.exists()) {
      const data = snap.data();

      setTrades(data.trades || []);
      setJournals(data.journals || [{ id: "main", name: "Main Journal" }]);
      setActiveJournal(data.activeJournal || "main");
      setActiveTab(data.activeTab || "dashboard");
      setJournals(prev =>
  prev.map(j =>
    j.id === (data.activeJournal || activeJournal)
      ? { ...j, startingBalance: Number(data.startingBalance || j.startingBalance || 50000) }
      : j
  )
);

      localStorage.setItem("trades", JSON.stringify(data.trades || []));
    }

    setCloudLoaded(true);
  };

  loadCloudData();
}, [user]);

useEffect(() => {
  localStorage.setItem("trades", JSON.stringify(trades));

  if (!user || !cloudLoaded) return;

  const tradesForCloud = trades.map((trade) => ({
    ...trade,
    imageData: [],
  }));

  setDoc(
    doc(db, "users", user.uid),
    {
      trades: tradesForCloud,
      journals,
      activeJournal,
      activeTab,
      startingBalance,
    },
    { merge: true }
  );
}, [trades, journals, activeJournal, activeTab, startingBalance, user]);

  useEffect(() => {
    localStorage.setItem("startingBalance", String(startingBalance || 0));
  }, [startingBalance]);

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("journals", JSON.stringify(journals));
  }, [journals]);

  useEffect(() => {
    localStorage.setItem("activeJournal", activeJournal);
  }, [activeJournal]);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    setUser(currentUser);

    if (!currentUser) {
      setCloudLoaded(false);
      return;
    }

    const userDocRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const data = userSnap.data();

      setTrades(Array.isArray(data.trades) ? data.trades : []);
      setJournals(
        Array.isArray(data.journals) && data.journals.length > 0
          ? data.journals
          : [{ id: "main", name: "Main Journal" }]
      );
      setActiveJournal(data.activeJournal || "main");
      setActiveTab(data.activeTab || "dashboard");
      setJournals((prev) =>
  prev.map((j) =>
    j.id === (data.activeJournal || activeJournal)
      ? {
          ...j,
          startingBalance: Number(data.startingBalance || j.startingBalance || 50000),
        }
      : j
  )
);
    }

    setCloudLoaded(true);
  });

  return () => unsubscribe();
}, []);

  const filteredTrades = trades.filter((trade) => {
    return (trade.journalId || "main") === activeJournal;
  });

  const activeJournalName =
    journals.find((j) => j.id === activeJournal)?.name || "Main Journal";

const handleRegister = async () => {
  try {
    await createUserWithEmailAndPassword(auth, email, password);

    alert("User created!");
  } catch (err) {
    alert(err.message);
  }
};

const handleLogin = async () => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Logged in!");
  } catch (err) {
    alert(err.message);
  }
};

const handleLogout = async () => {
  try {
    await signOut(auth);
  } catch (err) {
    alert(err.message);
  }
};

  const shellStyle = {
    minHeight: "100vh",
    display: "flex",
    background:
      "radial-gradient(circle at top left, #13254d 0%, #091323 28%, #060b16 60%, #04070f 100%)",
    color: "white",
    fontFamily: "Inter, Arial, sans-serif",
    overflowX: "hidden",
  };

  
const sidebarStyle = {
  width: "280px",
  height: "100vh",
  position: "sticky",
  top: 0,
  padding: "18px",
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  background: "rgba(2,6,23,0.6)",
  borderRight: "1px solid rgba(148,163,184,0.12)",
  backdropFilter: "blur(20px)",
  scrollbarWidth: "thin",
};

const logoWrap = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px",
  borderRadius: "16px",
  background:
    "linear-gradient(135deg, rgba(124,92,255,0.18), rgba(78,161,255,0.12))",
  border: "1px solid rgba(148,163,184,0.14)",
  marginBottom: "6px",
  flexShrink: 0,
};

  const logoMark = {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #7c5cff, #4ea1ff)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "950",
    fontSize: "18px",
    letterSpacing: "-0.04em",
    boxShadow: "0 12px 28px rgba(109,75,255,0.24)",
    flexShrink: 0,
  };

const sideItem = {
  width: "100%",
  height: "42px",
  textAlign: "left",
  padding: "0 14px",
  borderRadius: "14px",
  border: "1px solid rgba(148,163,184,0.10)",
  background: "rgba(255,255,255,0.02)",
  color: "#d8e3f7",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "700",
  boxSizing: "border-box",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "flex",
  alignItems: "center",
};

  const sideItemActive = {
    ...sideItem,
    background:
      "linear-gradient(135deg, rgba(139,92,246,0.26), rgba(78,161,255,0.18))",
    border: "1px solid rgba(109,75,255,0.34)",
    color: "white",
    boxShadow: "0 10px 26px rgba(109,75,255,0.18)",
  };

const smallButton = {
  width: "32px",
  minWidth: "32px",
  height: "32px",
  border: "1px solid rgba(148,163,184,0.12)",
  background: "rgba(255,255,255,0.03)",
  color: "#d8e3f7",
  borderRadius: "10px",
  padding: 0,
  cursor: "pointer",
  fontWeight: "900",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

  const mainStyle = {
    flex: 1,
    padding: "24px",
    boxSizing: "border-box",
    minWidth: 0,
    overflowX: "hidden",
  };

  const activeJournalBadgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(139,92,246,0.16)",
    border: "1px solid rgba(139,92,246,0.24)",
    color: "#e9ddff",
    fontSize: "13px",
    fontWeight: "800",
    marginBottom: "18px",
  };

  const sectionTitle = {
    fontSize: "11px",
    color: "#8ea0c4",
    marginBottom: "10px",
    fontWeight: "900",
    letterSpacing: "0.08em",
  };

  const handleExportBackup = () => {
    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      trades,
      journals,
      activeJournal,
      activeTab,
      startingBalance,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trading-journal-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);

        if (!parsed || typeof parsed !== "object") {
          alert("Backup file is invalid.");
          return;
        }

        setTrades(Array.isArray(parsed.trades) ? parsed.trades : []);
        setJournals(
          Array.isArray(parsed.journals) && parsed.journals.length > 0
            ? parsed.journals
            : [{ id: "main", name: "Main Journal" }]
        );
        setActiveJournal(parsed.activeJournal || "main");
        setActiveTab(parsed.activeTab || "dashboard");
        setJournals(prev =>
  prev.map(j =>
    j.id === (parsed.activeJournal || activeJournal)
      ? { ...j, startingBalance: Number(parsed.startingBalance || j.startingBalance || 50000) }
      : j
  )
);

        alert("Backup imported successfully.");
      } catch (error) {
        alert("Import failed. Please choose a valid backup JSON file.");
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  const handleRenameJournal = (journalId) => {
    const journal = journals.find((j) => j.id === journalId);
    if (!journal) return;

    const nextName = prompt("New journal name:", journal.name);
    if (!nextName || !nextName.trim()) return;

    setJournals((prev) =>
      prev.map((j) =>
        j.id === journalId ? { ...j, name: nextName.trim() } : j
      )
    );
  };

  const handleDeleteJournal = (journalId) => {
    if (journalId === "main") {
      alert("Main Journal cannot be deleted.");
      return;
    }

    const journal = journals.find((j) => j.id === journalId);
    if (!journal) return;

    const journalTradesCount = trades.filter(
      (t) => (t.journalId || "main") === journalId
    ).length;

    const confirmDelete = window.confirm(
      `Delete "${journal.name}"?\n\nThis journal has ${journalTradesCount} trades.\nThe trades will move to Main Journal.`
    );

    if (!confirmDelete) return;

    setJournals((prev) => prev.filter((j) => j.id !== journalId));

    setTrades((prev) =>
      prev.map((trade) =>
        (trade.journalId || "main") === journalId
          ? { ...trade, journalId: "main" }
          : trade
      )
    );

    if (activeJournal === journalId) {
      setActiveJournal("main");
    }
  };

  const handleDuplicateJournal = (journalId) => {
    const journal = journals.find((j) => j.id === journalId);
    if (!journal) return;

    const newJournal = {
      id: Date.now().toString(),
      name: `${journal.name} Copy`,
    };

    const tradesToDuplicate = trades
      .filter((t) => (t.journalId || "main") === journalId)
      .map((trade) => ({
        ...trade,
        id: `${Date.now()}-${Math.random()}`,
        journalId: newJournal.id,
        createdAt: new Date().toISOString(),
      }));

    setJournals((prev) => [...prev, newJournal]);
    setTrades((prev) => [...tradesToDuplicate, ...prev]);
    setActiveJournal(newJournal.id);
  };

if (showWelcome && !user) {
  return <Welcome onStart={() => setShowWelcome(false)} />;
}

if (!user) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at 20% 10%, rgba(34,197,94,0.22), transparent 32%), linear-gradient(135deg, #020617, #0f172a)",
        color: "white",
        fontFamily: "Inter, Arial, sans-serif",
        padding: "24px",
        position: "relative",
      }}
    >
      <div
        onClick={() => setShowWelcome(true)}
        style={{
          position: "absolute",
          top: "24px",
          left: "24px",
          width: "42px",
          height: "42px",
          borderRadius: "50%",
          background: "rgba(15,23,42,0.7)",
          border: "1px solid rgba(148,163,184,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          backdropFilter: "blur(10px)",
          transition: "0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(30,41,59,0.9)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(15,23,42,0.7)";
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 18L9 12L15 6"
            stroke="#e2e8f0"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          padding: "34px",
          borderRadius: "26px",
          background: "rgba(15,23,42,0.82)",
          border: "1px solid rgba(148,163,184,0.18)",
          boxShadow: "0 30px 90px rgba(0,0,0,0.45)",
        }}
      >
        <div
  style={{
    fontWeight: 900,
    fontSize: "20px",
    letterSpacing: "-0.04em",
    background: "linear-gradient(90deg, #ffffff, #a7f3d0, #22c55e)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textShadow: "0 0 12px rgba(167,243,208,0.25)",
    marginBottom: "8px",
  }}
>
  EdgeJournal
</div>

        <h1 style={{ margin: "10px 0 8px", fontSize: "34px" }}>
  {authMode === "login" ? "Build Your Edge" : "Create Your Account"}
</h1>

        <p style={{ color: "#94a3b8", marginBottom: "26px" }}>
          Login or create an account to continue.
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "15px 16px",
            borderRadius: "14px",
            border: "1px solid rgba(148,163,184,0.22)",
            background: "rgba(2,6,23,0.7)",
            color: "white",
            outline: "none",
            marginBottom: "12px",
            fontSize: "15px",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "15px 16px",
            borderRadius: "14px",
            border: "1px solid rgba(148,163,184,0.22)",
            background: "rgba(2,6,23,0.7)",
            color: "white",
            outline: "none",
            marginBottom: "18px",
            fontSize: "15px",
          }}
        />

{authMode === "register" && (
  <input
    type="password"
    placeholder="Confirm Password"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
    style={{
      width: "100%",
      boxSizing: "border-box",
      padding: "15px 16px",
      borderRadius: "14px",
      border: "1px solid rgba(148,163,184,0.22)",
      background: "rgba(2,6,23,0.7)",
      color: "white",
      outline: "none",
      marginBottom: "18px",
      fontSize: "15px",
    }}
  />
)}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <button
            onClick={() => {
  if (authMode === "register") {
    setAuthMode("login");
    return;
  }

  handleLogin();
}}
            style={{
              padding: "14px",
              borderRadius: "14px",
              border: "none",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#03140a",
              fontWeight: 1000,
              cursor: "pointer",
            }}
          >
            {authMode === "login" ? "Login" : "Back to Login"}
          </button>

          <button
  onClick={() => {
    if (authMode === "login") {
      setAuthMode("register");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    handleRegister();
  }}

  onMouseEnter={(e) => {
    e.target.style.background = "rgba(30,41,59,0.95)";
    e.target.style.transform = "translateY(-1px)";
    e.target.style.boxShadow = "0 8px 25px rgba(0,0,0,0.35)";
  }}

  onMouseLeave={(e) => {
    e.target.style.background = "rgba(15,23,42,0.75)";
    e.target.style.transform = "translateY(0)";
    e.target.style.boxShadow = "none";
  }}

  style={{
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid rgba(148,163,184,0.3)",
    background: "rgba(15,23,42,0.75)",
    color: "#e2e8f0",
    fontWeight: 1000,
    cursor: "pointer",
    transition: "all 0.2s ease",
  }}
>
  {authMode === "login" ? "Register" : "Create Account"}
</button>
        </div>
      </div>
    </div>
  );
}

  return (
<div style={shellStyle}>

<style>{`
  /* Chrome / Edge */
  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(99,102,241,0.4);
    border-radius: 10px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(99,102,241,0.7);
  }

  /* Firefox */
  * {
    scrollbar-width: thin;
    scrollbar-color: rgba(99,102,241,0.5) transparent;
  }
`}</style>

<aside
  style={{
    ...sidebarStyle,
  }}
>
  <style>
    {`
      .sidebar-scroll::-webkit-scrollbar {
        width: 0px;
        height: 0px;
      }
    `}
  </style>

 <div
  style={{
    minHeight: "100vh",
    height: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  }}
>
    <div
      style={{
        padding: "16px",
        borderRadius: "22px",
        background:
          "linear-gradient(180deg, rgba(15,23,42,0.92), rgba(15,23,42,0.58))",
        border: "1px solid rgba(148,163,184,0.14)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
        <div
          style={{
            width: "46px",
            height: "46px",
            borderRadius: "17px",
            background:
              "linear-gradient(135deg, rgba(34,197,94,0.3), rgba(16,185,129,0.08))",
            border: "1px solid rgba(34,197,94,0.34)",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 18px 45px rgba(34,197,94,0.2)",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
            <path
              d="M8 27L16.5 18.5L22.5 23L32 11"
              stroke="#86efac"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M25 11H32V18"
              stroke="#22c55e"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 950,
              fontSize: "20px",
              letterSpacing: "-0.04em",
              whiteSpace: "nowrap",
              background: "linear-gradient(90deg, #ffffff, #a7f3d0)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 10px rgba(34,197,94,0.35)",
            }}
          >
            EdgeJournal
          </div>

          <div
            style={{
              color: "#8ea0c4",
              fontSize: "11px",
              fontWeight: 800,
              marginTop: "4px",
              whiteSpace: "nowrap",
            }}
          >
            Performance Lab
          </div>
        </div>
      </div>
    </div>

    <div style={{ display: "grid", gap: "7px" }}>
      {[
        ["dashboard", "Dashboard", "⌁"],
        ["trades", "Trades", "↗"],
        ["analytics", "Analytics", "◈"],
        ["calendar", "Calendar", "◷"],
        ["ai", "AI Analytics", "✦"],
      ].map(([tab, label, icon]) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          style={{
            ...(activeTab === tab ? sideItemActive : sideItem),
            height: "42px",
            display: "flex",
            alignItems: "center",
            gap: "11px",
            padding: "0 14px",
            fontSize: "13px",
            fontWeight: 900,
            textAlign: "left",
          }}
        >
          <span style={{ width: "18px", opacity: 0.9 }}>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>

   <div
  style={{
    paddingTop: "14px",
    borderTop: "1px solid rgba(148,163,184,0.08)",
  }}
>
  <div
    style={{
      ...sectionTitle,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "10px",
    }}
  >
    <span>JOURNALS</span>
    <span style={{ color: "#64748b", fontSize: "11px" }}>
      {journals.length}
    </span>
  </div>

  <div style={{ display: "grid", gap: "8px" }}>
    {journals.map((journal) => (
      <div
        key={journal.id}
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 31px 31px 31px",
          gap: "6px",
          alignItems: "center",
          width: "100%",
        }}
      >
        <button
          onClick={() => setActiveJournal(journal.id)}
          title={journal.name}
          style={{
            ...(activeJournal === journal.id ? sideItemActive : sideItem),
            height: "39px",
            padding: "0 12px",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            overflow: "hidden",
          }}
        >
          <span style={{ color: "#a7f3d0", opacity: 0.85 }}>•</span>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {journal.name}
          </span>
        </button>

        <button
          onClick={() => handleRenameJournal(journal.id)}
          style={smallButton}
          title="Rename journal"
        >
          ✎
        </button>

        <button
          onClick={() => handleDuplicateJournal(journal.id)}
          style={smallButton}
          title="Duplicate journal"
        >
          ⧉
        </button>

        <button
          onClick={() => handleDeleteJournal(journal.id)}
          style={{
            ...smallButton,
            color: journal.id === "main" ? "#64748b" : "#fca5a5",
            cursor: journal.id === "main" ? "not-allowed" : "pointer",
          }}
          title="Delete journal"
          disabled={journal.id === "main"}
        >
          ×
        </button>
      </div>
    ))}
  </div>

  <button
    onClick={() => {
      const name = prompt("Journal name?");
      if (!name || !name.trim()) return;

      const newJournal = {
        id: Date.now().toString(),
        name: name.trim(),
      };

      setJournals((prev) => [...prev, newJournal]);
      setActiveJournal(newJournal.id);
    }}
    style={{
      ...sideItem,
      marginTop: "6px",
      height: "34px",
      textAlign: "center",
      fontWeight: 950,
      border: "1px solid rgba(148,163,184,0.1)",
    }}
  >
    + Add Journal
  </button>

  <div
    style={{
      marginTop: "8px",
      display: "grid",
      gap: "6px",
    }}
  >
    <button
      onClick={handleExportBackup}
      style={{
        height: "39px",
        textAlign: "left",
        fontWeight: 900,
        border: "none",
        outline: "none",
        borderRadius: "14px",
        background: "rgba(15,23,42,0.55)",
        color: "#e5e7eb",
        padding: "0 16px",
        cursor: "pointer",
      }}
    >
      Export Backup
    </button>

    <label
      style={{
        height: "34px",
        textAlign: "left",
        fontWeight: 900,
fontSize: "14px",
        border: "none",
        outline: "none",
        borderRadius: "14px",
        background: "rgba(15,23,42,0.55)",
        color: "#e5e7eb",
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
      }}
    >
      Import Backup
      <input
        type="file"
        accept="application/json"
        onChange={handleImportBackup}
        style={{ display: "none" }}
      />
    </label>
  </div>
</div>
</div>
</aside>
      <main style={mainStyle}>

<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    padding: "12px 18px",
    borderRadius: "14px",
    background: "rgba(15,23,42,0.6)",
    border: "1px solid rgba(148,163,184,0.15)",
  }}
>
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    <div
      style={{
        width: "34px",
        height: "34px",
        borderRadius: "50%",
        background: "#6366f1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
      }}
    >
      {user?.email?.[0]?.toUpperCase()}
    </div>

    <span style={{ fontSize: "14px", color: "#cbd5f5" }}>
      {user?.email}
    </span>
  </div>

  <button
    onClick={handleLogout}
    style={{
      padding: "6px 14px",
      borderRadius: "10px",
      background: "rgba(239,68,68,0.15)",
      color: "#f87171",
      border: "1px solid rgba(239,68,68,0.3)",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: "13px",
    }}
  >
      Logout
  </button>
</div>

  <div style={activeJournalBadgeStyle}>
    <span>📁</span>
    <span>{activeJournalName}</span>
  </div>

        {activeTab === "dashboard" && (
          <>
            <Dashboard
  trades={filteredTrades}
  startingBalance={startingBalance}
  setJournals={setJournals}
  activeJournal={activeJournal}
/>
            <div style={{ marginTop: "24px" }}>
              <AIDashboard trades={filteredTrades} />
            </div>
          </>
        )}

        {activeTab === "trades" && (
          <Trades
            trades={filteredTrades}
            setTrades={setTrades}
            startingBalance={startingBalance}
            activeJournal={activeJournal}
          />
        )}

        {activeTab === "analytics" && (
  <Analytics trades={filteredTrades} />
)}

        {activeTab === "calendar" && <Calendar trades={filteredTrades} />}

        {activeTab === "ai" && <AIDashboard trades={filteredTrades} />}
      </main>
    </div>
  );
}

export default App;
