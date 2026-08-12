export interface Profile {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
}

export interface ChatRoom {
  id: number;
  name: string;
  is_public: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  created_at: string;
  chat_room_id: number;
  author_id: string;
  text: string;
  author?: Profile;
}

export interface RoomMember {
  member_id: string;
  chat_room_id: number;
  created_at: string;
}
