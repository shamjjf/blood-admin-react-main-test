/**
 * LeaderboardTicker (admin copy) — same behaviour as the client-side
 * one, kept in this repo so the admin app doesn't import from outside
 * its own source tree.
 *
 *   Polls /api/public/leaderboard-ticker every 30s and marquee-scrolls
 *   the result. Public endpoint = no auth juggling, identical shape
 *   across all 6 dashboards.
 *
 *   If you change visuals here, mirror the change in
 *   blood-client-main-test/src/components/common/LeaderboardTicker.jsx
 *   so admin / dashboard look consistent.
 */
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const apiRoot = () =>
  String(import.meta.env.VITE_API_URL || "").replace(/\/admin$/, "").replace(
    /\/user$/,
    ""
  );

const LeaderboardTicker = ({ pollMs = 30_000, style: styleOverride = {} }) => {
  const [items, setItems] = useState([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let alive = true;
    const fetchOnce = async () => {
      try {
        const root = apiRoot();
        const res = await axios.get(`${root}/public/leaderboard-ticker`);
        if (!alive) return;
        setItems(res?.data?.data?.items || []);
      } catch {
        if (alive) setItems([]);
      }
    };
    fetchOnce();
    const t = setInterval(fetchOnce, Math.max(10_000, pollMs));
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [pollMs]);

  const looped = useMemo(() => (items.length ? [...items, ...items] : []), [
    items,
  ]);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        position: "relative",
        background:
          "linear-gradient(90deg, #FEF2F2 0%, #FFFFFF 50%, #FEF2F2 100%)",
        border: "1px solid #FECACA",
        borderRadius: 10,
        padding: "8px 0",
        overflow: "hidden",
        marginBottom: 14,
        ...styleOverride,
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Live dashboard ticker"
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 14px",
          background:
            "linear-gradient(90deg, #DC2626 0%, #DC2626 75%, rgba(220,38,38,0))",
          color: "#FFFFFF",
          fontWeight: 800,
          fontSize: 12,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          zIndex: 2,
          paddingRight: 30,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#FFFFFF",
            animation: "lba-pulse 1.4s infinite",
          }}
        />
        Live
      </div>

      <div
        style={{
          display: "inline-flex",
          gap: 28,
          paddingLeft: 90,
          animation: `lba-marquee ${Math.max(20, items.length * 6)}s linear infinite`,
          animationPlayState: paused ? "paused" : "running",
          whiteSpace: "nowrap",
          willChange: "transform",
        }}
      >
        {looped.map((it, i) => (
          <span
            key={`${it.category}-${i}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 12px",
              borderRadius: 999,
              background: "#FFFFFF",
              border: `1px solid ${it.color || "#E5E7EB"}33`,
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              fontSize: 13,
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: `${it.color || "#6B7280"}1f`,
                color: it.color || "#6B7280",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              <i className={`ti ${it.icon || "ti-circle"}`} />
            </span>
            <span style={{ color: "#6B7280", fontWeight: 600 }}>
              {it.label}:
            </span>
            <span style={{ color: "#111827", fontWeight: 700 }}>{it.name}</span>
            {it.metric && (
              <span
                style={{
                  color: it.color || "#6B7280",
                  fontWeight: 700,
                  marginLeft: 2,
                }}
              >
                · {it.metric}
              </span>
            )}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes lba-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes lba-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.7); }
          70%  { box-shadow: 0 0 0 8px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }
      `}</style>
    </div>
  );
};

export default LeaderboardTicker;
