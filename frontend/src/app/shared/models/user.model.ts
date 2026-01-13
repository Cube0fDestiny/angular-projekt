export interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  bio?: string | null;
  is_company: boolean;
  created_at?: string;
  avatar: string;
}