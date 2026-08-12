import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import EventsClient from "./EventsClient";

export default async function EventsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/events");
  }

  const { data: events, error } = await supabase
    .from("events")
    .select(
      "id, title, description, event_type, location, starts_at, ends_at, created_by",
    )
    .order("starts_at", { ascending: true });

  return (
    <div className="container py-4" style={{ maxWidth: 1140 }}>
      {error && (
        <div className="alert alert-danger">
          Couldn&apos;t load events: {error.message}
        </div>
      )}

      <EventsClient events={events ?? []} currentUserId={user.id} />
    </div>
  );
}

// import { createClient } from "@/utils/supabase/server";
// import { cookies } from "next/headers";
// import { redirect } from "next/navigation";
// import EventsClient from "./EventsClient";

// export default async function EventsPage() {
//   const cookieStore = await cookies();
//   const supabase = createClient(cookieStore);

//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   if (!user) {
//     redirect("/login?redirect=/events");
//   }

//   const { data: events, error } = await supabase
//     .from("events")
//     .select(
//       "id, title, description, event_type, location, starts_at, ends_at, created_by",
//     )
//     .order("starts_at", { ascending: true });

//   return (
//     <div className="container py-4" style={{ maxWidth: 1140 }}>
//       {error && (
//         <div className="alert alert-danger">
//           Couldn&apos;t load events: {error.message}
//         </div>
//       )}

//       <EventsClient events={events ?? []} />
//     </div>
//   );
// }
