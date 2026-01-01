export interface Project {
  name: string;
  description: string | null;
  readme: string;
  stars: number;
  forks: number;
  language: string | null;
  url: string;
  homepage: string | null;
  updated_at: string;
  topics: string[];
}

export interface ProjectsData {
  generated_at: string;
  projects: Record<string, Project>;
}
