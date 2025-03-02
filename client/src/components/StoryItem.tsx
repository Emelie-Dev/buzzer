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
import { Story, VoidStory } from './StoryModal';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';

export interface StoryContent {
  type: 'image' | 'video';
  src: string;
}

type StoryItemProps = {
  active: boolean;
  data: Story | { value: null };
  itemIndex: number;
  currentIndex: number;
  totalLength: number;
  moveToStory: (
    index: number,
    storyItemIndex: number | null,
    contentLength: number | null,
    setContentIndex: React.Dispatch<React.SetStateAction<number>> | null,
    type: 'initial' | 'next' | 'prev' | 'jump'
  ) => () => void;
  switchType: 'front' | 'back' | 'none';
};

const StoryItem = ({
  active,
  data,
  itemIndex,
  currentIndex,
  moveToStory,
  switchType,
}: StoryItemProps) => {
  const { name, time, content } = data as Story;

  const [like, setLike] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [hideMenu, setHideMenu] = useState<boolean>(true);
  const [mute, setMute] = useState<boolean>(false);
  const [pause, setPause] = useState<boolean>(false);
  const [contentIndex, setContentIndex] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [loading, setLoading] = useState<
    boolean | 'error' | 'empty' | 'notfound'
  >(true);

  const itemRef = useRef<HTMLDivElement>(null!);
  const menuRef = useRef<HTMLDivElement>(null!);
  const listRef = useRef<HTMLUListElement>(null!);
  const videoRef = useRef<HTMLVideoElement>(null!);
  const progressRef = useRef<HTMLSpanElement>(null!);

  useEffect(() => {
    if (active) {
      switch (switchType) {
        case 'back':
          itemRef.current.animate(
            {
              transform: [
                'scale(0.5) translateX(-100%)',
                'scale(1) translateX(0%)',
              ],
            },
            {
              fill: 'both',
              duration: 250,
            }
          );
          break;

        case 'front':
          itemRef.current.animate(
            {
              transform: [
                'scale(0.5) translateX(100%)',
                'scale(1) translateX(0%)',
              ],
            },
            {
              fill: 'both',
              duration: 250,
            }
          );
          break;

        default:
          itemRef.current.animate(
            {
              transform: ['scale(0.5)', 'scale(1)'],
            },
            {
              fill: 'both',
              duration: 250,
            }
          );
      }
    }
  }, [currentIndex]);

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

    if ((data as Story).name) {
      if (content[contentIndex].type === 'video') {
        if (videoRef.current)
          videoRef.current.src = `../../assets/images/content/${content[contentIndex].src}.mp4`;
      }

      setPause(false);
      setDuration(() => {
        if (content[contentIndex].type === 'image') return 7;
        else return 0;
      });
    }
  }, [contentIndex, content]);

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

  const getTime = () => {
    const arr = time.split(' ');

    return `${arr[0]}${arr[1][0]}`;
  };

  const handleVideoDuration = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration - videoRef.current.currentTime);
    }
  };

  return (data as VoidStory).value === null ? (
    <article className={styles['void-next-story']}></article>
  ) : active ? (
    <article className={styles['current-story']} ref={itemRef}>
      <span
        className={styles['left-arrow-box']}
        onClick={moveToStory(
          itemIndex - 1,
          contentIndex,
          content.length - 1,
          setContentIndex,
          'prev'
        )}
      >
        <MdKeyboardArrowLeft className={styles['left-arrow']} />
      </span>

      <div className={styles['line-container']}>
        {content.map((item, index) => (
          <span key={`${index}-${item.type}`} className={styles['line-box']}>
            <span
              className={`${styles['line-item']} ${
                index < contentIndex ? styles['viewed-item'] : ''
              } ${index === contentIndex ? styles['current-viewed-item'] : ''}`}
              ref={index === contentIndex ? progressRef : null}
              onAnimationEnd={moveToStory(
                itemIndex + 1,
                contentIndex,
                content.length - 1,
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
          <span className={styles['name-box']}>
            <img
              className={styles['user-pic']}
              src={`../../assets/images/users/user${itemIndex + 1}.jpeg`}
            />
            <span className={styles['user-name']}>{name}</span>
          </span>
          <BsDot className={styles.dot} />
          <time className={styles['time-sent']}>{getTime()}</time>
        </div>

        <div className={styles['menu-details']}>
          {content[contentIndex].type === 'video' && (
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
        </div>
      </div>
      <div className={styles['content-div']}>
        {content[contentIndex].type === 'image' ? (
          <img
            className={`${styles.content} ${
              loading ? styles['hide-item'] : ''
            }`}
            src={`../../assets/images/content/${content[contentIndex].src}.jpeg`}
            onLoad={() => setLoading(false)}
            onError={() => setLoading('error')}
            onAbort={() => setLoading('error')}
          />
        ) : (
          <video
            className={`${styles.content} ${
              loading ? styles['hide-item'] : ''
            }`}
            ref={videoRef}
            autoPlay
            muted={mute}
            onLoadedMetadata={handleVideoDuration}
            onCanPlay={() => setLoading(false)}
            onError={() => setLoading('error')}
            onAbort={() => setLoading('error')}
            onEmptied={() => setLoading('notfound')}
            onStalled={() => setLoading('empty')}
          >
            <source
              src={`../../assets/images/content/${content[contentIndex].src}.mp4`}
              type="video/mp4"
            />
            Your browser does not support playing video.
          </video>
        )}

        {loading === true ? (
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
        ) : loading === 'notfound' &&
          videoRef.current.src ===
            `../../assets/images/content/${content[contentIndex].src}.mp4` ? (
          <span className={styles['error-box']}>
            <BiSolidErrorAlt className={styles['error-icon']} />
            This media no longer exists.
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

      <span
        className={styles['right-arrow-box']}
        onClick={moveToStory(
          itemIndex + 1,
          contentIndex,
          content.length - 1,
          setContentIndex,
          'next'
        )}
      >
        <MdKeyboardArrowRight className={styles['right-arrow']} />
      </span>
    </article>
  ) : (
    <article className={styles['next-story']}>
      <div className={styles['next-content-div']}>
        {content[0].type === 'image' ? (
          <img
            className={styles['next-content']}
            src={`../../assets/images/content/${content[0].src}.jpeg`}
          />
        ) : (
          <video className={styles['next-content']} autoPlay muted>
            <source
              src={`../../assets/images/content/${content[0].src}.mp4`}
              type="video/mp4"
            />
            Your browser does not support playing video.
          </video>
        )}

        <div className={styles['next-story-content']}>
          <time className={styles['next-story-time']}>{time}</time>
          <span className={styles['next-story-img-box']}>
            <img
              className={styles['next-story-img']}
              src={`../../assets/images/users/user${itemIndex + 1}.jpeg`}
            />
          </span>
          <span className={styles['next-story-username']}>{name}</span>
        </div>
      </div>
    </article>
  );
};
export default StoryItem;
