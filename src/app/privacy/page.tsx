import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy — Unlost",
  description: "What Unlost stores, what it sends to Google Gemini, and how to delete it.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-surface px-5 py-12 text-foreground">
      <article className="mx-auto max-w-2xl border border-border bg-background p-8 leading-7">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          unlost<span className="text-primary">.</span>
        </Link>
        <h1 className="mt-6 font-display text-4xl">Privacy</h1>
        <p className="mt-2 text-sm text-muted">Last updated: October 2026</p>

        <h2 className="mt-8 text-xl font-medium">What we store</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Your name, email address and a hashed (not readable) password.</li>
          <li>The links, notes and images you save, plus tags and image descriptions generated for search.</li>
          <li>Your Gemini API key, if you add one, encrypted.</li>
          <li>Short-lived request counters used to stop abuse, keyed by account, email or IP address.</li>
        </ul>

        <h2 className="mt-8 text-xl font-medium">What is sent to Google Gemini</h2>
        <p className="mt-2">
          Only if you add your own Gemini API key: the title, description and
          image of items you save (to generate tags and descriptions), your
          search questions, and — when you click &ldquo;Summarize with
          AI&rdquo; — the matching items. These requests use your key, under
          your agreement with Google. On Google&rsquo;s free tier, Google may
          use this content to improve its products and people may review it,
          so don&rsquo;t save anything sensitive. Without a key, nothing is sent
          to Google.
        </p>

        <h2 className="mt-8 text-xl font-medium">What we don&rsquo;t do</h2>
        <p className="mt-2">
          No ads, no analytics or tracking cookies, no selling or sharing of
          your data. The only cookie is the one that keeps you signed in.
        </p>

        <h2 className="mt-8 text-xl font-medium">Deleting your data</h2>
        <p className="mt-2">
          In Settings you can remove your API key at any time, or delete your
          account, which permanently deletes everything you saved.
        </p>
      </article>
    </main>
  );
}
