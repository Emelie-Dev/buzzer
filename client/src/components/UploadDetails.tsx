import styles from '../styles/UploadDetails.module.css';
import { Content } from '../pages/Create';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import React, { useEffect, useRef, useState } from 'react';
import {
  getFilterValue,
  sanitizeInput,
  serverUrl,
  streamResponse,
} from '../Utilities';
import { IoArrowBack } from 'react-icons/io5';
import Cropper, { Area } from 'react-easy-crop';
import { toast } from 'sonner';
import PostLoader from './PostLoader';
import PostDetails from './PostDetails';

type UploadDetailsProps = {
  setStage: React.Dispatch<
    React.SetStateAction<{
      reel: 'select' | 'edit' | 'finish';
      content: 'select' | 'edit' | 'finish';
      story: 'select' | 'edit' | 'finish';
    }>
  >;
  editedFiles: Content[];
  rawFiles: Map<string, File>;
  contentIndex: number;
  setContentIndex: React.Dispatch<React.SetStateAction<number>>;
  aspectRatio: number | 'initial';
  videosCropArea: Map<string, Area>;
};

const UploadDetails = ({
  setStage,
  editedFiles,
  contentIndex,
  aspectRatio,
  setContentIndex,
  videosCropArea,
  rawFiles,
}: UploadDetailsProps) => {
  const [generalDescription, setGeneralDescription] = useState<string>('');
  const [fileDescriptions, setFileDescriptions] = useState<Map<string, string>>(
    new Map()
  );
  const [mentions, setMentions] = useState<Set<string>>(new Set());
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [cropIndex, setCropIndex] = useState<number>(0);
  const [cropAreas, setCropAreas] = useState<Map<string, Area>>(new Map());
  const [cropping, setCropping] = useState(false);
  const [postStage, setPostStage] = useState<{
    value: 'preparing' | 'validating' | 'processing' | 'saving' | 'finish';
    filesIndexes: Set<number>;
    percent: number;
  }>({ value: 'preparing', filesIndexes: new Set(), percent: 0 });
  const [postProgress, setPostProgress] = useState(0);
  const [collaborators, setCollaborators] = useState<
    { id: string; username: string }[]
  >([]);
  const [settings, setSettings] = useState({
    accessibility: 0,
    disableComments: false,
    hideEngagements: false,
  });

  const dotRef = useRef<HTMLSpanElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null!);
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const progressInterval = useRef<number>(null!);
  const containerRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = 0;

    const resizeHandler = () => {
      if (window.matchMedia('(max-width: 510px)').matches) {
        const size = window.innerWidth;

        carouselRef.current.style.width = `${size - 4}px`;
        carouselRef.current.style.height = `${size - 4}px`;
      } else {
        carouselRef.current.style.width = '500px';
        carouselRef.current.style.height = '500px';
      }
    };

    resizeHandler();

    window.addEventListener('resize', resizeHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  useEffect(() => {
    (() => {
      if (editedFiles[contentIndex].type === 'image') {
        imageRef.current?.animate(
          {
            opacity: [0, 1],
          },
          {
            fill: 'both',
            duration: 200,
          }
        );
      }

      if (editedFiles[contentIndex].type === 'video') {
        if (videoRef.current) {
          videoRef.current.src = '';
          videoRef.current.src = editedFiles[contentIndex].src as string;
        }
        videoRef.current?.animate(
          {
            opacity: [0, 1],
          },
          {
            fill: 'both',
            duration: 200,
          }
        );
      }
    })();
  }, [contentIndex]);

  useEffect(() => {
    let animationId: number;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    let eventListener = () => {};

    if (
      editedFiles[contentIndex].type === 'video' &&
      videosCropArea.has(editedFiles[contentIndex].key)
    ) {
      if (!video || !canvas) return;

      const ctx = canvas.getContext('2d')!;

      const render = () => {
        if (!video.paused && !video.ended) {
          const { x, y, width, height } = videosCropArea.get(
            editedFiles[contentIndex].key
          )!;

          canvas.width = width;
          canvas.height = height;

          if (ctx) {
            ctx.drawImage(video, x, y, width, height, 0, 0, width, height);
          }
        }
        animationId = requestAnimationFrame(render);
      };

      eventListener = () => {
        animationId = requestAnimationFrame(render);
      };

      video.removeEventListener('play', eventListener);
      video.addEventListener('play', eventListener);
    }

    return () => {
      cancelAnimationFrame(animationId);
      video?.removeEventListener('play', eventListener);
    };
  }, [contentIndex]);

  useEffect(() => {
    if (cropping) postContent();
  }, [cropping]);

  useEffect(() => {
    // 10, 20, 50, 20

    clearInterval(progressInterval.current);

    if (cropping) {
      const limit =
        postStage.value === 'preparing'
          ? 10
          : postStage.value === 'validating'
          ? 30
          : postStage.value === 'processing'
          ? 30 + (postStage.filesIndexes.size + 1) * (50 / editedFiles.length)
          : postStage.value === 'saving'
          ? 95
          : 100;

      const delay =
        postStage.value === 'preparing'
          ? 20
          : postStage.value === 'validating'
          ? 100
          : postStage.value === 'processing'
          ? 200
          : postStage.value === 'saving'
          ? 100
          : 20;

      progressInterval.current = setInterval(() => {
        setPostProgress((prev) => {
          return Math.floor(Math.min(prev + 1, limit));
        });
      }, delay);
    }
  }, [postStage]);

  useEffect(() => {
    if (postStage.value === 'finish' && postProgress === 100) {
      setTimeout(() => {
        clearInterval(progressInterval.current);
        setCropping(false);
        setStage((prevStage) => ({
          ...prevStage,
          content: 'select',
        }));
        return toast.success('Content created successfully!');
      }, 500);
    }
  }, [postProgress, postStage]);

  const getCroppedAreas = async () => {
    setCropIndex(0);
    setPostProgress(0);

    if (videoRef.current) videoRef.current.pause();
    for (let i = 0; i < editedFiles.length; i++) {
      setCropIndex(i);
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    setCropping(true);
    setPostStage({ value: 'preparing', filesIndexes: new Set(), percent: 0 });
  };

  const updatePostStage = (data: any) => {
    const { message } = data;
    if (message === 'processing') {
      if (data.fileIndex) {
        if (!postStage.filesIndexes.has(data.fileIndex)) {
          setPostStage((prev) => {
            const set = new Set(prev.filesIndexes);
            set.add(data.fileIndex);
            return {
              value: set.size === editedFiles.length ? 'saving' : 'processing',
              filesIndexes: set,
              percent: 0,
            };
          });
        }
      } else {
        setPostStage((prev) => ({ ...prev, value: 'processing' }));
      }
    } else if (message === 'finish') {
      setPostStage((prev) => ({ ...prev, value: 'finish' }));
    }
  };

  const postContent = async () => {
    // Preparing stage
    const formData = new FormData();

    try {
      const croppedMedia: File[] = await Promise.all(
        editedFiles.map(async (obj) => {
          const file = rawFiles.get(obj.key)!;
          if (obj.type === 'video') {
            return file;
          } else {
            return new Promise((resolve, reject) => {
              const cropArea = cropAreas.get(obj.key);

              if (cropArea) {
                const imageSrc = obj.src;
                const image = new Image();

                // prevents CORS issues
                image.crossOrigin = 'anonymous';

                image.onload = () => {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');

                  const { x, y, width, height } = cropArea;

                  canvas.width = width;
                  canvas.height = height;

                  if (ctx) {
                    ctx.drawImage(
                      image,
                      x,
                      y,
                      width,
                      height,
                      0,
                      0,
                      width,
                      height
                    );

                    canvas.toBlob(
                      (blob) => {
                        if (!blob) {
                          canvas.remove();
                          return reject();
                        }

                        const fileName = file?.name;
                        const newFile = new File([blob], String(fileName), {
                          type: 'image/jpeg',
                        });

                        canvas.remove();
                        resolve(newFile);
                      },
                      'image/jpeg',
                      1
                    );
                  } else reject();
                };

                image.onerror = () => reject();

                image.src = imageSrc as string;
              } else {
                resolve(rawFiles.get(obj.key)!);
              }
            });
          }
        })
      );

      const container = document.createElement('div');
      container.innerHTML = generalDescription;

      const hashTags = container.querySelectorAll('.app-hashtags');

      if (hashTags.length > 0) {
        hashTags.forEach((elem) =>
          elem.setAttribute(
            'href',
            `/search?q=${elem.textContent?.trim().slice(1)}`
          )
        );
      }

      const filters = editedFiles.map((file) =>
        getFilterValue(
          {
            filter: file.filter,
            adjustments: file.adjustments,
          },
          true
        )?.trim()
      );

      const descriptions = editedFiles.map(
        (obj) => fileDescriptions.get(obj.key) || ''
      );
      const contentDescription = sanitizeInput(container.innerHTML) || '';
      const collaboratorsList = collaborators.map((obj) => obj.id);
      const mentionsList = [...mentions];
      const videosCrop = editedFiles.map((file) => {
        if (file.type === 'video') {
          return cropAreas.get(file.key);
        }

        return null;
      });

      croppedMedia.forEach((file) => formData.append('content', file));
      formData.append('filters', JSON.stringify({ value: filters }));
      formData.append(
        'fileDescriptions',
        JSON.stringify({ value: descriptions })
      );
      formData.append('description', contentDescription);
      formData.append('settings', JSON.stringify(settings));
      formData.append(
        'aspectRatio',
        String(
          typeof aspectRatio === 'number'
            ? Number(aspectRatio.toFixed(4))
            : aspectRatio
        )
      );
      formData.append('collaborators', JSON.stringify(collaboratorsList));
      formData.append('mentions', JSON.stringify(mentionsList));
      formData.append('videosCropArea', JSON.stringify(videosCrop));
    } catch {
      clearInterval(progressInterval.current);
      setCropping(false);
      return toast.error('Error preparing files. Please try again.');
    }

    // Validating stage
    setPostStage((prev) => ({ ...prev, value: 'validating' }));

    try {
      await streamResponse(
        `${serverUrl}api/v1/contents`,
        formData,
        updatePostStage
      );
    } catch (err: any) {
      clearInterval(progressInterval.current);
      setCropping(false);
      return toast.error(
        err.name === 'operational'
          ? err.message
          : 'Failed to create post. Please try again.'
      );
    }
  };

  return (
    <div className={styles['carousel-details-section']} ref={containerRef}>
      {cropping && (
        <PostLoader
          postStage={postStage}
          postProgress={postProgress}
          postLength={editedFiles.length}
          postType="Content"
        />
      )}

      <div className={styles['carousel-details-container']} ref={carouselRef}>
        <div className={styles['cropper-container']}>
          <Cropper
            key={editedFiles[cropIndex].key}
            image={
              editedFiles[cropIndex].type === 'image'
                ? (editedFiles[cropIndex].src as string)
                : undefined
            }
            video={
              editedFiles[cropIndex].type === 'video'
                ? (editedFiles[cropIndex].src as string)
                : undefined
            }
            crop={crop}
            aspect={aspectRatio as number}
            onCropChange={setCrop}
            onCropComplete={(_, croppedAreaPixels) => {
              setCropAreas((prev) => {
                const map = new Map(prev);
                map.set(editedFiles[cropIndex].key, croppedAreaPixels);
                return map;
              });
            }}
            restrictPosition={true}
            zoomWithScroll={false}
            objectFit={'cover'}
            classes={{
              mediaClassName: styles.img,
            }}
            style={{
              mediaStyle: {
                aspectRatio,
                height: `${imageRef.current?.offsetHeight}px`,
              },
            }}
          />
        </div>

        <span
          className={styles['back-arrow-box']}
          onClick={() =>
            setStage((prevStage) => ({ ...prevStage, content: 'edit' }))
          }
        >
          <IoArrowBack className={styles['back-arrow']} />
        </span>

        <span className={styles['pagination-box']}>
          {contentIndex + 1} / {editedFiles.length}
        </span>

        {contentIndex !== 0 && (
          <span
            className={styles['left-arrow-box']}
            onClick={() => setContentIndex((prev) => prev - 1)}
          >
            <MdKeyboardArrowLeft className={styles.arrow} />
          </span>
        )}

        {editedFiles[contentIndex].type === 'image' ? (
          <img
            className={styles.img}
            ref={imageRef}
            src={editedFiles[contentIndex].src as string}
            style={{
              aspectRatio,
              filter: getFilterValue({
                filter: editedFiles[contentIndex].filter,
                adjustments: editedFiles[contentIndex].adjustments,
              }),
            }}
            onMouseDown={(e) => (e.currentTarget.style.filter = 'none')}
            onMouseUp={(e) =>
              (e.currentTarget.style.filter = getFilterValue({
                filter: editedFiles[contentIndex].filter,
                adjustments: editedFiles[contentIndex].adjustments,
              }) as string)
            }
          />
        ) : (
          <>
            <video
              className={`${styles.img} ${
                editedFiles[contentIndex].type === 'video' &&
                videosCropArea.has(editedFiles[contentIndex].key)
                  ? styles['hide-video']
                  : ''
              }`}
              ref={videoRef}
              style={{
                aspectRatio,
                filter: getFilterValue({
                  filter: editedFiles[contentIndex].filter,
                  adjustments: editedFiles[contentIndex].adjustments,
                }),
              }}
              autoPlay={true}
              loop={true}
              onMouseDown={(e) => (e.currentTarget.style.filter = 'none')}
              onMouseUp={(e) =>
                (e.currentTarget.style.filter = getFilterValue({
                  filter: editedFiles[contentIndex].filter,
                  adjustments: editedFiles[contentIndex].adjustments,
                }) as string)
              }
            >
              <source type="video/mp4" />
              Your browser does not support playing video.
            </video>

            {editedFiles[contentIndex].type === 'video' &&
              videosCropArea.has(editedFiles[contentIndex].key) && (
                <canvas
                  ref={canvasRef}
                  className={styles.img}
                  style={{
                    aspectRatio,
                    filter: getFilterValue({
                      filter: editedFiles[contentIndex].filter,
                      adjustments: editedFiles[contentIndex].adjustments,
                    }),
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.filter = 'none')}
                  onMouseUp={(e) =>
                    (e.currentTarget.style.filter = getFilterValue({
                      filter: editedFiles[contentIndex].filter,
                      adjustments: editedFiles[contentIndex].adjustments,
                    }) as string)
                  }
                ></canvas>
              )}
          </>
        )}

        {contentIndex < editedFiles.length - 1 && (
          <span
            className={styles['right-arrow-box']}
            onClick={() => setContentIndex((prev) => prev + 1)}
          >
            <MdKeyboardArrowRight className={styles.arrow} />
          </span>
        )}

        {editedFiles.length > 1 && (
          <span className={styles['dot-box']} ref={dotRef}>
            {editedFiles.map((_, index) => (
              <span
                key={`${Math.random()}-${index}`}
                className={`${styles.dot} ${
                  contentIndex === index ? styles['current-dot'] : ''
                }`}
              >
                .
              </span>
            ))}
          </span>
        )}
      </div>

      <PostDetails
        postType="content"
        setStage={setStage}
        submitHandler={getCroppedAreas}
        postDetails={{
          editedFiles,
          generalDescription,
          setGeneralDescription,
          collaborators,
          setCollaborators,
          mentions,
          setMentions,
          settings,
          setSettings,
          fileDescriptions,
          setFileDescriptions,
        }}
      />
    </div>
  );
};

export default UploadDetails;
