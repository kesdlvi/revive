export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id?: string; // For nested/reply comments
  content: string;
  label?: 'question' | 'comment' | 'suggestion';
  created_at: string;
  username?: string;
  display_name?: string;
  replies?: PostComment[]; // Nested replies
}

export interface FurnitureImage {
  id: string;
  public_url: string;
  user_id?: string;
  item?: string;
  style?: string;
  description?: string;
  material?: string;
  color?: string;
  created_at: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

export type ViewType = 'feed' | 'camera' | 'profile';

