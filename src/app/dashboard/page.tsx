import type { Metadata } from "next";
import { LibraryDashboard } from "@/features/library/components/library-dashboard";

export const metadata: Metadata = {
  title: "Kütüphane — Unlost",
  description: "Kaydettiğin linkleri, notları ve görselleri ara, filtrele ve düzenle.",
};

export default function DashboardPage() {
  return <LibraryDashboard />;
}
