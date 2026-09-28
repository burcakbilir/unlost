import type { Metadata } from "next";
import { LibraryDashboard } from "@/features/library/components/library-dashboard";

export const metadata: Metadata = {
  title: "Library — Unlost",
  description: "Search, filter and manage the links, notes and images you saved.",
};

export default function DashboardPage() {
  return <LibraryDashboard />;
}
