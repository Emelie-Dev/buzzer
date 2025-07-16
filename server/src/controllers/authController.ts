import User, { IUser } from '../models/userModel.js';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import Email from '../utils/Email.js';
import CustomError from '../utils/CustomError.js';
import crypto from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import protectData from '../utils/protectData.js';
import { Document } from 'mongoose';
import getUserLocation from '../utils/getUserLocation.js';
import { UAParser } from 'ua-parser-js';
import { randomUUID } from 'crypto';
import Notification from '../models/notificationModel.js';
import LoginAttempt from '../models/loginAttemptModel.js';

const verifyResult = fs.readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    '../templates/verifyResult.html'
  ),
  'utf-8'
);

const sendEmail = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
  user: IUser,
  signup?: boolean
) => {
  // Generate email verification token
  const verificationToken = user.generateToken('email');
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
        'A verification email has been sent. Please click the link to complete your signup.',
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

export const signToken = (id: unknown, jwi: string) => {
  return jwt.sign({ id, jwi }, String(process.env.JWT_SECRET), {
    expiresIn: Number(process.env.JWT_LOGIN_EXPIRES),
  });
};

export const manageUserDevices = async (
  user: IUser,
  userAgent: string,
  method: 'email' | 'google' | 'facebook',
  jwi: string,
  clientIp: string,
  switchAccount: Boolean = false
) => {
  const sessions = user.settings.security.sessions || [];
  const result = new UAParser(userAgent).getResult();

  const { type, model, vendor } = result.device;
  const { name, version } = result.os;

  const deviceName =
    model && vendor
      ? `${vendor} ${model}`
      : name && version
      ? `${name} ${version}`
      : result.ua.slice(0, result.ua.indexOf('/'));

  const session = {
    name: deviceName,
    type: type ? type : name && version ? 'desktop' : 'api-client',
    loginMethod: method,
    jwi,
    createdAt: new Date(),
    lastUsed: new Date(),
  };
  sessions.unshift(session);

  if (sessions.length > 10) sessions.pop();

  const { city, country } = await getUserLocation(clientIp);

  user = (await User.findByIdAndUpdate(
    user._id,
    {
      'settings.security.sessions': sessions,
    },
    {
      new: true,
      runValidators: true,
    }
  )) as IUser;

  if (!switchAccount) {
    // create notification
    await Notification.create({
      user: user._id,
      type: ['security', 'login', 'new'],
      data: {
        deviceName,
        city,
        country,
      },
    });

    if (sessions.length > 4) {
      // create notification
      await Notification.create({
        user: user._id,
        type: ['security', 'login', 'multiple'],
        data: {
          count: sessions.length,
        },
      });
    }

    const allowEmail = user.settings.content.notifications.email;

    if (allowEmail) {
      const url =
        process.env.NODE_ENV === 'production'
          ? 'https://buzzer-0z8q.onrender.com/settings'
          : 'http://localhost:5173/settings';

      // sends email to the user
      try {
        await new Email(user, url).sendSecurityEmail('new', {
          device: deviceName,
          location: `${city}, ${country}`,
          time: new Date(),
        });

        if (sessions.length > 4) {
          await new Email(user, url).sendSecurityEmail('multiple', {});
        }
      } catch {}
    }
  }
};

export const checkIfDataExist = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { field, value } = req.params;

    if (field !== 'username' && field !== 'email')
      return next(new CustomError('This request is invalid!', 400));

    const user = await User.findOne({
      [field]: value,
    });

    if (user) {
      return res.status(409).json({
        status: 'fail',
        message: `This ${field} already exists.`,
      });
    } else {
      return res.status(200).json({
        status: 'success',
        message: `This ${field} is available.`,
      });
    }
  }
);

export const signup = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const location = await getUserLocation(req.clientIp);

    const user = await User.create({
      ...req.body,
      location,
    });

    return await sendEmail(req, res, next, user, true);
  }
);

export const verifyEmail = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
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

      // Gets JWT ID
      const jwi = randomUUID();

      // Handles logged in devices
      await manageUserDevices(
        user,
        req.get('user-agent')!,
        'email',
        jwi,
        req.clientIp!,
        true
      );

      const nonce = crypto.randomBytes(16).toString('base64');

      res.setHeader(
        'Content-Security-Policy',
        `script-src 'self' 'nonce-${nonce}';`
      );

      res.cookie('jwt', signToken(user._id, jwi), {
        maxAge: Number(process.env.JWT_LOGIN_EXPIRES),
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });

      const resultPage = verifyResult
        .replace(
          '{{CONTENT}}',
          `<div class="body body-success">Your email verification was successful!
    </div>`
        )
        .replace(
          '{{CONTENT2}}',
          `<script nonce="${nonce}">
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
        const url = `${homePage}/settings`;
        return await new Email(user, url).sendWelcome();
      } catch {}
    }
  }
);

export const login = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { email, password, deviceId } = req.body;

    const bearerToken = req.headers.authorization;
    const jwtToken =
      bearerToken && bearerToken.startsWith('Bearer')
        ? bearerToken.split(' ')[1]
        : req.cookies.jwt;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    cutoff.setMilliseconds(0);

    if (!email || !password) {
      return next(
        new CustomError(
          'Please provide your email and password for logging in!',
          400
        )
      );
    }

    if (!deviceId) return next(new CustomError('Invalid device ID.', 400));

    let user = (await User.findOne({
      email,
      __login: true,
    })) as IUser;

    const loginAttempt = await LoginAttempt.findOne({
      email,
      deviceId,
    });

    if (loginAttempt && loginAttempt.count === 5) {
      if (!loginAttempt.blocked) {
        await LoginAttempt.findByIdAndUpdate(
          loginAttempt._id,
          {
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            blocked: true,
          },
          {
            runValidators: true,
          }
        );

        if (user) {
          const allowEmail = user.settings.content.notifications.email;

          await Notification.create({
            user: user._id,
            type: ['security', 'login', 'failed'],
          });

          if (allowEmail) {
            const url =
              process.env.NODE_ENV === 'production'
                ? 'https://buzzer-0z8q.onrender.com/auth'
                : 'http://localhost:5173/auth';

            // sends email to the user
            try {
              await new Email(user, url).sendSecurityEmail('failed', { url });
            } catch {}
          }
        }
      }

      const minutes =
        new Date(loginAttempt.expiresAt.getTime() - Date.now()).getMinutes() ||
        1;
      const time = loginAttempt.blocked
        ? `${minutes} minute${minutes !== 1 ? 's' : ''}`
        : '1 hour';

      return next(
        new CustomError(
          `Too many failed login attempts. Please try again in ${time}.`,
          401
        )
      );
    }

    if (!user || !(await user.comparePasswordInDb(password, user.password))) {
      if (user) {
        if (loginAttempt) {
          loginAttempt.count += 1;
          await loginAttempt.save();
        } else {
          await LoginAttempt.create({
            email,
            deviceId,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          });
        }
      }

      return next(new CustomError('Incorrect email or password', 401));
    }

    await loginAttempt?.deleteOne();

    let sessions = user.settings.security.sessions || [];

    if (!user.active) {
      user = (await User.findOneAndUpdate(
        { _id: user._id, __login: true },
        { active: true },
        {
          new: true,
          runValidators: true,
        }
      )) as IUser;

      try {
        await new Email(user, '').sendReactivationEmail();
      } catch {}
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

    if (sessions.length > 0) {
      // delete expired sessions
      user = (await User.findByIdAndUpdate(
        user._id,
        {
          settings: {
            security: {
              sessions: sessions.filter(
                (session) => session.createdAt > cutoff
              ),
            },
          },
        },
        {
          new: true,
          runValidators: true,
        }
      )) as IUser;
      sessions = user.settings.security.sessions;

      // check if user is logged in
      if (jwtToken) {
        try {
          // verify the token
          const decodedToken = jwt.verify(
            jwtToken,
            process.env.JWT_SECRET as string
          ) as JwtPayload;

          const session = sessions.find(
            (session) => session.jwi === decodedToken.jwi
          );

          if (session) {
            return res.status(200).json({
              status: 'success',
              message: 'You are already logged in.',
            });
          }
        } catch {}
      }
    }

    // Gets JWT ID
    const jwi = randomUUID();

    // Handles logged in devices
    await manageUserDevices(
      user,
      req.get('user-agent')!,
      'email',
      jwi,
      req.clientIp!
    );

    const userData = protectData(user, 'user');

    res.cookie('jwt', signToken(user._id, jwi), {
      maxAge: Number(process.env.JWT_LOGIN_EXPIRES),
      //  Prevents javascript access
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    return res.status(200).json({
      status: 'success',
      data: {
        user: userData,
      },
    });
  }
);

export const logout = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    let sessions = req.user?.settings.security.sessions || [];
    const id = req.params.id;

    sessions = sessions.filter((device: any) => String(device._id) !== id);

    await User.findByIdAndUpdate(
      req.user?._id,
      {
        'settings.security.sessions': sessions,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.cookie('jwt', 'loggedout', {
      maxAge: Number(process.env.JWT_LOGOUT_EXPIRES),
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    return res.status(200).json({ status: 'success', message: null });
  }
);

export const authConfirmed = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    const user = protectData(req.user as Document, 'user');

    return res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  }
);

export const forgotPassword = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Get user from email
    const user = await User.findOne({ email: req.body.email });

    if (!user) return next(new CustomError(`This user does not exist!`, 404));

    // Generate reset token
    const passwordResetToken = user.generateToken('password');
    await user.save({ validateBeforeSave: false });

    try {
      // Generates reset token url
      const resetUrl = `${
        process.env.NODE_ENV === 'production'
          ? 'https://buzzer-0z8q.onrender.com'
          : 'http://localhost:5173'
      }/reset-password?token=${passwordResetToken}`;

      // Sends email to user with token
      await new Email(user, resetUrl).sendPasswordReset();

      return res.status(200).json({
        status: 'success',
        message: 'A password reset link has been sent to your email.',
      });
    } catch {
      // Removes reset token from user data
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new CustomError(
          'We encountered an error while sending the password reset email. Please try again later.',
          500
        )
      );
    }
  }
);

export const resetPassword = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    //  Regenerates token
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Finds user with genereated token
    const user = await User.findOne({
      passwordResetToken,
      passwordResetTokenExpires: { $gt: Date.now() },
    });

    // If user does not exist
    if (!user) {
      return next(
        new CustomError('This reset link is invalid or has expired.', 404)
      );
    }

    // If request body is not good
    if (!req.body.password)
      return next(
        new CustomError('Please provide a value for the password field.', 400)
      );

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.passwordChangedAt = new Date();
    user.settings.security.sessions = [];

    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      status: 'success',
      message: 'Your password has been reset successfully.',
    });
  }
);

export const removeSession = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let sessions = req.user?.settings.security.sessions || [];
    const id = req.params.id;

    const session = sessions.find((device: any) => String(device._id) === id);

    if (!session)
      return next(new CustomError('This session does not exist!', 400));

    sessions = sessions.filter((device: any) => String(device._id) !== id);

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        settings: {
          security: {
            sessions,
          },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    const userData = protectData(user!, 'user');

    return res.status(200).json({
      status: 'success',
      data: {
        user: userData,
      },
    });
  }
);
