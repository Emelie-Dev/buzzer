import { useRef, useState, useEffect, useContext } from 'react';
import styles from '../styles/CarouselItem.module.css';
import { FaPause, FaPlay } from 'react-icons/fa';
import { BiSolidErrorAlt } from 'react-icons/bi';
import { GoUnmute, GoMute } from 'react-icons/go';
import { ContentContext, LikeContext } from '../Contexts';
import { BsDot } from 'react-icons/bs';
import { FaMusic } from 'react-icons/fa';
import { HiOutlineDotsHorizontal } from 'react-icons/hi';
import { RiPushpinFill } from 'react-icons/ri';

export interface Content {
  type: 'image' | 'video';
  src: string;
  description?: string;
}

type CarouselItemProps = {
  item: Content;
  aspectRatio: number;
  hideData: boolean;
  contentIndex: number;
  itemIndex: number;
  setHideData: React.Dispatch<React.SetStateAction<boolean>>;
  viewType: 'comment' | 'content';
  contentType: 'carousel' | 'single' | 'reels';
  description?: string;
  name?: string;
  time?: string;
};

const CarouselItem = ({
  item,
  aspectRatio,
  hideData,
  itemIndex,
  contentIndex,
  setHideData,
  viewType,
  contentType,
  description,
  name,
}: CarouselItemProps) => {
  const { type, src } = item;
  const [loading, setLoading] = useState<
    boolean | 'error' | 'empty' | 'notfound'
  >(true);
  const [pause, setPause] = useState<boolean>(false);
  const [hidePause, setHidePause] = useState<boolean>(true);
  const [reloading, setReloading] = useState<boolean>(false);
  const [mute, setMute] = useState<boolean>(false);
  const [clickTimeout, setClickTimeout] = useState<
    number | null | NodeJS.Timeout
  >(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const { contentRef } = useContext(ContentContext);
  const {
    like,
    setLike,
    setHideLike,
    setShowMenu,
    setHideMenu,
    reelMenuRef,
    viewComment,
    setShowMobileMenu,
  } = useContext(LikeContext);
  const [showLike, setShowLike] = useState<boolean>(false);
  const [webkit, setWebkit] = useState<boolean>(true);
  const [showMore, setShowMore] = useState<boolean>(false);
  const { setActiveVideo } = useContext(ContentContext);
  const [descriptionHeight, setDescriptionHeight] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isProgressChanging, setIsProgressChanging] = useState<boolean>(false);
  const [duration, setDuration] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState<string>('');

  const imageRef = useRef<HTMLImageElement>(null!);
  const videoRef = useRef<HTMLVideoElement>(null!);
  const descriptionRef = useRef<HTMLDivElement>(null!);
  const progressRef = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    const networkHandler = () => {
      if (
        loading === 'empty' ||
        loading === 'error' ||
        loading === 'notfound'
      ) {
        setReloading(true);

        if (type === 'image') {
          imageRef.current.src = '';
          imageRef.current.src = src;
        } else {
          videoRef.current.src = '';
          videoRef.current.src = src;
        }
      }
    };

    window.addEventListener('online', networkHandler);

    return () => {
      window.removeEventListener('online', networkHandler);
    };
  }, [loading]);

  useEffect(() => {
    if (type === 'video') {
      if (contentIndex !== itemIndex) {
        videoRef.current.pause();
        setCurrentTime(videoRef.current.currentTime);
      } else {
        if (contentType !== 'reels') {
          videoRef.current.currentTime = currentTime;
          videoRef.current.play();
          setActiveVideo(videoRef.current);
        } else {
          if (viewType === 'comment') {
            videoRef.current.play();
            setActiveVideo(videoRef.current);
          }
        }
      }
    }
  }, [contentIndex]);

  useEffect(() => {
    if (descriptionRef.current)
      setDescriptionHeight(descriptionRef.current.scrollHeight);
  }, []);

  useEffect(() => {
    if (contentType === 'reels' && progressRef.current) {
      progressRef.current.style.background = `linear-gradient(to right, white ${progress}%, gray ${progress}%)`;
    }
  }, [progress]);

  useEffect(() => {
    if (contentIndex === itemIndex) {
      if (type === 'video') {
        if (!viewComment) {
          videoRef.current.play();
          setActiveVideo(videoRef.current);
        }
      }
    }
  }, [viewComment]);

  const handleImageClick = () => {
    if (loading === false) setHideData(!hideData);
  };

  const handleClick = () => {
    if (loading === false) {
      if (hideData || contentType !== 'carousel') {
        if (videoRef.current.paused) {
          if (contentType === 'reels') {
            if (showMore) return handleDescription();
          } else setHideData(!hideData);

          videoRef.current.play();
          setPause(false);
        } else {
          if (contentType === 'reels') {
            if (showMore) return handleDescription();
          }

          videoRef.current.pause();
          setPause(true);
        }

        setHidePause(false);
        setTimeout(() => {
          setHidePause(true);
        }, 300);
      } else {
        setHideData(!hideData);
      }
    }
  };

  const handleError = (event: 'error' | 'empty' | 'notfound') => () => {
    setReloading(false);
    if (event === 'error') {
      setLoading('error');
    } else if (event === 'empty') {
      setLoading('empty');
    } else if (event === 'notfound') {
      setLoading('notfound');
    }
  };

  const handleSingleClick = (handler: () => void) => () => {
    // Clear any existing timeout for single click
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
    }

    // Set a timeout for single click action
    const timeout = setTimeout(() => {
      // Perform single-click action here

      handler();
      setClickTimeout(null);
    }, 250); // Adjust the delay time as needed

    setClickTimeout(timeout);
  };

  const handleDoubleClick =
    (
      handler1: React.Dispatch<React.SetStateAction<boolean>>,
      handler2: React.Dispatch<React.SetStateAction<boolean>>
    ) =>
    () => {
      // Clear the timeout for single click when a double click is detected
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        setClickTimeout(null);
      }

      if (loading === false) {
        // Perform double-click action here
        handler1(true);
        if (!like) handler2(false);
        setShowLike(true);

        setTimeout(() => setShowLike(false), 700);
      }
    };

  const addToRef =
    (ref: React.MutableRefObject<HTMLDivElement[]>) => (el: HTMLDivElement) => {
      if (el && !ref.current.includes(el)) {
        ref.current.push(el);
      }
    };

  const handleDescription = () => {
    let animation;

    const scrollHeight =
      descriptionRef.current.scrollHeight > 0.45 * window.innerHeight
        ? '45vh'
        : `${descriptionRef.current.scrollHeight}px`;

    setWebkit(false);
    if (showMore) {
      descriptionRef.current.style.scrollBehavior = 'auto';
      descriptionRef.current.scrollTop = 0;
      animation = descriptionRef.current.animate(
        {
          maxHeight: [`${scrollHeight}`, '50px'],
        },
        {
          fill: 'both',
          duration: 300,
        }
      );

      descriptionRef.current.style.overflow = 'hidden';
    } else {
      animation = descriptionRef.current.animate(
        {
          maxHeight: ['50px', `${scrollHeight}`],
        },
        {
          fill: 'both',
          duration: 300,
        }
      );
      descriptionRef.current.style.overflow = 'auto';
    }

    setShowMore(!showMore);
    animation.onfinish = () => {
      setWebkit(true);
      descriptionRef.current.style.scrollBehavior = 'smooth';
    };
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setIsProgressChanging(true);
    setHideData(true);
    setProgress(value);

    handleMediaTime('current', value)();
  };

  const handleProgressUpdate = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLVideoElement;

    const currentTime = target.currentTime;
    const duration = target.duration;

    if (!isProgressChanging) setProgress((currentTime / duration) * 100);
  };

  const seekMedia = () => {
    setIsProgressChanging(false);
    setHideData(false);

    if (videoRef.current)
      videoRef.current.currentTime =
        (progress / 100) * videoRef.current.duration;
  };

  const handleMediaTime =
    (type: 'duration' | 'current', value: number = 0) =>
    () => {
      const target = videoRef.current;
      const duration = Math.round(target.duration);
      const time = Math.round((value / 100) * duration);

      if (type === 'duration') {
        if (duration < 60) {
          setDuration(`00:${String(duration).padStart(2, '0')}`);
        } else {
          const trunc = Math.trunc(duration / 60);
          const rem = duration - trunc * 60;

          setDuration(
            `${String(trunc).padStart(2, '0')}:${String(rem).padStart(2, '0')}`
          );
        }
      } else {
        if (time < 60) {
          setElapsedTime(`00:${String(time).padStart(2, '0')}`);
        } else {
          const trunc = Math.trunc(time / 60);
          const rem = time - trunc * 60;

          setElapsedTime(
            `${String(trunc).padStart(2, '0')}:${String(rem).padStart(2, '0')}`
          );
        }
      }
    };

  return (
    <div
      className={`${styles['carousel-item']} ${
        viewType === 'comment' ? styles['comment-item'] : ''
      }`}
      ref={type === 'video' ? addToRef(contentRef) : null}
      data-active={contentIndex === itemIndex && !pause}
    >
      {(loading === true || reloading === true) && (
        <div className={styles.loader}></div>
      )}

      {loading === false && showLike && (
        <img
          className={styles['like-img']}
          src="../../assets/images/Animation - 1731357988887.gif"
        />
      )}

      {!reloading && (
        <div className={styles['loading-error-box']}>
          {loading === 'error' ? (
            <span className={styles['error-box']}>
              <BiSolidErrorAlt className={styles['error-icon']} />
              An error occured while loading media.
            </span>
          ) : loading === 'empty' ? (
            <span className={styles['error-box']}>
              <BiSolidErrorAlt className={styles['error-icon']} />
              Unable to load media.
            </span>
          ) : loading === 'notfound' ? (
            <span className={styles['error-box']}>
              <BiSolidErrorAlt className={styles['error-icon']} />
              This media no longer exists.
            </span>
          ) : (
            ''
          )}
        </div>
      )}

      <div
        className={`${styles['media-wrapper']} `}
        onContextMenu={(e) => {
          if (contentType === 'reels') {
            e.preventDefault();
            setHideData(!hideData);
          }
        }}
        onClick={
          type === 'video'
            ? handleSingleClick(handleClick)
            : handleSingleClick(handleImageClick)
        }
        onDoubleClick={
          type === 'video'
            ? handleDoubleClick(setLike, setHideLike)
            : handleDoubleClick(setLike, setHideLike)
        }
      >
        {type === 'image' ? (
          <img
            src={`../../assets/images/content/${src}.jpeg`}
            className={`${styles['media']} ${
              loading === true ||
              loading === 'empty' ||
              loading === 'error' ||
              loading === 'notfound'
                ? styles['hide-visibility']
                : ''
            }`}
            style={{ aspectRatio }}
            ref={imageRef}
            onLoad={() => {
              setLoading(false);
              setReloading(false);
            }}
            onError={handleError('error')}
            onAbort={handleError('error')}
          />
        ) : (
          <>
            <video
              className={`${styles['video-media']} ${
                contentType === 'reels' ? styles['reels-video'] : ''
              } ${
                loading === true ||
                loading === 'empty' ||
                loading === 'error' ||
                loading === 'notfound'
                  ? styles['hide-visibility']
                  : ''
              }`}
              style={{
                aspectRatio: contentType === 'reels' ? 9 / 16 : aspectRatio,
              }}
              ref={videoRef}
              muted={mute}
              loop={true}
              onCanPlay={() => {
                setLoading(false);
                setReloading(false);
              }}
              onError={handleError('error')}
              onAbort={handleError('error')}
              onEmptied={handleError('notfound')}
              onStalled={handleError('empty')}
              onTimeUpdate={handleProgressUpdate}
              onPlaying={() => {
                setIsProgressChanging(false);
                setPause(false);
              }}
              onDurationChange={handleMediaTime('duration')}
              autoPlay={false}
            >
              <source
                src={`../../assets/images/content/${src}.mp4`}
                type="video/mp4"
              />
              Your browser does not support playing video.
            </video>

            {pause ? (
              <span
                className={`${styles['pause-icon-box']} ${
                  hidePause ? styles['hide-data'] : ''
                }`}
                onClick={handleClick}
              >
                <FaPause className={styles['pause-icon']} />
              </span>
            ) : (
              <span
                className={`${styles['pause-icon-box']} ${
                  hidePause ? styles['hide-data'] : ''
                }`}
                onClick={handleClick}
              >
                <FaPlay className={styles['pause-icon']} />
              </span>
            )}
          </>
        )}
      </div>

      {type === 'video' && contentType !== 'reels' && (
        <span
          className={styles['mute-icon-box']}
          onClick={() => setMute(!mute)}
        >
          {mute ? (
            <GoMute className={styles['mute-icon']} />
          ) : (
            <GoUnmute className={styles['mute-icon']} />
          )}
        </span>
      )}

      {contentType === 'reels' && (
        <>
          {viewType !== 'comment' && (
            <span
              className={styles['reel-menu-box']}
              onClick={() => {
                setShowMenu((prevState) => !prevState);
                setHideMenu(false);
                if (setShowMobileMenu) setShowMobileMenu(true);
              }}
              ref={reelMenuRef}
            >
              <HiOutlineDotsHorizontal className={styles['reel-menu-icon']} />
            </span>
          )}

          {viewType === 'comment' && (
            <>
              <span className={styles['reel-mute-box']}>
                <GoUnmute className={styles['reel-mute-icon']} />
              </span>

              <span className={styles['reel-pin-box']}>
                <RiPushpinFill className={styles['reel-pin-icon']} />
              </span>
            </>
          )}

          <div
            className={`${styles['reel-details-box']} ${
              showMore ? styles['show-description'] : ''
            } ${hideData ? styles['hide-visibility'] : ''}`}
          >
            {viewType !== 'comment' && (
              <div className={styles['reel-details']}>
                <span className={styles['reel-owner']}>{name}</span>
                <BsDot className={styles.dot} />
                <time className={styles['reel-time']}>02-04-24</time>
              </div>
            )}

            <div className={styles['reel-description-container']}>
              <span
                className={`${styles['reel-description']} ${
                  showMore ? styles['show-desc'] : ''
                }  ${webkit ? styles['webkit-style'] : ''}`}
                ref={descriptionRef}
              >
                {description}
              </span>

              {descriptionHeight > 50 && (
                <span
                  className={`${styles['more-text']}`}
                  onClick={handleDescription}
                >
                  {showMore ? 'less' : 'more'}
                </span>
              )}
            </div>

            <span className={styles['music-box']}>
              <FaMusic className={styles['music-icon']} />{' '}
              <span className={styles['music-owner']}>SoVinci</span>{' '}
              <BsDot className={styles.dot2} />{' '}
              <span className={styles['music-name']}>Me and the Devil</span>
            </span>
          </div>

          <div className={styles['reel-progress-box']}>
            <input
              type="range"
              className={`${styles['reel-progress']} ${
                pause || isProgressChanging ? styles['reel-progress2'] : ''
              }`}
              value={progress}
              ref={progressRef}
              min={0}
              max={100}
              onKeyDown={(e) => e.preventDefault()}
              onChange={handleProgressChange}
              onClick={seekMedia}
            />
          </div>

          {isProgressChanging && (
            <div className={styles['seek-box']}>
              <span>{elapsedTime}</span>
              <span className={styles.slash}>/</span>
              <span>{duration}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CarouselItem;
