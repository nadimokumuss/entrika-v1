// Database Types
export type Gender = "female" | "male" | "other";

export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  gender: Gender;
  reputation_score: number;
  is_verified: boolean;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  content: string;
  category: string;
  is_anonymous: boolean;
  is_spoiler: boolean;
  image_url: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export interface ShadowProfile {
  id: string;
  target_name: string;
  identifier_hash: string;
  city: string;
  avg_score: number;
  total_reviews: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DatingProfile {
  id: string;
  user_id: string;
  bio: string;
  photos: string[];
  interests: string[];
  job: string | null;
  education: string | null;
  city: string;
  age: number | null;
  looking_for: string;
  relationship_status: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface UserReview {
  id: string;
  target_user_id: string;
  reviewer_id: string;
  score: number;
  content: string | null;
  tags: string[];
  is_anonymous: boolean;
  created_at: string;
  helpful_votes?: number;
  vote_scores?: Record<string, string>;
}

export type ReportType = "post" | "user" | "shadow_profile";

export interface Report {
  id: string;
  reporter_id: string;
  report_type: ReportType;
  target_id: string;
  reason: string;
  details: string | null;
  created_at: string;
}

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}
