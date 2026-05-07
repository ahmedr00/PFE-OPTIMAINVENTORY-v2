export function CompteurPage() {
  return (
    <section className="card">
      <p className="eyebrow">Compteur access</p>
      <h2>Native mobile app planned</h2>
      <p className="muted">
        This role is intentionally blocked from the desktop back office. The backend terrain API is prepared for the
        future native mobile counting app.
      </p>
      <div className="kpi-row">
        <div>
          <strong>Blind</strong>
          <span>No theoretical quantities exposed</span>
        </div>
        <div>
          <strong>Offline-ready</strong>
          <span>Bulk sync endpoint prepared</span>
        </div>
        <div>
          <strong>Native later</strong>
          <span>React Native or Expo can use /api/terrain</span>
        </div>
      </div>
    </section>
  );
}
