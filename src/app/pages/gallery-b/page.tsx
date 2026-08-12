// Server Component — no "use client" here.
// It only does one job: fetch the initial data on the server and pass it
// down as props. All interactivity (tabs, lightbox, upload modal) lives in
// GalleryClient, which is a separate Client Component.

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import GalleryClient from "./gallery-client";
import type { AlbumRow, PhotoRow } from "./supabase-client";

export const revalidate = 0; // always fetch fresh photos, never cache this page

function resolveUserName(user: User | null): string {
  if (!user) return "Guest";
  return (
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email ||
    "Guest"
  );
}

export default async function GalleryPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [
    { data: albums },
    { data: photos },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase
      .from("albums")
      .select("*")
      .order("album_date", { ascending: false }),
    supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  return (
    <GalleryClient
      initialAlbums={(albums as AlbumRow[]) ?? []}
      initialPhotos={(photos as PhotoRow[]) ?? []}
      currentUserId={user?.id}
      currentUserName={resolveUserName(user)}
    />
  );
}
