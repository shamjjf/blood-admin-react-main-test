import { useContext, useRef, useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { GlobalContext } from "../GlobalContext";

// Bulk-import members from an .xlsx / .xls / .csv file. The spreadsheet is parsed
// client-side (SheetJS) and every cell is validated before anything is sent to
// /users/import (which then UPSERTS — updates an existing member's profile or
// creates a new account). Columns (headers matched loosely, case-insensitive):
//   Sr. No.      → numbers only; display-only, never written to the DB
//   Name         → alphabets (and spaces) only
//   Email        → valid email, any domain
//   Mobile No.   → "+<countrycode><number>" e.g. +918877996644; length is
//                  validated per the country code
//   Blood Group  → one of the 8 standard groups (case-insensitive)
//   State        → must be a valid Indian state / UT (case-insensitive)
//   City         → free text, normalised to Title Case

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Name: starts with a letter, then letters / spaces / . ' - (no digits/symbols).
const NAME_RE = /^[A-Za-z][A-Za-z .'-]*$/;

const VALID_BG = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// White button with red text — readable on the red modal header/footer.
const WHITE_RED_BTN = {
  background: "#FFFFFF",
  color: "#9C0C0D",
  border: "1px solid #FFFFFF",
  fontWeight: 700,
  boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
};

// Expected national-number length (digits AFTER the country code), min–max.
// Unknown codes fall back to a permissive 6–14.
const COUNTRY_LEN = {
  "1": [10, 10], "7": [10, 10], "20": [10, 10], "27": [9, 9], "33": [9, 9],
  "34": [9, 9], "39": [9, 10], "44": [10, 10], "49": [10, 11], "52": [10, 10],
  "55": [10, 11], "60": [9, 10], "61": [9, 9], "62": [9, 11], "63": [10, 10],
  "64": [8, 9], "65": [8, 8], "66": [9, 9], "81": [10, 11], "82": [9, 10],
  "84": [9, 10], "86": [11, 11], "90": [10, 10], "91": [10, 10], "92": [10, 10],
  "94": [9, 9], "234": [10, 10], "351": [9, 9], "352": [9, 9], "353": [9, 9],
  "852": [8, 8], "880": [10, 10], "966": [9, 9], "971": [9, 9], "977": [10, 10],
};
// Known codes, longest-first so we match "971" before "97"/"9".
const KNOWN_CODES = Object.keys(COUNTRY_LEN).sort((a, b) => b.length - a.length);

// Indian states + union territories (canonical casing).
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
];
const STATE_MAP = new Map(INDIAN_STATES.map((s) => [s.toLowerCase(), s]));

const titleCase = (s) =>
  String(s).trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// Parse a mobile cell into { phoneCode, phone } and validate length per code.
const parseMobile = (raw) => {
  const digits = String(raw ?? "").replace(/[^\d]/g, ""); // drops the leading +
  if (!digits) return { ok: false, reason: "Missing mobile no." };
  for (const code of KNOWN_CODES) {
    if (digits.startsWith(code)) {
      const num = digits.slice(code.length);
      const [min, max] = COUNTRY_LEN[code];
      if (num.length >= min && num.length <= max)
        return { ok: true, phoneCode: code, phone: num };
      return {
        ok: false,
        reason: `+${code} number must be ${min === max ? min : `${min}-${max}`} digits`,
      };
    }
  }
  // No recognised country code. A bare 10-digit number is assumed Indian (+91).
  if (digits.length === 10) return { ok: true, phoneCode: "91", phone: digits };
  return { ok: false, reason: "Unrecognised country code — use e.g. +91XXXXXXXXXX" };
};

// Find the spreadsheet column whose header loosely matches one of `needles`.
const resolveKeys = (sampleRow) => {
  const keys = Object.keys(sampleRow || {});
  const find = (needles, avoid = []) =>
    keys.find((k) => {
      const lk = String(k).toLowerCase().trim();
      if (avoid.some((a) => lk.includes(a))) return false;
      return needles.some((n) => lk.includes(n));
    });
  return {
    srNo: find(["sr", "s.no", "serial", "#"]),
    name: find(["name"]),
    email: find(["email", "e-mail", "mail"]),
    phone: find(["mobile", "phone", "contact", "number"]),
    bloodGroup: find(["blood", "group", "bg"]),
    state: find(["state", "province"]),
    city: find(["city", "town", "district"]),
  };
};

// Validate + normalise one parsed row. Returns the cleaned record plus an
// `errors` array (empty = importable).
const validateRow = (rec) => {
  const errors = [];

  const name = String(rec.name || "").trim();
  if (!name) errors.push("Name is required");
  else if (!NAME_RE.test(name)) errors.push("Name must contain alphabets only");

  const email = String(rec.email || "").trim().toLowerCase();
  if (!email) errors.push("Email is required");
  else if (!EMAIL_RE.test(email)) errors.push("Invalid email format");

  const mobile = parseMobile(rec.phone);
  if (!mobile.ok) errors.push(mobile.reason);

  // Blood group — optional, but if present must be valid.
  let bloodGroup = "";
  if (String(rec.bloodGroup || "").trim()) {
    const bg = String(rec.bloodGroup).trim().toUpperCase().replace(/\s+/g, "");
    if (VALID_BG.includes(bg)) bloodGroup = bg;
    else errors.push("Invalid blood group");
  }

  // State — optional, but if present must be a recognised state/UT.
  let state = "";
  if (String(rec.state || "").trim()) {
    const canon = STATE_MAP.get(String(rec.state).trim().toLowerCase());
    if (canon) state = canon;
    else errors.push("Unknown state name");
  }

  const city = String(rec.city || "").trim() ? titleCase(rec.city) : "";

  return {
    srNo: rec.srNo,
    name,
    email,
    phoneCode: mobile.ok ? mobile.phoneCode : "",
    phone: mobile.ok ? mobile.phone : "",
    mobileDisplay: mobile.ok ? `+${mobile.phoneCode}${mobile.phone}` : String(rec.phone || ""),
    bloodGroup,
    state,
    city,
    errors,
    valid: errors.length === 0,
  };
};

const ImportUsersModal = ({ onClose, onImported }) => {
  const { alert } = useContext(GlobalContext);
  const fileInputRef = useRef(null);

  const [rows, setRows] = useState([]); // validated records
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const validRows = rows.filter((r) => r.valid);
  const invalidCount = rows.length - validRows.length;

  // Build + download a correctly-formatted sample spreadsheet.
  const downloadSample = () => {
    const header = ["Sr. No.", "Name", "Email", "Mobile No.", "Blood Group", "State", "City"];
    const sample = [
      { "Sr. No.": 1, Name: "Ravi Kumar", Email: "ravi.kumar@example.com", "Mobile No.": "+918877996644", "Blood Group": "O+", State: "Maharashtra", City: "Pune" },
      { "Sr. No.": 2, Name: "Anita Sharma", Email: "anita@example.com", "Mobile No.": "+919812345678", "Blood Group": "A-", State: "Karnataka", City: "Bengaluru" },
    ];
    const ws = XLSX.utils.json_to_sheet(sample, { header });
    ws["!cols"] = [{ wch: 7 }, { wch: 18 }, { wch: 26 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(wb, "members-import-sample.xlsx");
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setParsing(true);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(new Uint8Array(ev.target.result), { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (!raw.length) {
          setRows([]);
          alert({ type: "warning", title: "Empty file", text: "The file has no data rows." });
          return;
        }
        const keys = resolveKeys(raw[0]);
        if (!keys.email && !keys.phone) {
          setRows([]);
          alert({
            type: "error",
            title: "Missing columns",
            text: "Could not find Email / Mobile No. columns. Download the sample format and match the headers.",
          });
          return;
        }
        const mapped = raw
          .map((r) =>
            validateRow({
              srNo: keys.srNo ? r[keys.srNo] : "",
              name: keys.name ? r[keys.name] : "",
              email: keys.email ? r[keys.email] : "",
              phone: keys.phone ? r[keys.phone] : "",
              bloodGroup: keys.bloodGroup ? r[keys.bloodGroup] : "",
              state: keys.state ? r[keys.state] : "",
              city: keys.city ? r[keys.city] : "",
            })
          )
          // Drop fully-blank rows (trailing empties are common in spreadsheets).
          .filter((r) => r.name || r.email || r.phone);
        setRows(mapped);
      } catch (err) {
        console.error(err);
        setRows([]);
        alert({
          type: "error",
          title: "Unreadable file",
          text: "Could not read this file. Please upload a valid .xlsx / .xls / .csv.",
        });
      } finally {
        setParsing(false);
      }
    };
    reader.onerror = () => {
      setParsing(false);
      alert({ type: "error", title: "Read failed", text: "Failed to read the file." });
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!validRows.length) return;
    try {
      setImporting(true);
      const payload = validRows.map((r) => ({
        name: r.name,
        email: r.email,
        phoneCode: r.phoneCode,
        phone: r.phone,
        bloodGroup: r.bloodGroup,
        state: r.state,
        city: r.city,
      }));
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/users/import`,
        { users: payload },
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      const data = res.data?.data || {};
      setResult(data);
      alert({
        type: data.created > 0 || data.updated > 0 ? "success" : "info",
        title: "Import complete",
        text: data.message || `Imported ${data.created || 0} member(s).`,
      });
      if ((data.created > 0 || data.updated > 0) && typeof onImported === "function") onImported();
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Import failed";
      alert({ type: "error", title: "Import failed", text: msg });
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setRows([]);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="add-form-holder d-flex justify-content-center align-items-center">
      <div className="myupdatedcard add-admin" style={{ maxWidth: 820, width: "94%" }}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="m-0">Import Members</h5>
            <button
              type="button"
              onClick={onClose}
              style={{ background: "transparent", border: "none", fontSize: 22, lineHeight: 1, cursor: "pointer", color: "#6B7280" }}
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          <p className="text-muted" style={{ fontSize: 13, marginBottom: 12 }}>
            Upload an Excel/CSV file with these columns:{" "}
            <strong>Sr. No.</strong>, <strong>Name</strong>, <strong>Email</strong>,{" "}
            <strong>Mobile No.</strong> (e.g. <code>+918877996644</code>),{" "}
            <strong>Blood Group</strong>, <strong>State</strong> and <strong>City</strong>.
            Existing members (matched by email/phone) are <strong>updated</strong>; new
            ones are created. <em>Sr. No.</em> is ignored.
          </p>

          {/* Download sample format */}
          <div className="mb-3">
            <button type="button" className="btn btn-sm" style={WHITE_RED_BTN} onClick={downloadSample}>
              <i className="bi bi-download" /> Download Sample Format
            </button>
          </div>

          {/* Step 1 — file picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFile}
            className="form-control"
            disabled={importing}
          />

          {parsing && <p className="mt-3 mb-0">Reading file…</p>}

          {/* Step 2 — parsed preview */}
          {!parsing && rows.length > 0 && !result && (
            <div className="mt-3">
              <div className="d-flex flex-wrap gap-3 mb-2" style={{ fontSize: 13 }}>
                <span><strong>{rows.length}</strong> rows found</span>
                <span style={{ color: "#16A34A" }}><strong>{validRows.length}</strong> valid</span>
                {invalidCount > 0 && (
                  <span style={{ color: "#DC2626" }}>
                    <strong>{invalidCount}</strong> with errors (will be skipped)
                  </span>
                )}
              </div>
              <div className="table-responsive" style={{ maxHeight: 300, overflow: "auto", border: "1px solid #eee", borderRadius: 8 }}>
                <table className="table table-sm m-0" style={{ fontSize: 12.5 }}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th>Blood</th>
                      <th>State</th>
                      <th>City</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 50).map((r, i) => (
                      <tr key={i} style={r.valid ? undefined : { background: "#FEF2F2" }}>
                        <td>{i + 1}</td>
                        <td>{r.name || <span className="text-danger">—</span>}</td>
                        <td>{r.email || <span className="text-danger">—</span>}</td>
                        <td>{r.mobileDisplay || <span className="text-danger">—</span>}</td>
                        <td>{r.bloodGroup || <span className="text-muted">—</span>}</td>
                        <td>{r.state || <span className="text-muted">—</span>}</td>
                        <td>{r.city || <span className="text-muted">—</span>}</td>
                        <td>
                          {r.valid ? (
                            <span style={{ color: "#16A34A", fontWeight: 600 }}>✓ Valid</span>
                          ) : (
                            <span style={{ color: "#DC2626" }} title={r.errors.join("; ")}>
                              {r.errors[0]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 50 && (
                <p className="text-muted mt-1 mb-0" style={{ fontSize: 12 }}>
                  Showing first 50 of {rows.length} rows.
                </p>
              )}
            </div>
          )}

          {/* Step 3 — result summary */}
          {result && (
            <div className="mt-3">
              <div className="d-flex flex-wrap gap-3 mb-2" style={{ fontSize: 14 }}>
                <span style={{ color: "#16A34A" }}><strong>{result.created}</strong> created</span>
                <span style={{ color: "#2563EB" }}><strong>{result.updated || 0}</strong> updated</span>
                <span style={{ color: "#DC2626" }}><strong>{result.skippedCount}</strong> skipped</span>
                <span className="text-muted">of {result.total} total</span>
              </div>
              {result.skipped?.length > 0 && (
                <div className="table-responsive" style={{ maxHeight: 220, overflow: "auto", border: "1px solid #eee", borderRadius: 8 }}>
                  <table className="table table-sm m-0" style={{ fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th>Row</th>
                        <th>Email</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.skipped.map((s, i) => (
                        <tr key={i}>
                          <td>{s.row || "—"}</td>
                          <td>{s.email || "—"}</td>
                          <td>{s.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Footer actions */}
          <div className="text-end mt-4 d-flex justify-content-end gap-3">
            {result ? (
              <>
                <button type="button" className="btn" style={WHITE_RED_BTN} onClick={reset}>
                  Import Another
                </button>
                <button type="button" className="btn" style={WHITE_RED_BTN} onClick={onClose}>
                  Done
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn" style={WHITE_RED_BTN} onClick={onClose} disabled={importing}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn"
                  style={WHITE_RED_BTN}
                  onClick={handleImport}
                  disabled={importing || validRows.length === 0}
                >
                  {importing ? "Importing…" : `Import ${validRows.length || ""} Member${validRows.length === 1 ? "" : "s"}`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportUsersModal;
