import workerpool from 'workerpool';
import sharp, { Matrix3x3 } from 'sharp';
import fs, { promises } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import ffmpeg from 'fluent-ffmpeg';
import axios from 'axios';
import handleCloudinary from './utils/handleCloudinary.js';
import CustomError from './utils/CustomError.js';

const moveFile = async (src: string, dest: string) => {
  await promises.copyFile(src, dest);
  await promises.unlink(src);
};

const sharpFromUrl = async (url: string) => {
  const response = await axios.get(url, {
    responseType: 'arraybuffer', // Get the image as binary
  });

  const imageBuffer = Buffer.from(response.data, 'binary');
  return sharp(imageBuffer);
};

const emitEvent = (message: any) => {
  return workerpool.workerEmit(message);
};

const getGrayscaleMatrix = (intensity: number) => {
  const base = [
    [0.2126, 0.7152, 0.0722],
    [0.2126, 0.7152, 0.0722],
    [0.2126, 0.7152, 0.0722],
  ];

  const identity = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];

  return identity.map((row, i) =>
    row.map((val, j) => val * (1 - intensity) + base[i][j] * intensity)
  );
};

const processImage = async (
  filter: any,
  filePath: string,
  tempFilePath: string,
  filename: string
): Promise<void> => {
  const {
    brightness,
    contrast,
    grayscale,
    'hue-rotate': hue,
    saturate,
    sepia,
    blur,
  } = filter;

  let sharpInstance;

  if (process.env.NODE_ENV === 'production') {
    sharpInstance = await sharpFromUrl(filePath);
  } else {
    sharpInstance = sharp(filePath);
  }

  // Process image and write it to the temp file
  const processedFile = sharpInstance
    .modulate({ brightness, saturation: saturate, hue })
    .linear(contrast, 0)
    .recomb([
      [1 - sepia + sepia * 0.393, sepia * 0.769, sepia * 0.189],
      [sepia * 0.349, 1 - sepia + sepia * 0.686, sepia * 0.168],
      [sepia * 0.272, sepia * 0.534, 1 - sepia + sepia * 0.131],
    ])
    .recomb(getGrayscaleMatrix(grayscale) as Matrix3x3);

  if (blur) processedFile.blur(blur);

  await processedFile.toFile(tempFilePath); // Save to temp file

  // Overwrite the original file with the processed one
  if (process.env.NODE_ENV === 'production') {
    await handleCloudinary('upload', filename, 'image', tempFilePath);

    await new Promise<void>((resolve, reject) =>
      fs.unlink(tempFilePath, (err) => {
        if (err) return reject(err);
        resolve();
      })
    );
  } else {
    await new Promise<void>((resolve, reject) =>
      moveFile(tempFilePath, filePath)
        .then(() => resolve())
        .catch((err) => reject(err))
    );
  }
};

const processVideo = (
  filter: any,
  filePath: string,
  tempFilePath: string,
  filename: string,
  cropArea: any
): Promise<void> => {
  const {
    brightness,
    contrast,
    grayscale,
    'hue-rotate': hue,
    saturate,
    sepia,
    blur,
  } = filter;

  return new Promise((resolve, reject) => {
    // Convert CSS values to FFmpeg equivalents
    const ffBrightness = brightness - 1; // CSS 1 = FFmpeg 0
    const ffContrast = contrast; // Same scale
    const ffSaturation = saturate; // Same scale
    const ffHue = hue; // CSS degrees = FFmpeg degrees

    const eqFilter = `eq=brightness=${ffBrightness}:contrast=${ffContrast}:saturation=${ffSaturation}`;

    const filters = [eqFilter];

    if (grayscale > 0 && grayscale < 1) {
      // filters.push(
      //   `[0:v]format=gray[gray];[0:v][gray]blend=all_mode='overlay':all_opacity=${grayscale}`
      // );
      filters.push(
        `format=gray,blend=all_mode='overlay':all_opacity=${grayscale}`
      );
    } else if (grayscale >= 1) {
      filters.push(`hue=s=0`);
    }

    if (hue) {
      filters.push(`hue=h=${ffHue}`);
    }

    if (sepia > 0 && sepia < 1) {
      const sepiaMatrix = `colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131`;
      // filters.push(
      //   `[0:v]${sepiaMatrix}[sepia];[0:v][sepia]blend=all_mode='overlay':all_opacity=${sepia}`
      // );
      filters.push(
        `${sepiaMatrix},blend=all_mode='overlay':all_opacity=${sepia}`
      );
    } else if (sepia >= 1) {
      filters.push(
        `colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131`
      );
    }

    if (blur > 0) {
      const radius = blur * 20; // CSS blur(1px) ≈ boxblur radius 20
      filters.push(`boxblur=luma_radius=${radius}:luma_power=1`);
    }

    if (cropArea) {
      const { width, height, x, y } = cropArea;
      filters.push(`crop=${width}:${height}:${x}:${y}`);
    }

    const complexFilter = filters.join(',');

    ffmpeg(filePath)
      .videoFilters(complexFilter)
      .output(tempFilePath)
      .on('end', () => {
        if (process.env.NODE_ENV === 'production') {
          handleCloudinary('upload', filename, 'video', tempFilePath)
            .then(() => {
              fs.unlink(tempFilePath, (err) => {
                if (err) return reject(err);
                resolve();
              });
            })
            .catch((err) => reject(err));
        } else {
          moveFile(tempFilePath, filePath)
            .then(() => resolve())
            .catch((err) => reject(err));
        }
      })
      .on('error', reject)
      .run();
  });
};

export const checkVideoFilesDuration = async (
  files: any[],
  seconds: number
) => {
  await Promise.all(
    files.map((file) => {
      return new Promise<void>((resolve, reject) => {
        ffmpeg.ffprobe(file.path, (err, metadata) => {
          const error = new Error() as CustomError;
          error.statusCode = 400;

          if (err) {
            error.statusCode = 500;
            error.message = 'Error uploading files!.';
            return reject(error);
          }

          const duration = metadata.format.duration;

          if (!duration) {
            error.message = 'Please select only valid file types.';
            return reject(error);
          }

          if (duration > seconds) {
            error.message = `Video duration must not exceed ${seconds / 60} ${
              seconds / 60 === 1 ? 'minute' : 'minutes'
            }.`;
            return reject(error);
          }

          resolve();
        });
      });
    })
  );
};

export const processFiles = async (
  files: any[],
  filters: any[],
  videosCropArea: any[]
) => {
  let fileIndex = 0;
  const initialValues = {
    brightness: 1,
    contrast: 1,
    grayscale: 0,
    'hue-rotate': 0,
    saturate: 1,
    sepia: 0,
    blur: 0,
  };

  await Promise.all(
    files.map(async (file, index) => {
      const filterString = filters[index].trim();

      if (filterString) {
        const filterObj = filterString
          .split(' ')
          .reduce((accumulator: any, field: string) => {
            const key = field.slice(0, field.indexOf('('));
            const value = field.slice(
              field.indexOf('(') + 1,
              field.indexOf(')')
            );

            accumulator[key] = Number(value) || 0;
            return accumulator;
          }, {});

        const filter = Object.assign(initialValues, filterObj);

        // Create a temporary file location
        const ext = path.extname(file.originalname);
        const tempFilePath = path.join(
          tmpdir(),
          `processed-${Date.now()}-${Math.trunc(
            Math.random() * 1000000000
          )}${ext}`
        );

        if (file.mimetype.startsWith('video')) {
          await processVideo(
            filter,
            file.path,
            tempFilePath,
            file.filename,
            videosCropArea[index]
          );
        }

        if (file.mimetype.startsWith('image')) {
          await processImage(filter, file.path, tempFilePath, file.filename);
        }
      }

      fileIndex++;
      emitEvent({
        status: 'success',
        message: `processing`,
        fileIndex,
      });
    })
  );
};

export const transformReelFiles = (
  files: any,
  position: any = {},
  volume: any = {},
  savedSound: string
) => {
  let { reel: reelFile, sound = [], cover = [] } = files;
  sound = savedSound ? [{ path: savedSound }] : sound;

  const { start = 0, end = 1 } = position;
  let { original: originalVolume = 0, sound: soundVolume = 1 } = volume;
  originalVolume = Math.min(originalVolume, 1);
  soundVolume = Math.min(soundVolume, 1);

  const ext = path.extname(reelFile[0].originalname);
  const tempFilePath = path.join(
    tmpdir(),
    `processed-${Date.now()}-${Math.trunc(Math.random() * 1000000000)}${ext}`
  );

  return new Promise<void>((resolve, reject) => {
    // metadata
    ffmpeg.ffprobe(reelFile[0].path, (err, metadata) => {
      if (err) return reject(err);

      const hasAudio = metadata.streams.some((s) => s.codec_type === 'audio');

      const transformProcess = ffmpeg();
      const complexFilter = [];
      let inputIndex = 0;

      // Cover image input
      if (cover.length > 0) {
        transformProcess.input(cover[0].path).inputOptions(['-loop 1']);
        complexFilter.push(
          `[${inputIndex}:v]scale=720:1280:force_original_aspect_ratio=decrease,` +
            `pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1,` +
            `trim=duration=0.1,setpts=PTS-STARTPTS[cover]`
        );
        inputIndex++;
      }

      // Main video input
      transformProcess
        .input(reelFile[0].path)
        .setStartTime(start)
        .setDuration(end - start);
      const videoIndex = inputIndex;
      complexFilter.push(
        `[${videoIndex}:v]scale=720:1280:force_original_aspect_ratio=decrease,` +
          `pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1,setpts=PTS-STARTPTS[video]`
      );
      inputIndex++;

      // Background sound input (optional)
      if (sound.length > 0) {
        transformProcess.input(sound[0].path);
      }

      // Video stream merge
      if (cover.length > 0) {
        complexFilter.push('[cover][video]concat=n=2:v=1:a=0[outv]');
      } else {
        complexFilter.push('[video]null[outv]');
      }

      // Audio stream logic
      let audioFilter = '';
      if (hasAudio) {
        if (sound.length > 0) {
          audioFilter =
            `[${videoIndex}:a]volume=${originalVolume}[a1];` +
            `[${inputIndex}:a]volume=${soundVolume}[a2];` +
            `[a1][a2]amix=inputs=2:duration=longest:dropout_transition=2:normalize=1[outa]`;
        } else {
          audioFilter = `[${videoIndex}:a]volume=${originalVolume}[outa]`;
        }
      } else {
        if (sound.length > 0) {
          audioFilter = `[${inputIndex}:a]volume=${soundVolume}[outa]`;
        } else {
          // Silent fallback
          const silentAudioIndex = inputIndex;
          transformProcess
            .input('anullsrc=r=44100:cl=stereo')
            .inputFormat('lavfi');
          audioFilter = `[${silentAudioIndex}:a]anull[outa]`;
          inputIndex++;
        }
      }

      if (audioFilter) complexFilter.push(audioFilter);

      const totalDuration = end - start + (cover.length > 0 ? 0.1 : 0);

      transformProcess.complexFilter(complexFilter.join(';'));

      const outputOpts = [
        '-map',
        '[outv]',
        '-t',
        String(totalDuration),
        '-preset',
        'ultrafast',
      ];
      outputOpts.push('-map', '[outa]');

      transformProcess
        .outputOptions(outputOpts)
        .output(tempFilePath)
        .on('progress', (data) =>
          emitEvent({
            status: 'success',
            message: 'processing',
            percent: data.percent,
          })
        )
        .on('error', reject)
        .on('end', () => {
          if (process.env.NODE_ENV === 'production') {
            handleCloudinary(
              'upload',
              reelFile[0].filename,
              'video',
              tempFilePath
            )
              .then(() => {
                fs.unlink(tempFilePath, (err) => {
                  if (err) return reject(err);
                  resolve();
                });
              })
              .catch((err) => reject(err));
          } else {
            0;
            moveFile(tempFilePath, reelFile[0].path)
              .then(() => resolve())
              .catch((err) => reject(err));
          }
        })
        .run();
    });
  });
};

// Register the functions only when this file is executed as a worker
if (!workerpool.isMainThread) {
  workerpool.worker({
    checkVideoFilesDuration,
    processFiles,
    transformReelFiles,
  });
}
