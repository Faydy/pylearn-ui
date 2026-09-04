export default function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <section className="w-full max-w-md rounded-2xl border border-border bg-ink p-6 shadow-xl sm:p-8">
        <header className="mb-8 text-center">
          <p className="mb-2 text-3xl font-bold text-text-main">pyLearn</p>
          <h1 className="text-xl font-bold text-text-main">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>}
        </header>
        {children}
      </section>
    </main>
  );
}
