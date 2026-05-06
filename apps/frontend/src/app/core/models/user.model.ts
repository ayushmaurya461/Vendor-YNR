export type UserRole = 'customer' | 'vendor';

export interface User {
  id: string;
  phone: string;
  name?: string;
  area?: string;
  role: UserRole;
  createdAt: string;
  profileComplete?: boolean;
}
