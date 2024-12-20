import { useRef, useState, useEffect, useContext } from 'react';
import styles from '../styles/CarouselItem.module.css';
import { FaPause, FaPlay } from 'react-icons/fa';
import { BiSolidErrorAlt } from 'react-icons/bi';
import { GoUnmute, GoMute } from 'react-icons/go';
import { ContentContext, LikeContext } from '../Contexts';
import { BsDot } from 'react-icons/bs';
import { FaMusic } from 'react-icons/fa';
import { HiOutlineDotsHorizontal } from 'react-icons/hi';

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
  description: string;
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
}: CarouselItemProps) => {
  const { type, src } = item;
  const [loading, setLoading] = useState<
    boolean | 'error' | 'empty' | 'notfound'
  >(true);
  const [pause, setPause] = useState<boolean>(false);
  const [hidePause, setHidePause] = useState<boolean>(true);
  const [reloading, setReloading] = useState<boolean>(false);
  const [mute, setMute] = useState<boolean>(false);
  const [clickTimeout, setClickTimeout] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const { contentRef } = useContext(ContentContext);
  const { like, setLike, setHideLike, setShowMenu, setHideMenu, reelMenuRef } =
    useContext(LikeContext);
  const [showLike, setShowLike] = useState<boolean>(false);
  const [webkit, setWebkit] = useState<boolean>(true);
  const [showMore, setShowMore] = useState<boolean>(false);
  const { setActiveVideo } = useContext(ContentContext);
  const [descriptionHeight, setDescriptionHeight] = useState<number>(0);

  const imageRef = useRef<HTMLImageElement>(null!);
  const videoRef = useRef<HTMLVideoElement>(null!);
  const descriptionRef = useRef<HTMLDivElement>(null!);

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
        videoRef.current.currentTime = currentTime;
        videoRef.current.play();
        if (viewType === 'content') setActiveVideo(videoRef.current);
      }
    }
  }, [contentIndex]);

  useEffect(() => {
    if (descriptionRef.current)
      setDescriptionHeight(descriptionRef.current.scrollHeight);
  }, []);

  const handleImageClick = () => {
    if (loading === false) setHideData(!hideData);
  };

  const handleClick = () => {
    if (loading === false) {
      if (hideData || contentType !== 'carousel') {
        setHidePause(false);
        if (videoRef.current.paused) {
          videoRef.current.play();
          setHideData(!hideData);
          setPause(false);
        } else {
          videoRef.current.pause();
          setPause(true);
        }

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

    setWebkit(false);
    if (showMore) {
      animation = descriptionRef.current.animate(
        {
          maxHeight: [`${descriptionRef.current.scrollHeight}px`, '50px'],
        },
        {
          fill: 'both',
          duration: 300,
        }
      );
    } else {
      animation = descriptionRef.current.animate(
        {
          maxHeight: ['50px', `${descriptionRef.current.scrollHeight}px`],
        },
        {
          fill: 'both',
          duration: 300,
        }
      );
    }

    setShowMore(!showMore);
    animation.onfinish = () => {
      setWebkit(true);
    };
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

      <div className={styles['media-wrapper']}>
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
            onClick={handleSingleClick(handleImageClick)}
            onDoubleClick={handleDoubleClick(setLike, setHideLike)}
            onError={handleError('error')}
            onAbort={handleError('error')}
          />
        ) : (
          <>
            <video
              className={`${styles['video-media']} ${
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
              onClick={handleSingleClick(handleClick)}
              onDoubleClick={handleDoubleClick(setLike, setHideLike)}
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
          <span
            className={styles['reel-menu-box']}
            onClick={() => {
              setShowMenu((prevState) => !prevState);
              setHideMenu(false);
            }}
            ref={reelMenuRef}
          >
            <HiOutlineDotsHorizontal className={styles['reel-menu-icon']} />
          </span>

          <div
            className={`${styles['reel-details-box']} ${
              showMore ? styles['show-description'] : ''
            }`}
          >
            <div className={styles['reel-details']}>
              <span className={styles['reel-owner']}>Mr Hilarious👑</span>
              <BsDot className={styles.dot} />
              <time className={styles['reel-time']}>02-04-24</time>
            </div>

            <div
              className={styles['reel-description-container']}
              ref={descriptionRef}
            >
              <span
                className={`${styles['reel-description']} ${
                  showMore ? styles['show-desc'] : ''
                }  ${webkit ? styles['webkit-style'] : ''}`}
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
            <input type="range" className={styles['reel-progress']} />
          </div>
        </>
      )}
    </div>
  );
};

export default CarouselItem;
