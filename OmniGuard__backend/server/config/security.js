/**
 * OmniGuard Backend — Security Configuration
 * Defines CORS origins and Helmet CSP policies.
 */

const getSecurityConfig = (env) => {
  const allowedOrigins = [
    'https://omniguard-web.vercel.app',
    'https://*.vercel.app',
    'https://huggingface.co',
    'https://*.hf.space'
  ];

  if (env.FRONTEND_ORIGIN) {
    env.FRONTEND_ORIGIN.split(',').forEach(o => allowedOrigins.push(o.trim()));
  }

  const helmetConfig = {
    contentSecurityPolicy: env.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", 'ws:', 'wss:', 'https://hrishikeshdutta-omniguard-api.hf.space'],
        imgSrc: ["'self'", 'data:', 'https:'],
        frameAncestors: ["'self'", 'https://huggingface.co', 'https://*.hf.space'],
      },
    } : false,
    hsts: { maxAge: 31536000, includeSubDomains: true },
    crossOriginEmbedderPolicy: false,
  };

  return { allowedOrigins, helmetConfig };
};

module.exports = { getSecurityConfig };
