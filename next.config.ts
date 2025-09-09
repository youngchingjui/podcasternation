import type { NextConfig } from "next";

function remotePatternsFromEnv(): NextConfig["images"] | undefined {
  const base = process.env.S3_PUBLIC_BASE_URL;
  if (base) {
    try {
      const u = new URL(base);
      return {
        remotePatterns: [
          {
            protocol: u.protocol.replace(":", "") as "http" | "https",
            hostname: u.hostname,
            port: "",
            pathname: `${u.pathname.replace(/\/$/, "")}/**`,
          },
        ],
      };
    } catch {
      // fall through to broad amazonaws pattern
    }
  }
  return {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
        port: "",
        pathname: "/**",
      },
    ],
  };
}

const nextConfig: NextConfig = {
  images: remotePatternsFromEnv(),
};

export default nextConfig;

