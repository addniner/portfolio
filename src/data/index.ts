import projectsData from './projects.json';
import profileData from './profile.json';
import type { Project, ProjectsData } from '@/types';

export const profile = profileData;

export function getProjectsData(): ProjectsData {
  return projectsData as ProjectsData;
}

export function getProjects(): Project[] {
  return Object.values(getProjectsData().projects);
}

export function getProject(name: string): Project | null {
  return getProjectsData().projects[name] || null;
}

export function getProjectNames(): string[] {
  return Object.keys(getProjectsData().projects);
}
