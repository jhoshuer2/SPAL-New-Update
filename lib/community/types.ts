export type FeedPost = {
  id: string; type: "update" | "win" | "struggle" | "question" | "milestone"; body: string; media_urls: string[];
  attachment: { kind: "milestone"; title: string; level: number } | { kind: "moment"; type: string; text: string; date: string } | null;
  anonymous: boolean; author_level: number | null; created_at: string;
  author_id: string | null; author_name: string | null; author_avatar: string | null; author_business_type: string | null;
  is_mine: boolean; reaction_count: number; comment_count: number; my_reaction: string | null; saved: boolean;
};
export type CommentRow = { id: string; post_id: string; parent_id: string | null; body: string; is_helpful: boolean; anonymous: boolean; created_at: string; author_id: string | null; author_name: string | null; author_avatar: string | null; is_mine: boolean };
