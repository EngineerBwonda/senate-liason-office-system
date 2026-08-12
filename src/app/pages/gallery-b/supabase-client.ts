// Row shapes returned by Supabase for the `albums` and `photos` tables.
// These match the DB schema exactly, so keep them in sync with migrations.

export type AlbumRow = {
  id: string;
  name: string;
  slug: string;
  album_date: string | null;
  description: string | null;
  cover_photo_url: string | null;
  created_by: string | null;
  created_at: string;
};

export type PhotoRow = {
  id: string;
  album_id: string;
  storage_path: string | null;
  url: string;
  caption: string | null;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  created_at: string;
};
