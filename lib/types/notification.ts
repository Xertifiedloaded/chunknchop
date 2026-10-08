export interface Notification {
  id: string;
  type: 'order' | 'product' | 'promotion' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}
