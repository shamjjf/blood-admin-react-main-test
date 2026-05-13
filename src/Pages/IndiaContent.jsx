import { useContext, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";

const Pill = ({ active, onClick, children, color }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      background: active ? color : "#F9FAFB",
      color: active ? "#fff" : "#374151",
      border: active ? `1px solid ${color}` : "1px solid #E5E7EB",
      borderRadius: 18,
      padding: "6px 14px",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      margin: "0 6px 6px 0",
      transition: "all 0.12s ease",
      minHeight: 34,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
    }}
  >
    {active && <i className="ti ti-check" style={{ fontSize: 13 }} />}
    {children}
  </button>
);

const Section = ({ title, desc, children, count }) => (
  <div className="card mb-4">
    <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
      <div>
        <h5 className="mb-0">{title}</h5>
        {desc && <p className="small mb-0">{desc}</p>}
      </div>
      {count != null && (
        <span style={{
          background: "#fff", color: "#C0392B", borderRadius: 12,
          padding: "3px 12px", fontSize: 12, fontWeight: 700,
        }}>
          {count} enabled
        </span>
      )}
    </div>
    <div className="card-body">{children}</div>
  </div>
);

const IndiaContent = () => {
  const { setLoading } = useContext(GlobalContext);
  const [master, setMaster] = useState({ bloodTypes: [], states: [], languages: [] });
  const [enabledBT, setEnabledBT] = useState(new Set());
  const [enabledST, setEnabledST] = useState(new Set());
  const [enabledLG, setEnabledLG] = useState(new Set());
  const [defaultLanguage, setDefaultLanguage] = useState("en");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/india-content`, {
        headers: { Authorization: sessionStorage.getItem("auth") },
      });
      const d = res?.data?.data || {};
      setMaster({
        bloodTypes: d.bloodTypes || [],
        states: d.states || [],
        languages: d.languages || [],
      });
      setEnabledBT(new Set(d.enabled?.bloodTypes || []));
      setEnabledST(new Set(d.enabled?.states || []));
      setEnabledLG(new Set(d.enabled?.languages || []));
      setDefaultLanguage(d.defaultLanguage || "en");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = (set, setter) => (code) => {
    const next = new Set(set);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setter(next);
  };

  const selectAll = (master, setter, key) => () => {
    setter(new Set(master.map((m) => m[key])));
  };
  const selectNone = (setter) => () => setter(new Set());
  const selectPrimary = () => {
    setEnabledBT(new Set(master.bloodTypes.filter((b) => b.primary).map((b) => b.code)));
  };
  const selectStatesOnly = () => {
    setEnabledST(new Set(master.states.filter((s) => s.type === "state").map((s) => s.code)));
  };

  const save = async () => {
    try {
      setBusy(true);
      const payload = {
        enabledBloodTypes: Array.from(enabledBT),
        enabledStates: Array.from(enabledST),
        enabledLanguages: Array.from(enabledLG),
        defaultLanguage,
      };
      await axios.post(`${import.meta.env.VITE_API_URL}/updatesetting`, payload, {
        headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" },
      });
      swal("Success", "India content settings saved", "success");
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to save", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SEO title="India Content" />
      <div className="content-wrapper pt-5">
        <p className="card-title p-0 m-0 mb-3">India-Specific Content</p>

        {/* ===== Blood Types ===== */}
        <Section
          title="Blood Types"
          desc="Pick which blood groups appear in donor/request dropdowns. 8 main groups are the recommended default."
          count={enabledBT.size}
        >
          <div className="mb-3 d-flex flex-wrap" style={{ gap: 8 }}>
            <button className="btn btn-sm btn-outline-primary" onClick={selectPrimary}>8 main groups only</button>
            <button className="btn btn-sm btn-outline-primary" onClick={selectAll(master.bloodTypes, setEnabledBT, "code")}>All</button>
            <button className="btn btn-sm btn-outline-secondary" onClick={selectNone(setEnabledBT)}>None</button>
          </div>

          <div className="mb-2 text-muted small fw-bold text-uppercase" style={{ letterSpacing: 0.5 }}>
            Primary groups
          </div>
          <div className="mb-3">
            {master.bloodTypes.filter((b) => b.primary).map((b) => (
              <Pill
                key={b.code}
                active={enabledBT.has(b.code)}
                onClick={() => toggle(enabledBT, setEnabledBT)(b.code)}
                color="#C0392B"
              >
                {b.code} <span style={{ opacity: 0.7, fontSize: 11, marginLeft: 4 }}>{b.label}</span>
              </Pill>
            ))}
          </div>

          <div className="mb-2 text-muted small fw-bold text-uppercase" style={{ letterSpacing: 0.5 }}>
            Subtypes & rare groups
          </div>
          <div>
            {master.bloodTypes.filter((b) => !b.primary).map((b) => (
              <Pill
                key={b.code}
                active={enabledBT.has(b.code)}
                onClick={() => toggle(enabledBT, setEnabledBT)(b.code)}
                color="#7C3AED"
              >
                {b.code} <span style={{ opacity: 0.7, fontSize: 11, marginLeft: 4 }}>{b.label}</span>
              </Pill>
            ))}
          </div>
        </Section>

        {/* ===== States ===== */}
        <Section
          title="Indian States & Union Territories"
          desc="Picks the geographic scope of the platform. States = 28 official states, UTs = 8 union territories."
          count={enabledST.size}
        >
          <div className="mb-3 d-flex flex-wrap" style={{ gap: 8 }}>
            <button className="btn btn-sm btn-outline-primary" onClick={selectStatesOnly}>28 states only</button>
            <button className="btn btn-sm btn-outline-primary" onClick={selectAll(master.states, setEnabledST, "code")}>All (states + UTs)</button>
            <button className="btn btn-sm btn-outline-secondary" onClick={selectNone(setEnabledST)}>None</button>
          </div>

          <div className="mb-2 text-muted small fw-bold text-uppercase" style={{ letterSpacing: 0.5 }}>
            28 States
          </div>
          <div className="mb-3">
            {master.states.filter((s) => s.type === "state").map((s) => (
              <Pill
                key={s.code}
                active={enabledST.has(s.code)}
                onClick={() => toggle(enabledST, setEnabledST)(s.code)}
                color="#16A34A"
              >
                {s.name}
              </Pill>
            ))}
          </div>

          <div className="mb-2 text-muted small fw-bold text-uppercase" style={{ letterSpacing: 0.5 }}>
            8 Union Territories
          </div>
          <div>
            {master.states.filter((s) => s.type === "ut").map((s) => (
              <Pill
                key={s.code}
                active={enabledST.has(s.code)}
                onClick={() => toggle(enabledST, setEnabledST)(s.code)}
                color="#0EA5E9"
              >
                {s.name}
              </Pill>
            ))}
          </div>
        </Section>

        {/* ===== Languages ===== */}
        <Section
          title="Languages"
          desc="Toggle which language options are exposed in the user app. The default language is what new users start with."
          count={enabledLG.size}
        >
          <div className="mb-3 d-flex flex-wrap" style={{ gap: 8 }}>
            <button className="btn btn-sm btn-outline-primary" onClick={selectAll(master.languages, setEnabledLG, "code")}>All</button>
            <button className="btn btn-sm btn-outline-secondary" onClick={selectNone(setEnabledLG)}>None</button>
          </div>

          <div className="mb-3">
            {master.languages.map((l) => (
              <Pill
                key={l.code}
                active={enabledLG.has(l.code)}
                onClick={() => toggle(enabledLG, setEnabledLG)(l.code)}
                color="#F59E0B"
              >
                {l.name} <span style={{ opacity: 0.75, fontSize: 12, marginLeft: 6 }}>{l.nativeName}</span>
              </Pill>
            ))}
          </div>

          <div className="row g-3 align-items-end mt-2">
            <div className="col-12 col-md-4">
              <label className="form-label small fw-bold text-muted text-uppercase" style={{ letterSpacing: 0.5 }}>
                Default Language (for new users)
              </label>
              <select
                className="form-control"
                style={{ height: 40 }}
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value)}
              >
                {master.languages
                  .filter((l) => enabledLG.has(l.code))
                  .map((l) => (
                    <option key={l.code} value={l.code}>{l.name} ({l.nativeName})</option>
                  ))}
              </select>
              {!enabledLG.has(defaultLanguage) && (
                <small className="text-danger">
                  Current default isn't in the enabled list — pick a different default or enable it above.
                </small>
              )}
            </div>
          </div>
        </Section>

        {/* ===== Save ===== */}
        <div className="d-flex justify-content-end mb-5">
          <button className="btn btn-primary" disabled={busy} onClick={save}>
            {busy ? "Saving…" : "Save India Content Settings"}
          </button>
        </div>
      </div>
    </>
  );
};

export default IndiaContent;
