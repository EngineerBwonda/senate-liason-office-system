import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import OfficeDocClient from "./report-doc-client";

export default async function OfficeDocPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Fetch the initial list on the server so the page loads
  // with data already in it (no loading spinner on first render).
  const { data: initialRecords } = await supabase
    .from("boss doc")
    .select("*")
    .order("created_at", { ascending: false });

  return <OfficeDocClient initialRecords={initialRecords ?? []} />;
}
