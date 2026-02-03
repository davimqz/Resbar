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
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

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
