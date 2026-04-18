export default function notFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ss-bg-primary)',
        color: 'var(--ss-text-secondary)',
        fontFamily: 'Inter, sans-serif',
        gap: '1rem',
      }}
    >
      <span style={{ fontSize: '3rem', opacity: 0.3 }}>🔐</span>
      <h1 style={{ color: 'var(--ss-text-primary)', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
        404 – Not Found
      </h1>
      <a
        href="/"
        style={{
          color: 'var(--ss-accent)',
          textDecoration: 'none',
          fontSize: '0.875rem',
          opacity: 0.8,
        }}
      >
        ← Back to Suite
      </a>
    </main>
  );
}
