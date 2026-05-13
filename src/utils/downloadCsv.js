// Triggers a CSV download from an admin endpoint. Adds the auth header,
// builds the query string, and pipes the response into a temporary <a>
// element so the browser fires the Save dialog.

import axios from "axios";

export const downloadCsv = async (path, params = {}, filename) => {
  try {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.set(k, v);
    });
    const url = `${import.meta.env.VITE_API_URL}${path}${query.toString() ? `?${query}` : ""}`;
    const res = await axios.get(url, {
      headers: { Authorization: sessionStorage.getItem("auth") },
      responseType: "blob",
    });
    const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename || `export-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl);
      a.remove();
    }, 0);
  } catch (err) {
    console.error("CSV download failed:", err);
    alert(err?.response?.data?.error || "Failed to download CSV");
  }
};
