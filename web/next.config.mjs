/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Needed for argon2 native bindings on Vercel
  experimental: {
    serverComponentsExternalPackages: ['argon2'],
  },
};

export default nextConfig;
