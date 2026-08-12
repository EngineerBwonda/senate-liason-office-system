"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/utils/supabase/client";

type CountryRecord = {
  id: string | number;
  country: string;
  capital: string;
  president: string;
  year: string;
};

function normalizeCountries(records: CountryRecord[]) {
  return Array.from(
    new Map(records.map((record) => [record.id, record])).values(),
  );
}

export default function CountryPage() {
  const [countries, setCountries] = useState("");
  const [capital, setCapital] = useState("");
  const [president, setPresident] = useState("");
  const [year, setYear] = useState("");

  const [records, setRecords] = useState<CountryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const supabase = createClient();

  async function fetchCountries() {
    const { data, error } = await supabase
      .from("state")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Error fetching data:", error);
      setFetchError(error.message);
    } else {
      setRecords(normalizeCountries((data ?? []) as CountryRecord[]));
    }

    setLoading(false);
  }

  useEffect(() => {
    let isActive = true;

    Promise.resolve().then(() => {
      if (isActive) {
        void fetchCountries();
      }
    });

    const channel = supabase
      .channel("state-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "state" },
        (payload) => {
          console.log("Realtime change received:", payload);

          if (payload.eventType === "INSERT") {
            setRecords((current) =>
              normalizeCountries([payload.new as CountryRecord, ...current]),
            );
          }

          if (payload.eventType === "UPDATE") {
            setRecords((current) =>
              normalizeCountries(
                current.map((record) =>
                  record.id === (payload.new as CountryRecord).id
                    ? (payload.new as CountryRecord)
                    : record,
                ),
              ),
            );
          }

          if (payload.eventType === "DELETE") {
            setRecords((current) =>
              current.filter(
                (record) => record.id !== (payload.old as CountryRecord).id,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      isActive = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { data, error } = await supabase
      .from("state")
      .insert({
        country: countries,
        capital: capital,
        president: president,
        year: year,
      })
      .select();

    if (error) {
      console.error("Error inserting data:", error);
    } else {
      console.log("Data inserted successfully:", data);
      setCountries("");
      setCapital("");
      setPresident("");
      setYear("");
      await fetchCountries();
    }
  }

  return (
    <div>
      <h1>Country Page</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Country"
          value={countries}
          onChange={(e) => setCountries(e.target.value)}
        />
        <input
          type="text"
          placeholder="Capital"
          value={capital}
          onChange={(e) => setCapital(e.target.value)}
        />
        <input
          type="text"
          placeholder="President"
          value={president}
          onChange={(e) => setPresident(e.target.value)}
        />
        <input
          type="text"
          placeholder="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
        <button type="submit">Submit</button>
      </form>

      <h2>Records</h2>
      {loading && <p>Loading...</p>}
      {fetchError && <p style={{ color: "red" }}>Error: {fetchError}</p>}
      {!loading && !fetchError && records.length === 0 && (
        <p>No records yet.</p>
      )}

      <ul>
        {records.map((record) => (
          <li key={record.id}>
            {record.country} — {record.capital} — {record.president} (
            {record.year})
          </li>
        ))}
      </ul>
    </div>
  );
}

//===============================================================================================
// "use client";

// import { useEffect, useState } from "react";

// import { createClient } from "@/utils/supabase/client";

// type CountryRecord = {
//   id: string | number;
//   country: string;
//   capital: string;
//   president: string;
//   year: string;
// };

// export default function CountryPage() {
//   const [countries, setCountries] = useState("");
//   const [capital, setCapital] = useState("");
//   const [president, setPresident] = useState("");
//   const [year, setYear] = useState("");

//   const [records, setRecords] = useState<CountryRecord[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [fetchError, setFetchError] = useState<string | null>(null);

//   const supabase = createClient();

//   useEffect(() => {
//     fetchCountries();
//   }, []);

//   async function fetchCountries() {
//     setLoading(true);
//     setFetchError(null);

//     const { data, error } = await supabase
//       .from("state")
//       .select("*")
//       .order("id", { ascending: false });

//     if (error) {
//       console.error("Error fetching data:", error);
//       setFetchError(error.message);
//     } else {
//       setRecords(data ?? []);
//     }

//     setLoading(false);
//   }

//   async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
//     event.preventDefault();

//     const { data, error } = await supabase.from("state").insert({
//       country: countries,
//       capital: capital,
//       president: president,
//       year: year,
//     });

//     if (error) {
//       console.error("Error inserting data:", error);
//     } else {
//       console.log("Data inserted successfully:", data);
//       setCountries("");
//       setCapital("");
//       setPresident("");
//       setYear("");
//       fetchCountries();
//     }
//   }

//   return (
//     <div>
//       <h1>Country Page</h1>
//       <form onSubmit={handleSubmit}>
//         <input
//           type="text"
//           placeholder="Country"
//           value={countries}
//           onChange={(e) => setCountries(e.target.value)}
//         />
//         <input
//           type="text"
//           placeholder="Capital"
//           value={capital}
//           onChange={(e) => setCapital(e.target.value)}
//         />
//         <input
//           type="text"
//           placeholder="President"
//           value={president}
//           onChange={(e) => setPresident(e.target.value)}
//         />
//         <input
//           type="text"
//           placeholder="Year"
//           value={year}
//           onChange={(e) => setYear(e.target.value)}
//         />
//         <button type="submit">Submit</button>
//       </form>

//       <h2>Records</h2>
//       {loading && <p>Loading...</p>}
//       {fetchError && <p style={{ color: "red" }}>Error: {fetchError}</p>}
//       {!loading && !fetchError && records.length === 0 && (
//         <p>No records yet.</p>
//       )}

//       <ul>
//         {records.map((record) => (
//           <li key={record.id}>
//             {record.country} — {record.capital} — {record.president} (
//             {record.year})
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

//========================================================================================================================================

// "use client";

// import { useEffect, useState } from "react";

// import { createClient } from "@/utils/supabase/client";

// export default function CountryPage() {
//   const [countries, setCountries] = useState("");
//   const [capital, setCapital] = useState("");
//   const [president, setPresident] = useState("");
//   const [year, setYear] = useState("");

//   const supabase = createClient();

//   async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
//     event.preventDefault();

//     const { data, error } = await supabase.from("state").insert({
//       country: countries,
//       capital: capital,
//       president: president,
//       year: year,
//     });

//     if (error) {
//       console.error("Error inserting data:", error);
//     } else {
//       console.log("Data inserted successfully:", data);
//     }
//   }

//   return (
//     <div>
//       <h1>Country Page</h1>
//       <form onSubmit={handleSubmit}>
//         <input
//           type="text"
//           placeholder="Country"
//           value={countries}
//           onChange={(e) => setCountries(e.target.value)}
//         />
//         <input
//           type="text"
//           placeholder="Capital"
//           value={capital}
//           onChange={(e) => setCapital(e.target.value)}
//         />
//         <input
//           type="text"
//           placeholder="President"
//           value={president}
//           onChange={(e) => setPresident(e.target.value)}
//         />
//         <input
//           type="text"
//           placeholder="Year"
//           value={year}
//           onChange={(e) => setYear(e.target.value)}
//         />
//         <button type="submit">Submit</button>
//       </form>
//     </div>
//   );
// }
