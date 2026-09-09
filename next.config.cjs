/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		appDir: true
	},
	eslint: {
		// 在打包部署时忽略 ESLint 校验错误
		ignoreDuringBuilds: true
	},
	typescript: {
		// Dangerously allow production builds to successfully complete even if
		// your project has type errors.
		ignoreBuildErrors: true
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'raw.githubusercontent.com'
			},
			{
				protocol: 'https',
				hostname: 'cryptologos.cc'
			},
			{
				protocol: 'https',
				hostname: 'openpeerimages.s3.us-west-1.amazonaws.com'
			},
			{
				protocol: 'http',
				hostname: 'localhost'
			}
		]
	},
	webpack: (config) => {
		config.resolve.fallback = { fs: false, net: false, tls: false };
		return config;
	}
};

module.exports = nextConfig;
