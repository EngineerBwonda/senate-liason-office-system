// import { createClient } from "@supabase/supabase-js";

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
