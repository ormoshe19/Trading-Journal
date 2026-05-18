import React from "react";

function Welcome({ onStart }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 20% 10%, rgba(34,197,94,0.28), transparent 30%), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.22), transparent 28%), linear-gradient(135deg, #020617 0%, #07111f 45%, #0f172a 100%)",
        color: "#fff",
        overflow: "hidden",
        position: "relative",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <style>
        {`
          @keyframes floatUp {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-14px); }
          }
          @keyframes glowPulse {
            0%, 100% { opacity: .45; transform: scale(1); }
            50% { opacity: .9; transform: scale(1.04); }
          }
          @keyframes chartMove {
            0% { transform: translateX(-40px); opacity: .45; }
            50% { opacity: .95; }
            100% { transform: translateX(40px); opacity: .45; }
          }
          .welcome-btn:hover {
            transform: translateY(-2px) scale(1.01);
            box-shadow: 0 22px 60px rgba(34,197,94,.35);
          }
        `}
      </style>

      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "linear-gradient(to bottom, black, transparent 78%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "rgba(34,197,94,.2)",
          filter: "blur(80px)",
          top: -120,
          left: -90,
          animation: "glowPulse 5s ease-in-out infinite",
        }}
      />

      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "38px 28px 70px",
          position: "relative",
          zIndex: 2,
        }}
      >
        <nav
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 70,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
  <Logo />
</div>

          <button
            onClick={onStart}
            style={{
              border: "1px solid rgba(148,163,184,.22)",
              background: "rgba(15,23,42,.55)",
              color: "#e5e7eb",
              padding: "11px 18px",
              borderRadius: 999,
              fontWeight: 800,
              cursor: "pointer",
              backdropFilter: "blur(10px)",
            }}
          >
            Get Started
          </button>
        </nav>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr .95fr",
            gap: 44,
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 13px",
                borderRadius: 999,
                background: "rgba(34,197,94,.12)",
                border: "1px solid rgba(34,197,94,.28)",
                color: "#86efac",
                fontWeight: 800,
                fontSize: 13,
                marginBottom: 22,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
              Built for serious traders
            </div>

            <h1
              style={{
                fontSize: "clamp(46px, 6vw, 78px)",
                lineHeight: .94,
                letterSpacing: "-3px",
                margin: 0,
                fontWeight: 1000,
              }}
            >
              Trade less.
              <br />
              <span
                style={{
                  background: "linear-gradient(90deg, #22c55e, #a7f3d0, #8b5cf6)",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                Improve faster.
              </span>
            </h1>

            <p
              style={{
                color: "#cbd5e1",
                fontSize: 18,
                lineHeight: 1.75,
                maxWidth: 620,
                marginTop: 24,
              }}
            >
              A premium trading journal that tracks your executions, exposes your leaks,
              ranks your best setups, and turns your trade history into real edge.
            </p>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 34 }}>
              <button
                className="welcome-btn"
                onClick={onStart}
                style={{
                  border: "none",
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "#04130a",
                  padding: "16px 28px",
                  borderRadius: 16,
                  fontSize: 16,
                  fontWeight: 1000,
                  cursor: "pointer",
                  boxShadow: "0 18px 50px rgba(34,197,94,.28)",
                  transition: ".25s ease",
                }}
              >
                Login / Register
              </button>

              <div
                style={{
                  padding: "15px 18px",
                  borderRadius: 16,
                  background: "rgba(15,23,42,.62)",
                  border: "1px solid rgba(148,163,184,.16)",
                  color: "#94a3b8",
                  fontWeight: 800,
                }}
              >
                No fluff. Just performance.
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 12,
                marginTop: 38,
                maxWidth: 620,
              }}
            >
              <MiniStat title="Edge Score" value="0-100" />
              <MiniStat title="Setup Ranking" value="Auto" />
              <MiniStat title="Leak Detection" value="Live" />
            </div>
          </div>

          <div
            style={{
              position: "relative",
              animation: "floatUp 6s ease-in-out infinite",
            }}
          >
            <div
              style={{
                borderRadius: 30,
                padding: 20,
                background:
                  "linear-gradient(180deg, rgba(15,23,42,.88), rgba(2,6,23,.88))",
                border: "1px solid rgba(148,163,184,.18)",
                boxShadow: "0 35px 100px rgba(0,0,0,.45)",
                backdropFilter: "blur(18px)",
              }}
            >
              <div
                style={{
                  height: 360,
                  borderRadius: 22,
                  background:
                    "radial-gradient(circle at 50% 30%, rgba(34,197,94,.22), transparent 35%), linear-gradient(180deg, rgba(15,23,42,.9), rgba(2,6,23,.95))",
                  border: "1px solid rgba(148,163,184,.12)",
                  padding: 20,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <ChartVisual />

                <div
                  style={{
                    position: "absolute",
                    top: 22,
                    left: 22,
                    right: 22,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 800 }}>
                      ACCOUNT EDGE
                    </div>
                    <div style={{ fontSize: 34, fontWeight: 1000, color: "#86efac" }}>
                      +18.7R
                    </div>
                  </div>

                  <div
                    style={{
                      color: "#22c55e",
                      background: "rgba(34,197,94,.12)",
                      border: "1px solid rgba(34,197,94,.25)",
                      borderRadius: 999,
                      padding: "8px 12px",
                      fontWeight: 900,
                      fontSize: 12,
                    }}
                  >
                    PRO MODE
                  </div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    bottom: 20,
                    left: 20,
                    right: 20,
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 10,
                  }}
                >
                  <Panel label="Win Rate" value="62%" />
                  <Panel label="Profit Factor" value="2.14" />
                  <Panel label="Best Setup" value="AI Ranked" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "18px",
          background:
            "linear-gradient(135deg, rgba(34,197,94,0.25), rgba(16,185,129,0.08))",
          border: "1px solid rgba(34,197,94,0.35)",
          display: "grid",
          placeItems: "center",
          boxShadow: "0 25px 60px rgba(34,197,94,0.25)",
        }}
      >
        <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
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

      <div>
        <div
          style={{
            fontWeight: 900,
            fontSize: "18px",
            letterSpacing: "-0.03em",
            background: "linear-gradient(90deg, #fff, #a7f3d0)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          EdgeJournal
        </div>

        <div
          style={{
            fontSize: "12px",
            color: "#64748b",
            fontWeight: 700,
            marginTop: "2px",
          }}
        >
          Performance Lab
        </div>
      </div>
    </div>
  );
}

function MiniStat({ title, value }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 18,
        background: "rgba(15,23,42,.62)",
        border: "1px solid rgba(148,163,184,.14)",
      }}
    >
      <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 800 }}>{title}</div>
      <div style={{ color: "#fff", fontSize: 22, fontWeight: 1000, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function Panel({ label, value }) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 16,
        background: "rgba(2,6,23,.72)",
        border: "1px solid rgba(148,163,184,.12)",
      }}
    >
      <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 800 }}>{label}</div>
      <div style={{ color: "#fff", fontSize: 18, fontWeight: 1000 }}>{value}</div>
    </div>
  );
}

function ChartVisual() {
  const candles = [
    48, 70, 58, 90, 80, 112, 105, 136, 128, 164, 150, 190, 176, 212,
  ];

  return (
    <svg
      viewBox="0 0 520 300"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0.9,
      }}
    >
      {[60, 120, 180, 240].map((y) => (
        <line key={y} x1="0" x2="520" y1={y} y2={y} stroke="rgba(148,163,184,.08)" />
      ))}

      <path
        d="M20 240 C90 225, 110 190, 160 198 C220 210, 235 145, 285 150 C350 155, 365 80, 500 55"
        stroke="#22c55e"
        strokeWidth="4"
        fill="none"
        style={{ filter: "drop-shadow(0 0 10px rgba(34,197,94,.65))" }}
      />

      <g style={{ animation: "chartMove 8s ease-in-out infinite" }}>
        {candles.map((h, i) => {
          const x = 34 + i * 34;
          const y = 260 - h;
          const isGreen = i % 4 !== 1;
          return (
            <g key={i}>
              <line
                x1={x + 6}
                x2={x + 6}
                y1={y - 18}
                y2={y + 52}
                stroke={isGreen ? "#86efac" : "#fb923c"}
                strokeWidth="2"
                opacity=".8"
              />
              <rect
                x={x}
                y={y}
                width="12"
                height={Math.max(28, h / 3)}
                rx="3"
                fill={isGreen ? "#22c55e" : "#f97316"}
                opacity=".9"
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export default Welcome;