import { useContext, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";

const PLACEHOLDERS = ["{{name}}", "{{date}}", "{{bloodGroup}}", "{{units}}", "{{requestType}}", "{{orgName}}"];

// A small live-preview render using fake data.
const PREVIEW_DATA = {
  name: "Prathamesh Dhobale",
  date: "13 May 2026",
  bloodGroup: "AB+",
  units: "1",
  requestType: "Blood",
  orgName: "Life Saver Army",
};
const render = (text) =>
  (text || "").replace(/\{\{(\w+)\}\}/g, (_, k) => PREVIEW_DATA[k] ?? `{{${k}}}`);

const CertificateManagement = () => {
  const { setLoading } = useContext(GlobalContext);
  const [form, setForm] = useState({
    certificateDigitalEnabled: true,
    certificatePrintedEnabled: true,
    printedCertificateCourierCharge: 100,
    certificateTemplate: {
      title: "Certificate of Appreciation",
      bodyHtml: "",
      footerNote: "",
      signatureName: "",
    },
    socialSharing: { whatsapp: true, facebook: true, instagram: true, twitter: false },
    socialShareMessage: "",
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/settings`, {
        headers: { Authorization: sessionStorage.getItem("auth") },
      });
      const s = res?.data?.data?.setting || {};
      setForm({
        certificateDigitalEnabled: s.certificateDigitalEnabled !== false,
        certificatePrintedEnabled: s.certificatePrintedEnabled !== false,
        printedCertificateCourierCharge: Number(s.printedCertificateCourierCharge) || 100,
        certificateTemplate: {
          title: s.certificateTemplate?.title || "Certificate of Appreciation",
          bodyHtml: s.certificateTemplate?.bodyHtml || "",
          footerNote: s.certificateTemplate?.footerNote || "",
          signatureName: s.certificateTemplate?.signatureName || "",
        },
        socialSharing: {
          whatsapp:  s.socialSharing?.whatsapp  !== false,
          facebook:  s.socialSharing?.facebook  !== false,
          instagram: s.socialSharing?.instagram !== false,
          twitter:   s.socialSharing?.twitter   === true,
        },
        socialShareMessage: s.socialShareMessage || "",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/updatesetting`, form, {
        headers: { Authorization: sessionStorage.getItem("auth"), "Content-Type": "application/json" },
      });
      swal("Success", "Certificate settings updated", "success");
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const insertPlaceholder = (ph) => {
    setForm((prev) => ({
      ...prev,
      certificateTemplate: {
        ...prev.certificateTemplate,
        bodyHtml: (prev.certificateTemplate.bodyHtml || "") + " " + ph,
      },
    }));
  };

  return (
    <>
      <SEO title="Certificate Management" />
      <div className="content-wrapper pt-5">
        <p className="card-title p-0 m-0 mb-3">Certificate Management</p>

        {/* ===== Mode toggles ===== */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5>Certificate Modes</h5>
            <p className="small mb-0">Enable or disable digital and printed certificate flows.</p>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="digitalToggle"
                    checked={form.certificateDigitalEnabled}
                    onChange={(e) => setForm({ ...form, certificateDigitalEnabled: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="digitalToggle">
                    <strong>Digital Certificates</strong>
                    <div className="text-muted small">
                      Auto-issued on every approved donation. Free for the donor.
                    </div>
                  </label>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="printedToggle"
                    checked={form.certificatePrintedEnabled}
                    onChange={(e) => setForm({ ...form, certificatePrintedEnabled: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="printedToggle">
                    <strong>Printed (Paid) Certificates</strong>
                    <div className="text-muted small">
                      Donor pays courier charge; admin dispatches via Certificate Orders.
                    </div>
                  </label>
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Courier Charge (₹)</label>
                <input
                  type="number"
                  min={0}
                  className="form-control"
                  value={form.printedCertificateCourierCharge}
                  onChange={(e) =>
                    setForm({ ...form, printedCertificateCourierCharge: Number(e.target.value) || 0 })
                  }
                  disabled={!form.certificatePrintedEnabled}
                />
                <small className="text-muted">Charged at the time the donor places a printed-certificate order.</small>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Template editor + preview ===== */}
        <div className="row g-3 mb-4">
          {/* Editor */}
          <div className="col-lg-7">
            <div className="card h-100">
              <div className="card-header bg-primary text-white">
                <h5>Certificate Template</h5>
                <p className="small mb-0">Used to generate digital certificates and the printable PDF.</p>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Title</label>
                  <input
                    className="form-control"
                    value={form.certificateTemplate.title}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        certificateTemplate: { ...form.certificateTemplate, title: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label">Body</label>
                  <textarea
                    className="form-control"
                    rows={6}
                    value={form.certificateTemplate.bodyHtml}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        certificateTemplate: { ...form.certificateTemplate, bodyHtml: e.target.value },
                      })
                    }
                    placeholder="Write your certificate body. Use placeholders like {{name}}."
                  />
                </div>

                <div className="mb-3">
                  <small className="text-muted d-block mb-2">Insert placeholder:</small>
                  <div className="d-flex flex-wrap gap-2">
                    {PLACEHOLDERS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => insertPlaceholder(p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Footer Note</label>
                    <input
                      className="form-control"
                      value={form.certificateTemplate.footerNote}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          certificateTemplate: { ...form.certificateTemplate, footerNote: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Signature Name</label>
                    <input
                      className="form-control"
                      value={form.certificateTemplate.signatureName}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          certificateTemplate: { ...form.certificateTemplate, signatureName: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="col-lg-5">
            <div className="card h-100">
              <div className="card-header bg-primary text-white">
                <h5>Live Preview</h5>
                <p className="small mb-0">Sample data substituted into your template.</p>
              </div>
              <div className="card-body">
                <div
                  style={{
                    background: "#FFF8EC",
                    border: "8px double #C0392B",
                    padding: 24,
                    borderRadius: 8,
                    minHeight: 320,
                    textAlign: "center",
                    fontFamily: "'Georgia', serif",
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#C0392B", marginBottom: 16 }}>
                    {render(form.certificateTemplate.title)}
                  </div>
                  <div
                    style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}
                    dangerouslySetInnerHTML={{ __html: render(form.certificateTemplate.bodyHtml) }}
                  />
                  <div style={{ marginTop: 28, fontSize: 12, color: "#6B7280" }}>
                    {render(form.certificateTemplate.footerNote)}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, fontStyle: "italic", color: "#374151" }}>
                    — {render(form.certificateTemplate.signatureName)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Social sharing ===== */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5>Social Sharing</h5>
            <p className="small mb-0">
              Toggle which platforms show share buttons on the donor's certificate page in the client app.
            </p>
          </div>
          <div className="card-body">
            <div className="row g-3 mb-3">
              {[
                { key: "whatsapp",  label: "WhatsApp",  icon: "ti ti-brand-whatsapp", color: "#25D366" },
                { key: "facebook",  label: "Facebook",  icon: "ti ti-brand-facebook", color: "#1877F2" },
                { key: "instagram", label: "Instagram", icon: "ti ti-brand-instagram", color: "#E1306C" },
                { key: "twitter",   label: "Twitter / X", icon: "ti ti-brand-x",       color: "#000000" },
              ].map((p) => (
                <div key={p.key} className="col-md-3">
                  <div
                    style={{
                      border: form.socialSharing[p.key] ? `2px solid ${p.color}` : "1px solid #E5E7EB",
                      borderRadius: 10,
                      padding: 14,
                      cursor: "pointer",
                      background: form.socialSharing[p.key] ? "#FFFFFF" : "#FAFAFA",
                      transition: "all 0.15s",
                    }}
                    onClick={() =>
                      setForm({
                        ...form,
                        socialSharing: { ...form.socialSharing, [p.key]: !form.socialSharing[p.key] },
                      })
                    }
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <i className={p.icon} style={{ fontSize: 22, color: p.color }}></i>
                        <span className="ms-2 fw-bold">{p.label}</span>
                      </div>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={!!form.socialSharing[p.key]}
                        onChange={() => {}}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-2">
              <label className="form-label">Share Message Template</label>
              <textarea
                className="form-control"
                rows={3}
                value={form.socialShareMessage}
                onChange={(e) => setForm({ ...form, socialShareMessage: e.target.value })}
                placeholder="Text pre-filled when the user clicks Share. Use {{name}}, {{units}}, {{bloodGroup}} placeholders."
              />
              <small className="text-muted">
                Preview: <em>{render(form.socialShareMessage)}</em>
              </small>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end mb-5">
          <button className="btn btn-primary" disabled={saving} onClick={save}>
            {saving ? "Saving…" : "Save Certificate Settings"}
          </button>
        </div>
      </div>
    </>
  );
};

export default CertificateManagement;
