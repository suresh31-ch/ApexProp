import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './server/routes/api.router';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// ============================================================================
// SECURITY HARDENING MIDDLEWARE (PART 4)
// ============================================================================

// 1. Remove identifying fingerprint
app.disable('x-powered-by');

// 2. Security Headers Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy permitting AI Studio iframe embedding and CDN assets
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:; " +
    "img-src 'self' https: data: blob:; " +
    "font-src 'self' https: data:; " +
    "connect-src 'self' https: wss:; " +
    "frame-ancestors 'self' https://*.google.com https://*.run.app https://*.aistudio.google.com;"
  );

  next();
});

// 3. CORS & Preflight Configuration
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, X-Client-Info');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// 4. In-Memory Sliding Window Rate Limiter
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();

function createRateLimiter(windowMs: number, maxRequests: number, endpointName: string = 'general') {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const key = `${endpointName}:${ip}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);
    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    record.count++;
    if (record.count > maxRequests) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        error: `Rate quota limit exceeded for ${endpointName}. Please retry in ${retryAfterSec} seconds.`,
        retryAfter: retryAfterSec
      });
    }

    next();
  };
}

// Apply general API rate limiter: 250 requests per minute
app.use('/api', createRateLimiter(60 * 1000, 250, 'api-standard'));
// Stricter rate limiter for heavy AI multimodal inspection calls: 20 per minute
app.use('/api/inspect', createRateLimiter(60 * 1000, 20, 'ai-inspection'));

// 5. Body parser with 50mb limit for high-res property inspection images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 6. Serve local upload assets (fallback if Supabase private storage is initializing)
const uploadsDir = path.join(__dirname, 'public/uploads');
app.use('/uploads', express.static(uploadsDir));

// ============================================================================
// MOUNT MODULAR API ROUTER
// ============================================================================
app.use('/api', apiRouter);

// ============================================================================
// CENTRALIZED ERROR HANDLING MIDDLEWARE (Sanitized, No Secret Leaks)
// ============================================================================
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ApexProp Server Error] [${req.method} ${req.url}]:`, err?.message || err);
  
  const statusCode = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    error: err?.message || 'Internal server error occurred.',
    timestamp: new Date().toISOString(),
    path: req.path,
    // Never leak stack traces to client in production
    ...(isProd ? {} : { stack: err.stack })
  });
});

// ============================================================================
// VITE SPA & STATIC SERVING
// ============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ApexProp AI] Full-stack application active at http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('[ApexProp AI] Gracefully closing HTTP server...');
    server.close(() => {
      console.log('[ApexProp AI] Server terminated cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();
