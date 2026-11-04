import type{ Metadata } from "next";
import Link from "next/link";


export const metadata: Metadata ={
 title:"Page not found — Unlost"
}


export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-5 py-10">
      <Link href="/" aria-label="Unlost home" className="font-display text-xl">
        unlost.
      </Link>
      <h1 className="font-display text-3xl">Page not found.</h1>
      <p className="text-sm text-muted">The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
      <Link href="/" className="rounded-lg bg-foreground px-4 py-2 font-medium text-background transition-opacity hover:opacity-85">
        Back to home
      </Link>
    </main>
  );
}
