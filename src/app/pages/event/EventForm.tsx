"use client";

import { useState, useTransition } from "react";
import { createEvent } from "./Action";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  DocumentTextIcon,
  TagIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

const EVENT_TYPES = [
  { value: "outdoor meeting", label: "outdoor meeting", icon: "👥" },
  { value: "deadline", label: "Deadline", icon: "⏰" },
  { value: "other", label: "Other", icon: "📌" },
];

export default function EventForm() {
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

    startTransition(async () => {
      const result = await createEvent({
        title,
        description,
        eventType,
        location,
        startsAt: startsAt ? new Date(startsAt).toISOString() : "",
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        const form = document.getElementById("event-form") as HTMLFormElement;
        form?.reset();
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
        <PlusCircleIcon style={{ width: "1.25rem", height: "1.25rem" }} />
        New Event
      </h2>

      {error && (
        <div
          className="alert alert-danger py-2"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <XCircleIcon style={{ width: "1rem", height: "1rem" }} />
          {error}
        </div>
      )}
      {success && (
        <div
          className="alert alert-success py-2"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <CheckCircleIcon style={{ width: "1rem", height: "1rem" }} />
          Event created successfully!
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
          <TagIcon style={{ width: "1rem", height: "1rem" }} />
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          className="form-control"
          style={{ fontFamily: "inherit" }}
          placeholder="Enter event title"
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
            <MapPinIcon style={{ width: "1rem", height: "1rem" }} />
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            className="form-control"
            style={{ fontFamily: "inherit" }}
            placeholder="Room, link, or address"
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
            <CalendarIcon style={{ width: "1rem", height: "1rem" }} />
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
                required
              />
              <ClockIcon
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
              <CalendarIcon style={{ width: "1rem", height: "1rem" }} />
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
            <CalendarIcon style={{ width: "1rem", height: "1rem" }} />
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
              />
              <ClockIcon
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
              <CalendarIcon style={{ width: "1rem", height: "1rem" }} />
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
          <DocumentTextIcon style={{ width: "1rem", height: "1rem" }} />
          Description
        </label>
        <textarea
          id="description"
          name="description"
          className="form-control"
          style={{ fontFamily: "inherit" }}
          rows={3}
          placeholder="Add event details..."
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
            Creating...
          </>
        ) : (
          <>
            <PlusCircleIcon style={{ width: "1rem", height: "1rem" }} />
            Create Event
          </>
        )}
      </button>
    </form>
  );
}

// "use client";

// import { useState, useTransition } from "react";
// import { createEvent } from "./Action";

// const EVENT_TYPES = [
//   { value: "meeting", label: "Meeting" },
//   { value: "deadline", label: "Deadline" },
//   { value: "other", label: "Other" },
// ];

// export default function EventForm() {
//   const [isPending, startTransition] = useTransition();
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState(false);

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
//       }
//     });
//   }

//   return (
//     <form
//       id="event-form"
//       action={handleSubmit}
//       className="card shadow-sm border-0 p-4 mb-4"
//     >
//       <h2 className="h5 mb-3">New Event</h2>

//       {error && <div className="alert alert-danger py-2">{error}</div>}
//       {success && (
//         <div className="alert alert-success py-2">Event created.</div>
//       )}

//       <div className="mb-3">
//         <label htmlFor="title" className="form-label">
//           Title
//         </label>
//         <input
//           id="title"
//           name="title"
//           type="text"
//           className="form-control"
//           required
//         />
//       </div>

//       <div className="row">
//         <div className="col-md-6 mb-3">
//           <label htmlFor="eventType" className="form-label">
//             Type
//           </label>
//           <select id="eventType" name="eventType" className="form-select">
//             {EVENT_TYPES.map((t) => (
//               <option key={t.value} value={t.value}>
//                 {t.label}
//               </option>
//             ))}
//           </select>
//         </div>
//         <div className="col-md-6 mb-3">
//           <label htmlFor="location" className="form-label">
//             Location
//           </label>
//           <input
//             id="location"
//             name="location"
//             type="text"
//             className="form-control"
//             placeholder="Room, link, or address"
//           />
//         </div>
//       </div>

//       <div className="row">
//         <div className="col-md-6 mb-3">
//           <label htmlFor="startsAt" className="form-label">
//             Starts at
//           </label>
//           <input
//             id="startsAt"
//             name="startsAt"
//             type="datetime-local"
//             className="form-control"
//             required
//           />
//         </div>
//         <div className="col-md-6 mb-3">
//           <label htmlFor="endsAt" className="form-label">
//             Ends at (optional)
//           </label>
//           <input
//             id="endsAt"
//             name="endsAt"
//             type="datetime-local"
//             className="form-control"
//           />
//         </div>
//       </div>

//       <div className="mb-3">
//         <label htmlFor="description" className="form-label">
//           Description
//         </label>
//         <textarea
//           id="description"
//           name="description"
//           className="form-control"
//           rows={3}
//         />
//       </div>

//       <button
//         type="submit"
//         className="btn btn-primary align-self-start"
//         disabled={isPending}
//       >
//         {isPending ? "Creating..." : "Create Event"}
//       </button>
//     </form>
//   );
// }
