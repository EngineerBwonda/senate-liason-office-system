"use client";

import { useState, useTransition } from "react";
import { createEvent, updateEvent } from "./Action";
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  Tag,
  PlusCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

const EVENT_TYPES = [
  { value: "outdoor meeting", label: "outdoor meeting", icon: "👥" },
  { value: "deadline", label: "Deadline", icon: "⏰" },
  { value: "other", label: "Other", icon: "📌" },
];

export type EditableEvent = {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
};

type EventFormProps = {
  onSuccess?: () => void;
  event?: EditableEvent;
};

// datetime-local inputs need "yyyy-MM-ddThh:mm" in local time
function toDatetimeLocalValue(isoString: string) {
  const date = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function EventForm({ onSuccess, event }: EventFormProps) {
  const isEditMode = Boolean(event);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function openDatePicker(inputId: string) {
    const input = document.getElementById(inputId) as HTMLInputElement | null;

    if (!input) return;

    input.focus();
    if (typeof input.showPicker === "function") {
      input.showPicker();
    }
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const eventType = formData.get("eventType") as string;
    const location = formData.get("location") as string;
    const startsAt = formData.get("startsAt") as string;
    const endsAt = formData.get("endsAt") as string;

    const eventInput = {
      title,
      description,
      eventType,
      location,
      startsAt: startsAt ? new Date(startsAt).toISOString() : "",
      endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
    };

    startTransition(async () => {
      const result = isEditMode
        ? await updateEvent({ id: event!.id, ...eventInput })
        : await createEvent(eventInput);

      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        if (!isEditMode) {
          const form = document.getElementById("event-form") as HTMLFormElement;
          form?.reset();
        }
        onSuccess?.();
      }
    });
  }

  return (
    <form
      id="event-form"
      action={handleSubmit}
      className="card shadow-sm border-0 p-4 mb-4"
      style={{
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <h2
        className="h5 mb-3"
        style={{
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <PlusCircle style={{ width: "1.25rem", height: "1.25rem" }} />
        {isEditMode ? "Edit Event" : "New Event"}
      </h2>

      {error && (
        <div
          className="alert alert-danger py-2"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <XCircle style={{ width: "1rem", height: "1rem" }} />
          {error}
        </div>
      )}
      {success && (
        <div
          className="alert alert-success py-2"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <CheckCircle style={{ width: "1rem", height: "1rem" }} />
          {isEditMode
            ? "Event updated successfully!"
            : "Event created successfully!"}
        </div>
      )}

      <div className="mb-3">
        <label
          htmlFor="title"
          className="form-label"
          style={{
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Tag style={{ width: "1rem", height: "1rem" }} />
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          className="form-control"
          style={{ fontFamily: "inherit" }}
          placeholder="Enter event title"
          defaultValue={event?.title}
          required
        />
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label
            htmlFor="eventType"
            className="form-label"
            style={{ fontWeight: 500 }}
          >
            Type
          </label>
          <select
            id="eventType"
            name="eventType"
            className="form-select"
            style={{ fontFamily: "inherit" }}
            defaultValue={event?.event_type}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.icon} {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-6 mb-3">
          <label
            htmlFor="location"
            className="form-label"
            style={{
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <MapPin style={{ width: "1rem", height: "1rem" }} />
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            className="form-control"
            style={{ fontFamily: "inherit" }}
            placeholder="Room, link, or address"
            defaultValue={event?.location ?? undefined}
          />
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label
            htmlFor="startsAt"
            className="form-label"
            style={{
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Calendar style={{ width: "1rem", height: "1rem" }} />
            Starts at
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                id="startsAt"
                name="startsAt"
                type="datetime-local"
                className="form-control"
                style={{
                  fontFamily: "inherit",
                  paddingLeft: "2.5rem",
                }}
                defaultValue={
                  event ? toDatetimeLocalValue(event.starts_at) : undefined
                }
                required
              />
              <Clock
                style={{
                  width: "1rem",
                  height: "1rem",
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#6c757d",
                  pointerEvents: "none",
                }}
              />
            </div>
            <button
              type="button"
              aria-label="Open calendar picker"
              onClick={() => openDatePicker("startsAt")}
              style={{
                border: "1px solid #dee2e6",
                background: "#fff",
                borderRadius: "0.375rem",
                padding: "0.5rem",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0d6efd",
              }}
            >
              <Calendar style={{ width: "1rem", height: "1rem" }} />
            </button>
          </div>
        </div>
        <div className="col-md-6 mb-3">
          <label
            htmlFor="endsAt"
            className="form-label"
            style={{
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Calendar style={{ width: "1rem", height: "1rem" }} />
            Ends at (optional)
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                id="endsAt"
                name="endsAt"
                type="datetime-local"
                className="form-control"
                style={{
                  fontFamily: "inherit",
                  paddingLeft: "2.5rem",
                }}
                defaultValue={
                  event?.ends_at
                    ? toDatetimeLocalValue(event.ends_at)
                    : undefined
                }
              />
              <Clock
                style={{
                  width: "1rem",
                  height: "1rem",
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#14181b",
                  pointerEvents: "none",
                }}
              />
            </div>
            <button
              type="button"
              aria-label="Open calendar picker"
              onClick={() => openDatePicker("endsAt")}
              style={{
                border: "1px solid #dee2e6",
                background: "#fff",
                borderRadius: "0.375rem",
                padding: "0.5rem",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0d6efd",
              }}
            >
              <Calendar style={{ width: "1rem", height: "1rem" }} />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <label
          htmlFor="description"
          className="form-label"
          style={{
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <FileText style={{ width: "1rem", height: "1rem" }} />
          Description
        </label>
        <textarea
          id="description"
          name="description"
          className="form-control"
          style={{ fontFamily: "inherit" }}
          rows={3}
          placeholder="Add event details..."
          defaultValue={event?.description ?? undefined}
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary align-self-start"
        disabled={isPending}
        style={{
          fontFamily: "inherit",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        {isPending ? (
          <>
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            ></span>
            {isEditMode ? "Saving..." : "Creating..."}
          </>
        ) : (
          <>
            <PlusCircle style={{ width: "1rem", height: "1rem" }} />
            {isEditMode ? "Save Changes" : "Create Event"}
          </>
        )}
      </button>
    </form>
  );
}

// "use client";

// import { useState, useTransition } from "react";
// import { createEvent } from "./Action";
// import {
//   Calendar,
//   Clock,
//   MapPin,
//   FileText,
//   Tag,
//   PlusCircle,
//   CheckCircle,
//   XCircle,
// } from "lucide-react";

// const EVENT_TYPES = [
//   { value: "outdoor meeting", label: "outdoor meeting", icon: "👥" },
//   { value: "deadline", label: "Deadline", icon: "⏰" },
//   { value: "other", label: "Other", icon: "📌" },
// ];

// type EventFormProps = {
//   onSuccess?: () => void;
// };

// export default function EventForm({ onSuccess }: EventFormProps) {
//   const [isPending, startTransition] = useTransition();
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState(false);

//   function openDatePicker(inputId: string) {
//     const input = document.getElementById(inputId) as HTMLInputElement | null;

//     if (!input) return;

//     input.focus();
//     if (typeof input.showPicker === "function") {
//       input.showPicker();
//     }
//   }

//   function handleSubmit(formData: FormData) {
//     setError(null);
//     setSuccess(false);

//     const title = formData.get("title") as string;
//     const description = formData.get("description") as string;
//     const eventType = formData.get("eventType") as string;
//     const location = formData.get("location") as string;
//     const startsAt = formData.get("startsAt") as string;
//     const endsAt = formData.get("endsAt") as string;

//     startTransition(async () => {
//       const result = await createEvent({
//         title,
//         description,
//         eventType,
//         location,
//         startsAt: startsAt ? new Date(startsAt).toISOString() : "",
//         endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
//       });

//       if (result?.error) {
//         setError(result.error);
//       } else {
//         setSuccess(true);
//         const form = document.getElementById("event-form") as HTMLFormElement;
//         form?.reset();
//         onSuccess?.();
//       }
//     });
//   }

//   return (
//     <form
//       id="event-form"
//       action={handleSubmit}
//       className="card shadow-sm border-0 p-4 mb-4"
//       style={{
//         fontFamily:
//           "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
//       }}
//     >
//       <h2
//         className="h5 mb-3"
//         style={{
//           fontWeight: 600,
//           display: "flex",
//           alignItems: "center",
//           gap: "0.5rem",
//         }}
//       >
//         <PlusCircle style={{ width: "1.25rem", height: "1.25rem" }} />
//         New Event
//       </h2>

//       {error && (
//         <div
//           className="alert alert-danger py-2"
//           style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
//         >
//           <XCircle style={{ width: "1rem", height: "1rem" }} />
//           {error}
//         </div>
//       )}
//       {success && (
//         <div
//           className="alert alert-success py-2"
//           style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
//         >
//           <CheckCircle style={{ width: "1rem", height: "1rem" }} />
//           Event created successfully!
//         </div>
//       )}

//       <div className="mb-3">
//         <label
//           htmlFor="title"
//           className="form-label"
//           style={{
//             fontWeight: 500,
//             display: "flex",
//             alignItems: "center",
//             gap: "0.5rem",
//           }}
//         >
//           <Tag style={{ width: "1rem", height: "1rem" }} />
//           Title
//         </label>
//         <input
//           id="title"
//           name="title"
//           type="text"
//           className="form-control"
//           style={{ fontFamily: "inherit" }}
//           placeholder="Enter event title"
//           required
//         />
//       </div>

//       <div className="row">
//         <div className="col-md-6 mb-3">
//           <label
//             htmlFor="eventType"
//             className="form-label"
//             style={{ fontWeight: 500 }}
//           >
//             Type
//           </label>
//           <select
//             id="eventType"
//             name="eventType"
//             className="form-select"
//             style={{ fontFamily: "inherit" }}
//           >
//             {EVENT_TYPES.map((t) => (
//               <option key={t.value} value={t.value}>
//                 {t.icon} {t.label}
//               </option>
//             ))}
//           </select>
//         </div>
//         <div className="col-md-6 mb-3">
//           <label
//             htmlFor="location"
//             className="form-label"
//             style={{
//               fontWeight: 500,
//               display: "flex",
//               alignItems: "center",
//               gap: "0.5rem",
//             }}
//           >
//             <MapPin style={{ width: "1rem", height: "1rem" }} />
//             Location
//           </label>
//           <input
//             id="location"
//             name="location"
//             type="text"
//             className="form-control"
//             style={{ fontFamily: "inherit" }}
//             placeholder="Room, link, or address"
//           />
//         </div>
//       </div>

//       <div className="row">
//         <div className="col-md-6 mb-3">
//           <label
//             htmlFor="startsAt"
//             className="form-label"
//             style={{
//               fontWeight: 500,
//               display: "flex",
//               alignItems: "center",
//               gap: "0.5rem",
//             }}
//           >
//             <Calendar style={{ width: "1rem", height: "1rem" }} />
//             Starts at
//           </label>
//           <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
//             <div style={{ position: "relative", flex: 1 }}>
//               <input
//                 id="startsAt"
//                 name="startsAt"
//                 type="datetime-local"
//                 className="form-control"
//                 style={{
//                   fontFamily: "inherit",
//                   paddingLeft: "2.5rem",
//                 }}
//                 required
//               />
//               <Clock
//                 style={{
//                   width: "1rem",
//                   height: "1rem",
//                   position: "absolute",
//                   left: "0.75rem",
//                   top: "50%",
//                   transform: "translateY(-50%)",
//                   color: "#6c757d",
//                   pointerEvents: "none",
//                 }}
//               />
//             </div>
//             <button
//               type="button"
//               aria-label="Open calendar picker"
//               onClick={() => openDatePicker("startsAt")}
//               style={{
//                 border: "1px solid #dee2e6",
//                 background: "#fff",
//                 borderRadius: "0.375rem",
//                 padding: "0.5rem",
//                 display: "inline-flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 color: "#0d6efd",
//               }}
//             >
//               <Calendar style={{ width: "1rem", height: "1rem" }} />
//             </button>
//           </div>
//         </div>
//         <div className="col-md-6 mb-3">
//           <label
//             htmlFor="endsAt"
//             className="form-label"
//             style={{
//               fontWeight: 500,
//               display: "flex",
//               alignItems: "center",
//               gap: "0.5rem",
//             }}
//           >
//             <Calendar style={{ width: "1rem", height: "1rem" }} />
//             Ends at (optional)
//           </label>
//           <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
//             <div style={{ position: "relative", flex: 1 }}>
//               <input
//                 id="endsAt"
//                 name="endsAt"
//                 type="datetime-local"
//                 className="form-control"
//                 style={{
//                   fontFamily: "inherit",
//                   paddingLeft: "2.5rem",
//                 }}
//               />
//               <Clock
//                 style={{
//                   width: "1rem",
//                   height: "1rem",
//                   position: "absolute",
//                   left: "0.75rem",
//                   top: "50%",
//                   transform: "translateY(-50%)",
//                   color: "#14181b",
//                   pointerEvents: "none",
//                 }}
//               />
//             </div>
//             <button
//               type="button"
//               aria-label="Open calendar picker"
//               onClick={() => openDatePicker("endsAt")}
//               style={{
//                 border: "1px solid #dee2e6",
//                 background: "#fff",
//                 borderRadius: "0.375rem",
//                 padding: "0.5rem",
//                 display: "inline-flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 color: "#0d6efd",
//               }}
//             >
//               <Calendar style={{ width: "1rem", height: "1rem" }} />
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="mb-3">
//         <label
//           htmlFor="description"
//           className="form-label"
//           style={{
//             fontWeight: 500,
//             display: "flex",
//             alignItems: "center",
//             gap: "0.5rem",
//           }}
//         >
//           <FileText style={{ width: "1rem", height: "1rem" }} />
//           Description
//         </label>
//         <textarea
//           id="description"
//           name="description"
//           className="form-control"
//           style={{ fontFamily: "inherit" }}
//           rows={3}
//           placeholder="Add event details..."
//         />
//       </div>

//       <button
//         type="submit"
//         className="btn btn-primary align-self-start"
//         disabled={isPending}
//         style={{
//           fontFamily: "inherit",
//           fontWeight: 500,
//           display: "flex",
//           alignItems: "center",
//           gap: "0.5rem",
//         }}
//       >
//         {isPending ? (
//           <>
//             <span
//               className="spinner-border spinner-border-sm"
//               role="status"
//               aria-hidden="true"
//             ></span>
//             Creating...
//           </>
//         ) : (
//           <>
//             <PlusCircle style={{ width: "1rem", height: "1rem" }} />
//             Create Event
//           </>
//         )}
//       </button>
//     </form>
//   );
// }
