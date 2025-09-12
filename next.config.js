/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  // If your site is at https://username.github.io/my-site/
  // add basePath and assetPrefix:
  // basePath: '/my-site',
  // assetPrefix: '/my-site/',
}

module.exports = nextConfig
