export type Tag = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type Bookmark = {
  id: string;
  user_id: string;
  url: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  favicon_url: string | null;
  site_name: string | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
};

export type FetchMetaResult = {
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  favicon_url: string | null;
  site_name: string | null;
};

export type Session = {
  access_token: string;
  user: {
    id: string;
    email: string | undefined;
  };
};
