export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'CUSTOMER' | 'SUPPLIER' | 'ADMIN';
}
