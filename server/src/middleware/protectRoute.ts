import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import User from '../models/userModel.js';
import { NextFunction, Response } from 'express';
import CustomError from '../utils/CustomError.js';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import Session from '../models/sessionModel.js';
import { getDeviceDetails } from '../controllers/authController.js';

export default asyncErrorHandler(
  async (req: AuthRequest, _: Response, next: NextFunction) => {
    // Get bearer token
    const bearerToken = req.headers.authorization;

    const jwtToken =
      bearerToken && bearerToken.startsWith('Bearer')
        ? bearerToken.split(' ')[1]
        : req.cookies.jwt;
    const deviceCookie = req.cookies.deviceId;

    if (!jwtToken) return next(new CustomError('You are not logged in.', 401));

    // verify the token
    const decodedToken = jwt.verify(
      jwtToken,
      process.env.JWT_SECRET as string
    ) as JwtPayload;
    const deviceId = decodedToken.deviceId;

    if (deviceId !== deviceCookie) {
      return next(new CustomError('Invalid Device ID.', 401));
    }

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
    const session = await Session.findOne({
      user: user._id,
      deviceId,
      revokedAt: null,
    });
    if (!session) return next(new CustomError('This session is invalid.', 401));

    // const deviceName = await getDeviceDetails(
    //   req.get('user-agent')!,
    //   req.clientIp!,
    //   true
    // );

    // if (session.deviceName !== deviceName) {
    //   return next(new CustomError('This session is invalid.', 401));
    // }

    session.lastUsedAt = new Date();
    await session.save();

    const timezone = Intl.supportedValuesOf('timeZone').includes(
      req.get('x-timezone')!
    )
      ? req.get('x-timezone')
      : 'UTC';

    req.activeSession = String(session._id);
    req.user = user as Record<string, any>;
    req.clientTimeZone = timezone;

    // Allow the user access the route
    next();
  }
);
