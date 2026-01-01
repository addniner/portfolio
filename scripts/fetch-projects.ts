import { Octokit } from '@octokit/rest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Project {
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

interface ProjectsData {
  generated_at: string;
  projects: Record<string, Project>;
}

interface PinnedRepo {
  name: string;
  description: string | null;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: { name: string } | null;
  url: string;
  homepageUrl: string | null;
  updatedAt: string;
  repositoryTopics: {
    nodes: Array<{ topic: { name: string } }>;
  };
  defaultBranchRef: { name: string } | null;
}

function convertRelativePaths(
  markdown: string,
  owner: string,
  repo: string,
  branch = 'main'
): string {
  const baseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`;

  const toAbsolute = (path: string) =>
    path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`;

  // Skip if already absolute URL or anchor link
  const isRelative = (path: string) =>
    !path.startsWith('http://') &&
    !path.startsWith('https://') &&
    !path.startsWith('#') &&
    !path.startsWith('mailto:');

  let result = markdown;

  // Convert markdown image syntax: ![alt](path)
  result = result.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (match, alt, path) => (isRelative(path) ? `![${alt}](${toAbsolute(path)})` : match)
  );

  // Convert markdown link syntax: [text](path) - for files like PDFs
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (match, text, path) => (isRelative(path) ? `[${text}](${toAbsolute(path)})` : match)
  );

  // Convert HTML img tags: <img src="path" ...>
  result = result.replace(
    /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*)>/gi,
    (match, before, path, after) =>
      isRelative(path) ? `<img ${before}src="${toAbsolute(path)}"${after}>` : match
  );

  // Convert HTML anchor tags: <a href="path" ...>
  result = result.replace(
    /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*)>/gi,
    (match, before, path, after) =>
      isRelative(path) ? `<a ${before}href="${toAbsolute(path)}"${after}>` : match
  );

  return result;
}

async function fetchProjects() {
  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME || 'addniner';

  if (!token) {
    console.log('⚠️  GITHUB_TOKEN not found. Using existing projects.json');
    return;
  }

  console.log(`📦 Fetching pinned projects for ${username}...`);

  const octokit = new Octokit({ auth: token });

  try {
    // Fetch pinned repos using GraphQL
    const { user } = await octokit.graphql<{
      user: {
        pinnedItems: {
          nodes: PinnedRepo[];
        };
      };
    }>(`
      query($username: String!) {
        user(login: $username) {
          pinnedItems(first: 6, types: REPOSITORY) {
            nodes {
              ... on Repository {
                name
                description
                stargazerCount
                forkCount
                primaryLanguage { name }
                url
                homepageUrl
                updatedAt
                repositoryTopics(first: 10) {
                  nodes { topic { name } }
                }
                defaultBranchRef { name }
              }
            }
          }
        }
      }
    `, { username });

    const pinnedRepos = user.pinnedItems.nodes;
    console.log(`📌 Found ${pinnedRepos.length} pinned projects`);

    const projects: Record<string, Project> = {};

    for (const repo of pinnedRepos) {
      console.log(`  → Fetching ${repo.name}...`);

      let readme = '';
      try {
        const { data: readmeData } = await octokit.repos.getReadme({
          owner: username,
          repo: repo.name,
        });

        const content = Buffer.from(readmeData.content, 'base64').toString('utf-8');
        const branch = repo.defaultBranchRef?.name || 'main';
        readme = convertRelativePaths(content, username, repo.name, branch);
      } catch {
        console.log(`    ⚠️  No README found for ${repo.name}`);
        readme = `# ${repo.name}\n\n${repo.description || 'No description available.'}`;
      }

      projects[repo.name] = {
        name: repo.name,
        description: repo.description,
        readme,
        stars: repo.stargazerCount,
        forks: repo.forkCount,
        language: repo.primaryLanguage?.name || null,
        url: repo.url,
        homepage: repo.homepageUrl || null,
        updated_at: repo.updatedAt,
        topics: repo.repositoryTopics.nodes.map(n => n.topic.name),
      };
    }

    const output: ProjectsData = {
      generated_at: new Date().toISOString(),
      projects,
    };

    const outputPath = path.join(__dirname, '../src/data/projects.json');
    await fs.writeJSON(outputPath, output, { spaces: 2 });

    console.log(`✅ Saved ${Object.keys(projects).length} projects to projects.json`);
  } catch (error) {
    console.error('❌ Failed to fetch projects:', error);
    process.exit(1);
  }
}

fetchProjects();
