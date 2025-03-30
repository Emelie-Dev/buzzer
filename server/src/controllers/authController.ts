import User from '../models/userModel.ts';
import asyncErrorHandler from '../utils/asyncErrorHandler.ts';
import { NextFunction, Request, Response } from 'express';
import Email from '../utils/Email.ts';
import CustomError from '../utils/CustomError.ts';

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
