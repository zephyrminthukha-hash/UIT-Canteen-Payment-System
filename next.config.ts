import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Vercel deployment configuration
  // Use standalone output for optimal serverless deployment
  output: "standalone",
  // Ensure environment variables are available at build time
  env: {
    // These will be overridden by Vercel dashboard settings
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
  },
  // Experimental features for better performance
  experimental: {
    // Enable if using server components with heavy data fetching
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
  // Image optimization settings
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
