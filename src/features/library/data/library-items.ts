import type { LibraryItem } from "@/features/library/types";

export const initialLibraryItems: LibraryItem[] = [
  {
    id: "noticing",
    type: "link",
    title: "The art of noticing",
    description: "Daha iyi fikirler için çevrendeki küçük detayları fark etmeyi öğren.",
    source: "medium.com",
    savedAt: "2 gün önce",
  },
  {
    id: "quiet-spaces",
    type: "note",
    title: "Sessiz çalışma alanları",
    description: "Gürültü seviyesi, priz ve internet kalitesiyle filtrelenen bir şehir rehberi.",
    source: "Kısa not",
    savedAt: "4 gün önce",
  },
  {
    id: "warm-ui",
    type: "image",
    title: "Warm minimal interfaces",
    description: "Steril görünmeden sade hissettiren arayüz referansları.",
    source: "Ekran görüntüsü",
    savedAt: "1 hafta önce",
  },
  {
    id: "micro-interactions",
    type: "link",
    title: "Portföy için mikro etkileşimler",
    description: "Hover, focus ve geçiş durumları için seçilmiş örnekler.",
    source: "awwwards.com",
    savedAt: "3 hafta önce",
  },
  {
    id: "reading-list",
    type: "note",
    title: "Eylül okuma listesi",
    description: "Ürün tasarımı, erişilebilirlik ve web performansı üzerine kaynaklar.",
    source: "Kısa not",
    savedAt: "1 ay önce",
  },
  {
    id: "editorial-layouts",
    type: "image",
    title: "Editorial layout study",
    description: "Büyük tipografi ve asimetrik grid kullanan landing page örnekleri.",
    source: "Ekran görüntüsü",
    savedAt: "1 ay önce",
  },
];
