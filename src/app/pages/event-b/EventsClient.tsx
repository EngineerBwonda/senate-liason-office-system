"use client";

import { useMemo, useState } from "react";
import EventCard, { type EventRecord } from "./Eventcard";
import SearchBar from "./Searchbar";
import EventModal from "./EventModal";
import styles from "./Events.module.css";

type EventsClientProps = {
  events: EventRecord[];
  currentUserId: string;
};

export default function EventsClient({
  events,
  currentUserId,
}: EventsClientProps) {
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesQuery = query.trim()
        ? event.title.toLowerCase().includes(query.trim().toLowerCase())
        : true;

      const matchesDate = dateFilter
        ? new Date(event.starts_at).toISOString().slice(0, 10) === dateFilter
        : true;

      return matchesQuery && matchesDate;
    });
  }, [events, query, dateFilter]);

  return (
    <div
      style={{
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div className={styles.pageHeader}>
        <div>
          <h1 className={`h3 ${styles.headerTitle}`}>Events</h1>
          <p className={styles.headerSubtitle}>
            {events.length} event{events.length === 1 ? "" : "s"} scheduled
          </p>
        </div>
        <EventModal />
      </div>

      <div className={styles.toolbar}>
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
        />
      </div>

      {filteredEvents.length === 0 ? (
        <div className={styles.emptyState}>
          {events.length === 0
            ? "No events yet. Add your first one above."
            : "No events match your search."}
        </div>
      ) : (
        <div className={styles.eventsGrid}>
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// "use client";

// import { useMemo, useState } from "react";
// import EventCard, { type EventRecord } from "./Eventcard";
// import SearchBar from "./Searchbar";
// import EventModal from "./EventModal";
// import styles from "./Events.module.css";

// export default function EventsClient({ events }: { events: EventRecord[] }) {
//   const [query, setQuery] = useState("");
//   const [dateFilter, setDateFilter] = useState("");

//   const filteredEvents = useMemo(() => {
//     return events.filter((event) => {
//       const matchesQuery = query.trim()
//         ? event.title.toLowerCase().includes(query.trim().toLowerCase())
//         : true;

//       const matchesDate = dateFilter
//         ? new Date(event.starts_at).toISOString().slice(0, 10) === dateFilter
//         : true;

//       return matchesQuery && matchesDate;
//     });
//   }, [events, query, dateFilter]);

//   return (
//     <div
//       style={{
//         fontFamily:
//           "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
//       }}
//     >
//       <div className={styles.pageHeader}>
//         <div>
//           <h1 className={`h3 ${styles.headerTitle}`}>Events</h1>
//           <p className={styles.headerSubtitle}>
//             {events.length} event{events.length === 1 ? "" : "s"} scheduled
//           </p>
//         </div>
//         <EventModal />
//       </div>

//       <div className={styles.toolbar}>
//         <SearchBar
//           query={query}
//           onQueryChange={setQuery}
//           dateFilter={dateFilter}
//           onDateFilterChange={setDateFilter}
//         />
//       </div>

//       {filteredEvents.length === 0 ? (
//         <div className={styles.emptyState}>
//           {events.length === 0
//             ? "No events yet. Add your first one above."
//             : "No events match your search."}
//         </div>
//       ) : (
//         <div className={styles.eventsGrid}>
//           {filteredEvents.map((event) => (
//             <EventCard key={event.id} event={event} />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
