export type Bookmark = {
  id: string;
  url: string;
  title: string | null;
  summary: string | null;
  faviconUrl: string;
  imageUrl: string | null; // og:image / twitter:image
  createdAt: number; // epoch millis UTC
  tags: string[];
};

export type SummaryResult = {
  summary: string;
  title: string | null;
  imageUrl: string | null; // og:image / twitter:image
};
