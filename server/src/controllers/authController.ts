import User, { IUser } from '../models/userModel.js';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Request, Response } from 'express';
import Email from '../utils/Email.js';
import CustomError from '../utils/CustomError.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { AuthRequest } from '../middleware/protectRoute.js';

const verifyResult = fs.readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    '../templates/verifyResult.html'
  ),
  'utf-8'
);

const sendEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
  user: IUser,
  signup?: boolean
) => {
  // Generate email verification token
  const verificationToken = user.generateToken();
  await user.save({ validateBeforeSave: false });

  try {
    // Creates email verification url
    const verificationUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/auth/verify-email/${verificationToken}`;

    await new Email(user, verificationUrl).sendEmailVerification();

    return res.status(200).json({
      status: 'success',
      message:
        'A verification email has been sent to you. Click the link in the email to complete your signup process.',
    });
  } catch {
    // Removes verification token from user data
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;

    await user.save({ validateBeforeSave: false });

    const message = signup
      ? 'An error occurred while sending the verification email. Please try logging in with the credentials you entered.'
      : 'An error occurred while sending the verification email. Please try again later.';

    return next(new CustomError(message, 500));
  }
};

const signToken = (id: unknown) => {
  return jwt.sign({ id }, String(process.env.JWT_SECRET), {
    expiresIn: Number(process.env.JWT_LOGIN_EXPIRES),
  });
};

export const signup = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.create(req.body);

    return await sendEmail(req, res, next, user, true);
  }
);

export const verifyEmail = asyncErrorHandler(
  async (req: Request, res: Response) => {
    //  Regenerates token
    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken,
      emailVerificationTokenExpires: { $gt: Date.now() },
    });

    const homePage =
      process.env.NODE_ENV === 'production'
        ? 'https://buzzer-0z8q.onrender.com'
        : 'http://localhost:5173';

    if (!user) {
      const resultPage = verifyResult
        .replace(
          '{{CONTENT}}',
          `<div class="body body-fail">Oops! Looks like the verification link is invalid or has expired. No worries—just log in to your account to get a new one!
    <div class="btn-div"><a href="${homePage}/auth"><button class='btn'>Login</button></a></div>
    </div>`
        )
        .replace('{{CONTENT2}}', '');

      return res.status(404).send(resultPage);
    } else {
      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationTokenExpires = undefined;

      await user.save({ validateBeforeSave: false });

      const jwtToken = signToken(user._id);

      res.cookie('jwt', jwtToken, {
        maxAge: Number(process.env.JWT_LOGIN_EXPIRES),
        httpOnly: true,
      });

      const resultPage = verifyResult
        .replace(
          '{{CONTENT}}',
          `<div class="body body-success">Your email verification was successful!
    </div>`
        )
        .replace(
          '{{CONTENT2}}',
          `<script>
   (() => {
   setTimeout(() => {
    window.location.href = '${homePage}/home'
    }, 3000)
      })();
   </script>`
        );

      res.status(200).send(resultPage);

      // Sends welcome email after response so as not to delay response
      try {
        const url = `${req.protocol}://${req.get('host')}/settings`;
        return await new Email(user, url).sendWelcome();
      } catch {}
    }
  }
);

export const login = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(
        new CustomError(
          'Please provide your email and password for logging in!',
          400
        )
      );
    }

    const user = await User.findOne({
      email,
      __login: true,
    });

    if (!user || !(await user.comparePasswordInDb(password, user.password))) {
      return next(new CustomError('Incorrect email or password', 401));
    }

    if (!user.emailVerified) {
      if (
        !user.emailVerificationToken ||
        Date.parse(String(user.emailVerificationTokenExpires)) < Date.now()
      )
        return await sendEmail(req, res, next, user);
      else {
        return res.status(200).json({
          status: 'success',
          message:
            'Finish setting up your account by clicking the verification link in the email we sent you!',
        });
      }
    }

    const token = signToken(user._id);
    const {
      password: userPassword,
      emailVerified,
      __v,
      active,
      ...userData
    } = user.toObject();

    res.cookie('jwt', token, {
      maxAge: Number(process.env.JWT_LOGIN_EXPIRES),
      //  Prevents javascript access
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    return res.status(200).json({
      status: 'success',
      token,
      data: {
        user: userData,
      },
    });
  }
);

export const logout = asyncErrorHandler(async (_: Request, res: Response) => {
  res.cookie('jwt', 'loggedout', {
    maxAge: Number(process.env.JWT_LOGIN_EXPIRES),
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });

  return res.status(200).json({ status: 'success', message: null });
});

export const authConfirmed = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    return res.status(200).json({
      status: 'success',
      data: {
        user: req.user,
      },
    });
  }
);
