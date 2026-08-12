import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import GalleryClient from "./gallery-client";
import type { AlbumRow, PhotoRow } from "./supabase-client";

export const revalidate = 0; // always fetch fresh photos

export default async function GalleryPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [{ data: albums }, { data: photos }] = await Promise.all([
    supabase
      .from("albums")
      .select("*")
      .order("album_date", { ascending: false }),
    supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <GalleryClient
      initialAlbums={(albums as AlbumRow[]) ?? []}
      initialPhotos={(photos as PhotoRow[]) ?? []}
    />
  );
}
