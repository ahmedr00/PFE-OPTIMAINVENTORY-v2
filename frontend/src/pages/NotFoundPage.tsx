export function NotFoundPage({ navigate }: { navigate: (path: string) => void }) {
  return (
    <section className="card">
      <p className="eyebrow">404</p>
      <h2>Page not found</h2>
      <p className="muted">The page you opened does not exist in the current SaaS back office.</p>
      <div className="actions">
        <button className="button primary" onClick={() => navigate("/app")}>
          Go to dashboard
        </button>
        <button className="button" onClick={() => navigate("/")}>
          Go to landing page
        </button>
      </div>
    </section>
  );
}
