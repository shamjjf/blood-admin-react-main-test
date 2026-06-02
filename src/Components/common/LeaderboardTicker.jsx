/**
 * LeaderboardTicker (admin copy) — premium fade-in variant.
 *   Crossfade between items with a soft upward drift + brief blur on
 *   enter / leave. No continuous scroll.
 *
 *   If you change visuals here, mirror the change in
 *   blood-client-main-test/src/components/common/LeaderboardTicker.jsx
 *   so admin / dashboard look consistent.
 */
import { useEffect, useRef, useState } from "react";
import axios from "axios";

const apiRoot = () =>
  String(import.meta.env.VITE_API_URL || "").replace(/\/admin$/, "").replace(
    /\/user$/,
    ""
  );

const ROW_H = 44;

const LeaderboardTicker = ({
  pollMs = 30_000,
  // 7s per item — slow, deliberate. Matches the deep-blur entry/leave
  // animation so the whole strip feels intentional, not rushed.
  perItemMs = 7000,
  style: styleOverride = {},
}) => {
  const [items, setItems] = useState([]);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  useEffect(() => {
    let alive = true;
    const fetchOnce = async () => {
      try {
        const root = apiRoot();
        const res = await axios.get(`${root}/public/leaderboard-ticker`);
        if (!alive) return;
        setItems(res?.data?.data?.items || []);
        setIdx(0);
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

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => {
      if (pausedRef.current) return;
      setIdx((i) => (i + 1) % items.length);
    }, perItemMs);
    return () => clearInterval(t);
  }, [items.length, perItemMs]);

  if (items.length === 0) return null;

  const it = items[idx] || items[0];

  return (
    <div
      style={{
        position: "relative",
        background: "transparent",
        border: "none",
        marginBottom: 14,
        display: "flex",
        alignItems: "stretch",
        height: ROW_H + 12,
        ...styleOverride,
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Live dashboard ticker"
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          alignSelf: "center",
          gap: 7,
          padding: "6px 12px",
          margin: "0 12px 0 10px",
          background: "#FECACA",
          color: "#991B1B",
          fontWeight: 800,
          fontSize: 12,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          borderRadius: 6,
          border: "1px solid #FCA5A5",
          zIndex: 2,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: "#22C55E",
            boxShadow:
              "0 0 0 0 rgba(34,197,94,0.7), 0 0 6px rgba(34,197,94,0.55)",
            animation: "lba-pulse-g 1.4s infinite",
          }}
        />
        Live
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          key={idx}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            whiteSpace: "nowrap",
            minWidth: 0,
            width: "100%",
            animation:
              "lba-enter 1400ms cubic-bezier(.16,1,.3,1) both, lba-leave 1000ms cubic-bezier(.7,0,.84,0) " +
              `${perItemMs - 1000}ms forwards`,
            willChange: "opacity, transform",
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: `${it.color || "#6B7280"}1f`,
              color: it.color || "#6B7280",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              flexShrink: 0,
              boxShadow: `0 0 0 4px ${it.color || "#6B7280"}10`,
            }}
          >
            <i className={`ti ${it.icon || "ti-circle"}`} />
          </span>
          <span
            style={{
              color: "#6B7280",
              fontWeight: 600,
              fontSize: 13,
              flexShrink: 0,
              letterSpacing: 0.1,
            }}
          >
            {it.label}:
          </span>
          <span
            style={{
              color: "#0F172A",
              fontWeight: 800,
              fontSize: 14,
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
              letterSpacing: -0.2,
            }}
          >
            {it.name}
          </span>
          {it.metric && (
            <span
              style={{
                color: it.color || "#6B7280",
                fontWeight: 700,
                fontSize: 13,
                flexShrink: 0,
                letterSpacing: 0.1,
              }}
            >
              · {it.metric}
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes lba-enter {
          0%   { opacity: 0; transform: translateY(14px) scale(.985); filter: blur(8px); }
          55%  { opacity: 0.85; filter: blur(2px); }
          100% { opacity: 1; transform: translateY(0)   scale(1);    filter: blur(0); }
        }
        @keyframes lba-leave {
          0%   { opacity: 1; transform: translateY(0)    scale(1);    filter: blur(0); }
          45%  { opacity: 0.7; filter: blur(2px); }
          100% { opacity: 0; transform: translateY(-14px) scale(.985); filter: blur(8px); }
        }
        @keyframes lba-pulse-g {
          0%   { box-shadow: 0 0 0 0 rgba(34,197,94,0.7), 0 0 6px rgba(34,197,94,0.55); }
          70%  { box-shadow: 0 0 0 8px rgba(34,197,94,0), 0 0 6px rgba(34,197,94,0.55); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0), 0 0 6px rgba(34,197,94,0.55); }
        }
      `}</style>
    </div>
  );
};

export default LeaderboardTicker;
