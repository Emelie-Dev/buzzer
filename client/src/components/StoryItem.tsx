import styles from '../styles/StoryItem.module.css';
import { BsDot } from 'react-icons/bs';
import { FaPause, FaPlay } from 'react-icons/fa6';
import {
  BiSolidVolumeMute,
  BiSolidVolumeFull,
  BiSolidErrorAlt,
} from 'react-icons/bi';
import { HiDotsHorizontal } from 'react-icons/hi';
import { FaRegHeart } from 'react-icons/fa';
import { AiOutlineSend } from 'react-icons/ai';
import { useEffect, useRef, useState } from 'react';
import { FaHeart } from 'react-icons/fa';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import { IoClose } from 'react-icons/io5';
import { serverUrl } from '../Utilities';
import { useNavigate } from 'react-router-dom';

export interface StoryContent {
  type: 'image' | 'video';
  src: string;
}

type StoryItemProps = {
  data: any;
  itemIndex: number;
  isOperative: boolean;
  totalLength: number;
  storyIndex: number;
  moveToStory: (
    index: number,
    storyItemIndex: number | null,
    contentLength: number | null,
    setContentIndex: React.Dispatch<React.SetStateAction<number>> | null,
    type: 'initial' | 'next' | 'prev' | 'jump'
  ) => () => void;
  setViewStory: React.Dispatch<React.SetStateAction<boolean>>;
};

const StoryItem = ({
  data,
  itemIndex,
  storyIndex,
  isOperative,
  totalLength,
  moveToStory,
  setViewStory,
}: StoryItemProps) => {
  const { user, stories } = data || {};

  const [like, setLike] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [hideMenu, setHideMenu] = useState<boolean>(true);
  const [mute, setMute] = useState<boolean>(false);
  const [pause, setPause] = useState<boolean>(false);
  const [contentIndex, setContentIndex] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [loading, setLoading] = useState<
    boolean | 'error' | 'empty' | 'waiting'
  >(true);

  const navigate = useNavigate();

  const itemRef = useRef<HTMLDivElement>(null!);
  const menuRef = useRef<HTMLDivElement>(null!);
  const listRef = useRef<HTMLUListElement>(null!);
  const videoRef = useRef<HTMLVideoElement>(null!);
  const progressRef = useRef<HTMLSpanElement>(null!);

  const touchStartX = useRef(0);
  const threshold = 100;

  useEffect(() => {
    if (itemRef.current) {
      if (isOperative) {
        itemRef.current.style.animationDuration = '0.3s';
      }
    }
  });

  useEffect(() => {
    const clickHandler = (e: Event) => {
      if (e.target) {
        if (showMenu && !menuRef.current.contains(e.target as Node)) {
          setShowMenu(false);
        }
      }
    };

    let animation;

    if (listRef.current) {
      if (showMenu) {
        animation = listRef.current.animate(
          {
            height: ['0px', `${listRef.current.scrollHeight}px`],
          },
          {
            fill: 'both',
            duration: 150,
          }
        );
      } else {
        animation = listRef.current.animate(
          {
            height: [`${listRef.current.scrollHeight}px`, '0px'],
          },
          {
            fill: 'both',
            duration: 150,
          }
        );
        animation.onfinish = () => setHideMenu(true);
      }
    }

    window.addEventListener('click', clickHandler);

    return () => {
      window.removeEventListener('click', clickHandler);
    };
  }, [showMenu]);

  useEffect(() => {
    setLoading(true);
    if (stories) {
      if (stories[contentIndex].media.mediaType === 'video') {
        if (videoRef.current)
          videoRef.current.src = `${serverUrl}stories/${stories[contentIndex].media.src}`;
      }

      setPause(false);
      setDuration(() => {
        if (stories[contentIndex].media.mediaType === 'image') return 7;
        else return 0;
      });
    }
  }, [contentIndex, storyIndex, stories]);

  useEffect(() => {
    if (progressRef.current) {
      if (duration > 0)
        progressRef.current.style.animationDuration = `${Math.ceil(duration)}s`;
    }
  }, [duration]);

  useEffect(() => {
    if (videoRef.current) {
      if (pause) videoRef.current.pause();
      else videoRef.current.play();
    }

    if (progressRef.current) {
      if (pause) progressRef.current.style.animationPlayState = 'paused';
      else progressRef.current.style.animationPlayState = 'running';
    }
  }, [pause]);

  const getTime = (date: string, full: boolean = false) => {
    const diff = Date.now() - Date.parse(date);
    let value, type;

    if (diff > 86_400_000) {
      value = Math.floor(diff / 86_400_000);
      type = 'd';
    } else if (diff > 3_600_000) {
      value = Math.floor(diff / 3_600_000);
      type = 'h';
    } else if (diff > 60_000) {
      value = Math.floor(diff / 60_000);
      type = 'm';
    } else if (diff > 1000) {
      value = Math.floor(diff / 1000);
      type = 's';
    } else {
      value = 1;
      type = 's';
    }

    const fullForm =
      type === 's'
        ? 'second'
        : type === 'h'
        ? 'hour'
        : type === 'm'
        ? 'minute'
        : 'day';

    const result = full
      ? `${
          value === 1 ? `${value} ${fullForm} ago` : `${value} ${fullForm}s ago`
        }`
      : `${value}${type}`;

    return result;
  };

  const handleVideoDuration = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration - videoRef.current.currentTime);
    }
  };

  const handleVideoOnMobile =
    (type: 'start' | 'end') => (e: React.TouchEvent<HTMLDivElement>) => {
      const isMobileDevice = window.matchMedia('(max-width: 500px)').matches;
      const isMobileDevice2 = window.matchMedia('(max-width: 800px)').matches;

      if (isMobileDevice) {
        if (stories[contentIndex].media.mediaType === 'video') {
          if (type === 'start') setPause(true);
          else setPause(false);
        }
      }

      if (isMobileDevice2) {
        if (type === 'start') {
          touchStartX.current = e.touches[0].clientX;
        } else {
          const touchEndX = e.changedTouches[0].clientX;
          const diffX = touchEndX - touchStartX.current;

          if (Math.abs(diffX) > threshold) {
            if (diffX > 0) {
              if (itemIndex !== 0)
                moveToStory(itemIndex - 1, null, null, null, 'jump')();
            } else {
              if (itemIndex !== totalLength - 1)
                moveToStory(itemIndex + 1, null, null, null, 'jump')();
            }
          }
        }
      }
    };

  const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const isMobileDevice = window.matchMedia('(max-width: 800px)').matches;

    if (isMobileDevice) {
      const target = e.target as HTMLDivElement;
      const pos = e.nativeEvent.offsetX;
      const center = target.offsetWidth / 2;

      if (pos > center) {
        moveToStory(
          itemIndex + 1,
          contentIndex,
          stories.length - 1,
          setContentIndex,
          'next'
        )();
      } else {
        moveToStory(
          itemIndex - 1,
          contentIndex,
          stories.length - 1,
          setContentIndex,
          'prev'
        )();
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

  return storyIndex === itemIndex ? (
    <article className={styles['current-story']} ref={itemRef}>
      {!(itemIndex === 0 && contentIndex === 0) && (
        <span
          className={styles['left-arrow-box']}
          onClick={moveToStory(
            itemIndex - 1,
            contentIndex,
            stories.length - 1,
            setContentIndex,
            'prev'
          )}
        >
          <MdKeyboardArrowLeft className={styles['left-arrow']} />
        </span>
      )}

      <div
        className={styles['current-story-div']}
        onTouchStart={handleVideoOnMobile('start')}
        onTouchEnd={handleVideoOnMobile('end')}
        onClick={handleClick}
      >
        <div className={styles['line-container']}>
          {stories.map((item: any, index: number) => (
            <span key={`${item._id}`} className={styles['line-box']}>
              <span
                className={`${styles['line-item']} ${
                  index < contentIndex ? styles['viewed-item'] : ''
                } ${
                  index === contentIndex ? styles['current-viewed-item'] : ''
                } ${loading ? styles['pause-animation'] : ''}`}
                ref={index === contentIndex ? progressRef : null}
                onAnimationEnd={moveToStory(
                  itemIndex + 1,
                  contentIndex,
                  stories.length - 1,
                  setContentIndex,
                  'next'
                )}
              >
                &nbsp;
              </span>
            </span>
          ))}
        </div>

        <div className={styles['details-box']}>
          <div className={styles['story-details']}>
            <span
              className={styles['name-box']}
              onClick={() => navigate(`/@${user.username}`)}
            >
              <img
                className={styles['user-pic']}
                src={`${serverUrl}users/${user.photo}`}
              />
              <span className={styles['user-name']}>{user.username}</span>
            </span>
            <BsDot className={styles.dot} />
            <time className={styles['time-sent']}>
              {getTime(stories[contentIndex].createdAt)}
            </time>
          </div>

          <div className={styles['menu-details']}>
            {stories[contentIndex].media.mediaType === 'video' && (
              <>
                {mute ? (
                  <BiSolidVolumeMute
                    className={styles['mute-icon']}
                    onClick={() => setMute(false)}
                  />
                ) : (
                  <BiSolidVolumeFull
                    className={styles['mute-icon']}
                    onClick={() => setMute(true)}
                  />
                )}
              </>
            )}

            {pause ? (
              <FaPlay
                className={styles['pause-icon']}
                onClick={() => setPause(false)}
              />
            ) : (
              <FaPause
                className={styles['pause-icon']}
                onClick={() => setPause(true)}
              />
            )}

            <div className={styles['menu-div']} ref={menuRef}>
              <HiDotsHorizontal
                className={`${styles['menu-icon']} ${
                  showMenu ? styles['active-menu'] : ''
                }`}
                onClick={() => {
                  setShowMenu(!showMenu);
                  setHideMenu(false);
                }}
              />

              {!hideMenu && (
                <ul className={styles['menu-list']} ref={listRef}>
                  <li className={styles['menu-item']}>Follow</li>
                  <li className={styles['menu-item']}>Report</li>
                  <li className={styles['menu-item']}>Hide story</li>
                </ul>
              )}
            </div>

            <IoClose
              className={styles['close-icon']}
              onClick={() => setViewStory(false)}
            />
          </div>
        </div>

        <div className={styles['content-div']}>
          {stories[contentIndex].media.mediaType === 'image' ? (
            <img
              className={`${styles.content} ${
                loading ? styles['hide-item'] : ''
              }`}
              src={`${serverUrl}stories/${stories[contentIndex].media.src}`}
              onLoad={() => setLoading(false)}
              onError={() => setLoading('error')}
              onAbort={() => setLoading('error')}
            />
          ) : (
            <video
              className={`${styles.content} ${
                loading && loading !== 'waiting' ? styles['hide-item'] : ''
              }`}
              ref={videoRef}
              autoPlay
              muted={mute}
              onLoadedMetadata={handleVideoDuration}
              onCanPlay={() => setLoading(false)}
              onError={() => setLoading('error')}
              onAbort={() => setLoading('error')}
              onStalled={() => setLoading('empty')}
              onWaiting={showLoader}
            >
              <source
                src={`${serverUrl}stories/${stories[contentIndex].media.src}`}
              />
              Your browser does not support playing video.
            </video>
          )}

          {loading === true || loading === 'waiting' ? (
            <div className={styles.loader}></div>
          ) : loading === 'error' ? (
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

        <div className={styles['reply-div']}>
          <input
            className={styles['reply-input']}
            type="text"
            placeholder="Reply privately...."
          />

          {like ? (
            <FaHeart
              className={styles['like-icon2']}
              onClick={() => setLike(false)}
            />
          ) : (
            <FaRegHeart
              className={styles['like-icon']}
              onClick={() => setLike(true)}
            />
          )}

          <AiOutlineSend className={styles['send-icon']} />
        </div>
      </div>

      {!(
        itemIndex === totalLength - 1 && contentIndex === stories.length - 1
      ) && (
        <span
          className={styles['right-arrow-box']}
          onClick={moveToStory(
            itemIndex + 1,
            contentIndex,
            stories.length - 1,
            setContentIndex,
            'next'
          )}
        >
          <MdKeyboardArrowRight className={styles['right-arrow']} />
        </span>
      )}
    </article>
  ) : data === null ? (
    <article className={styles['next-story']}></article>
  ) : (
    <article className={styles['next-story']}>
      <div
        className={styles['next-content-div']}
        onClick={moveToStory(itemIndex, null, null, null, 'jump')}
      >
        {stories[contentIndex].media.mediaType === 'image' ? (
          <img
            className={styles['next-content']}
            src={`${serverUrl}stories/${stories[0].media.src}`}
          />
        ) : (
          <video className={styles['next-content']} autoPlay muted>
            <source
              src={`${serverUrl}stories/${stories[contentIndex].media.src}`}
              type="video/mp4"
            />
            Your browser does not support playing video.
          </video>
        )}

        <div className={styles['next-story-content']}>
          <time className={styles['next-story-time']}>
            {getTime(stories[contentIndex].createdAt, true)}
          </time>
          <span className={styles['next-story-img-box']}>
            <img
              className={styles['next-story-img']}
              src={`${serverUrl}users/${user.photo}`}
            />
          </span>
          <span className={styles['next-story-username']}>{user.username}</span>
        </div>
      </div>
    </article>
  );
};
export default StoryItem;
