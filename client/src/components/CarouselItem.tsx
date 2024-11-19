import { useRef, useState, useEffect, useContext } from 'react';
import styles from '../styles/CarouselItem.module.css';
import { FaPause, FaPlay } from 'react-icons/fa';
import { BiSolidErrorAlt } from 'react-icons/bi';
import { GoUnmute, GoMute } from 'react-icons/go';
import { ContentContext, LikeContext } from '../Contexts';

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
};

const CarouselItem = ({
  item,
  aspectRatio,
  hideData,
  itemIndex,
  contentIndex,
  setHideData,
  viewType,
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
  const contentRef = useContext(ContentContext);
  const { like, setLike, setHideLike } = useContext(LikeContext);
  const [showLike, setShowLike] = useState<boolean>(false);

  const imageRef = useRef<HTMLImageElement>(null!);
  const videoRef = useRef<HTMLVideoElement>(null!);

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
      }
    }
  }, [contentIndex]);

  const handleImageClick = () => {
    if (loading === false) setHideData(!hideData);
  };

  const handleClick = () => {
    if (loading === false) {
      if (hideData) {
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
              style={{ aspectRatio }}
              ref={videoRef}
              onClick={handleSingleClick(handleClick)}
              onDoubleClick={handleDoubleClick(setLike, setHideLike)}
              autoPlay
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

      {type === 'video' && (
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
    </div>
  );
};

export default CarouselItem;
