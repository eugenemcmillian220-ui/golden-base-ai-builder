export interface Project {
  id: string;
  user_id: string;
  name: string;
  prompt: string;
  code: string;
  deployed_url?: string;
  github_url?: string;
  created_at: string;
  updated_at: string;
}
