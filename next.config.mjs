import path from 'path';
import { fileURLToPath } from 'url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const repoName = 'ideaPiece';
const basePath = isGithubPages ? `/${repoName}` : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: projectRoot,
  output: isGithubPages ? 'export' : undefined,
  trailingSlash: isGithubPages,
  basePath,
  assetPrefix: isGithubPages ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_STATIC_MODE: isGithubPages ? 'true' : process.env.NEXT_PUBLIC_STATIC_MODE || 'false',
  },
};

export default nextConfig;
