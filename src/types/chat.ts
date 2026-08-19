export interface ChatMessage {
  id: string; // Unique Message ID
  senderId: string; // পাঠাদানকারী ইউজারের ID (যেমন: 'USR-ALEX')
  receiverId: string; // গ্রহণকারী ইউজারের ID (যেমন: 'USR-DAVID' অথবা 'ADMIN')
  senderName: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface UserProfile {
  userId: string;
  username: string;
  role: 'user' | 'admin';
  diamonds: number;
}
