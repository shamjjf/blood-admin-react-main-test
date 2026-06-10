import { useContext, useRef, useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { GlobalContext } from "../GlobalContext";

// Bulk-import members from an .xlsx / .xls / .csv file. The spreadsheet is parsed
// client-side (SheetJS) into { name, email, phone } rows which are POSTed to
// /users/import. Column headers are matched loosely (case-insensitive contains)
// so "Phone Number", "Mobile", "E-mail" etc. all resolve.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Find the spreadsheet column whose header loosely matches one of `needles`.
const resolveKeys = (sampleRow) => {
  const keys = Object.keys(sampleRow || {});
  const find = (needles) =>
    keys.find((k) => {
      const lk = String(k).toLowerCase().trim();
      return needles.some((n) => lk.includes(n));
    });
  return {
    name: find(["name"]),
    email: find(["email", "e-mail", "mail"]),
    phone: find(["phone", "mobile", "contact", "number"]),
  };
};

const ImportUsersModal = ({ onClose, onImported }) => {
  const { alert } = useContext(GlobalContext);
  const fileInputRef = useRef(null);

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]); // [{ name, email, phone }]
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null); // { created, skippedCount, total, skipped[] }

  // How many parsed rows look importable (authoritative check still runs server-side).
  const validCount = rows.filter((r) => EMAIL_RE.test(r.email) && r.phone).length;

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
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
            text: "Could not find Email / Phone columns. Check the header row.",
          });
          return;
        }
        const mapped = raw
          .map((r) => ({
            name: String(keys.name ? r[keys.name] : "").trim(),
            email: String(keys.email ? r[keys.email] : "").trim().toLowerCase(),
            phone: String(keys.phone ? r[keys.phone] : "").replace(/\D/g, ""),
          }))
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
    if (!rows.length) return;
    try {
      setImporting(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/users/import`,
        { users: rows },
        { headers: { Authorization: sessionStorage.getItem("auth") } }
      );
      const data = res.data?.data || {};
      setResult(data);
      alert({
        type: data.created > 0 ? "success" : "info",
        title: "Import complete",
        text: data.message || `Imported ${data.created || 0} user(s).`,
      });
      if (data.created > 0 && typeof onImported === "function") onImported();
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
    setFileName("");
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="add-form-holder d-flex justify-content-center align-items-center">
      <div className="myupdatedcard add-admin" style={{ maxWidth: 640, width: "92%" }}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="m-0">Import Users</h5>
            <button
              type="button"
              onClick={onClose}
              style={{ background: "transparent", border: "none", fontSize: 22, lineHeight: 1, cursor: "pointer", color: "#6B7280" }}
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          <p className="text-muted" style={{ fontSize: 13, marginBottom: 16 }}>
            Upload an Excel/CSV file with <strong>Name</strong>, <strong>Email</strong> and{" "}
            <strong>Phone Number</strong> columns. New accounts are created with country code{" "}
            <strong>+91</strong>; existing emails/phones are skipped.
          </p>

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
                <span style={{ color: "#16A34A" }}><strong>{validCount}</strong> look valid</span>
                {rows.length - validCount > 0 && (
                  <span style={{ color: "#DC2626" }}>
                    <strong>{rows.length - validCount}</strong> missing email/phone
                  </span>
                )}
              </div>
              <div className="table-responsive" style={{ maxHeight: 240, overflow: "auto", border: "1px solid #eee", borderRadius: 8 }}>
                <table className="table table-sm m-0" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 20).map((r, i) => {
                      const bad = !EMAIL_RE.test(r.email) || !r.phone;
                      return (
                        <tr key={i} style={bad ? { background: "#FEF2F2" } : undefined}>
                          <td>{i + 1}</td>
                          <td>{r.name || <span className="text-muted">User</span>}</td>
                          <td>{r.email || <span className="text-danger">—</span>}</td>
                          <td>{r.phone || <span className="text-danger">—</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {rows.length > 20 && (
                <p className="text-muted mt-1 mb-0" style={{ fontSize: 12 }}>
                  Showing first 20 of {rows.length} rows.
                </p>
              )}
            </div>
          )}

          {/* Step 3 — result summary */}
          {result && (
            <div className="mt-3">
              <div className="d-flex flex-wrap gap-3 mb-2" style={{ fontSize: 14 }}>
                <span style={{ color: "#16A34A" }}><strong>{result.created}</strong> created</span>
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
                <button type="button" className="btn btn-outline-secondary" onClick={reset}>
                  Import Another
                </button>
                <button type="button" className="btn btn-primary" onClick={onClose}>
                  Done
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={importing}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleImport}
                  disabled={importing || rows.length === 0}
                >
                  {importing ? "Importing…" : `Import ${rows.length || ""} User${rows.length === 1 ? "" : "s"}`}
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
