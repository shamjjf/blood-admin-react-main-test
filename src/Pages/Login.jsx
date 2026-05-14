import { useContext, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { GlobalContext } from "../GlobalContext";
import logo from "../Assets/images/life-logo.png";
import SEO from "../SEO";

const Login = () => {
  const { dispatch, setLoading, alert } = useContext(GlobalContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ emailId: "", password: "" });
  const [errors, setErrors] = useState({});
  const [passwordShow, setPasswordShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    let e = {};
    let ok = true;
    if (!formData.emailId) { e.emailId = "Email is required."; ok = false; }
    else if (!/^\S+@\S+\.\S+$/.test(formData.emailId)) { e.emailId = "Invalid email format."; ok = false; }
    setErrors(e);
    return ok;
  };

  const handelChange = (ev) => setFormData({ ...formData, [ev.target.name]: ev.target.value });

  const handelSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      setLoading(true);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/signin`, { ...formData }, { headers: { "Content-Type": "application/json" } });
      if (res.status === 200) { dispatch({ type: "SIGNIN", payload: res.data.token }); navigate("/"); }
      else alert({ type: "warning", title: "Warning!", text: res.error });
    } catch (err) { console.log(err); }
    finally { setLoading(false); setSubmitting(false); }
  };

  return (
    <div style={styles.page}>
      <SEO title="Login" />

      {/* Left Panel */}
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.dropWrap}>
            <svg viewBox="0 0 24 24" fill="white" style={{ width: 32, height: 32 }}>
              <path d="M12 2C8.5 8.5 4 12 4 16.5a8 8 0 0016 0C20 12 15.5 8.5 12 2z"/>
            </svg>
          </div>
          <div style={styles.leftTitle}>Life Saver Army</div>
          <div style={styles.leftSub}>ADMIN PANEL</div>
          <div style={styles.divider}/>
          <div style={styles.leftDesc}>
            Manage blood donation requests, users, volunteers, and camps from a single powerful dashboard.
          </div>
          <div style={styles.statsRow}>
            {[["🩸", "Blood Requests"], ["👥", "Registered Users"], ["🏥", "Blood Banks"]].map(([icon, label]) => (
              <div key={label} style={styles.statPill}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={styles.statLabel}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={styles.leftFooter}>Every Drop Matters · Life Saver Army</div>
      </div>

      {/* Right Panel — Form */}
      <div style={styles.rightPanel}>
        <div style={styles.card}>
          <img src={logo} alt="logo" style={styles.logo} />
          <div style={styles.greeting}>Welcome back 👋</div>
          <div style={styles.subGreet}>Sign in to your admin account</div>

          <form onSubmit={handelSubmit} style={{ width: "100%" }}>
            {/* Email */}
            <div style={styles.fieldWrap}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrap}>
                <i className="ti ti-mail" style={styles.inputIcon}/>
                <input
                  type="email" name="emailId" value={formData.emailId}
                  onChange={handelChange} placeholder="admin@example.com"
                  style={{ ...styles.input, borderColor: errors.emailId ? "#ef4444" : "rgba(0,0,0,0.12)" }}
                />
              </div>
              {errors.emailId && <div style={styles.err}>{errors.emailId}</div>}
            </div>

            {/* Password */}
            <div style={styles.fieldWrap}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrap}>
                <svg style={styles.inputIcon} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                <input
                  type={passwordShow ? "text" : "password"} name="password" value={formData.password}
                  onChange={handelChange} placeholder="Enter your password" required
                  style={{ ...styles.input, paddingRight: 42, borderColor: errors.password ? "#ef4444" : "rgba(0,0,0,0.12)" }}
                />
                <span
                  onClick={() => setPasswordShow(!passwordShow)}
                  style={styles.eyeIcon}
                  role="button"
                  aria-label={passwordShow ? "Hide password" : "Show password"}
                >
                  {passwordShow ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 3l18 18" />
                      <path d="M10.584 10.587a2 2 0 0 0 2.828 2.83" />
                      <path d="M9.363 5.365A9.466 9.466 0 0 1 12 5c4 0 7.333 2.333 10 7a13.16 13.16 0 0 1 -1.5 2.43m-2.07 2.08C16.61 17.83 14.48 19 12 19c-4 0-7.333 -2.333 -10 -7a13.07 13.07 0 0 1 3.825 -4.575" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 5c-4 0-7.333 2.333-10 7c2.667 4.667 6 7 10 7s7.333-2.333 10-7c-2.667-4.667-6-7-10-7z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  )}
                </span>
              </div>
              {errors.password && <div style={styles.err}>{errors.password}</div>}
            </div>

            <button type="submit" disabled={submitting} style={styles.btn}>
              {submitting
                ? <><div style={styles.spinner}/> Signing in…</>
                : <><i className="ti ti-login" style={{ marginRight: 8 }}/> Sign In</>}
            </button>
          </form>

          <div style={styles.footNote}>
            Life Saver Army Admin · Secure Access
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: { display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#F7F4F1" },
  leftPanel: {
    width: "45%", background: "linear-gradient(160deg, #0d0d0d 0%, #1a0a0a 50%, #2d0a0a 100%)",
    display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px",
    position: "relative", overflow: "hidden",
  },
  leftContent: { position: "relative", zIndex: 2 },
  dropWrap: {
    width: 56, height: 56, borderRadius: 14, background: "#C0392B",
    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  leftTitle: { fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "white", letterSpacing: -0.5 },
  leftSub: { fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: 2, marginTop: 4 },
  divider: { width: 48, height: 3, background: "#C0392B", borderRadius: 99, margin: "24px 0" },
  leftDesc: { fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: 360 },
  statsRow: { display: "flex", flexDirection: "column", gap: 12, marginTop: 36 },
  statPill: {
    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
    background: "rgba(255,255,255,0.06)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)",
  },
  statLabel: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 },
  leftFooter: { fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: 0.5 },
  rightPanel: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px",
  },
  card: {
    background: "white", borderRadius: 20, padding: "48px 40px", width: "100%", maxWidth: 440,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
    display: "flex", flexDirection: "column", alignItems: "center",
  },
  logo: { height: 48, marginBottom: 24, objectFit: "contain" },
  greeting: { fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: "#111", letterSpacing: -0.3 },
  subGreet: { fontSize: 14, color: "#717171", marginTop: 6, marginBottom: 32 },
  fieldWrap: { width: "100%", marginBottom: 20 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 },
  inputWrap: { position: "relative" },
  inputIcon: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 17, color: "#9ca3af" },
  input: {
    width: "100%", height: 46, paddingLeft: 42, paddingRight: 16, border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none",
    background: "#FAFAFA", boxSizing: "border-box", transition: "border-color 0.15s",
  },
  eyeIcon: {
    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
    fontSize: 17, color: "#9ca3af", cursor: "pointer",
  },
  err: { fontSize: 12, color: "#ef4444", marginTop: 5, fontWeight: 500 },
  btn: {
    width: "100%", height: 48, background: "#C0392B", color: "white", border: "none", borderRadius: 10,
    fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne', sans-serif",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8,
    transition: "background 0.15s",
  },
  spinner: {
    width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite",
  },
  footNote: { fontSize: 11, color: "#9ca3af", marginTop: 28, textAlign: "center" },
};

export default Login;
