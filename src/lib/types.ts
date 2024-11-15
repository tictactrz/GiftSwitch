export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface Group {
  id: string;
  name: string;
  admin_id: string;
  budget: number;
  is_finalized: boolean;
}

export interface GroupMember {
  user_id: string;
  group_id: string;
  significant_other_id?: string;
  assigned_recipient_id?: string;
}

export interface WishListItem {
  id: string;
  user_id: string;
  amazon_url: string;
  title: string;
  price: number;
  image_url?: string;
} 