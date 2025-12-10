import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/a/**',
      },
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    // Handle node: protocol imports
    const nodeProtocolModules = [
      'module', 'util', 'path', 'fs', 'crypto', 'stream',
      'buffer', 'process', 'events', 'url', 'http', 'https',
      'zlib', 'os', 'net', 'tls', 'dns', 'dgram', 'child_process',
      'cluster', 'readline', 'repl', 'tty', 'v8', 'vm', 'worker_threads',
      'perf_hooks', 'async_hooks', 'string_decoder', 'timers', 'querystring',
      'punycode', 'assert', 'constants'
    ];

    nodeProtocolModules.forEach((moduleName) => {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          new RegExp(`^node:${moduleName}$`),
          (resource: any) => {
            resource.request = moduleName;
          }
        )
      );
    });

    // For client-side, provide fallbacks for Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        module: false,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        readline: false,
        repl: false,
        cluster: false,
        dgram: false,
        http2: false,
        worker_threads: false,
        perf_hooks: false,
        async_hooks: false,
        inspector: false,
        trace_events: false,
      };
    }

    return config;
  },
};

export default nextConfig;
