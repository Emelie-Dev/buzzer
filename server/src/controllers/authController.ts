import User from '../models/userModel.js';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Request, Response } from 'express';
import Email from '../utils/Email.js';
import CustomError from '../utils/CustomError.js';
import crypto from 'crypto';

export const signup = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.create(req.body);

    // Gnerate email verification token
    const verificationToken = user.generateToken();
    await user.save({ validateBeforeSave: false });

    try {
      // Creates email verification url
      const verificationUrl = `${req.protocol}://${req.get(
        'host'
      )}/api/v1/auth/verify_email/${verificationToken}`;

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

      return next(
        new CustomError(
          'An error occurred while sending the verification email. Please try logging in with the credentials you entered.',
          500
        )
      );
    }
  }
);

export const verifyEmail = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    //  Regenerates token
    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.find({
      emailVerificationToken,
      emailVerificationTokenExpires: { $gt: Date.now() },
    });

    const url =
      process.env.NODE_ENV === 'production'
        ? 'https://taskflow-266v.onrender.com'
        : 'http://localhost:5173';
  }
);
