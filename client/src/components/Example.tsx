import styles from '../styles/UploadReel.module.css';
import { MdOutlineMonochromePhotos } from 'react-icons/md';
import { IoMusicalNotes } from 'react-icons/io5';
import { useEffect, useRef, useState } from 'react';
import { IoBookmarkOutline } from 'react-icons/io5';
import { MdDelete } from 'react-icons/md';
import { FaPlus } from 'react-icons/fa6';
import { IoBookmark } from 'react-icons/io5';
import ReactSlider from 'react-slider';
import { FaPlay } from 'react-icons/fa6';
import { FaPause } from 'react-icons/fa6';
import { IoClose } from 'react-icons/io5';
import { MdChangeCircle } from 'react-icons/md';

type UploadReelProps = {
  src: string | ArrayBuffer | null;
  setStage: React.Dispatch<
    React.SetStateAction<{
      reel: 'select' | 'edit' | 'finish';
      content: 'select' | 'edit' | 'finish';
    }>
  >;
  newVideoRef: React.MutableRefObject<HTMLInputElement>;
};

type AudioFile = {
  name: string;
  duration: string;
  src: string;
  id: string;
  saved?: boolean;
  current?: boolean;
};

const UploadReel = ({
  src: reelSrc,
  setStage,
  newVideoRef,
}: UploadReelProps) => {
  const [category, setCategory] = useState<'cover' | 'sound'>('cover');
  const [soundCategory, setSoundCategory] = useState<'local' | 'saved'>(
    'local'
  );
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [rawFiles, setRawFiles] = useState<File[] | FileList>(null!);
  const [playingIndex, setPlayingIndex] = useState<string>(null!);
  const [addSounds, setAddSounds] = useState<boolean>(false);
  const [savedSounds, setSavedSounds] = useState<AudioFile[]>([]);
  const [coverUrls, setCoverUrls] = useState<string[]>([]);
  const [hideVideo, setHideVideo] = useState<boolean>(true);
  const [coverIndex, setCoverIndex] = useState<number | 'local' | null>(null);
  const [localCoverUrl, setLocalCoverUrl] = useState<string>('');
  const [sliderValues, setSliderValues] = useState<number | number[]>([0, 100]);
  const [positionValues, setPositionValues] = useState<{
    left: string;
    right: string;
  }>({ left: '', right: '' });
  const [newDuration, setNewDuration] = useState<string>('');
  const [pauseVideo, setPauseVideo] = useState<boolean>(true);
  const [showCover, setShowCover] = useState<boolean>(false);
  const [durationValues, setDurationValues] = useState<number[]>([0, 0]);
  const [currentSound, setCurrentSound] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null!);
  const coverRef = useRef<HTMLInputElement>(null!);
  const audioRef = useRef<HTMLAudioElement>(null!);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const startRef = useRef<HTMLSpanElement>(null!);
  const endRef = useRef<HTMLSpanElement>(null!);
  const progressRef = useRef<HTMLSpanElement>(null!);

  useEffect(() => {
    return () => {
      if (files.length > 0)
        files.forEach((file) => URL.revokeObjectURL(file.src as string));

      if (localCoverUrl) URL.revokeObjectURL(localCoverUrl);
    };
  }, []);

  useEffect(() => {
    const tracks = document.querySelectorAll(`.${styles.track}`);
    const slider = document.querySelector(`.${styles.slider}`) as HTMLElement;

    const [firstTrack] = [...tracks].map((track) => track as HTMLElement);

    const [firstValue, secondValue] = Array.isArray(sliderValues)
      ? [...sliderValues]
      : [0, 100];
    const duration = videoRef.current ? videoRef.current.duration : 0;
    const values = [
      Math.floor((firstValue / 100) * duration),
      Math.floor((secondValue / 100) * duration),
    ];

    firstTrack.style.background = 'rgba(0,0,0,0.6)';
    slider.style.background = `linear-gradient(to right,  transparent ${secondValue}%,  rgba(0,0,0,0.6) ${secondValue}%, rgba(0,0,0,0.6) 100%)`;

    startRef.current.style.left = `${firstValue - 2}%`;
    endRef.current.style.left = `${secondValue - 3}%`;

    const durationValues = values.reduce(
      (accumulator, value, index) => {
        const key = index === 0 ? 'left' : 'right';

        accumulator[key] = getDurationText(value);

        return accumulator;
      },
      { left: '', right: '' }
    );

    setDurationValues([
      (firstValue / 100) * duration,
      (secondValue / 100) * duration,
    ]);
    setNewDuration(
      getDurationText(
        Math.floor((secondValue / 100) * duration) -
          Math.floor((firstValue / 100) * duration)
      )
    );
    setPositionValues(durationValues);
  }, [sliderValues]);

  useEffect(() => {
    if (pauseVideo) {
      videoRef.current?.pause();
    } else {
      videoRef.current?.play();
    }
  }, [pauseVideo]);

  // Add animation for sound processing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const uploadFiles = [...e.target.files];
      const filesData: AudioFile[] = [];

      const promises = uploadFiles.map((file) => isFileValid(file));

      try {
        const results = await Promise.all(promises);
        results.forEach((result) => filesData.push(result));
      } catch (error) {
        filesData.forEach((data) => URL.revokeObjectURL(data.src as string));
        e.target.files = new DataTransfer().files;
        return alert(error);
      }

      e.target.files = new DataTransfer().files;
      console.log(rawFiles);
      setRawFiles((prevFiles) => {
        return addSounds ? [...prevFiles, ...uploadFiles] : uploadFiles;
      });
      setFiles((prevFiles) => {
        return addSounds ? [...prevFiles, ...filesData] : filesData;
      });
      setAddSounds(false);
    }
  };

  const getDurationText = (duration: number): string => {
    if (!duration) return '00:00';

    if (duration < 60) {
      return `00:${String(duration).padStart(2, '0')}`;
    } else if (duration < 3600) {
      const trunc = Math.trunc(duration / 60);
      const rem = duration - trunc * 60;

      return `${String(trunc).padStart(2, '0')}:${String(rem).padStart(
        2,
        '0'
      )}`;
    } else {
      return `1:00:00`;
    }
  };

  const isFileValid = (file: File): Promise<AudioFile> => {
    return new Promise((resolve, reject) => {
      if (file.size > 1_073_741_824) {
        reject('Size error');
      } else {
        const fileURL = URL.createObjectURL(file);
        const video = document.createElement('video');

        video.src = fileURL;
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
          const duration = Math.round(video.duration);
          const durationText: string = getDurationText(duration);

          if (duration > 3600) reject('Duration error');

          resolve({
            name: file.name,
            duration: durationText,
            src: fileURL,
            id: `ID-${Math.random()}`,
          });
        };

        video.onerror = () =>
          resolve({
            name: file.name,
            duration: '',
            src: fileURL,
            id: `ID-${Math.random()}`,
          });
      }
    });
  };

  const handlePlayingSound = (soundId: string) => () => {
    const id = files.findIndex((file) => file.id === soundId);

    if (soundId === playingIndex) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    } else {
      audioRef.current.src = files[id].src;
      audioRef.current.play();
      setPlayingIndex(soundId);
    }
  };

  const deleteSound = (soundId: string) => () => {
    const id = files.findIndex((file) => file.id === soundId);

    if (soundId === playingIndex) {
      audioRef.current.src = '';
      setPlayingIndex(null!);
    }

    URL.revokeObjectURL(files[id].src as string);
    setFiles((prevFiles) => prevFiles.filter((_, index) => index !== id));
    setRawFiles((prevFiles) =>
      [...prevFiles].filter((_, index) => index !== id)
    );
  };

  const handleSavedSounds = (soundId: string) => () => {
    if (savedSounds.length < 10) {
      const id = files.findIndex((file) => file.id === soundId);
      const isSoundSaved = savedSounds.find((sound) => sound.id === soundId);

      if (isSoundSaved) {
        setSavedSounds((prevSounds) =>
          prevSounds.filter((sound) => sound.id !== soundId)
        );
        setFiles((prevFiles) => {
          prevFiles[id].saved = false;
          return [...prevFiles];
        });
      } else {
        const sound: AudioFile = {
          name: files[id].name,
          duration: files[id].duration,
          src: files[id].src,
          id: files[id].id,
        };

        setSavedSounds([...savedSounds, sound]);
        setFiles((prevFiles) => {
          prevFiles[id].saved = true;
          return [...prevFiles];
        });
      }
    } else {
      return alert('You can only save ten sounds.');
    }
  };

  const handleCapture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const urls: string[] = [];

    if (video && canvas) {
      const duration = video.duration;
      const interval = duration / 9;

      const ctx = canvas.getContext('2d');

      if (ctx) {
        for (let i = 0; i < 10; i++) {
          const src = await captureFrameAt(video, canvas, ctx, i * interval);

          urls.push(src);
        }
      }

      video.currentTime = 0;
    }

    setSliderValues((values) => {
      if (Array.isArray(values)) return [...values];
      else return values;
    });
    setHideVideo(false);
    setCoverUrls(urls);
  };

  const captureFrameAt = (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    time: number
  ) => {
    return new Promise<string>((resolve) => {
      video.currentTime = time;
      video.onseeked = () => {
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the current frame from video to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get the image data URL from the canvas
        const dataUrl = canvas.toDataURL('image/png');

        resolve(dataUrl);
      };
    });
  };

  const handleCoverPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];

      if (file.size > 1_073_741_824) {
        return alert('Size Error');
      } else {
        const fileURL = URL.createObjectURL(file);
        setLocalCoverUrl(fileURL);
        setPauseVideo(true);
        setCoverIndex('local');
        setShowCover(true);
      }
    }
  };

  const playVideo = (index: number | null, local?: boolean) => () => {
    const condition = local ? coverIndex !== 'local' : coverIndex !== index;

    if (condition) {
      if (videoRef.current) {
        setPauseVideo(true);
        setCoverIndex(local ? 'local' : index);
        setShowCover(true);
        videoRef.current.currentTime = durationValues[0];
      }
    }
  };

  const handlePlayingVideo = () => {
    setShowCover(false);
    if (progressRef.current && videoRef.current) {
      const endValue = Array.isArray(sliderValues) ? sliderValues[1] : 0;
      const startValue =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;

      const animation = progressRef.current.animate(
        {
          left: [`${startValue}%`, `calc(${endValue}% - 0.5rem)`],
        },
        {
          duration: (durationValues[1] - videoRef.current.currentTime) * 1000,
        }
      );

      animation.onfinish = () => {
        progressRef.current.style.left = `${startValue}%`;
        setPauseVideo(true);
      };
    }
  };

  const handleCurrentSound = (soundId: string) => () => {
    if (currentSound === soundId) {
      setCurrentSound(null);
      setFiles((prevFiles) =>
        prevFiles.map((file) => {
          if (file.id === soundId) file.current = false;
          return file;
        })
      );
    } else {
      setFiles((prevFiles) =>
        prevFiles.map((file) => {
          if (file.id === soundId) file.current = true;
          else file.current = false;
          return file;
        })
      );
      setPlayingIndex(soundId);
      setCurrentSound(soundId);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles['edit-container']}>
        <div className={styles['container-head']}>
          Edit Video
          <span
            className={styles['close-edit-box']}
            onClick={() =>
              setStage((prevStage) => ({ ...prevStage, reel: 'select' }))
            }
          >
            <IoClose className={styles['close-edit-icon']} />
          </span>
        </div>

        <div className={styles['hidden-div']}>
          <input
            type="file"
            ref={fileRef}
            accept="audio/mp3, audio/wav, audio/aac, audio/ogg"
            multiple={true}
            onChange={handleFileUpload}
          />

          <input
            type="file"
            ref={coverRef}
            accept="image/jpeg, image/png, image/webp, image/avif"
            onChange={handleCoverPhoto}
          />

          <audio ref={audioRef}>
            <source />
            Your browser does not support the audio element.
          </audio>

          <canvas ref={canvasRef} />
        </div>

        <div className={styles['video-container']}>
          <ul className={styles['category-list']}>
            <li
              className={`${styles['category-item']} ${
                category === 'cover' ? styles['current-category'] : ''
              }`}
              onClick={() => setCategory('cover')}
            >
              <MdOutlineMonochromePhotos className={styles['edit-icon']} />
              Cover Photo
            </li>
            <li
              className={`${styles['category-item']} ${
                category === 'sound' ? styles['current-category'] : ''
              }`}
              onClick={() => setCategory('sound')}
            >
              <IoMusicalNotes className={styles['edit-icon']} />
              Sounds
            </li>

            <MdChangeCircle
              className={styles['swap-icon']}
              title="Change Video"
              onClick={() => {
                setStage((prevStage) => ({ ...prevStage, reel: 'select' }));
                newVideoRef.current.click();
              }}
            />
          </ul>

          {category === 'cover' ? (
            <div className={styles['cover-photo-container']}>
              <div className={styles['cover-photo-head']}>
                Select Cover photo
              </div>

              <div className={styles['cover-photo-div']}>
                {coverUrls.length > 0 &&
                  coverUrls.map((src, index) => (
                    <span
                      key={index}
                      className={`${styles['cover-photo-box']} ${
                        index === coverIndex ? styles['current-cover'] : ''
                      }`}
                      onClick={playVideo(index)}
                    >
                      {index === coverIndex && (
                        <span
                          className={styles['remove-cover-box']}
                          onClick={() => setCoverIndex(null)}
                        >
                          <IoClose className={styles['remove-cover-icon']} />
                        </span>
                      )}
                      <img src={src} className={styles['cover-photo-img']} />
                    </span>
                  ))}
              </div>

              {localCoverUrl && (
                <div className={styles['local-photo-div']}>
                  <span className={styles['local-photo-head']}>
                    Local photo
                  </span>

                  <span
                    className={`${styles['cover-photo-box']} ${
                      coverIndex === 'local' ? styles['current-cover'] : ''
                    }`}
                    onClick={playVideo(null, true)}
                  >
                    {coverIndex === 'local' && (
                      <span
                        className={styles['remove-cover-box']}
                        onClick={() => setCoverIndex(null)}
                      >
                        <IoClose className={styles['remove-cover-icon']} />
                      </span>
                    )}
                    <img
                      src={localCoverUrl}
                      className={styles['cover-photo-img']}
                    />
                  </span>
                </div>
              )}

              <div className={styles['cover-photo-btn-div']}>
                <button
                  className={styles['cover-photo-btn']}
                  onClick={() => coverRef.current.click()}
                >
                  Select from computer
                </button>
              </div>
            </div>
          ) : (
            <div className={styles['add-sound-container']}>
              <div className={styles['sound-category-container']}>
                <ul className={styles['sound-category-list']}>
                  <li
                    className={`${styles['sound-category-item']} ${
                      soundCategory === 'local'
                        ? styles['current-sound-category']
                        : ''
                    }`}
                    onClick={() => setSoundCategory('local')}
                  >
                    Local
                  </li>
                  <li
                    className={`${styles['sound-category-item']} ${
                      soundCategory === 'saved'
                        ? styles['current-sound-category']
                        : ''
                    }`}
                    onClick={() => setSoundCategory('saved')}
                  >
                    Saved
                  </li>
                </ul>

                <div className={styles['sound-category-div']}>
                  {soundCategory === 'local' &&
                    files.length > 0 &&
                    files.map((file, index) => (
                      <article
                        key={`${Math.random()}-${index}`}
                        className={styles['sound-box']}
                      >
                        <span
                          className={`${styles['sound-details']} ${
                            playingIndex === file.id
                              ? styles['playing-sound']
                              : ''
                          }`}
                          onClick={handlePlayingSound(file.id)}
                        >
                          <span className={styles['sound-name']}>
                            {file.name}
                          </span>
                          <span className={styles['sound-duration']}>
                            {file.duration}
                          </span>
                        </span>

                        <span className={styles['sound-btn-box']}>
                          <button
                            className={styles['sound-use-button']}
                            onClick={handleCurrentSound(file.id)}
                          >
                            {file.current ? 'Remove' : 'Use'}
                          </button>

                          {file.saved ? (
                            <IoBookmark
                              className={styles['sound-save-icon']}
                              onClick={handleSavedSounds(file.id)}
                            />
                          ) : (
                            <IoBookmarkOutline
                              className={styles['sound-save-icon']}
                              onClick={handleSavedSounds(file.id)}
                            />
                          )}
                        </span>

                        <MdDelete
                          className={styles['sound-icon']}
                          onClick={deleteSound(file.id)}
                          title="Delete Sound"
                        />
                      </article>
                    ))}

                  {soundCategory === 'saved' &&
                    savedSounds.length > 0 &&
                    savedSounds.map((file, index) => (
                      <article
                        key={`${Math.random()}-${index}`}
                        className={styles['sound-box']}
                      >
                        <span
                          className={`${styles['sound-details']} ${
                            playingIndex === file.id
                              ? styles['playing-sound']
                              : ''
                          }`}
                          onClick={handlePlayingSound(file.id)}
                        >
                          <span className={styles['sound-name']}>
                            {file.name}
                          </span>
                          <span className={styles['sound-duration']}>
                            {file.duration}
                          </span>
                        </span>

                        <span className={styles['sound-btn-box']}>
                          <button className={styles['sound-use-button']}>
                            Use
                          </button>
                          <IoBookmark
                            className={styles['sound-save-icon']}
                            onClick={handleSavedSounds(file.id)}
                          />
                        </span>
                      </article>
                    ))}

                  {soundCategory === 'local' && files.length > 0 && (
                    <div className={styles['plus-icon-div']}>
                      <span
                        className={styles['plus-icon-box']}
                        title="Add sound"
                        onClick={() => {
                          setAddSounds(true);
                          fileRef.current.click();
                        }}
                      >
                        <FaPlus className={styles['plus-icon']} />
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {soundCategory === 'local' && files.length === 0 && (
                <div className={styles['add-sound-btn-div']}>
                  <span className={styles['add-sound-txt']}>
                    You can select multiple songs and pick one to use
                  </span>

                  <button
                    className={styles['add-sound-btn']}
                    onClick={() => fileRef.current.click()}
                  >
                    Select from computer
                  </button>
                </div>
              )}

              {soundCategory === 'saved' && savedSounds.length === 0 && (
                <span className={styles['add-sound-txt2']}>
                  You have no saved songs
                </span>
              )}
            </div>
          )}

          <div className={styles['video-box']}>
            <div className={styles['video-div']}>
              <video
                className={`${styles.video}  ${
                  hideVideo ? styles['hide-item'] : ''
                } `}
                ref={videoRef}
                onLoadedMetadata={hideVideo ? handleCapture : undefined}
                onPlay={handlePlayingVideo}
                onEnded={() => {
                  setPauseVideo(true);
                  setShowCover(true);
                }}
                onTimeUpdate={(e) => {
                  if (e.currentTarget.currentTime >= durationValues[1]) {
                    setPauseVideo(true);
                    setShowCover(true);
                    e.currentTarget.currentTime = durationValues[0];
                  }
                }}
              >
                <source src={reelSrc as string} />
                Your browser does not support playing video.
              </video>

              <div className={styles['video-details']}>
                {pauseVideo ? (
                  <FaPlay
                    className={styles['video-play-icon']}
                    onClick={() => setPauseVideo(false)}
                  />
                ) : (
                  <FaPause
                    className={styles['video-play-icon']}
                    onClick={() => setPauseVideo(true)}
                  />
                )}
                <span className={styles['video-duration']}>{newDuration}</span>
              </div>

              {showCover && coverIndex !== null && (
                <img
                  className={styles.poster}
                  src={
                    coverIndex === 'local'
                      ? localCoverUrl
                      : coverUrls[coverIndex]
                  }
                />
              )}
            </div>
          </div>
        </div>

        <div className={styles['trim-container']}>
          <div className={styles['trim-div']}>
            {coverUrls
              ? coverUrls.map((url) => (
                  <img className={styles['trim-img']} src={url} />
                ))
              : ''}

            <div className={styles['slider-div']}>
              {!pauseVideo && (
                <span
                  className={styles['progress-line']}
                  ref={progressRef}
                ></span>
              )}
              <span
                className={`${styles['start-position']} ${
                  hideVideo ? styles['hide-item'] : ''
                } `}
                ref={startRef}
              >
                {positionValues.left}
              </span>

              <ReactSlider
                className={`${styles.slider} ${
                  hideVideo ? styles['hide-item'] : ''
                }`}
                trackClassName={styles.track}
                value={sliderValues}
                min={0}
                max={100}
                pearling
                minDistance={1}
                renderThumb={(props) => (
                  <div {...props} className={styles['thumb']}>
                    <img
                      src="../../assets/images/suppository-capsule-svgrepo-com (4).svg"
                      alt="Thumb"
                      className={styles['thumb-image']}
                    />
                  </div>
                )}
                onChange={(values) => {
                  setPauseVideo(true);
                  setSliderValues(values);
                  setShowCover(true);
                }}
                onAfterChange={() => {
                  setPauseVideo(false);
                  setShowCover(false);
                  console.log(durationValues[0]);
                  if (videoRef.current && progressRef.current) {
                    videoRef.current.currentTime = durationValues[0];
                    progressRef.current.style.left = `${
                      (durationValues[0] / videoRef.current.duration) * 100
                    }%`;
                  }
                }}
              />

              <span
                className={`${styles['start-position']} ${
                  hideVideo ? styles['hide-item'] : ''
                } `}
                ref={endRef}
              >
                {positionValues.right}
              </span>
            </div>
          </div>

          <div className={styles['next-btn-div']}>
            <button className={styles['next-btn']}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadReel;
