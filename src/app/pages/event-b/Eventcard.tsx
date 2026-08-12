import { Calendar, Clock, MapPin } from "lucide-react";
import styles from "./Events.module.css";
import EditEventModal from "./Editeventmodal";
import DeleteEventButton from "./Deleteeventbutton";

export type EventRecord = {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  created_by: string;
};

const EVENT_TYPE_ICON: Record<string, string> = {
  "outdoor meeting": "👥",
  deadline: "⏰",
  other: "📌",
};

type EventCardProps = {
  event: EventRecord;
  currentUserId?: string;
};

export default function EventCard({ event, currentUserId }: EventCardProps) {
  const isOwner = Boolean(currentUserId) && event.created_by === currentUserId;
  const startDate = new Date(event.starts_at);
  const dateLabel = startDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeLabel = startDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className={styles.eventCard}>
      <div className={styles.eventCardTop}>
        <h3 className={styles.eventTitle}>{event.title}</h3>
        <span className={styles.eventTypeBadge}>
          {EVENT_TYPE_ICON[event.event_type] ?? "📌"} {event.event_type}
        </span>
      </div>

      <div className={styles.metaRow}>
        <Calendar className={styles.metaIcon} />
        <span>{dateLabel}</span>
      </div>

      <div className={styles.metaRow}>
        <Clock className={styles.metaIcon} />
        <span>
          {timeLabel}
          {event.ends_at
            ? ` – ${new Date(event.ends_at).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}`
            : ""}
        </span>
      </div>

      {event.location && (
        <div className={styles.metaRow}>
          <MapPin className={styles.metaIcon} />
          <span>{event.location}</span>
        </div>
      )}

      {event.description && (
        <p className={styles.eventDescription}>{event.description}</p>
      )}

      {isOwner && (
        <div className={styles.cardActions}>
          <EditEventModal event={event} />
          <DeleteEventButton eventId={event.id} />
        </div>
      )}
    </div>
  );
}

// import { Calendar, Clock, MapPin } from "lucide-react";
// import styles from "./Events.module.css";

// export type EventRecord = {
//   id: string;
//   title: string;
//   description: string | null;
//   event_type: string;
//   location: string | null;
//   starts_at: string;
//   ends_at: string | null;
//   created_by: string;
// };

// const EVENT_TYPE_ICON: Record<string, string> = {
//   "outdoor meeting": "👥",
//   deadline: "⏰",
//   other: "📌",
// };

// export default function EventCard({ event }: { event: EventRecord }) {
//   const startDate = new Date(event.starts_at);
//   const dateLabel = startDate.toLocaleDateString(undefined, {
//     month: "short",
//     day: "numeric",
//     year: "numeric",
//   });
//   const timeLabel = startDate.toLocaleTimeString(undefined, {
//     hour: "numeric",
//     minute: "2-digit",
//   });

//   return (
//     <div className={styles.eventCard}>
//       <div className={styles.eventCardTop}>
//         <h3 className={styles.eventTitle}>{event.title}</h3>
//         <span className="badge bg-secondary text-uppercase">
//           {EVENT_TYPE_ICON[event.event_type] ?? "📌"} {event.event_type}
//         </span>
//       </div>

//       <div className={styles.metaRow}>
//         <Calendar className={styles.metaIcon} />
//         <span>{dateLabel}</span>
//       </div>

//       <div className={styles.metaRow}>
//         <Clock className={styles.metaIcon} />
//         <span>
//           {timeLabel}
//           {event.ends_at
//             ? ` – ${new Date(event.ends_at).toLocaleTimeString(undefined, {
//                 hour: "numeric",
//                 minute: "2-digit",
//               })}`
//             : ""}
//         </span>
//       </div>

//       {event.location && (
//         <div className={styles.metaRow}>
//           <MapPin className={styles.metaIcon} />
//           <span>{event.location}</span>
//         </div>
//       )}

//       {event.description && (
//         <p className={styles.eventDescription}>{event.description}</p>
//       )}
//     </div>
//   );
// }
