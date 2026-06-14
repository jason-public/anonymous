export type CategoryType = '교통' | '복지' | '환경' | '교육' | '문화' | '안전' | '경제' | '기타';
export type StatusType = '접수' | '검토중' | '채택' | '보류' | '반려';

export interface Attachment {
  file_url: string;
  file_name: string;
}

export interface IdeaHistoryItem {
  id: string;
  status: StatusType;
  admin_notes: string;
  updated_at: string;
  updated_by_nickname: string;
}

export interface Idea {
  id: string;
  title: string;
  content: string;
  category: CategoryType;
  status: StatusType;
  summary: string; // 3-line AI summary
  similarity_flag: boolean;
  similarity_score?: number; // Calculated %
  similar_to_title?: string;
  created_at: string;
  attachments?: Attachment[];
  admin_notes?: string;
  history?: IdeaHistoryItem[];
}

export interface UserIdeaMapping {
  user_id: string;
  idea_id: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  role: 'User' | 'Admin';
  is_supabase?: boolean;
}
