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

function convertImagePaths(
  markdown: string,
  owner: string,
  repo: string,
  branch = 'main'
): string {
  const baseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`;
  return markdown.replace(
    /!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g,
    (_, alt, imgPath) => {
      const absolutePath = imgPath.startsWith('/')
        ? `${baseUrl}${imgPath}`
        : `${baseUrl}/${imgPath}`;
      return `![${alt}](${absolutePath})`;
    }
  );
}

async function fetchProjects() {
  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME || 'addniner';

  if (!token) {
    console.log('⚠️  GITHUB_TOKEN not found. Using existing projects.json');
    return;
  }

  console.log(`📦 Fetching projects for ${username}...`);

  const octokit = new Octokit({ auth: token });

  try {
    // Fetch all repos
    const { data: repos } = await octokit.repos.listForUser({
      username,
      sort: 'updated',
      per_page: 100,
    });

    // Filter repos with 'portfolio' topic
    const portfolioRepos = repos.filter(
      (repo) => repo.topics?.includes('portfolio') && !repo.fork
    );

    console.log(`📂 Found ${portfolioRepos.length} portfolio projects`);

    const projects: Record<string, Project> = {};

    for (const repo of portfolioRepos) {
      console.log(`  → Fetching ${repo.name}...`);

      let readme = '';
      try {
        const { data: readmeData } = await octokit.repos.getReadme({
          owner: username,
          repo: repo.name,
        });

        const content = Buffer.from(readmeData.content, 'base64').toString('utf-8');
        readme = convertImagePaths(content, username, repo.name, repo.default_branch);
      } catch {
        console.log(`    ⚠️  No README found for ${repo.name}`);
        readme = `# ${repo.name}\n\n${repo.description || 'No description available.'}`;
      }

      projects[repo.name] = {
        name: repo.name,
        description: repo.description,
        readme,
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        language: repo.language,
        url: repo.html_url,
        homepage: repo.homepage || null,
        updated_at: repo.updated_at || new Date().toISOString(),
        topics: repo.topics || [],
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
