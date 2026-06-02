import { useCallback, useState } from "react";

export function useAlert() {
  const [list, setList] = useState([]);
  const addAlert = useCallback(
    (alert) => {
      const delAlert = () => {
        clearTimeout(id);
        setList((l) => l.filter((a) => a.id !== id));
      };
      const id = setTimeout(() => delAlert(), 3000);
      setList((l) => l.concat({ id, delAlert, ...alert }));
    },
    [setList]
  );

  return [list, addAlert];
}

// Tone config keyed by alert `type` — drives the accent colour + icon so each
// kind of message reads at a glance (success / error / warning / info).
const TONE = {
  success: { accent: "#16a34a", icon: "ti ti-circle-check" },
  error:   { accent: "#dc2626", icon: "ti ti-alert-circle" },
  warning: { accent: "#d97706", icon: "ti ti-alert-triangle" },
  info:    { accent: "#2563eb", icon: "ti ti-info-circle" },
};

function Alert({ type, title, text, delAlert }) {
  const tone = TONE[type] || TONE.info;
  return (
    <div
      role="alert"
      onClick={delAlert}
      style={{
        pointerEvents: "auto",
        minWidth: 320,
        maxWidth: 440,
        background: "#ffffff",
        borderTop: `4px solid ${tone.accent}`,
        borderRadius: 12,
        boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
        padding: "18px 20px",
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        cursor: "pointer",
        animation: "lsaAlertIn 0.18s ease-out",
      }}
    >
      <i
        className={tone.icon}
        style={{ color: tone.accent, fontSize: 24, marginTop: 1, flexShrink: 0 }}
      ></i>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: text ? 4 : 0 }}>
            {title}
          </div>
        )}
        {text && (
          <div style={{ fontSize: 13.5, color: "#4b5563", lineHeight: 1.45 }}>{text}</div>
        )}
      </div>
      <i className="ti ti-x" style={{ color: "#9ca3af", fontSize: 16, flexShrink: 0 }}></i>
    </div>
  );
}

export function AlertContainer({ alerts }) {
  if (!alerts || alerts.length === 0) return null;
  return (
    <>
      {/* Dim backdrop so the popup reads as a centred, focused message. */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(17,24,39,0.35)",
          zIndex: 99998,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        <style>{`@keyframes lsaAlertIn { from { opacity: 0; transform: scale(0.94) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
        {alerts.map((alert) => (
          <Alert key={alert.id} {...alert} />
        ))}
      </div>
    </>
  );
}
