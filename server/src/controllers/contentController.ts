import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import multerConfig from '../utils/multerConfig.js';
import CustomError from '../utils/CustomError.js';
import { pool } from '../app.js';
import fs from 'fs';
import path from 'path';
import Content from '../models/contentModel.js';
import User from '../models/userModel.js';
import protectData from '../utils/protectData.js';

const upload = multerConfig('contents');

const deleteContentFiles = async (files: Express.Multer.File[]) => {
  const paths = files.map((file) => file.path);

  await Promise.allSettled(
    paths.map((path): Promise<void> => {
      return new Promise((resolve, reject) => {
        fs.unlink(path as fs.PathLike, (err) => {
          if (err) reject();
          resolve();
        });
      });
    })
  );
};

export const validateContentFiles = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const uploader = upload.array('content', 20);

    uploader(req, res, async (error: any) => {
      const files = (req.files as Express.Multer.File[]) || [];

      try {
        if (error) {
          let message = error.isOperational
            ? error.message
            : error.code === 'LIMIT_FILE_SIZE'
            ? 'Each file must not exceed 1GB.'
            : 'File upload failed.';
          throw new CustomError(
            message,
            error.isOperational || error.code === 'LIMIT_FILE_SIZE' ? 400 : 500
          );
        }

        if (files.length === 0)
          throw new CustomError('You must upload at least one file.', 400);

        if (files.length > 20)
          throw new CustomError('You can only upload 20 files at once.', 400);

        // Gets video and image files
        const videoFiles = files.filter((file) =>
          file.mimetype.startsWith('video')
        );

        // Checks if video files duration are correct in the worker pool
        await pool.exec('checkVideoFilesDuration', [videoFiles, 60]);

        next();
      } catch (err) {
        await deleteContentFiles(files);
        next(err);
      }
    });
  }
);

export const processContentFiles = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    res.setHeader('Content-Type', 'text/plain');
    res.write(
      JSON.stringify({ status: 'success', message: 'Processing started' })
    );

    const files = req.files as Express.Multer.File[];

    try {
      // Process files
      await pool.exec(
        'processFiles',
        [files, JSON.parse(req.body.filters).value],
        {
          on: function (event) {
            res.write(JSON.stringify(event));
          },
        }
      );

      next();
    } catch (err) {
      await deleteContentFiles(files);

      res.status(500).end(
        JSON.stringify({
          status: 'fail',
          message: 'Unable to process files.',
        })
      );
    }
  }
);

export const saveContent = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    const files = req.files as Express.Multer.File[];

    try {
      const filters = JSON.parse(req.body.filters).value;
      const fileDescriptions = JSON.parse(req.body.fileDescriptions).value;

      const contentItems = files.map((file, index) => ({
        src:
          process.env.NODE_ENV === 'production'
            ? (file as any).secure_url
            : path.basename(file.path),
        mediaType: file.mimetype.startsWith('video')
          ? 'video'
          : file.mimetype.startsWith('image')
          ? 'image'
          : '',
        description: fileDescriptions[index],
        filter: filters[index],
      }));

      const content = await Content.create({
        user: req.user?._id,
        media: contentItems,
        aspectRatio: Number(req.body.aspectRatio),
        description: req.body.description,
        collaborators: (() => {
          if (req.body.collaborators) {
            const collaborators = new Set(
              JSON.parse(req.body.collaborators).value
            );
            collaborators.delete(String(req.user?._id));

            return [...collaborators];
          }

          return undefined;
        })(),
        settings: JSON.parse(req.body.settings),
      });

      // in production delete content files from server storage
      return res.status(201).end(
        JSON.stringify({
          status: 'success',
          message: 'Content created!',
          content,
        })
      );
    } catch (err) {
      await deleteContentFiles(files);

      return res.status(500).end(
        JSON.stringify({
          status: 'fail',
          message: 'Unable to create content.',
        })
      );
    }
  }
);

export const deleteContent = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const content = await Content.findById(req.params.id);

    if (!content || String(req.user?._id) !== String(content.user)) {
      return next(new CustomError('This content does not exist!', 404));
    }

    // Delete user content
    await content.deleteOne();

    // Deletes content files
    if (process.env.NODE_ENV === 'production') {
    } else {
      const paths = content.media.map((file) => file.src);

      try {
        await Promise.allSettled(
          paths.map((src) => fs.promises.unlink(`src/public/contents/${src}`))
        );
      } catch {}
    }

    return res.status(204).json({
      status: 'success',
      message: null,
    });
  }
);

export const excludeContent = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new CustomError('This user does not exist!', 404));
    }

    if (String(user._id) === String(req.user?._id)) {
      return next(new CustomError("You can't exlude your content.", 400));
    }

    const excludedContents = new Set(
      req.user?.settings.content.notInterested.content || []
    );

    if (excludedContents.size === 100) {
      const firstItem = [...excludedContents].shift();
      excludedContents.delete(firstItem);
    }

    excludedContents.add(req.params.id);

    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        settings: {
          content: {
            notInterested: {
              content: [...excludedContents],
            },
          },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    const userData = protectData(updatedUser!, 'user');

    return res.status(200).json({
      status: 'success',
      data: {
        user: userData,
      },
    });
  }
);

export const getContents = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const pages = ['home', 'following', 'friends'];
    const page = String(req.params.page).trim();

    if (!pages.includes(page)) {
      return next(new CustomError('Invalid request!', 400));
    }

    const excludedUsers =
      req.user?.settings.content.notInterested.content || [];

    switch (page) {
      case 'home':
        const contents = await Content.aggregate([
          { $match: { user: { $nin: [req.user?._id, ...excludedUsers] } } },
          { $sample: { size: 10 } },
        ]);
    }

    return res.status(200).json({
      status: 'success',
    });
  }
);
