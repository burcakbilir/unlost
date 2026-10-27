import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";

// One family for everything; headings differ by weight and tracking only.
// `subsets` only picks what gets preloaded: Turkish letters (latin-ext) still
// load on demand when a page uses them.
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Unlost — Find what you saved",
  description:
    "Collect your links, screenshots and thoughts in one place. Unlost brings back what you'd otherwise forget, right when you need it.",
  keywords: [
    "personal knowledge management",
    "bookmarks",
    "notes",
    "digital memory",
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The CSP nonce from src/proxy.ts is per request, so pages must render per
  // request too; a page prerendered at build time would carry no nonce and its
  // scripts would be blocked.
  await connection();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geist.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
