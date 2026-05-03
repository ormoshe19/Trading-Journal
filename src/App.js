
import React, { useEffect, useState } from "react";
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

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("activeTab") || "dashboard";
  });

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
  width: "260px",
  minWidth: "260px",
  maxWidth: "260px",
  padding: "14px 12px",
  borderRight: "1px solid rgba(148,163,184,0.12)",
  background: "rgba(6, 11, 22, 0.82)",
  backdropFilter: "blur(10px)",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  position: "sticky",
  top: 0,
  height: "100vh",
  boxSizing: "border-box",
  overflowY: "auto",
  overflowX: "hidden",
  flexShrink: 0,
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

if (!user) {
  return (
    <div style={{ padding: "40px", color: "white" }}>
      <h2>Login</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleRegister}>Register</button>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

  return (
    <div style={shellStyle}>
      <aside style={sidebarStyle}>
        <div style={logoWrap}>
          <div style={logoMark}>TC</div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: "950",
                fontSize: "15px",
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
              }}
            >
              TradeCoach AI
            </div>
            <div
              style={{
                color: "#8ea0c4",
                fontSize: "11px",
                fontWeight: "800",
                marginTop: "2px",
                whiteSpace: "nowrap",
              }}
            >
              Performance System
            </div>
          </div>
        </div>

        <button
          style={activeTab === "dashboard" ? sideItemActive : sideItem}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>

        <button
          style={activeTab === "trades" ? sideItemActive : sideItem}
          onClick={() => setActiveTab("trades")}
        >
          Trades
        </button>

        <button
          style={activeTab === "analytics" ? sideItemActive : sideItem}
          onClick={() => setActiveTab("analytics")}
        >
          Analytics
        </button>

        <button
          style={activeTab === "calendar" ? sideItemActive : sideItem}
          onClick={() => setActiveTab("calendar")}
        >
          Calendar
        </button>

        <button
          style={activeTab === "ai" ? sideItemActive : sideItem}
          onClick={() => setActiveTab("ai")}
        >
          AI Analytics
        </button>

        <div
          style={{
            marginTop: "18px",
            paddingTop: "14px",
            borderTop: "1px solid rgba(148,163,184,0.12)",
          }}
        >
          <div style={sectionTitle}>JOURNALS</div>

          <div style={{ display: "grid", gap: "8px" }}>
            {journals.map((journal) => (
              <div
                key={journal.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) 32px 32px 32px",
                  gap: "6px",
                  alignItems: "center",
                  width: "100%",
minWidth: 0,
overflow: "hidden",
boxSizing: "border-box",
                }}
              >
                <button
                  onClick={() => setActiveJournal(journal.id)}
                  style={
                    activeJournal === journal.id
                      ? {
                          ...sideItemActive,
                          height: "38px",
padding: "0 12px",
fontSize: "13px",
display: "flex",
alignItems: "center",
                        }
                      : {
                          ...sideItem,
                          height: "38px",
padding: "0 12px",
fontSize: "13px",
display: "flex",
alignItems: "center",
                        }
                  }
                  title={journal.name}
                >
                  {journal.name}
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
              marginTop: "10px",
              textAlign: "center",
              fontWeight: "900",
            }}
          >
            + Add Journal
          </button>
        </div>

       <div
  style={{
    marginTop: "16px",
    paddingTop: "14px",
    borderTop: "1px solid rgba(148,163,184,0.12)",
    display: "grid",
    gap: "8px",
  }}
>
  <button
    onClick={handleExportBackup}
    style={{
      ...sideItem,
      textAlign: "left",
      fontWeight: "900",
    }}
  >
    Export Backup
  </button>

  <label
    style={{
      ...sideItem,
      textAlign: "left",
      fontWeight: "900",
      display: "block",
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
</aside>

      <main style={mainStyle}>

  <div style={{ marginBottom: "20px" }}>
    <span style={{ marginRight: "10px" }}>
      Logged in as: {user?.email}
    </span>

    <button onClick={handleLogout}>
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