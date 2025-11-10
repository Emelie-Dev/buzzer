import { useRef, useState, useEffect, useContext } from 'react';
import styles from '../styles/CarouselItem.module.css';
import { FaPause, FaPlay } from 'react-icons/fa';
import { BiSolidErrorAlt } from 'react-icons/bi';
import { GoUnmute, GoMute } from 'react-icons/go';
import { AuthContext, ContentContext, LikeContext } from '../Contexts';
import { BsDot } from 'react-icons/bs';
import { MdLibraryMusic } from 'react-icons/md';
import { HiOutlineDotsHorizontal } from 'react-icons/hi';
import { RiPushpinFill, RiUnpinFill } from 'react-icons/ri';
import { getTime, getUrl } from '../Utilities';
import { GiMeepleCircle } from 'react-icons/gi';
import LoadingAnimation from '../components/LoadingAnimation';

export interface Content {
  type: 'image' | 'video';
  src: string;
  description?: string;
}

type CarouselItemProps = {
  item: any;
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
  viewsData: {
    seenSlides: Set<unknown>;
    setSeenSlides: React.Dispatch<React.SetStateAction<Set<unknown>>>;
  };
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
  viewsData,
}: CarouselItemProps) => {
  const { type, src, createdAt, hasSound } = item;
  const [loading, setLoading] = useState<
    boolean | 'error' | 'empty' | 'waiting'
  >(true);
  const [pause, setPause] = useState<boolean>(false);
  const [hidePause, setHidePause] = useState<boolean>(true);
  const [reloading, setReloading] = useState<boolean>(false);
  const [mute, setMute] = useState<boolean>(false);
  const [clickTimeout, setClickTimeout] = useState<
    number | null | NodeJS.Timeout
  >(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const { contentRef, reelOptions, mainRef } = useContext(ContentContext);
  const {
    like,
    setShowMenu,
    setHideMenu,
    reelMenuRef,
    viewComment,
    setShowMobileMenu,
    handleLike,
    muted,
    setMuted,
    handlePinnedReels,
    isReelPinned,
    collaboratorsList,
    handleFollow,
    getFollowText,
    followList,
  } = useContext(LikeContext);
  const { seenSlides, setSeenSlides } = viewsData;
  const [showLike, setShowLike] = useState<boolean>(false);
  const [webkit, setWebkit] = useState<boolean>(true);
  const [showMore, setShowMore] = useState<boolean>(false);
  const { setActiveVideo } = useContext(ContentContext);
  const [descriptionHeight, setDescriptionHeight] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isProgressChanging, setIsProgressChanging] = useState<boolean>(false);
  const [duration, setDuration] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState<string>('');
  const { user: authUser } = useContext(AuthContext);

  const imageRef = useRef<HTMLImageElement>(null!);
  const videoRef = useRef<HTMLVideoElement>(null!);
  const descriptionRef = useRef<HTMLDivElement>(null!);
  const progressRef = useRef<HTMLInputElement>(null!);
  const collaboratorsRef = useRef<HTMLUListElement>(null!);

  useEffect(() => {
    const networkHandler = () => {
      if (loading === 'empty' || loading === 'error') {
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
    if (descriptionRef.current) {
      setDescriptionHeight(descriptionRef.current.scrollHeight);
    }

    const resizeHandler = () => {
      if (collaboratorsRef.current && videoRef.current) {
        collaboratorsRef.current.style.width = `${
          videoRef.current.offsetWidth - 4
        }px`;
      }
    };

    resizeHandler();

    window.addEventListener('resize', resizeHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
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

  useEffect(() => {
    if (contentType === 'reels' && reelOptions && videoRef.current) {
      videoRef.current.playbackRate = reelOptions.playBackSpeed;
    }
  }, [reelOptions?.playBackSpeed]);

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

  const handleError = (event: 'error' | 'empty') => () => {
    setReloading(false);
    if (event === 'error') {
      setLoading('error');
    } else if (event === 'empty') {
      setLoading('empty');
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

  const handleDoubleClick = () => {
    // Clear the timeout for single click when a double click is detected
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
    }

    if (loading === false) {
      if (!like.value) handleLike();
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

  const showLoader = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    // Check if we're really out of buffer

    const target = e.target as HTMLVideoElement;
    const buffered = target.buffered;
    const currentTime = target.currentTime;
    let isBuffered = false;

    for (let i = 0; i < buffered.length; i++) {
      if (currentTime >= buffered.start(i) && currentTime <= buffered.end(i)) {
        isBuffered = true;
        break;
      }
    }

    if (!isBuffered) {
      setLoading('waiting');
    }
  };

  const handleMediaLoad = (
    e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement, Event>
  ) => {
    setLoading(false);
    setReloading(false);

    const elem = e.currentTarget;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const ratio = entry.intersectionRatio;
          if (viewType === 'content') {
            if (ratio >= 0.4) {
              // Element is at least 40% visible

              if (contentType === 'carousel' && !seenSlides.has(itemIndex)) {
                setSeenSlides((prev) => new Set(prev).add(itemIndex));
              }
            } else if (ratio === 0) {
              // Fully out of view
              if (contentType !== 'carousel' && type === 'image') {
                setSeenSlides(new Set());
              }
            }
          }
        });
      },
      { threshold: [0, 0.4] }
    );

    observer.observe(elem);
  };

  const handleEnded = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    if (contentType !== 'carousel') {
      setSeenSlides(new Set());
    }

    handleAutoScroll();

    const video = e.target as HTMLVideoElement;
    video.currentTime = 0;
    video.play();
  };

  const handleAutoScroll = () => {
    if (contentType === 'reels' && reelOptions?.autoScroll) {
      if (mainRef && mainRef.current) {
        mainRef.current.scrollTop += mainRef.current.clientHeight;
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
      {(loading === true || reloading === true || loading === 'waiting') && (
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
          ) : (
            ''
          )}
        </div>
      )}

      <div
        className={`${styles['media-wrapper']}`}
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
        onDoubleClick={handleDoubleClick}
      >
        {type === 'image' ? (
          <img
            src={getUrl(src, 'contents')}
            className={`${styles['media']} ${
              loading && loading !== 'waiting' ? styles['hide-visibility'] : ''
            }`}
            style={{ aspectRatio }}
            ref={imageRef}
            onLoad={handleMediaLoad}
            onError={handleError('error')}
            onAbort={handleError('error')}
          />
        ) : (
          <>
            <video
              className={`${styles['video-media']} ${
                contentType === 'reels' ? styles['reels-video'] : ''
              } ${
                loading && loading !== 'waiting'
                  ? styles['hide-visibility']
                  : ''
              }`}
              style={{
                aspectRatio: contentType === 'reels' ? 9 / 16 : aspectRatio,
              }}
              ref={videoRef}
              muted={contentType === 'reels' ? muted : mute}
              onCanPlay={handleMediaLoad}
              onError={handleError('error')}
              onAbort={handleError('error')}
              onStalled={handleError('empty')}
              onWaiting={showLoader}
              onTimeUpdate={handleProgressUpdate}
              onPlaying={() => {
                setIsProgressChanging(false);
                setPause(false);
              }}
              onDurationChange={handleMediaTime('duration')}
              autoPlay={false}
              onEnded={handleEnded}
            >
              <source
                src={getUrl(
                  src,
                  contentType === 'reels' ? 'reels' : 'contents'
                )}
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
              {muted ? (
                <span
                  className={styles['reel-mute-box']}
                  onClick={() => setMuted(!muted)}
                >
                  <GoMute className={styles['reel-mute-icon']} />
                </span>
              ) : (
                <span
                  className={styles['reel-mute-box']}
                  onClick={() => setMuted(!muted)}
                >
                  <GoUnmute className={styles['reel-mute-icon']} />
                </span>
              )}

              {isReelPinned() ? (
                <span
                  className={styles['reel-pin-box']}
                  onClick={() => handlePinnedReels('delete')}
                >
                  <RiUnpinFill className={styles['reel-pin-icon']} />
                </span>
              ) : (
                <span
                  className={styles['reel-pin-box']}
                  onClick={() => handlePinnedReels('add')}
                >
                  <RiPushpinFill className={styles['reel-pin-icon']} />
                </span>
              )}
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
                {collaboratorsList.value.length > 0 && (
                  <div className={styles['collaborators-div']}>
                    <ul
                      className={styles['collaborators-list']}
                      ref={collaboratorsRef}
                    >
                      {collaboratorsList.value.map((user: any) => (
                        <li
                          key={user._id}
                          className={styles['collaborators-item']}
                        >
                          <a
                            className={styles['collaborators-link']}
                            href={`/@${user.username}`}
                          >
                            <img
                              className={styles['collaborators-img']}
                              src={getUrl(user.photo, 'users')}
                            />

                            <span className={styles['collaborators-names']}>
                              <span
                                className={`${styles['collaborators-name']} ${
                                  user._id === authUser._id
                                    ? styles['auth-user']
                                    : ''
                                }`}
                              >
                                {user._id === authUser._id ? 'You' : user.name}
                              </span>
                              <span
                                className={styles['collaborators-username']}
                              >
                                @{user.username}
                              </span>
                            </span>

                            {user._id !== authUser._id && (
                              <span
                                className={styles['follow-btn-box']}
                                onClick={(e) => handleFollow(e, user._id)}
                              >
                                <button
                                  className={`${styles['follow-btn']} ${
                                    followList.has(user._id)
                                      ? styles['disable-btn']
                                      : ''
                                  }`}
                                >
                                  <span
                                    className={`${
                                      followList.has(user._id)
                                        ? styles['follow-txt']
                                        : ''
                                    } `}
                                  >
                                    {getFollowText(user._id)}
                                  </span>
                                </button>

                                {followList.has(user._id) && (
                                  <LoadingAnimation
                                    style={{
                                      position: 'absolute',
                                      zIndex: 2,
                                      width: 60,
                                      height: 60,
                                      opacity: 0.7,
                                    }}
                                  />
                                )}
                              </span>
                            )}
                          </a>
                        </li>
                      ))}
                    </ul>
                    <span
                      className={styles['collaborators-box']}
                      title="Collaborators"
                    >
                      <GiMeepleCircle
                        className={styles['collaborators-icon']}
                      />
                      <span>{collaboratorsList.value.length} </span>
                    </span>
                  </div>
                )}
                <BsDot className={styles.dot} />
                <time className={styles['reel-time']}>
                  {getTime(createdAt)}
                </time>
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

            {hasSound && (
              <span className={styles['music-box']} title="Has Sound">
                <MdLibraryMusic />
                {/* <FaMusic className={styles['music-icon']} />{' '}
              <span className={styles['music-owner']}>SoVinci</span>{' '}
              <BsDot className={styles.dot2} />{' '}
              <span className={styles['music-name']}>Me and the Devil</span> */}
              </span>
            )}
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
