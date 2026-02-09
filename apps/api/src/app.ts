import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app: Application = express();

// Trust proxy for production environments (Render, Heroku, etc.)
app.set('trust proxy', 1);

// Security middleware with relaxed policies for OAuth
app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // Permite cookies
}));
app.use(cookieParser());

// Rate limiting
// Global limiter but skip the heavy dashboard finance route so we can
// apply a per-route, higher limit for that endpoint.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // skip global limiter for finance summary path so a dedicated limiter can be used
    // also skip auth routes (login/refresh/logout) to avoid blocking logout/refresh flows
    const path = req.path ?? '';
    if (path.startsWith('/api/dashboard/finance')) return true;
    if (path.startsWith('/api/auth')) return true;
    return false;
  },
});
// Only enable the global rate limiter in non-development environments
if (process.env.NODE_ENV !== 'development' && process.env.DISABLE_RATE_LIMITS !== 'true') {
  app.use('/api/', limiter);
} else {
  // Helpful log for local development
  // eslint-disable-next-line no-console
  console.log('Rate limiter disabled for development (NODE_ENV=development or DISABLE_RATE_LIMITS=true)');
}

// More permissive limiter for finance dashboard (temporary increase)
const financeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // allow more requests for testing/dev
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/dashboard/finance', financeLimiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Serve OpenAPI spec and Swagger UI
app.use('/docs/openapi.yaml', express.static(path.join(process.cwd(), 'docs', 'openapi.yaml')));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(undefined, { swaggerUrl: '/docs/openapi.yaml' }));

// Routes
app.use('/api', routes);

// Resolve base URL helper with precedence and safety
function getBaseUrlFromRequest(req: express.Request): string {
  const xfProto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0];
  const proto = xfProto || req.protocol;
  const host = (req.headers['x-forwarded-host'] as string | undefined)
    || (req.headers['x-forwarded-server'] as string | undefined)
    || req.headers.host;
  return `${proto}://${host}`.replace(/\/$/, '');
}

function resolveBaseUrl(req: express.Request): string {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, '');
  if (process.env.ALLOW_DYNAMIC_BASE_URL === 'true') return getBaseUrlFromRequest(req);
  // fallback to derived value when BASE_URL not set (safe default)
  return getBaseUrlFromRequest(req);
}

// Health check
app.get('/health', (req, res) => {
  const baseUrl = resolveBaseUrl(req) || `http://localhost:${process.env.PORT || 3333}`;
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    docs: `${baseUrl}/docs`,
    openapi: `${baseUrl}/docs/openapi.yaml`,
  });
});

// Error handling
app.use(errorHandler);

export default app;
