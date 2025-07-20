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
import { useContext, useEffect, useRef, useState } from 'react';
import { FaHeart } from 'react-icons/fa';
import {
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdDelete,
} from 'react-icons/md';
import { IoClose, IoSettingsSharp } from 'react-icons/io5';
import { apiClient, serverUrl } from '../Utilities';
import { useNavigate } from 'react-router-dom';
import { AuthContext, GeneralContext, StoryContext } from '../Contexts';
import { toast } from 'sonner';
import { FiPlusCircle } from 'react-icons/fi';
import ConfirmModal from './ConfirmModal';
import LoadingAnimation from './LoadingAnimation';

export interface StoryContent {
  type: 'image' | 'video';
  src: string;
}

type StoryItemProps = {
  data: any;
  itemIndex: number;
  isOperative: boolean;
  storyIndex: number;
  moveToStory: (
    index: number,
    storyItemIndex: number | null,
    contentLength: number | null,
    setContentIndex: React.Dispatch<React.SetStateAction<number>> | null,
    type: 'initial' | 'next' | 'prev' | 'jump'
  ) => () => void;
  setStoryItems: React.Dispatch<React.SetStateAction<any[]>>;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
};

const StoryItem = ({
  data,
  itemIndex,
  storyIndex,
  isOperative,
  moveToStory,
  setStoryItems,
  setCurrentIndex,
}: StoryItemProps) => {
  const { user, stories } = data || {};
  const { user: authUser } = useContext(AuthContext);
  const { setCreateCategory } = useContext(GeneralContext);
  const {
    setViewStory,
    userStory,
    stories: usersStories,
    setUserStory,
    setStories,
  } = useContext(StoryContext);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [hideMenu, setHideMenu] = useState<boolean>(true);
  const [mute, setMute] = useState<boolean>(false);
  const [pause, setPause] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [confirmModal, setConfirmModal] = useState<boolean>(false);
  const [contentIndex, setContentIndex] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [loading, setLoading] = useState<
    boolean | 'error' | 'empty' | 'waiting'
  >(true);
  const [deleteList, setDeleteList] = useState<Set<string>>(new Set());
  const [deleteStory, setDeleteStory] = useState(false);
  const [updatingList, setUpdatingList] = useState<Set<string>>(new Set());
  const [likeList, setLikeList] = useState<Set<string>>(
    stories
      ? new Set(
          stories
            .map((story: any) => {
              if (story.like) return story._id;
              return null;
            })
            .filter((story: any) => story)
        )
      : new Set()
  );
  const [updateData, setUpdateData] = useState({
    accessibility: stories ? stories[contentIndex].accessibility : 0,
    comments: stories ? stories[contentIndex].disableComments : true,
  });
  const totalLength = userStory.length + usersStories.length;

  const navigate = useNavigate();

  const itemRef = useRef<HTMLDivElement>(null!);
  const menuRef = useRef<HTMLDivElement>(null!);
  const settingsRef = useRef<HTMLDivElement>(null!);
  const listRef = useRef<HTMLUListElement>(null!);
  const videoRef = useRef<HTMLVideoElement>(null!);
  const progressRef = useRef<HTMLSpanElement>(null!);
  const imgRef = useRef<HTMLImageElement>(null!);

  const touchStartX = useRef(0);
  const threshold = 100;

  useEffect(() => {
    if (itemRef.current) {
      if (isOperative) {
        itemRef.current.style.animationDuration = '0.3s';
      }
    }
  });

  useEffect(() => setHideMenu(true), [storyIndex]);

  useEffect(() => {
    const clickHandler = (e: Event) => {
      if (e.target) {
        if (showMenu && !menuRef.current.contains(e.target as Node)) {
          setShowMenu(false);
        }
      }
    };
    window.removeEventListener('click', clickHandler);

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
    const clickHandler = (e: Event) => {
      if (e.target) {
        if (showSettings && !settingsRef.current.contains(e.target as Node)) {
          setShowSettings(false);
        }
      }
    };

    if (!showSettings) setPause(false);

    window.removeEventListener('click', clickHandler);

    window.addEventListener('click', clickHandler);

    return () => {
      window.removeEventListener('click', clickHandler);
    };
  }, [showSettings]);

  useEffect(() => {
    setLoading(true);
    if (stories) {
      if (stories[contentIndex].media.mediaType === 'video') {
        if (videoRef.current)
          videoRef.current.src = `${serverUrl}stories/${stories[contentIndex].media.src}`;
      } else {
        if (imgRef.current) {
          imgRef.current.src = '';
          imgRef.current.src = `${serverUrl}stories/${stories[contentIndex].media.src}`;
        }
      }

      setDeleteStory(false);
      setPause(false);
      setDuration(() => {
        if (stories[contentIndex].media.mediaType === 'image') return 7;
        else return 0;
      });
      setUpdateData({
        accessibility: stories[contentIndex].accessibility,
        comments: stories[contentIndex].disableComments,
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

  useEffect(() => {
    if (deleteStory) {
      const id = stories[contentIndex]._id;
      const newStories = stories.filter((story: any) => story._id !== id);
      const newSet = new Set(deleteList).add(id);
      setDeleteList(newSet);

      const deleteStory = async () => {
        try {
          await apiClient.delete(`api/v1/stories/${id}`);

          setUserStory(newStories);

          if (newStories.length === 0) {
            let start;
            const end = storyIndex + 2;

            if (storyIndex == 0) start = 0;
            else start = storyIndex - 1;

            setStoryItems(
              usersStories.map((item, index) => {
                if (index >= start && index < end) return item;
                else return null;
              })
            );
            setCurrentIndex(1);
            moveToStory(0, null, null, null, 'jump')();
          } else {
            setStoryItems((prevValue) => {
              return prevValue.map((story) => {
                if (story) {
                  const newStory = { ...story };

                  if (story.user._id === user._id)
                    newStory.stories = newStories;
                  return newStory;
                } else return story;
              });
            });
            setContentIndex((prevValue) => prevValue - 1);
          }

          toast.success('Story deleted.', {
            duration: 2000,
          });
        } catch (err: any) {
          if (!err.response) {
            toast.error(`Could not delete story. Please Try again.`, {
              duration: 2000,
            });
          } else {
            toast.error(err.response.data.message, {
              duration: 2000,
            });
          }
        } finally {
          newSet.delete(id);
          setDeleteList(new Set(newSet));
          setDeleteStory(false);
        }
      };

      deleteStory();
    }
  }, [deleteStory]);

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

  const checkStoryLength = () => {
    if (stories.length >= 20) {
      toast.info('Maximum story limit reached.');
    } else {
      setCreateCategory('story');
      navigate('/create');
    }
  };

  const isUpdateValid = () => {
    const story = stories[contentIndex];

    return (
      !updatingList.has(story._id) &&
      (story.accessibility !== updateData.accessibility ||
        story.disableComments !== updateData.comments)
    );
  };

  const updateStory = async () => {
    const id = stories[contentIndex]._id;
    const newSet = new Set(updatingList).add(id);
    setUpdatingList(newSet);

    try {
      const { data } = await apiClient.patch(
        `api/v1/stories/${id}`,
        updateData
      );
      const updatedStory = data.data.story;
      const updatedUserStory = userStory.map((value) => {
        let story = { ...value };
        if (story._id === id) story = updatedStory;
        return story;
      });

      setShowSettings(false);
      setUserStory(updatedUserStory);

      setStoryItems((prevValue) => {
        const index = prevValue.findIndex((story) => {
          if (story) {
            return story.user._id === user._id;
          } else return story;
        });

        prevValue[index].stories = updatedUserStory;

        return prevValue;
      });

      toast.success('Story updated.', {
        duration: 2000,
      });
    } catch (err: any) {
      if (!err.response) {
        toast.error(`Could not update story. Please Try again.`, {
          duration: 2000,
        });
      } else {
        toast.error(err.response.data.message, {
          duration: 2000,
        });
      }
    } finally {
      newSet.delete(id);
      setUpdatingList(new Set(newSet));
    }
  };

  const handleStoryLike = (like: boolean) => async () => {
    const id = stories[contentIndex]._id;
    const newList = new Set(likeList);
    let likeObj: any;

    if (like) {
      newList.add(id);
      setLikeList(new Set(newList));
    } else {
      newList.delete(id);
      setLikeList(new Set(newList));
    }

    try {
      if (like) {
        const { data } = await apiClient.post('api/v1/likes', {
          collection: 'story',
          documentId: id,
        });
        likeObj = data.data.like;
      } else {
        await apiClient.delete(
          `api/v1/likes/story/${id}?id=${stories[contentIndex].like._id}`
        );
      }

      const newStories = stories.map((story: any) => {
        if (story._id === id) story.like = like ? likeObj : null;
        return story;
      });

      setStories((prevValue) => {
        return prevValue.map((story) => {
          const newStory = { ...story };

          if (story.user._id === user._id) newStory.stories = newStories;

          return newStory;
        });
      });
      setStoryItems((prevValue) => {
        return prevValue.map((story) => {
          if (story) {
            const newStory = { ...story };

            if (story.user._id === user._id) newStory.stories = newStories;
            return newStory;
          } else return story;
        });
      });
    } catch (err: any) {
      if (!like) {
        newList.add(id);
        setLikeList(new Set(newList));
      } else {
        newList.delete(id);
        setLikeList(new Set(newList));
      }

      if (!err.response) {
        toast.error(
          `Could not ${like ? 'remove like' : 'like story'}. Please Try again.`,
          {
            duration: 2000,
          }
        );
      } else {
        toast.error(err.response.data.message, {
          duration: 2000,
        });
      }
    }
  };

  return (
    <>
      {confirmModal && (
        <ConfirmModal
          item="story"
          setConfirmModal={setConfirmModal}
          setterArray={[
            { setter: setPause, value: false, type: 'both' },
            { setter: setDeleteStory, value: true, type: 'delete' },
          ]}
        />
      )}

      {storyIndex === itemIndex ? (
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
                      index === contentIndex
                        ? styles['current-viewed-item']
                        : ''
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
                  {authUser._id === user._id ? (
                    deleteList.has(stories[contentIndex]._id) ? (
                      <span className={styles['loading-box']}>
                        <LoadingAnimation
                          style={{
                            position: 'absolute',
                            zIndex: -1,
                            width: 65,
                            height: 65,
                            top: '-110%',
                          }}
                        />
                      </span>
                    ) : (
                      <MdDelete
                        className={styles['delete-icon']}
                        title="Delete Story"
                        onClick={() => {
                          setPause(true);
                          setConfirmModal(true);
                        }}
                      />
                    )
                  ) : (
                    <HiDotsHorizontal
                      className={`${styles['menu-icon']} ${
                        showMenu ? styles['active-menu'] : ''
                      }`}
                      onClick={() => {
                        setShowMenu(!showMenu);
                        setHideMenu(false);
                      }}
                    />
                  )}

                  {!hideMenu && authUser._id !== user._id && (
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
                  ref={imgRef}
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

            {authUser._id === user._id ? (
              <div className={styles['owner-div']}>
                <button
                  className={styles['add-story-btn']}
                  onClick={checkStoryLength}
                >
                  <FiPlusCircle className={styles['add-icon']} />
                  Add story
                </button>

                <div className={styles['settings-div']} ref={settingsRef}>
                  <IoSettingsSharp
                    className={`${styles['settings-icon']} ${
                      showSettings ? styles['settings-icon2'] : ''
                    }`}
                    title="Story Settings"
                    onClick={() => {
                      setShowSettings(!showSettings);
                      setPause(true);
                    }}
                  />

                  <div
                    className={`${styles['settings-container']} ${
                      showSettings ? styles['show-settings'] : ''
                    }`}
                  >
                    <div className={styles['settings-box']}>
                      <span className={styles['accessibility-text']}>
                        Accessibility:
                      </span>
                      <select
                        className={styles['accessibility-select']}
                        value={updateData.accessibility}
                        onChange={(e) =>
                          setUpdateData({
                            ...updateData,
                            accessibility: Number(e.target.value),
                          })
                        }
                      >
                        <option value={0}>Everyone</option>
                        <option value={1}>Friends</option>
                        <option value={1}>Only you</option>
                      </select>
                    </div>

                    <div className={styles['settings-box']}>
                      <input
                        type="checkbox"
                        id="reply"
                        className={styles['settings-checkbox']}
                        value={updateData.comments}
                        onChange={(e) =>
                          setUpdateData({
                            ...updateData,
                            comments: e.target.checked,
                          })
                        }
                      />

                      <label
                        className={styles['settings-reply-text']}
                        htmlFor="reply"
                      >
                        Disable replies
                      </label>
                    </div>

                    <div className={styles['save-btn-div']}>
                      <span className={styles['updating-box']}>
                        {updatingList.has(stories[contentIndex]._id) && (
                          <LoadingAnimation
                            style={{
                              position: 'absolute',
                              zIndex: 2,
                              bottom: -15,
                              width: 65,
                              height: 65,
                              opacity: 0.7,
                            }}
                          />
                        )}
                        <button
                          className={`${styles['save-btn']} ${
                            !isUpdateValid() ? styles['disable-btn'] : ''
                          }`}
                          onClick={updateStory}
                        >
                          <span
                            className={`${
                              updatingList.has(stories[contentIndex]._id)
                                ? styles['hide-text']
                                : ''
                            }`}
                          >
                            Save
                          </span>
                        </button>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles['reply-div']}>
                <input
                  className={styles['reply-input']}
                  type="text"
                  placeholder="Reply privately...."
                />

                {likeList.has(stories[contentIndex]._id) &&
                stories[contentIndex].like ? (
                  <FaHeart
                    className={styles['like-icon2']}
                    onClick={handleStoryLike(false)}
                  />
                ) : (
                  <FaRegHeart
                    className={styles['like-icon']}
                    onClick={handleStoryLike(true)}
                  />
                )}

                <AiOutlineSend className={styles['send-icon']} />
              </div>
            )}
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
              <span className={styles['next-story-username']}>
                {user.username}
              </span>
            </div>
          </div>
        </article>
      )}
    </>
  );
};
export default StoryItem;
