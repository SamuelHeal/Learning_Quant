/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // When running on the server, mark pyodide as external to prevent bundling issues
      config.externals.push("node-fetch");
    }

    return config;
  },
};

export default nextConfig;
