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

// Custom Modules
// import errorController from './Controllers/errorController.ts';
// import CustomError from './Utils/CustomError.js';

const app = express();

config({ path: './config.env' });

// Middlewares

// Implements Cors
const allowedOrigins = [
  'http://localhost:5173',
  'https://buzzer-d1x4.onrender.com/',
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
        req.body[key] = sanitizeHtml(req.body[key]); // Sanitize input fields
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

// For wrong endpoints
// app.all('*', (req, _, next) => {
//   const error = new CustomError(
//     `Can't find ${req.originalUrl} on the server.`,
//     404
//   );

//   next(error);
// });

// Error middlewares
// app.use(errorController);

app.get('/', (_: Request, res: Response) => {
  return res.send('Welcome to Buzzer!!');
});

export default app;
