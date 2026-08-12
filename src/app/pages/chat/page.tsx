// app/chat/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User, RealtimeChannel } from "@supabase/supabase-js";
import type { Message, Group } from "./typechat";
import CreateGroupModal from "./groupmodal";

const TYPING_TIMEOUT = 3000;

export default function ChatRoom() {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(
    new Map(),
  );

  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const clearTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Initial load: user + their groups
  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      const { data: groupsData, error } = await supabase
        .from("groups_a")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && groupsData) {
        setGroups(groupsData as Group[]);
        if (groupsData.length > 0) setActiveGroup(groupsData[0] as Group);
      }
      setLoading(false);
    };
    init();
  }, []);

  // Whenever the active group changes: load its messages + (re)subscribe
  useEffect(() => {
    if (!activeGroup || !user) return;

    let cancelled = false;
    setLoadingMessages(true);
    setMessages([]);
    setTypingUsers(new Map());

    const loadAndSubscribe = async () => {
      const { data, error } = await supabase
        .from("messages_a")
        .select("*")
        .eq("group_id", activeGroup.id)
        .order("created_at", { ascending: true })
        .limit(50);

      if (!cancelled) {
        if (!error && data) setMessages(data as Message[]);
        setLoadingMessages(false);
      }

      // Tear down any previous subscription before creating a new one
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channel = supabase
        .channel(`group:${activeGroup.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages_a",
            filter: `group_id=eq.${activeGroup.id}`,
          },
          (payload) => {
            const newMsg = payload.new as Message;
            setMessages((prev) => [...prev, newMsg]);
            setTypingUsers((prev) => {
              const next = new Map(prev);
              next.delete(newMsg.user_id);
              return next;
            });
          },
        )
        .on("broadcast", { event: "typing" }, (payload) => {
          const { user_id, username, isTyping } = payload.payload as {
            user_id: string;
            username: string;
            isTyping: boolean;
          };
          if (user_id === user.id) return;

          setTypingUsers((prev) => {
            const next = new Map(prev);
            if (isTyping) next.set(user_id, username);
            else next.delete(user_id);
            return next;
          });

          const existingTimer = clearTimersRef.current.get(user_id);
          if (existingTimer) clearTimeout(existingTimer);

          if (isTyping) {
            const timer = setTimeout(() => {
              setTypingUsers((prev) => {
                const next = new Map(prev);
                next.delete(user_id);
                return next;
              });
            }, TYPING_TIMEOUT);
            clearTimersRef.current.set(user_id, timer);
          }
        })
        .subscribe();

      channelRef.current = channel;
    };

    loadAndSubscribe();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroup?.id, user?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      clearTimersRef.current.forEach((t) => clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const broadcastTyping = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current || !user) return;
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: {
          user_id: user.id,
          username: user.email ?? "Anonymous",
          isTyping,
        },
      });
    },
    [user],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      broadcastTyping(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      broadcastTyping(false);
    }, TYPING_TIMEOUT);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !activeGroup) return;

    const content = input;
    setInput("");

    isTypingRef.current = false;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    broadcastTyping(false);

    const { error } = await supabase.from("messages_a").insert({
      content,
      user_id: user.id,
      username: user.email ?? "Anonymous",
      group_id: activeGroup.id,
    });

    if (error) {
      console.error("Failed to send message:", error.message);
      setInput(content);
    }
  };

  const handleGroupCreated = async (groupId: string) => {
    setShowCreateModal(false);
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();
    if (!error && data) {
      setGroups((prev) => [data as Group, ...prev]);
      setActiveGroup(data as Group);
    }
  };

  const formatTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const typingLabel = () => {
    const names = Array.from(typingUsers.values());
    if (names.length === 0) return null;
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return `${names.length} people are typing...`;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        Loading...
      </div>
    );
  }

  return (
    <div className="d-flex vh-100">
      {/* Sidebar: group list */}
      <div className="border-end" style={{ width: "260px" }}>
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h6 className="mb-0">Groups</h6>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + New
          </button>
        </div>

        <div className="overflow-auto" style={{ height: "calc(100vh - 60px)" }}>
          {groups.length === 0 && (
            <p className="text-muted small p-3">
              No groups yet. Create one to start chatting.
            </p>
          )}
          {groups.map((g) => (
            <button
              key={g.id}
              className={`btn text-start w-100 rounded-0 py-2 px-3 ${
                activeGroup?.id === g.id ? "btn-light fw-semibold" : "btn-white"
              }`}
              onClick={() => setActiveGroup(g)}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="d-flex flex-column flex-grow-1">
        {!activeGroup ? (
          <div className="d-flex justify-content-center align-items-center h-100 text-muted">
            Select or create a group to start chatting
          </div>
        ) : (
          <>
            <div className="border-bottom p-3">
              <h6 className="mb-0">{activeGroup.name}</h6>
            </div>

            <div className="flex-grow-1 overflow-auto p-3">
              {loadingMessages ? (
                <div className="text-muted">Loading messages...</div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.user_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`d-flex mb-2 ${isOwn ? "justify-content-end" : "justify-content-start"}`}
                    >
                      <div
                        className={`p-2 px-3 rounded-3 ${isOwn ? "bg-primary text-white" : "bg-light"}`}
                        style={{ maxWidth: "70%" }}
                      >
                        {!isOwn && (
                          <div className="fw-semibold small mb-1">
                            {msg.username}
                          </div>
                        )}
                        <div>{msg.content}</div>
                        <div
                          className={`small mt-1 ${isOwn ? "text-white-50" : "text-muted"}`}
                          style={{ fontSize: "0.7rem" }}
                        >
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {typingLabel() && (
                <div className="text-muted small fst-italic px-2 py-1">
                  {typingLabel()}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={sendMessage}
              className="p-3 border-top d-flex gap-2"
            >
              <input
                type="text"
                className="form-control"
                value={input}
                onChange={handleInputChange}
                placeholder="Type a message..."
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!input.trim()}
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>

      {showCreateModal && user && (
        <CreateGroupModal
          currentUser={user}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleGroupCreated}
        />
      )}
    </div>
  );
}

// // app/chat/page.tsx
// "use client";

// import { useEffect, useState, useRef, useCallback } from "react";
// import { createClient } from "@/utils/supabase/client";
// import type { User, RealtimeChannel } from "@supabase/supabase-js";

// const ROOM_ID = "general";
// const TYPING_TIMEOUT = 3000; // stop showing "typing" after 3s of no input

// interface Message {
//   id: string;
//   content: string;
//   user_id: string;
//   username: string;
//   room_id: string;
//   created_at: string;
// }

// export default function ChatRoom() {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [input, setInput] = useState("");
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [typingUsers, setTypingUsers] = useState<Map<string, string>>(
//     new Map(),
//   ); // user_id -> username

//   const supabase = createClient();
//   const bottomRef = useRef<HTMLDivElement>(null);
//   const channelRef = useRef<RealtimeChannel | null>(null);
//   const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const isTypingRef = useRef(false);
//   const clearTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

//   useEffect(() => {
//     const init = async () => {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();
//       setUser(user);

//       // Fetch existing messages, oldest first
//       const { data, error } = await supabase
//         .from("messages_a")
//         .select("*")
//         .eq("room_id", ROOM_ID)
//         .order("created_at", { ascending: true })
//         .limit(50);

//       if (!error && data) {
//         setMessages(data as Message[]);
//       } else if (error) {
//         console.error("Failed to load messages:", error.message);
//       }
//       setLoading(false);

//       // Subscribe to new messages + typing broadcasts
//       const channel = supabase
//         .channel(`room:${ROOM_ID}`)
//         .on(
//           "postgres_changes",
//           {
//             event: "INSERT",
//             schema: "public",
//             table: "messages_a",
//             filter: `room_id=eq.${ROOM_ID}`,
//           },
//           (payload) => {
//             const newMsg = payload.new as Message;
//             setMessages((prev) => [...prev, newMsg]);
//             // Clear typing indicator for that user once their message arrives
//             setTypingUsers((prev) => {
//               const next = new Map(prev);
//               next.delete(newMsg.user_id);
//               return next;
//             });
//           },
//         )
//         .on("broadcast", { event: "typing" }, (payload) => {
//           const { user_id, username, isTyping } = payload.payload as {
//             user_id: string;
//             username: string;
//             isTyping: boolean;
//           };

//           if (user_id === user?.id) return; // ignore our own broadcast

//           setTypingUsers((prev) => {
//             const next = new Map(prev);
//             if (isTyping) {
//               next.set(user_id, username);
//             } else {
//               next.delete(user_id);
//             }
//             return next;
//           });

//           // Auto-clear if we don't hear a "stopped typing" in time
//           const existingTimer = clearTimersRef.current.get(user_id);
//           if (existingTimer) clearTimeout(existingTimer);

//           if (isTyping) {
//             const timer = setTimeout(() => {
//               setTypingUsers((prev) => {
//                 const next = new Map(prev);
//                 next.delete(user_id);
//                 return next;
//               });
//             }, TYPING_TIMEOUT);
//             clearTimersRef.current.set(user_id, timer);
//           }
//         })
//         .subscribe();

//       channelRef.current = channel;
//     };

//     init();

//     return () => {
//       if (channelRef.current) supabase.removeChannel(channelRef.current);
//       if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
//       clearTimersRef.current.forEach((t) => clearTimeout(t));
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, typingUsers]);

//   const broadcastTyping = useCallback(
//     (isTyping: boolean) => {
//       if (!channelRef.current || !user) return;
//       channelRef.current.send({
//         type: "broadcast",
//         event: "typing",
//         payload: {
//           user_id: user.id,
//           username: user.email ?? "Anonymous",
//           isTyping,
//         },
//       });
//     },
//     [user],
//   );

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setInput(e.target.value);

//     if (!isTypingRef.current) {
//       isTypingRef.current = true;
//       broadcastTyping(true);
//     }

//     if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
//     typingTimeoutRef.current = setTimeout(() => {
//       isTypingRef.current = false;
//       broadcastTyping(false);
//     }, TYPING_TIMEOUT);
//   };

//   const sendMessage = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!input.trim() || !user) return;

//     const content = input;
//     setInput("");

//     // Stop typing indicator immediately on send
//     isTypingRef.current = false;
//     if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
//     broadcastTyping(false);

//     const { error } = await supabase.from("messages_a").insert({
//       content,
//       user_id: user.id,
//       username: user.email ?? "Anonymous",
//       room_id: ROOM_ID,
//     });

//     if (error) {
//       console.error("Failed to send message:", error.message);
//       setInput(content); // restore on failure
//     }
//   };

//   const formatTime = (timestamp: string) =>
//     new Date(timestamp).toLocaleTimeString([], {
//       hour: "2-digit",
//       minute: "2-digit",
//     });

//   const typingLabel = () => {
//     const names = Array.from(typingUsers.values());
//     if (names.length === 0) return null;
//     if (names.length === 1) return `${names[0]} is typing...`;
//     if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
//     return `${names.length} people are typing...`;
//   };

//   if (loading) {
//     return (
//       <div className="d-flex justify-content-center align-items-center vh-100">
//         Loading messages...
//       </div>
//     );
//   }

//   return (
//     <div className="d-flex flex-column vh-100">
//       <div className="flex-grow-1 overflow-auto p-3">
//         {messages.map((msg) => {
//           const isOwn = msg.user_id === user?.id;
//           return (
//             <div
//               key={msg.id}
//               className={`d-flex mb-2 ${isOwn ? "justify-content-end" : "justify-content-start"}`}
//             >
//               <div
//                 className={`p-2 px-3 rounded-3 ${isOwn ? "bg-primary text-white" : "bg-light"}`}
//                 style={{ maxWidth: "70%" }}
//               >
//                 {!isOwn && (
//                   <div className="fw-semibold small mb-1">{msg.username}</div>
//                 )}
//                 <div>{msg.content}</div>
//                 <div
//                   className={`small mt-1 ${isOwn ? "text-white-50" : "text-muted"}`}
//                   style={{ fontSize: "0.7rem" }}
//                 >
//                   {formatTime(msg.created_at)}
//                 </div>
//               </div>
//             </div>
//           );
//         })}

//         {typingLabel() && (
//           <div className="text-muted small fst-italic px-2 py-1">
//             {typingLabel()}
//           </div>
//         )}

//         <div ref={bottomRef} />
//       </div>

//       <form onSubmit={sendMessage} className="p-3 border-top d-flex gap-2">
//         <input
//           type="text"
//           className="form-control"
//           value={input}
//           onChange={handleInputChange}
//           placeholder="Type a message..."
//         />
//         <button
//           type="submit"
//           className="btn btn-primary"
//           disabled={!input.trim()}
//         >
//           Send
//         </button>
//       </form>
//     </div>
//   );
// }

// // app/chat/page.tsx
// "use client";

// import { useEffect, useState, useRef } from "react";
// import { createClient } from "@/utils/supabase/client";
// import type { Message } from "./typechat";
// import type { User } from "@supabase/supabase-js";
// import type { RealtimeChannel } from "@supabase/supabase-js";

// const ROOM_ID = "general";

// export default function ChatRoom() {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [input, setInput] = useState("");
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);
//   const supabase = createClient();
//   const bottomRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     let channel: RealtimeChannel;

//     const init = async () => {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();
//       setUser(user);

//       // Fetch existing messages, oldest first
//       const { data, error } = await supabase
//         .from("messages_a")
//         .select("*")
//         .eq("room_id", ROOM_ID)
//         .order("created_at", { ascending: true })
//         .limit(50);

//       if (!error && data) {
//         setMessages(data as Message[]);
//       }
//       setLoading(false);

//       // Subscribe to new messages
//       channel = supabase
//         .channel(`room:${ROOM_ID}`)
//         .on(
//           "postgres_changes",
//           {
//             event: "INSERT",
//             schema: "public",
//             table: "messages_a",
//             filter: `room_id=eq.${ROOM_ID}`,
//           },
//           (payload) => {
//             setMessages((prev) => [...prev, payload.new as Message]);
//           },
//         )
//         .subscribe();
//     };

//     init();

//     return () => {
//       if (channel) supabase.removeChannel(channel);
//     };
//   }, []);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const sendMessage = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!input.trim() || !user) return;

//     const content = input;
//     setInput("");

//     const { error } = await supabase.from("messages_a").insert({
//       content,
//       user_id: user.id,
//       username: user.email ?? "Anonymous",
//       room_id: ROOM_ID,
//     });

//     if (error) {
//       console.error("Failed to send message:", error.message);
//       setInput(content); // restore on failure
//     }
//   };

//   const formatTime = (timestamp: string) =>
//     new Date(timestamp).toLocaleTimeString([], {
//       hour: "2-digit",
//       minute: "2-digit",
//     });

//   if (loading) {
//     return (
//       <div className="d-flex justify-content-center align-items-center vh-100">
//         Loading messages...
//       </div>
//     );
//   }

//   return (
//     <div className="d-flex flex-column vh-100">
//       <div className="flex-grow-1 overflow-auto p-3">
//         {messages.map((msg) => {
//           const isOwn = msg.user_id === user?.id;
//           return (
//             <div
//               key={msg.id}
//               className={`d-flex mb-2 ${isOwn ? "justify-content-end" : "justify-content-start"}`}
//             >
//               <div
//                 className={`p-2 px-3 rounded-3 ${isOwn ? "bg-primary text-white" : "bg-light"}`}
//                 style={{ maxWidth: "70%" }}
//               >
//                 {!isOwn && (
//                   <div className="fw-semibold small mb-1">{msg.username}</div>
//                 )}
//                 <div>{msg.content}</div>
//                 <div
//                   className={`small mt-1 ${isOwn ? "text-white-50" : "text-muted"}`}
//                   style={{ fontSize: "0.7rem" }}
//                 >
//                   {formatTime(msg.created_at)}
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//         <div ref={bottomRef} />
//       </div>

//       <form onSubmit={sendMessage} className="p-3 border-top d-flex gap-2">
//         <input
//           type="text"
//           className="form-control"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           placeholder="Type a message..."
//         />
//         <button
//           type="submit"
//           className="btn btn-primary"
//           disabled={!input.trim()}
//         >
//           Send
//         </button>
//       </form>
//     </div>
//   );
// }
