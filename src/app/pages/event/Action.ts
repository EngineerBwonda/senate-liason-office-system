"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export type CreateEventInput = {
  title: string;
  description?: string;
  eventType: string;
  location?: string;
  startsAt: string; // ISO string from the form
  endsAt?: string;
};

export async function createEvent(input: CreateEventInput) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to create an event." };
  }

  if (!input.title?.trim() || !input.startsAt) {
    return { error: "Title and start time are required." };
  }

  const { error } = await supabase.from("events").insert({
    title: input.title.trim(),
    description: input.description?.trim() || null,
    event_type: input.eventType,
    location: input.location?.trim() || null,
    starts_at: input.startsAt,
    ends_at: input.endsAt || null,
    created_by: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/events");
  return { success: true };
}

// "use server";

// import { createClient } from "@/utils/supabase/server";
// import { revalidatePath } from "next/cache";
// import { cookies } from "next/headers";

// export type CreateEventInput = {
//   title: string;
//   description?: string;
//   eventType: string;
//   location?: string;
//   startsAt: string; // ISO string from the form
//   endsAt?: string;
// };

// export async function createEvent(input: CreateEventInput) {
//   const cookieStore = await cookies();
//   const supabase = createClient(cookieStore);

//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   if (!user) {
//     return { error: "You must be signed in to create an event." };
//   }

//   if (!input.title?.trim() || !input.startsAt) {
//     return { error: "Title and start time are required." };
//   }

//   const { error } = await supabase.from("events").insert({
//     title: input.title.trim(),
//     description: input.description?.trim() || null,
//     event_type: input.eventType,
//     location: input.location?.trim() || null,
//     starts_at: input.startsAt,
//     ends_at: input.endsAt || null,
//     created_by: user.id,
//   });

//   if (error) {
//     return { error: error.message };
//   }

//   revalidatePath("/events");
//   return { success: true };
// }
