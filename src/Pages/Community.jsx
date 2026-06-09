import { useContext, useEffect, useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import SEO from "../SEO";
import { GlobalContext } from "../GlobalContext";
import Tabs from "../Components/Tabs";

// Admin moderation of the community feed: hide / restore / remove posts.

const CAT_LABEL = {
  general: "💬 General",
  donation_experience: "🩸 Donation",
  camp_activity: "⛺ Camp",
  success_story: "🌟 Success",
};

const STATUS_COLORS = { active: "#22C55E", hidden: "#F59E0B", removed: "#EF4444" };
const statusBadge = (s) => ({
  padding: "2px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#fff",
  background: STATUS_COLORS[s] || "#94A3B8", textTransform: "capitalize", display: "inline-block",
});

const Community = () => {
  const { setLoading } = useContext(GlobalContext);
  const [statusFilter, setStatusFilter] = useState("All");
  const [items, setItems] = useState([]);

  const apiUrl = import.meta.env.VITE_API_URL;
  const authHeader = { Authorization: sessionStorage.getItem("auth") };

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/community/posts?status=${statusFilter}&n=50`, { headers: authHeader });
      setItems(res?.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const setStatus = async (id, status) => {
    try {
      setLoading(true);
      await axios.patch(`${apiUrl}/community/posts/${id}`, { status }, { headers: { ...authHeader, "Content-Type": "application/json" } });
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    const ok = await swal({ title: "Permanently delete post?", text: "This also deletes its comments.", icon: "warning", buttons: ["No", "Yes"], dangerMode: true });
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(`${apiUrl}/community/posts/${id}`, { headers: authHeader });
      await load();
    } catch (err) {
      swal("Error", err?.response?.data?.error || "Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Community Moderation" />
      <div className="content-wrapper pt-5">
        <div className="d-flex mb-3 justify-content-between align-items-center flex-wrap" style={{ gap: 12 }}>
          <p className="card-title p-0 m-0">🌍 Community Feed — Moderation</p>
        </div>

        <Tabs
          variant="pill"
          accent="#c0392b"
          active={statusFilter}
          onChange={setStatusFilter}
          tabs={{
            All: { label: "All", render: "" },
            active: { label: "Active", render: "" },
            hidden: { label: "Hidden", render: "" },
            removed: { label: "Removed", render: "" },
          }}
        />

        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover-removed my-table">
                <thead id="request-heading">
                  <tr>
                    <th className="align-left">Post</th>
                    <th className="align-left">Author</th>
                    <th className="align-left">Category</th>
                    <th className="align-left">Engagement</th>
                    <th className="align-left">Status</th>
                    <th className="align-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={6} className="align-center"><p className="m-5 p-5 fs-4">No posts.</p></td></tr>
                  ) : items.map((p) => (
                    <tr key={p._id}>
                      <td className="align-left">
                        <div className="d-flex align-items-start" style={{ gap: 8 }}>
                          {p.image?.url && <img src={p.image.url} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover" }} />}
                          <div className="text-muted small" style={{ maxWidth: 340, whiteSpace: "pre-wrap" }}>
                            {String(p.content || "").slice(0, 160)}{(p.content || "").length > 160 ? "…" : ""}
                          </div>
                        </div>
                      </td>
                      <td className="align-left">
                        <div className="fw-bold">{p.author?.name || "—"}</div>
                        <div className="text-muted small">{p.author?.email || ""}</div>
                      </td>
                      <td className="align-left">{CAT_LABEL[p.category] || p.category}</td>
                      <td className="align-left small">❤️ {p.likeCount || 0} · 💬 {p.commentCount || 0}</td>
                      <td className="align-left"><span style={statusBadge(p.status)}>{p.status}</span></td>
                      <td className="align-center">
                        {p.status !== "active" && <button className="btn btn-sm btn-outline-success me-2" onClick={() => setStatus(p._id, "active")}>Restore</button>}
                        {p.status === "active" && <button className="btn btn-sm btn-outline-warning me-2" onClick={() => setStatus(p._id, "hidden")}>Hide</button>}
                        <button className="btn btn-sm btn-outline-danger" onClick={() => remove(p._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Community;
