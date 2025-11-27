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
}

export type ViewType = 'feed' | 'camera' | 'profile';

