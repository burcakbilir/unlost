export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <a href="#top" aria-label="Sayfanın başına dön" className="text-lg font-semibold text-foreground">
          unlost<span className="text-primary">.</span>
        </a>
        <p>Kaydet. Düzenle. Yeniden keşfet.</p>
        <p>© 2026 Unlost</p>
      </div>
    </footer>
  );
}
