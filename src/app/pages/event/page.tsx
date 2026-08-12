import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import EventForm from "./EventForm";

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
    <div className="container py-4" style={{ maxWidth: 720 }}>
      <h1
        className="h3 mb-4"
        style={{
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontWeight: 600,
        }}
      >
        Events
      </h1>

      <EventForm />

      {error && (
        <div className="alert alert-danger">
          Couldn&apos;t load events: {error.message}
        </div>
      )}

      {events && events.length === 0 && (
        <p className="text-muted">No events yet. Create the first one above.</p>
      )}

      <ul className="list-group">
        {events?.map((event) => (
          <li key={event.id} className="list-group-item">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="fw-semibold">{event.title}</div>
                <div className="small text-muted">
                  {new Date(event.starts_at).toLocaleString()}
                  {event.location ? ` · ${event.location}` : ""}
                </div>
                {event.description && (
                  <div className="small mt-1">{event.description}</div>
                )}
              </div>
              <span className="badge bg-secondary text-uppercase">
                {event.event_type}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// import { createClient } from "@/utils/supabase/server";
// import { cookies } from "next/headers";
// import { redirect } from "next/navigation";
// import EventForm from "./EventForm";

// export default async function EventsPage() {
//   const cookieStore = await cookies();
//   const supabase = createClient(cookieStore);

//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   // Belt-and-suspenders: middleware already redirects unauthenticated
//   // users, but a page-level check keeps this safe if the page is ever
//   // rendered outside that middleware's matcher.
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
//     <div className="container py-4" style={{ maxWidth: 720 }}>
//       <h1 className="h3 mb-4">Events</h1>

//       <EventForm />

//       {error && (
//         <div className="alert alert-danger">
//           Couldn&apos;t load events: {error.message}
//         </div>
//       )}

//       {events && events.length === 0 && (
//         <p className="text-muted">No events yet. Create the first one above.</p>
//       )}

//       <ul className="list-group">
//         {events?.map((event) => (
//           <li key={event.id} className="list-group-item">
//             <div className="d-flex justify-content-between align-items-start">
//               <div>
//                 <div className="fw-semibold">{event.title}</div>
//                 <div className="small text-muted">
//                   {new Date(event.starts_at).toLocaleString()}
//                   {event.location ? ` · ${event.location}` : ""}
//                 </div>
//                 {event.description && (
//                   <div className="small mt-1">{event.description}</div>
//                 )}
//               </div>
//               <span className="badge bg-secondary text-uppercase">
//                 {event.event_type}
//               </span>
//             </div>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }
