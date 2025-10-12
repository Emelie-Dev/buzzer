// Core Modules
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Third party Modules
import express from 'express';
import { config } from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
// import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import sanitizeHtml from 'sanitize-html';
import sanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import compression from 'compression';
import morgan from 'morgan';
import workerpool from 'workerpool';
import requestIp from 'request-ip';

// Custom Modules
import './cron/expiredStoryCron.js';
import './cron/profileViewCron.js';
import authRouter from './routes/authRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import CustomError from './utils/CustomError.js';
import storiesRouter from './routes/storyRoutes.js';
import likesRouter from './routes/likeRoutes.js';
import contentRouter from './routes/contentRoutes.js';
import commentRouter from './routes/commentRoutes.js';
import bookmarkRouter from './routes/bookmarkRoute.js';
import followRouter from './routes/followRoutes.js';
import viewRouter from './routes/viewRoutes.js';
import userRouter from './routes/userRoutes.js';
import searchRouter from './routes/searchRoutes.js';
import friendRouter from './routes/friendRoutes.js';
import reelRouter from './routes/reelRoutes.js';
import notificationRouter from './routes/notificationRoutes.js';
import analyticsRouter from './routes/analyticsRoutes.js';
import shareRouter from './routes/shareRoutes.js';

const app = express();

config({ path: './config.env' });

const workerScriptFile = join(
  dirname(fileURLToPath(import.meta.url)),
  process.env.NODE_ENV === 'production' ? 'worker.js' : 'worker.ts'
);

export const pool = workerpool.pool(workerScriptFile, {
  maxWorkers: 4,
  minWorkers: 0,
  workerThreadOpts:
    process.env.NODE_ENV === 'production'
      ? {}
      : {
          execArgv: [
            '--import',
            'data:text/javascript,import { register } from "node:module";' +
              ' import { pathToFileURL } from "node:url";' +
              ' register("ts-node/esm", pathToFileURL("./"));',
          ],
        }, // ts-node loader converts the ts file to js
});

// Middlewares

// Implements Cors
const allowedOrigins = [
  'http://localhost:5173',
  'https://buzzer-0z8q.onrender.com',
];

const corsOptions = {
  origin: function (origin: any, callback: any) {
    // Check if the origin is in the allowedOrigins array or is undefined (same-origin or server-side requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(
        new Error('You are not allowed to make the request because of CORS.')
      );
    }
  },
  credentials: true,
};

// ✅ Trust proxy so IPs are real behind Render
app.set('trust proxy', true);

// ✅ Use request-ip middleware
app.use(requestIp.mw());

app.use(cors(corsOptions));

// Render static files
app.use(
  express.static(join(dirname(fileURLToPath(import.meta.url)), 'public'))
);

// Adds security headers
app.use(helmet());

// Implements rate limiting
// const limiter = rateLimit({
//   max: 1000,
//   windowMs: 60 * 60 * 1000,
//   message:
//     'We have received too many request from this IP address. Please try after one hour.',
// });

// app.use('/api', limiter);

// Parses request body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Parses cookies
app.use(cookieParser());

// Sanitize mongo injections
app.use(sanitize());

// Sanitize html injections
app.use((req, _, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        const cleanText = sanitizeHtml(req.body[key], {
          allowedTags: ['a', 'br'],
          allowedAttributes: {
            a: ['class', 'href'],
          },
          allowedClasses: {
            a: ['app-user-tags'],
          },
        });

        req.body[key] = cleanText
          .replace(/(<br\s*\/?>\s*){2,}/gi, '<br />')
          .replace(/(&nbsp;\s*){2,}/gi, '&nbsp;');
      }
    }
  }
  next();
});

// Prevents parameter pollution
app.use(
  hpp({
    whitelist: [],
  })
);

// Compresses response
app.use(compression());

// Displays response details in terminal
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Route handlers
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/stories', storiesRouter);
app.use('/api/v1/likes', likesRouter);
app.use('/api/v1/contents', contentRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/api/v1/bookmarks', bookmarkRouter);
app.use('/api/v1/follow', followRouter);
app.use('/api/v1/views', viewRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/friends', friendRouter);
app.use('/api/v1/reels', reelRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/share', shareRouter);

// For wrong endpoints
app.all('*', (req, _, next) => {
  next(new CustomError(`Can't find ${req.originalUrl} on the server.`, 404));
});

// Error middlewares
app.use(errorHandler);

export default app;
