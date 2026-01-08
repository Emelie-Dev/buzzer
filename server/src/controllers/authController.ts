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
import { Document, Types } from 'mongoose';
import getUserLocation from '../utils/getUserLocation.js';
import { UAParser } from 'ua-parser-js';
import { randomUUID } from 'crypto';
import Notification from '../models/notificationModel.js';
import LoginAttempt from '../models/loginAttemptModel.js';
import Session from '../models/sessionModel.js';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { GetTokenResponse } from 'google-auth-library/build/src/auth/oauth2client.js';
import { customAlphabet } from 'nanoid';
import sharp from 'sharp';
import cloudinary from '../utils/cloudinary.js';

type DeviceResult<T extends boolean> = T extends true
  ? string
  : {
      type:
        | 'mobile'
        | 'tablet'
        | 'console'
        | 'smarttv'
        | 'wearable'
        | 'xr'
        | 'embedded'
        | undefined;
      name: string | undefined;
      version: string | undefined;
      data: {
        deviceName: string;
        city: any;
        country: any;
      };
    };

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
      signin: !signup,
    });
  } catch {
    // Removes verification token from user data
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;

    await user.save({ validateBeforeSave: false });

    const message = signup
      ? 'An error occurred while sending the verification email. Please try logging in with the credentials you entered.'
      : 'An error occurred while sending the verification email. Please try again later.';

    return next(new CustomError(message, 500, { emailError: true }));
  }
};

const sendOAuthEmail = async (newUser: IUser, signup?: boolean) => {
  const serverUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://buzzer-server-py76.onrender.com'
      : 'http://127.0.0.1:5000';

  const verificationToken = newUser.generateToken('email');
  await newUser.save({ validateBeforeSave: false });

  try {
    const verificationUrl = `${serverUrl}/api/v1/auth/verify-email/${verificationToken}`;
    await new Email(newUser, verificationUrl).sendEmailVerification();

    throw new CustomError(
      'A verification email has been sent. Please click the link to complete your signup.',
      401
    );
  } catch {
    newUser.emailVerificationToken = undefined;
    newUser.emailVerificationTokenExpires = undefined;
    await newUser.save({ validateBeforeSave: false });

    throw new CustomError(
      `An error occurred while sending a verification email. ${
        signup
          ? 'Please try logging in with this account.'
          : 'Please try again later.'
      }`,
      500
    );
  }
};

const getProfilePhoto = async (url: string, user: IUser): Promise<string> => {
  const defaultPhoto =
    process.env.NODE_ENV === 'production'
      ? 'https://res.cloudinary.com/dtwsoibt0/image/upload/v1765614386/default.jpg'
      : 'default.jpg';

  if (!url) return defaultPhoto;

  const fileName = `${user._id}-${Date.now()}-${Math.trunc(
    Math.random() * 1000000000
  )}`;

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });
    const imageBuffer = Buffer.from(response.data, 'binary');

    const sharpInstance = sharp(imageBuffer)
      .resize(160, 160, {
        fit: 'cover',
        withoutEnlargement: true,
        position: 'attention',
      })
      .jpeg({ quality: 90 });

    if (process.env.NODE_ENV === 'production') {
      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: 'users',
              format: 'jpg',
              public_id: fileName,
              overwrite: true,
            },
            (err, res) => {
              if (err) reject();
              else resolve(res);
            }
          )
          .end(sharpInstance.toBuffer());
      });
      return result.secure_url;
    } else {
      await sharpInstance.toFile(`src/public/users/${fileName}.jpg`);
      return `${fileName}.jpg`;
    }
  } catch {
    return defaultPhoto;
  }
};

const handleOAuthSignup = async (
  data: any,
  clientIp: string,
  type: 'google' | 'facebook'
) => {
  const user = await User.findOne({
    $or: [
      { email: data.email },
      { [`oAuthProviders.${type}.authId`]: data.id },
    ],
  });

  if (user) {
    throw new CustomError('This user already exists!', 409);
  } else {
    const location = await getUserLocation(clientIp);
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789_';
    const MAX_ATTEMPTS = 5;

    const newUser = await (async () => {
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        const nanoid = customAlphabet(alphabet, 7);

        try {
          const user = await User.create({
            email: data.email,
            username: `${data.firstName}${nanoid()}`,
            location,
            photo: 'default.jpg',
            name: data.name,
            oAuthProviders: {
              [type]: { authId: data.id, createdAt: new Date() },
            },
            emailVerified: data.emailVerified,
          });

          return user;
        } catch {}
      }

      return new Error();
    })();

    if (newUser instanceof Error) {
      throw new CustomError('Unable to generate username!', 400);
    }

    newUser.photo = await getProfilePhoto(data.picture, newUser);
    await newUser.save();

    if (!data.emailVerified) {
      return sendOAuthEmail(newUser, true);
    } else {
      return newUser;
    }
  }
};

const handleOAuthSignin = async (
  data: any,
  type: 'google' | 'facebook',
  linkProvider: boolean,
  userId: string
) => {
  let user: IUser;
  let linkUser: IUser = null!;

  if (linkProvider) {
    // Get logged in user id
    const decodedToken = jwt.verify(
      userId,
      process.env.JWT_SECRET as string
    ) as JwtPayload;
    const id = decodedToken.userId;

    linkUser = (await User.findById(id))!;

    if (!linkUser) {
      throw new CustomError('This user does not exist!', 404);
    }
  }

  user = (await User.findOne({
    [`oAuthProviders.${type}.authId`]: data.id,
    __login: true,
  }))!;

  if (!user && !linkProvider) {
    throw new CustomError(
      'There’s no account linked to this provider login.',
      404
    );
  } else {
    if (linkProvider) {
      if (user) {
        throw new CustomError(
          'This user already exists!',
          String(user._id) === String(linkUser._id) ? 409 : 403
        );
      } else {
        user = (await User.findByIdAndUpdate(
          linkUser?._id,
          {
            [`oAuthProviders.${type}`]: {
              authId: data.id,
              createdAt: new Date(),
            },
          },
          {
            new: true,
            runValidators: true,
          }
        ))!;
      }
    } else {
      if (!user.active) {
        user = (await User.findOneAndUpdate(
          { _id: user._id, __login: true },
          { active: true },
          {
            new: true,
            runValidators: true,
          }
        ))!;

        try {
          await new Email(user, '').sendReactivationEmail();
        } catch {}
      }

      if (!user.emailVerified) {
        if (
          !user.emailVerificationToken ||
          Date.parse(String(user.emailVerificationTokenExpires)) < Date.now()
        ) {
          return sendOAuthEmail(user);
        } else {
          throw new CustomError(
            'Finish setting up your account by clicking the verification link in the email we sent you!',
            403
          );
        }
      }
    }

    return user;
  }
};

export const getDeviceDetails = async <T extends boolean>(
  userAgent: string,
  clientIp: string,
  onlyName: T
): Promise<DeviceResult<T>> => {
  const result = new UAParser(userAgent).getResult();

  const { type, model, vendor } = result.device;
  const { name, version } = result.os;

  const deviceName =
    model && vendor
      ? `${vendor} ${model}`
      : name && version
      ? `${name} ${version}`
      : result.ua.slice(0, result.ua.indexOf('/'));

  if (onlyName) {
    return deviceName as DeviceResult<T>;
  }

  const { city, country } = await getUserLocation(clientIp);

  return {
    type,
    name,
    version,
    data: {
      deviceName,
      city,
      country,
    },
  } as DeviceResult<T>;
};

export const signToken = (id: unknown, deviceId: string) => {
  return jwt.sign({ id, deviceId }, String(process.env.JWT_SECRET), {
    expiresIn: Number(process.env.JWT_LOGIN_EXPIRES),
  });
};

export const manageUserDevices = async (
  user: IUser,
  userAgent: string,
  method: 'email' | 'google' | 'facebook',
  deviceId: string,
  clientIp: string,
  signup: Boolean = false
) => {
  const session = await Session.findOne({
    user: user._id,
    deviceId,
  });

  if (session) {
    await Session.findByIdAndUpdate(session._id, {
      revokedAt: null,
    });
  } else {
    const sessions = await Session.find({ user: user._id }).sort({
      lastUsedAt: -1,
    });

    if (sessions.length >= 10) {
      await Session.findByIdAndDelete(sessions[sessions.length - 1]._id);
    }

    const { data, name, version, type } = await getDeviceDetails(
      userAgent,
      clientIp,
      false
    );

    await Session.create({
      user: user._id,
      deviceName: data.deviceName,
      deviceId,
      platform: type ? type : name && version ? 'desktop' : 'api-client',
      loginMethod: method,
    });

    if (!signup) {
      // create notification
      await Notification.create({
        user: user._id,
        type: ['security', 'login', 'new'],
        data,
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
            device: data.deviceName,
            location: `${data.city}, ${data.country}`,
            time: new Date(),
          });

          if (sessions.length > 4) {
            await new Email(user, url).sendSecurityEmail('multiple', {
              deviceLength: sessions.length,
            });
          }
        } catch {}
      }
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
      __login: true,
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
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      location,
      photo:
        process.env.NODE_ENV === 'production'
          ? 'https://res.cloudinary.com/dtwsoibt0/image/upload/v1765614386/default.jpg'
          : 'default.jpg',
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

      // Gets device ID
      const deviceId = req.cookies.deviceId || randomUUID();

      // Handles logged in devices
      await manageUserDevices(
        user,
        req.get('user-agent')!,
        'email',
        deviceId,
        req.clientIp!,
        true
      );

      const nonce = crypto.randomBytes(16).toString('base64');

      res.setHeader(
        'Content-Security-Policy',
        `script-src 'self' 'nonce-${nonce}';`
      );

      res.cookie('jwt', signToken(user._id, deviceId), {
        maxAge: Number(process.env.JWT_LOGIN_EXPIRES),
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });

      if (!req.cookies.deviceId) {
        res.cookie('deviceId', deviceId, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: Number(process.env.JWT_DEVICE_EXPIRES),
        });
      }

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
    const { email, password, addAccount } = req.body;
    const bearerToken = req.headers.authorization;
    const jwtToken =
      bearerToken && bearerToken.startsWith('Bearer')
        ? bearerToken.split(' ')[1]
        : req.cookies.jwt;
    let deviceId = req.cookies.deviceId;

    if (!email || !password) {
      return next(
        new CustomError(
          'Please provide your email and password for logging in!',
          400
        )
      );
    }

    if (!deviceId) deviceId = randomUUID();

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

          const { data } = await getDeviceDetails(
            req.get('user-agent')!,
            req.clientIp!,
            false
          );

          await Notification.create({
            user: user._id,
            type: ['security', 'login', 'failed'],
            data,
          });

          if (allowEmail) {
            const url =
              process.env.NODE_ENV === 'production'
                ? 'https://buzzer-0z8q.onrender.com/settings'
                : 'http://localhost:5173/settings';

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

      if (!req.cookies.deviceId) {
        res.cookie('deviceId', deviceId, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: Number(process.env.JWT_DEVICE_EXPIRES),
        });
      }

      return next(new CustomError('Incorrect email or password', 401));
    }

    await loginAttempt?.deleteOne();

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
        return res.status(400).json({
          status: 'success',
          message:
            'Finish setting up your account by clicking the verification link in the email we sent you!',
        });
      }
    }

    // check if user is logged in
    if (jwtToken) {
      try {
        // verify the token
        const decodedToken = jwt.verify(
          jwtToken,
          process.env.JWT_SECRET as string
        ) as JwtPayload;

        const session = await Session.findOne({
          user: user._id,
          deviceId,
          revokedAt: null,
        });

        if (session) {
          if (addAccount || decodedToken.deviceId !== deviceId) {
            res.cookie('jwt', signToken(user._id, deviceId), {
              maxAge: Number(process.env.JWT_LOGIN_EXPIRES),
              //  Prevents javascript access
              httpOnly: true,
              secure: true,
              sameSite: 'none',
            });
          }

          res.cookie('deviceId', deviceId, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: Number(process.env.JWT_DEVICE_EXPIRES),
          });

          return res.status(200).json({
            status: 'success',
            message: addAccount
              ? 'Account added successfully!'
              : 'You are already logged in.',
          });
        }
      } catch {}
    }

    // Handles logged in devices
    await manageUserDevices(
      user,
      req.get('user-agent')!,
      'email',
      deviceId,
      req.clientIp!
    );

    res.cookie('jwt', signToken(user._id, deviceId), {
      maxAge: Number(process.env.JWT_LOGIN_EXPIRES),
      //  Prevents javascript access
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    if (!req.cookies.deviceId) {
      res.cookie('deviceId', deviceId, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: Number(process.env.JWT_DEVICE_EXPIRES),
      });
    }

    const userData = protectData(user, 'user');

    return res.status(200).json({
      status: 'success',
      data: {
        user: userData,
      },
    });
  }
);

export const logout = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const session = await Session.findOne({
      user: req.user?._id,
      deviceId: req.cookies.deviceId,
      revokedAt: null,
    });

    if (!session) return next(new CustomError('This session is invalid.', 401));

    session.revokedAt = new Date();
    await session.save();

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

    await user.save({ validateBeforeSave: false });

    await Session.updateMany(
      { user: user._id, revokedAt: null },
      {
        revokedAt: new Date(),
      }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Your password has been reset successfully.',
    });
  }
);

export const getSessions = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    const activeSession = new Types.ObjectId(req.activeSession);

    const sessions = await Session.aggregate([
      {
        $match: {
          user: req.user?._id,
        },
      },
      {
        $sort: {
          revokedAt: 1,
          lastUsedAt: -1,
        },
      },
      {
        $addFields: {
          active: { $eq: ['$_id', activeSession] },
        },
      },
      {
        $project: {
          deviceId: 0,
          revokedAt: 0,
        },
      },
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        sessions,
      },
    });
  }
);

export const removeSession = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const session = await Session.findById(req.params.id);

    if (!session || String(session.user) !== String(req.user?._id)) {
      return next(new CustomError('This device does not exist!', 400));
    }

    if (String(session._id) === String(req.activeSession)) {
      return next(new CustomError(`You can't remove this device.`, 400));
    }

    await Session.findByIdAndDelete(session._id);

    return res.status(200).json({
      status: 'success',
      message: null,
    });
  }
);

export const getDeviceAccounts = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    const sessions = await Session.aggregate([
      { $match: { deviceId: req.cookies.deviceId } },
      {
        $sort: {
          lastUsedAt: -1,
        },
      },
      {
        $lookup: {
          from: 'users',
          foreignField: '_id',
          localField: 'user',
          as: 'users',
        },
      },
      {
        $addFields: {
          active: { $eq: ['$user', req.user?._id] },
          user: { $first: '$users' },
        },
      },
      {
        $project: {
          active: 1,
          user: {
            name: 1,
            username: 1,
            photo: 1,
            _id: 1,
          },
        },
      },
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        sessions,
      },
    });
  }
);

export const switchAccount = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return next(
        new CustomError(
          'This session does not exist! Please log in again.',
          400
        )
      );
    }

    if (session.deviceId !== req.cookies.deviceId) {
      return next(
        new CustomError(
          'This session does not exist! Please log in again.',
          400
        )
      );
    }

    if (String(session._id) === String(req.activeSession)) {
      return next(
        new CustomError('You are already logged in with this account.', 401)
      );
    }

    const user = await User.findById(session.user);
    if (!user) {
      return next(new CustomError('This user does not exist!', 404));
    }

    const passwordChangedAt = user.passwordChangedAt;
    const lastUsedAt = new Date(session.lastUsedAt);

    if (passwordChangedAt) {
      if (lastUsedAt < passwordChangedAt) {
        return next(
          new CustomError(
            'The password has changed since your last login. Please log in again.',
            400
          )
        );
      }
    }

    if (session.revokedAt) {
      return next(
        new CustomError('This session has expired! Please log in again.', 400)
      );
    }

    lastUsedAt.setDate(lastUsedAt.getDate() + 30);
    if (lastUsedAt < new Date()) {
      return next(
        new CustomError('This session has expired! Please log in again.', 400)
      );
    }

    session.lastUsedAt = new Date();
    await session.save();

    res.cookie('jwt', signToken(user._id, session.deviceId), {
      maxAge: Number(process.env.JWT_LOGIN_EXPIRES),
      //  Prevents javascript access
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    const userData = protectData(user, 'user');

    return res.status(200).json({
      status: 'success',
      data: {
        user: userData,
      },
    });
  }
);

export const handleOAuth = (linkProvider: boolean = false) =>
  asyncErrorHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const provider = req.params.provider;

      let url;

      if (provider !== 'google' && provider !== 'facebook') {
        return next(new CustomError('Inavlid OAuth Provider', 400));
      }

      const redirectUrl =
        process.env.NODE_ENV === 'production'
          ? `https://buzzer-server-py76.onrender.com/api/v1/auth/${
              linkProvider ? 'link-oauth/' : ''
            }${provider}/callback`
          : `${
              provider === 'facebook'
                ? 'https://1b449605ef22.ngrok-free.app'
                : 'http://127.0.0.1:5000'
            }/api/v1/auth/${
              linkProvider ? 'link-oauth/' : ''
            }${provider}/callback`;
      let userId;

      if (linkProvider) {
        userId = jwt.sign(
          { userId: req.user?._id },
          String(process.env.JWT_SECRET),
          {
            expiresIn: '5m',
          }
        );
      }

      const state = JSON.stringify({
        signup: req.query.signup ? true : false,
        clientIp: req.clientIp,
        userAgent: req.get('user-agent'),
        deviceId: req.cookies.deviceId || '',
        userId,
      });

      if (provider === 'google') {
        const auth2Client = new OAuth2Client(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          redirectUrl
        );

        url = auth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: ['profile', 'email'],
          prompt: 'consent',
          state,
        });

        res.header('Referrer-policy', 'no-referrer-when-downgrade');
      } else {
        url = `https://www.facebook.com/v24.0/dialog/oauth?client_id=${process.env.FB_APP_ID}&redirect_uri=${redirectUrl}&state=${state}&auth_type=rerequest&scope=email,public_profile`;
      }

      return res.status(200).json({ status: 'success', data: { url } });
    }
  );

export const oAuthCallback = (linkProvider: boolean = false) =>
  asyncErrorHandler(async (req: AuthRequest, res: Response) => {
    const provider = req.params.provider;

    if (provider !== 'google' && provider !== 'facebook') {
      throw new CustomError('Inavlid OAuth Provider', 400);
    }

    const { code, state, error } = req.query;
    const { signup, clientIp, userAgent, deviceId, userId } = JSON.parse(
      (state as string) || JSON.stringify({})
    );

    const redirectUrl =
      process.env.NODE_ENV === 'production'
        ? `https://buzzer-server-py76.onrender.com/api/v1/auth/${
            linkProvider ? 'link-oauth/' : ''
          }${provider}/callback`
        : `${
            provider === 'facebook'
              ? 'https://1b449605ef22.ngrok-free.app'
              : 'http://127.0.0.1:5000'
          }/api/v1/auth/${
            linkProvider ? 'link-oauth/' : ''
          }${provider}/callback`;

    const authPage =
      process.env.NODE_ENV === 'production'
        ? 'https://buzzer-0z8q.onrender.com'
        : 'http://localhost:5173';

    try {
      if (error || !code) {
        throw new CustomError('Error', 400);
      }

      let data: any;

      if (provider === 'google') {
        const auth2Client = new OAuth2Client(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          redirectUrl
        );

        // Get resposnse tokens
        const response: GetTokenResponse = await auth2Client.getToken(
          code as string
        );
        auth2Client.setCredentials(response.tokens);

        // Get access tokens
        const { access_token } = auth2Client.credentials;

        // Get user data
        const { data: result } = await axios(
          `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
        );

        data = {
          ...result,
          id: result.sub,
          firstName: result.given_name,
          emailVerified: result.email_verified,
        };
      } else {
        // Gets user access token
        const { data: accessObj }: any = await axios(
          `https://graph.facebook.com/v24.0/oauth/access_token?client_id=${process.env.FB_APP_ID}&redirect_uri=${redirectUrl}&client_secret=${process.env.FB_APP_SECRET}&code=${code}`
        );

        // Gets app access token
        const { data: appObj } = await axios(
          `https://graph.facebook.com/oauth/access_token?client_id=${process.env.FB_APP_ID}&client_secret=${process.env.FB_APP_SECRET}&grant_type=client_credentials`
        );

        // verify if tokens are valid
        const { data: result } = await axios(
          `https://graph.facebook.com/debug_token?input_token=${accessObj.access_token}&access_token=${appObj.access_token}`
        );

        if (!result.data.is_valid) {
          throw new CustomError('Error', 400);
        }

        // Get user data
        const { data: userData } = await axios(
          `https://graph.facebook.com/v24.0/me?access_token=${accessObj.access_token}&fields=id,first_name,email,picture,name`
        );

        if (signup && !userData.email) {
          throw new CustomError('Error', 406);
        }

        data = {
          ...userData,
          firstName: userData.first_name,
          picture: userData.picture.data.url,
          emailVerified: true,
        };
      }

      const platformId = deviceId || randomUUID();
      let user: IUser;

      if (signup && !linkProvider) {
        user = await handleOAuthSignup(data, clientIp, provider);
      } else {
        user = await handleOAuthSignin(data, provider, linkProvider, userId);
      }

      if (!linkProvider) {
        await manageUserDevices(
          user,
          userAgent,
          provider,
          platformId,
          clientIp,
          signup
        );

        res.cookie('jwt', signToken(user._id, platformId), {
          maxAge: Number(process.env.JWT_LOGIN_EXPIRES),
          httpOnly: true,
          secure: true,
          sameSite: 'none',
        });

        if (!deviceId) {
          res.cookie('deviceId', platformId, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: Number(process.env.JWT_DEVICE_EXPIRES),
          });
        }
      }

      if (linkProvider) {
        res.redirect(
          `${authPage}/settings?provider=${provider[0].toUpperCase()}${provider.slice(
            1
          )}`
        );
      } else res.redirect(`${authPage}/home`);

      if (signup && !linkProvider) {
        try {
          return await new Email(user, `${authPage}/settings`).sendWelcome();
        } catch {}
      }
    } catch (err: any) {
      if (linkProvider) {
        return res.redirect(
          `${authPage}/settings?error=${provider[0].toUpperCase()}${provider.slice(
            1
          )}&code=${err.statusCode || 400}`
        );
      } else {
        return res.redirect(
          `${authPage}?error=${provider[0].toUpperCase()}${provider.slice(
            1
          )}&type=${signup ? 'signup' : 'signin'}&code=${err.statusCode || 400}`
        );
      }
    }
  });

export const removeOAuthProvider = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const provider = req.params.provider;

    if (provider !== 'google' && provider !== 'facebook') {
      return next(new CustomError('Inavlid OAuth Provider', 400));
    }

    const userProviders = Object.entries(req.user?.oAuthProviders || {})
      .map((field: any) => field[1]?.authId)
      .filter(Boolean);

    if (userProviders.length < 2 && !req.user?.password) {
      return next(
        new CustomError(
          'This is your only login method. Create a password or link another account before removing it.',
          400
        )
      );
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        [`oAuthProviders.${provider}`]: {},
      },
      { new: true }
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
