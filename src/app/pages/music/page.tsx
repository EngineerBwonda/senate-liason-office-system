"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

interface MusicItem {
  id: string;
  name: string;
  genre: string;
  created_at?: string;
}

export default function ReportForm() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [musicList, setMusicList] = useState<MusicItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        setError(error.message);
        return;
      }

      const currentUser = data.user;
      setUser(currentUser);
      setIsValidated(Boolean(currentUser?.email_confirmed_at));
    });
  }, [supabase]);

  // Fetch music list once the user is available
  useEffect(() => {
    if (!user) return;

    async function fetchMusic() {
      setLoadingList(true);
      const { data, error } = await supabase
        .from("music")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching music:", error);
        setError(error.message);
      } else {
        setMusicList(data as MusicItem[]);
      }
      setLoadingList(false);
    }

    fetchMusic();
  }, [user, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("You must be logged in to submit.");
      return;
    }

    if (!isValidated) {
      setError("Please validate your Supabase account before submitting.");
      return;
    }

    const { data, error } = await supabase
      .from("music")
      .insert({ name, genre })
      .select();

    if (error) {
      console.error("Error inserting data:", error);
      if (error.code === "42501") {
        setError(
          "Supabase row-level security is blocking this insert. Add an INSERT policy for authenticated users on the music table.",
        );
      } else {
        setError(error.message);
      }
    } else {
      console.log("Data inserted successfully:", data);
      setName("");
      setGenre("");
      // Prepend the new row so the list updates immediately
      if (data && data.length > 0) {
        setMusicList((prev) => [data[0] as MusicItem, ...prev]);
      }
    }
  }

  if (!user) {
    return <p>Please log in to add music.</p>;
  }

  if (!isValidated) {
    return <p>Please validate your Supabase account before adding music.</p>;
  }

  return (
    <div className="max-w-md space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Genre</label>
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Submit
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>

      <div>
        <h2 className="text-lg font-semibold mb-2">Music List</h2>
        {loadingList ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : musicList.length === 0 ? (
          <p className="text-sm text-gray-500">No entries yet.</p>
        ) : (
          <table className="w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left px-3 py-2 border-b">Name</th>
                <th className="text-left px-3 py-2 border-b">Genre</th>
              </tr>
            </thead>
            <tbody>
              {musicList.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 border-b">{item.name}</td>
                  <td className="px-3 py-2 border-b">{item.genre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

//===========================================================================================================================================

// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { createClient } from "@/utils/supabase/client";
// import type { User } from "@supabase/supabase-js";

// export default function ReportForm() {
//   const supabase = useMemo(() => createClient(), []);
//   const [user, setUser] = useState<User | null>(null);
//   const [isValidated, setIsValidated] = useState(false);
//   const [name, setName] = useState("");
//   const [genre, setGenre] = useState("");
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     supabase.auth.getUser().then(({ data, error }) => {
//       if (error) {
//         setError(error.message);
//         return;
//       }

//       const currentUser = data.user;
//       setUser(currentUser);
//       setIsValidated(Boolean(currentUser?.email_confirmed_at));
//     });
//   }, [supabase]);

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     setError(null);

//     if (!user) {
//       setError("You must be logged in to submit.");
//       return;
//     }

//     if (!isValidated) {
//       setError("Please validate your Supabase account before submitting.");
//       return;
//     }

//     const { data, error } = await supabase
//       .from("music")
//       .insert({ name, genre })
//       .select();

//     if (error) {
//       console.error("Error inserting data:", error);
//       if (error.code === "42501") {
//         setError(
//           "Supabase row-level security is blocking this insert. Add an INSERT policy for authenticated users on the music table.",
//         );
//       } else {
//         setError(error.message);
//       }
//     } else {
//       console.log("Data inserted successfully:", data);
//       setName("");
//       setGenre("");
//     }
//   }

//   if (!user) {
//     return <p>Please log in to add music.</p>;
//   }

//   if (!isValidated) {
//     return <p>Please validate your Supabase account before adding music.</p>;
//   }

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
//       <div>
//         <label className="block text-sm font-medium mb-1">Name</label>
//         <input
//           type="text"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           className="w-full border border-gray-300 rounded px-3 py-2"
//         />
//       </div>
//       <div>
//         <label className="block text-sm font-medium mb-1">Genre</label>
//         <input
//           type="text"
//           value={genre}
//           onChange={(e) => setGenre(e.target.value)}
//           className="w-full border border-gray-300 rounded px-3 py-2"
//         />
//       </div>
//       <button
//         type="submit"
//         className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//       >
//         Submit
//       </button>
//       {error && <p className="text-red-500 text-sm">{error}</p>}
//     </form>
//   );
// }

//==========================================================================================================================================

// "use client";

// import { useState } from "react";
// import { createClient } from "@/utils/supabase/client";

// export default function ReportForm() {
//   const supabase = createClient();
//   const [name, setName] = useState("");
//   const [genre, setGenre] = useState("");

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     const { data, error } = await supabase
//       .from("music")
//       .insert({ name, genre })
//       .select();

//     if (error) {
//       console.error("Error inserting data:", error);
//     } else {
//       console.log("Data inserted successfully:", data);
//       setName("");
//       setGenre("");
//     }
//   }

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
//       <div>
//         <label className="block text-sm font-medium mb-1">Name</label>
//         <input
//           type="text"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           className="w-full border border-gray-300 rounded px-3 py-2"
//         />
//       </div>
//       <div>
//         <label className="block text-sm font-medium mb-1">Genre</label>
//         <input
//           type="text"
//           value={genre}
//           onChange={(e) => setGenre(e.target.value)}
//           className="w-full border border-gray-300 rounded px-3 py-2"
//         />
//       </div>
//       <button
//         type="submit"
//         className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//       >
//         Submit
//       </button>
//     </form>
//   );
// }
