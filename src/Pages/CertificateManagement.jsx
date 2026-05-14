import { useContext, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";

// Used by the social-share preview to substitute placeholders into the
// admin's message template before showing the sample text.
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
      pdfUrl: "",
      pdfFileId: null,
      placeholders: {
        name: { x: 360, y: 460, size: 22 },
        date: { x: 330, y: 405, size: 16 },
        bloodGroup: { x: 760, y: 405, size: 16 },
      },
    },
    socialSharing: { whatsapp: true, facebook: true, instagram: true, twitter: false },
    socialShareMessage: "",
  });
  const [saving, setSaving] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);

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
          pdfUrl: s.certificateTemplate?.pdfUrl || "",
          pdfFileId: s.certificateTemplate?.pdfFileId || null,
          placeholders: {
            name: {
              x: Number(s.certificateTemplate?.placeholders?.name?.x ?? 360),
              y: Number(s.certificateTemplate?.placeholders?.name?.y ?? 460),
              size: Number(s.certificateTemplate?.placeholders?.name?.size ?? 22),
            },
            date: {
              x: Number(s.certificateTemplate?.placeholders?.date?.x ?? 330),
              y: Number(s.certificateTemplate?.placeholders?.date?.y ?? 405),
              size: Number(s.certificateTemplate?.placeholders?.date?.size ?? 16),
            },
            bloodGroup: {
              x: Number(s.certificateTemplate?.placeholders?.bloodGroup?.x ?? 760),
              y: Number(s.certificateTemplate?.placeholders?.bloodGroup?.y ?? 405),
              size: Number(s.certificateTemplate?.placeholders?.bloodGroup?.size ?? 16),
            },
          },
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

  // Uploads the designed certificate PDF using the existing S3 presigned POST
  // flow (/upload-test → S3 direct → /upload-ack), then stores the resulting
  // public URL + FileObject id on the form so saving the settings persists it.
  const uploadTemplatePdf = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (file.type !== "application/pdf") {
      swal("Wrong file type", "Please upload a PDF template", "warning");
      return;
    }
    try {
      setPdfUploading(true);
      const { name, size, type } = file;
      const presign = await axios.post(
        `${import.meta.env.VITE_API_UPLOAD}/upload-test`,
        { name, size, mime: type },
        { headers: { "content-type": "application/json" } }
      );
      const presignData = presign?.data?.data;
      const publicUrl = presign?.data?.url;
      if (!presignData?.url || !publicUrl) {
        throw new Error("Upload pre-sign failed");
      }

      const fd = new FormData();
      for (const [k, v] of Object.entries(presignData.fields)) fd.append(k, v);
      fd.append("file", file);
      const s3Resp = await fetch(presignData.url, { method: "POST", body: fd });
      if (!s3Resp.ok) throw new Error("S3 upload failed");

      // Mark the FileObject active so it isn't garbage-collected
      await axios.post(
        `${import.meta.env.VITE_API_UPLOAD}/upload-ack`,
        { fid: presignData._id },
        { headers: { "content-type": "application/json" } }
      );

      setForm((prev) => ({
        ...prev,
        certificateTemplate: {
          ...prev.certificateTemplate,
          pdfUrl: publicUrl,
          pdfFileId: presignData._id,
        },
      }));
      swal("Uploaded", "Template PDF uploaded. Save to apply.", "success");
    } catch (err) {
      console.error(err);
      swal("Upload failed", err?.message || "Could not upload template", "error");
    } finally {
      setPdfUploading(false);
    }
  };

  // Streams the rendered preview PDF from the backend so the admin can verify
  // placeholder placement without committing the coordinates yet. The blob URL
  // is shown in an <iframe> below the controls and revoked on the next preview.
  const previewPdf = async () => {
    if (!form.certificateTemplate.pdfUrl) {
      swal("No template", "Upload a PDF template first", "info");
      return;
    }
    try {
      setPreviewing(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/certificate-preview`,
        {
          placeholders: form.certificateTemplate.placeholders,
          sample: {
            name: "Jane Doe",
            date: "13 May 2026",
            bloodGroup: "AB+",
          },
        },
        {
          headers: { Authorization: sessionStorage.getItem("auth") },
          responseType: "blob",
        }
      );
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
      const blobUrl = URL.createObjectURL(res.data);
      setPreviewBlobUrl(blobUrl);
    } catch (err) {
      console.error(err);
      // Axios swallows the error body when responseType is "blob"; re-read it
      const text = await err?.response?.data?.text?.();
      let msg = "Preview failed";
      try {
        msg = JSON.parse(text || "{}").error || msg;
      } catch {
        if (text) msg = text;
      }
      swal("Preview failed", msg, "error");
    } finally {
      setPreviewing(false);
    }
  };

  const setPlaceholder = (field, axis, value) => {
    setForm((prev) => ({
      ...prev,
      certificateTemplate: {
        ...prev.certificateTemplate,
        placeholders: {
          ...prev.certificateTemplate.placeholders,
          [field]: {
            ...prev.certificateTemplate.placeholders[field],
            [axis]: Number(value) || 0,
          },
        },
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
              {[
                {
                  key: "certificateDigitalEnabled",
                  id: "digitalToggle",
                  title: "Digital Certificates",
                  desc: "Auto-issued on every approved donation. Free for the donor.",
                },
                {
                  key: "certificatePrintedEnabled",
                  id: "printedToggle",
                  title: "Printed (Paid) Certificates",
                  desc: "Donor pays courier charge; admin dispatches via Certificate Orders.",
                },
              ].map((m) => (
                <div key={m.key} className="col-md-6">
                  <label
                    htmlFor={m.id}
                    className="d-flex align-items-start gap-3 p-3 border rounded h-100"
                    style={{
                      cursor: "pointer",
                      background: form[m.key] ? "#FFFFFF" : "#FAFAFA",
                      borderColor: form[m.key] ? "#0d6efd" : "#E5E7EB",
                      transition: "all 0.15s",
                      marginBottom: 0,
                    }}
                  >
                    <div className="form-check form-switch m-0 ps-0" style={{ minWidth: 38 }}>
                      <input
                        type="checkbox"
                        role="switch"
                        className="form-check-input m-0"
                        id={m.id}
                        checked={form[m.key]}
                        onChange={(e) => setForm({ ...form, [m.key]: e.target.checked })}
                        style={{ width: 38, height: 20, cursor: "pointer" }}
                      />
                    </div>
                    <div>
                      <div className="fw-bold">{m.title}</div>
                      <div className="text-muted small mt-1">{m.desc}</div>
                    </div>
                  </label>
                </div>
              ))}
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

        {/* ===== PDF template (designed certificate) ===== */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5>Designed PDF Template</h5>
            <p className="small mb-0">
              Upload your designed certificate PDF (e.g. LSA Final.pdf). The
              backend overlays the donor's name, date, and blood group onto
              the placeholders below — coordinates are in PDF points from the
              bottom-left of the page.
            </p>
          </div>
          <div className="card-body">
            <div className="row g-3 align-items-center mb-3">
              <div className="col-md-7">
                <label className="form-label">Template PDF</label>
                <input
                  type="file"
                  accept="application/pdf"
                  className="form-control"
                  onChange={uploadTemplatePdf}
                  disabled={pdfUploading}
                />
                {pdfUploading && (
                  <small className="text-muted">Uploading…</small>
                )}
                {!pdfUploading && form.certificateTemplate.pdfUrl && (
                  <small className="text-success d-block mt-1">
                    <i className="ti ti-check"></i>{" "}
                    <a
                      href={form.certificateTemplate.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Currently uploaded template
                    </a>
                  </small>
                )}
              </div>
              <div className="col-md-5 text-md-end">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={previewPdf}
                  disabled={previewing || !form.certificateTemplate.pdfUrl}
                >
                  {previewing ? "Rendering…" : "Preview with sample data"}
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th style={{ width: 130 }}>X (from left)</th>
                    <th style={{ width: 130 }}>Y (from bottom)</th>
                    <th style={{ width: 110 }}>Font size</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: "name", label: "Donor name" },
                    { key: "date", label: "Donation date" },
                    { key: "bloodGroup", label: "Blood group" },
                  ].map(({ key, label }) => {
                    const slot = form.certificateTemplate.placeholders[key] || {};
                    return (
                      <tr key={key}>
                        <td>
                          <strong>{label}</strong>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={slot.x ?? 0}
                            onChange={(e) =>
                              setPlaceholder(key, "x", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={slot.y ?? 0}
                            onChange={(e) =>
                              setPlaceholder(key, "y", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={slot.size ?? 14}
                            onChange={(e) =>
                              setPlaceholder(key, "size", e.target.value)
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <small className="text-muted d-block">
              Tip: bump Y to move the text <strong>up</strong>; bump X to move
              it <strong>right</strong>. Hit "Preview" after each tweak to see
              the result without saving.
            </small>

            {previewBlobUrl && (
              <div className="mt-3">
                <label className="form-label">Live preview</label>
                <iframe
                  title="Certificate preview"
                  src={previewBlobUrl}
                  style={{
                    width: "100%",
                    height: 520,
                    border: "1px solid #E5E7EB",
                    borderRadius: 6,
                    background: "#FAFAFA",
                  }}
                />
              </div>
            )}
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
            <div className="row row-cols-2 row-cols-md-4 g-3 mb-3">
              {[
                { key: "whatsapp",  label: "WhatsApp",    icon: "ti ti-brand-whatsapp", color: "#25D366" },
                { key: "facebook",  label: "Facebook",    icon: "ti ti-brand-facebook", color: "#1877F2" },
                { key: "instagram", label: "Instagram",   icon: "ti ti-brand-instagram", color: "#E1306C" },
                { key: "twitter",   label: "Twitter / X", icon: "ti ti-brand-x",         color: "#000000" },
              ].map((p) => (
                <div key={p.key} className="col">
                  <div
                    onClick={() =>
                      setForm({
                        ...form,
                        socialSharing: { ...form.socialSharing, [p.key]: !form.socialSharing[p.key] },
                      })
                    }
                    style={{
                      border: form.socialSharing[p.key] ? `2px solid ${p.color}` : "1px solid #E5E7EB",
                      borderRadius: 10,
                      padding: "14px 16px",
                      cursor: "pointer",
                      background: form.socialSharing[p.key] ? "#FFFFFF" : "#FAFAFA",
                      transition: "all 0.15s",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div className="d-flex align-items-center" style={{ gap: 10, minWidth: 0 }}>
                      <i className={p.icon} style={{ fontSize: 22, color: p.color, flexShrink: 0 }}></i>
                      <span className="fw-bold text-truncate">{p.label}</span>
                    </div>
                    <div
                      className="form-check form-switch m-0 ps-0"
                      style={{ flexShrink: 0, marginRight: 56 }}
                    >
                      <input
                        type="checkbox"
                        role="switch"
                        className="form-check-input m-0"
                        checked={!!form.socialSharing[p.key]}
                        onChange={() => {}}
                        style={{ width: 38, height: 20, cursor: "pointer" }}
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
