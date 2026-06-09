/**
 * Shared empty-state block — an attractive blood-drop illustration (the LSA
 * brand mark) with the page's own icon nested inside the drop, above a short
 * message. Used everywhere a list/table/section has no data yet so every
 * "nothing here" screen across the admin looks the same and on-brand.
 *
 * Usage inside a table body (spans the row so it centers under the columns):
 *   <EmptyState colSpan={7} icon="ti ti-school" title="No institutions yet"
 *               subtitle="Click 'Add Institution' to begin." />
 *
 * Usage as a plain block (cards / grids / non-table sections):
 *   <EmptyState icon="ti ti-gift" title="No gifts in the catalog yet" />
 */
const EmptyState = ({
  icon = "ti ti-droplet",
  title = "Nothing here yet",
  subtitle,
  colSpan,
}) => {
  const content = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 14,
        padding: "46px 20px",
      }}
    >
      {/* Blood-drop hero with the page icon nested inside */}
      <div className="lsa-empty-drop" style={{ position: "relative", width: 104, height: 120 }}>
        <svg width="104" height="120" viewBox="0 0 104 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <linearGradient id="lsaDropGrad" x1="52" y1="6" x2="52" y2="114" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FD292F" />
              <stop offset="55%" stopColor="#D21C20" />
              <stop offset="100%" stopColor="#9C0C0D" />
            </linearGradient>
          </defs>
          {/* soft ground shadow */}
          <ellipse cx="52" cy="113" rx="30" ry="6" fill="#C0392B" opacity="0.14" />
          {/* droplet */}
          <path
            d="M52 6 C 40 32, 12 50, 12 74 a 40 40 0 1 0 80 0 C 92 50, 64 32, 52 6 Z"
            fill="url(#lsaDropGrad)"
          />
          {/* glossy highlight */}
          <ellipse cx="38" cy="60" rx="9" ry="15" fill="#ffffff" opacity="0.22" transform="rotate(-20 38 60)" />
        </svg>
        {/* page-specific icon, centered in the bulb of the drop */}
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 16,
            pointerEvents: "none",
          }}
        >
          <i className={icon} style={{ fontSize: 33, color: "#ffffff", lineHeight: 1 }} />
        </span>
      </div>

      <div style={{ fontSize: 16, fontWeight: 600, color: "#374151" }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: 13, color: "#9ca3af", maxWidth: 360, lineHeight: 1.5 }}>
          {subtitle}
        </div>
      )}
    </div>
  );

  // Inside a <tbody>, an EmptyState must live in a single full-width cell.
  if (colSpan) {
    return (
      <tr>
        <td colSpan={colSpan} style={{ border: "none", background: "transparent" }}>
          {content}
        </td>
      </tr>
    );
  }

  return content;
};

export default EmptyState;
