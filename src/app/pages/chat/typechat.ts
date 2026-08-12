export interface Message {
  id: string;
  content: string;
  user_id: string;
  username: string;
  group_id: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
}
