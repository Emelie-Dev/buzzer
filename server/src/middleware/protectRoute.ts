import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import User from '../models/userModel.js';
import { NextFunction, Response } from 'express';
import CustomError from '../utils/CustomError.js';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AuthRequest } from '../utils/asyncErrorHandler.js';

export default asyncErrorHandler(
  async (req: AuthRequest, _: Response, next: NextFunction) => {
    // Get bearer token
    const bearerToken = req.headers.authorization;

    const jwtToken =
      bearerToken && bearerToken.startsWith('Bearer')
        ? bearerToken.split(' ')[1]
        : req.cookies.jwt;

    if (!jwtToken) return next(new CustomError('You are not logged in.', 401));

    // verify the token
    const decodedToken = jwt.verify(
      jwtToken,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    // check if the user exists
    let user = await User.findById(decodedToken.id);

    if (!user)
      return next(
        new CustomError('The user with the given token does not exist.', 401)
      );

    // Checks if the user changed the password after token was issued
    const isPasswordChanged = user.isPasswordChanged(
      decodedToken.iat as number
    );

    if (isPasswordChanged) {
      return next(
        new CustomError(
          'Your password was recently changed. Please log in again.',
          401
        )
      );
    }

    // Checks if user session is valid
    const jwi = decodedToken.jwi;
    const sessions = user.settings.security.sessions || [];
    const session = sessions.find((session) => session.jwi === jwi);

    if (!session) return next(new CustomError('This session is invalid.', 401));

    session.lastUsed = new Date();

    user = await User.findByIdAndUpdate(
      user._id,
      {
        'settings.security.sessions': sessions,
      },

      {
        new: true,
        runValidators: true,
      }
    );

    req.activeSession = session.jwi;
    req.user = user as Record<string, any>;

    // Allow the user access the route
    next();
  }
);
