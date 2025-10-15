import Image from "next/image";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-slate-950/30 border-b border-light-subtle/50 dark:border-dark-subtle/60">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="Easy Script logo" width={36} height={36} className="rounded-xl" />
          <div className="text-xl font-semibold tracking-tight">Easy Script</div>
        </div>
        <nav className="flex items-center gap-2">
          <a href="https://example.com/docs" className="btn-ghost text-sm">Docs</a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
