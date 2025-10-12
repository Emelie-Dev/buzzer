import { BsDot } from 'react-icons/bs';
import {
  HiOutlineDotsHorizontal,
  HiPlus,
  HiOutlineDotsVertical,
} from 'react-icons/hi';
import Carousel from '../components/Carousel';
import { FaCommentDots, FaShare } from 'react-icons/fa';
import { IoBookmark } from 'react-icons/io5';
import styles from '../styles/ContentBox.module.css';
import { useContext, useEffect, useRef, useState } from 'react';
import { PiCheckFatFill } from 'react-icons/pi';
import { AuthContext, ContentContext, LikeContext } from '../Contexts';
import CommentBox from './CommentBox';
import ShareMedia from '../components/ShareMedia';
import { Content } from '../components/CarouselItem';
import ContentItem from './ContentItem';
import { apiClient, getTime, getUrl, getEngagementValue } from '../Utilities';
import LoadingAnimation from '../components/LoadingAnimation';
import { toast } from 'sonner';
import { IoMdHeart } from 'react-icons/io';

type ContentBoxProps = {
  data: any;
  contentType: 'following' | 'home' | 'reels';
  setContents: React.Dispatch<React.SetStateAction<any[]>>;
  setShowMobileMenu?: React.Dispatch<React.SetStateAction<boolean>>;
  pinnedReels?: any[] | 'error';
  setPinnedReels?: React.Dispatch<React.SetStateAction<any[] | 'error'>>;
};

export type CommentData =
  | {
      postId: string;
      media: Content[];
      user: any;
      aspectRatio: number;
      type: 'carousel';
    }
  | {
      postId: string;
      media: string;
      user: any;
      aspectRatio: number;
      type: 'image' | 'video';
    };

const ContentBox = ({
  data,
  contentType,
  setContents,
  setShowMobileMenu,
  pinnedReels,
  setPinnedReels,
}: ContentBoxProps) => {
  const {
    _id: contentId,
    user,
    createdAt,
    collaborators,
    aspectRatio,
    media,
    description,
    hasUnviewedStory,
    hasStory,
    userLike,
    likesCount,
    commentsCount,
    userBookmark,
    bookmarksCount,
    sharesCount,
    src,hasSound
  } = data;
  const type =
    contentType === 'reels'
      ? 'video'
      : media.length === 1
      ? media[0].mediaType
      : 'carousel';
  const [showMore, setShowMore] = useState<boolean>(false);
  const [descriptionWidth, setDescriptionWidth] = useState<number>(0);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [hideMenu, setHideMenu] = useState<boolean>(true);
  const [like, setLike] = useState<{ value: boolean; obj: any; count: number }>(
    {
      value: Boolean(userLike),
      obj: userLike,
      count: likesCount,
    }
  );
  const [isFollowing, setIsFollowing] = useState<any>(user.isFollowing);
  const [follow, setFollow] = useState<any>(Boolean(user.isFollowing));
  const [excludeValue, setExcludeValue] = useState<any>(false);
  const [save, setSave] = useState<{ value: any; count: number }>({
    value: userBookmark,
    count: bookmarksCount,
  });
  const [shareMedia, setShareMedia] = useState<boolean>(false);
  const [viewComment, setViewComment] = useState<boolean>(false);
  const [hideMore, setHideMore] = useState<boolean>(false);
  const [hideData, setHideData] = useState<boolean>(false);
  const { activeVideo, setActiveVideo } = useContext(ContentContext);
  const [followList, setFollowList] = useState<Set<string>>(new Set());
  const [followersList, setFollowersList] = useState<any[]>(
    collaborators
      .map((user: any) => user.isFollowing)
      .filter((data: any) => data)
  );
  const { setUser, user: authUser } = useContext(AuthContext);
  const [loading, setLoading] = useState({ like: false, save: false });
  const [comments, setComments] = useState<{
    totalCount: number;
    value: any[] | 'error';
  }>({ totalCount: commentsCount, value: null! });
  const [shares, setShares] = useState<number>(sharesCount);
  const [viewed, setViewed] = useState(false);
  const [muted, setMuted] = useState(false);

  const descriptionRef = useRef<HTMLDivElement>(null!);
  const contentRef = useRef<HTMLDivElement>(null!);
  const menuRef = useRef<HTMLDivElement>(null!);
  const listRef = useRef<HTMLUListElement>(null!);
  const reelMenuRef = useRef<HTMLDivElement>(null!);

  useEffect(() => setShares(sharesCount), [sharesCount]);

  useEffect(() => {
    setIsFollowing(user.isFollowing);
    setFollow(Boolean(user.isFollowing));
  }, [user]);

  useEffect(() => {
    setLike({
      value: Boolean(userLike),
      obj: userLike,
      count: likesCount,
    });
  }, [likesCount, userLike]);

  useEffect(() => {
    setSave({ count: bookmarksCount, value: userBookmark });
  }, [userBookmark, bookmarksCount]);

  useEffect(() => {
    setComments({ totalCount: commentsCount, value: null! });
  }, [commentsCount]);

  useEffect(() => {
    setFollowersList(
      collaborators
        .map((user: any) => user.isFollowing)
        .filter((data: any) => data)
    );
  }, [collaborators]);

  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.innerHTML = description!;

      if (descriptionRef.current.scrollHeight <= 42) {
        setHideMore(true);
      }
    }
  }, [descriptionWidth]);

  useEffect(() => {
    const clickHandler = (e: Event) => {
      if (e.target) {
        if (showMenu) {
          if (contentType === 'reels') {
            if (!reelMenuRef.current.contains(e.target as Node))
              setShowMenu(false);
          } else {
            if (!menuRef.current.contains(e.target as Node)) setShowMenu(false);
          }
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
            duration: 100,
          }
        );
      } else {
        animation = listRef.current.animate(
          {
            height: [`${listRef.current.scrollHeight}px`, '0px'],
          },
          {
            fill: 'both',
            duration: 100,
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

  const handleDescription = () => {
    descriptionRef.current.animate(
      {
        maxHeight: ['50px', `${descriptionRef.current.scrollHeight}px`],
      },
      {
        fill: 'both',
        duration: 200,
      }
    );

    setShowMore(true);
  };

  const getFollowText = (id: string) => {
    const user = followersList.find((data) => data.following === id);
    return user ? 'Unfollow' : 'Follow';
  };

  const handleFollow = async (
    e: React.MouseEvent<HTMLSpanElement, MouseEvent>,
    id: string
  ) => {
    e.preventDefault();

    const action = getFollowText(id);
    const newList = new Set(followList);
    newList.add(id);
    setFollowList(newList);

    try {
      if (action === 'Follow') {
        const { data } = await apiClient.post(`v1/follow/${id}`, {
          collection: contentType === 'reels' ? 'reel' : 'content',
          documentId: contentId,
        });
        const follow = data.data.follow;

        setFollowersList((prevValue) => [...prevValue, follow]);
      } else {
        const followId = followersList.find(
          (data) => data.following === id
        )._id;
        await apiClient.delete(`v1/follow/${followId}`);

        setFollowersList((prevValue) =>
          prevValue.filter((follow) => follow._id !== followId)
        );
      }
    } catch (err: any) {
      if (!err.response) {
        toast.error(
          `Could not ${action.toLowerCase()} user. Please Try again.`
        );
      } else {
        toast.error(err.response.data.message);
      }
    } finally {
      newList.delete(id);
      setFollowList(new Set(newList));
    }
  };

  const getNames = () => {
    if (collaborators.length === 1) {
      const secondUser = collaborators[0];

      return (
        <>
          <span className={styles.collaborators}>
            <a className={styles['user-link']} href={`/@${user.username}`}>
              {user.username}
            </a>
          </span>{' '}
          &nbsp;and &nbsp;
          <span className={styles.collaborators}>
            <a
              className={styles['user-link']}
              href={`/@${secondUser.username}`}
            >
              {secondUser.username}
            </a>
          </span>
        </>
      );
    } else {
      return (
        <>
          <span className={styles.collaborators}>
            <a className={styles['user-link']} href={`/@${user.username}`}>
              {user.username}
            </a>
          </span>{' '}
          &nbsp;and &nbsp;
          <div className={styles.collaborators}>
            {collaborators.length} others
            <ul className={styles['collaborators-list']}>
              {collaborators.map((user: any) => (
                <li key={user._id} className={styles['collaborators-item']}>
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
                          user._id === authUser._id ? styles['auth-user'] : ''
                        }`}
                      >
                        {user._id === authUser._id ? 'You' : user.name}
                      </span>
                      <span className={styles['collaborators-username']}>
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
          </div>
        </>
      );
    }
  };

  const handleUserFollow = async () => {
    setShowMenu(false);
    setFollow(!follow);

    if (Boolean(isFollowing) !== follow) return;

    try {
      if (!isFollowing) {
        const { data } = await apiClient.post(`v1/follow/${user._id}`, {
          collection: contentType === 'reels' ? 'reel' : 'content',
          documentId: contentId,
        });
        const follow = data.data.follow;

        setIsFollowing(follow);
      } else {
        await apiClient.delete(`v1/follow/${isFollowing._id}`);
        setIsFollowing(null);
      }
    } catch (err: any) {
      setFollow(!follow);

      if (!err.response) {
        toast.error(
          `Could not ${
            isFollowing ? 'unfollow' : 'follow'
          } user. Please Try again.`
        );
      } else {
        toast.error(err.response.data.message);
      }
    }
  };

  const excludeContent = async () => {
    setShowMenu(false);
    if (excludeValue) return;

    setExcludeValue(true);

    try {
      const request =
        contentType === 'reels'
          ? apiClient.patch(`v1/reels/not-interested/${contentId}`)
          : apiClient.patch(`v1/contents/not-interested/${user._id}`);

      const { data } = await request;

      setUser(data.data.user);

      setContents((prevValue) =>
        prevValue.filter((content) => content._id !== contentId)
      );

      toast.success(`We'll show you fewer posts like this.`);
    } catch (err: any) {
      setExcludeValue(false);

      if (!err.response) {
        toast.error(`Could not complete action. Please Try again.`);
      } else {
        toast.error(err.response.data.message);
      }
    }
  };

  const handleLike = async () => {
    setLoading({ ...loading, like: true });

    const collection = contentType === 'reels' ? 'reel' : 'content';

    try {
      if (!like.value) {
        const { data } = await apiClient.post('v1/likes', {
          collection,
          documentId: contentId,
        });

        setLike({ value: true, count: like.count + 1, obj: data.data.like });
      } else {
        await apiClient.delete(
          `v1/likes/content/${contentId}?id=${like.obj._id}`
        );
        setLike({ value: false, count: like.count - 1, obj: null });
      }
    } catch {
      toast.error(
        `Could not ${
          like.value ? 'remove like' : `like ${collection}`
        }. Please Try again.`
      );
    } finally {
      setLoading({ ...loading, like: false });
    }
  };

  const handleSave = async () => {
    setLoading({ ...loading, save: true });

    const collection = contentType === 'reels' ? 'reel' : 'content';

    try {
      if (!save.value) {
        const { data } = await apiClient.post('v1/bookmarks', {
          collection,
          documentId: contentId,
        });

        setSave({ value: data.data.saveObj, count: save.count + 1 });
      } else {
        await apiClient.delete(`v1/bookmarks/${save.value._id}`);
        setSave({ value: null, count: save.count - 1 });
      }
    } catch {
      toast.error(
        `Could not ${
          save.value ? `remove ${collection} from saved` : `save ${collection}`
        }. Please Try again.`
      );
    } finally {
      setLoading({ ...loading, save: false });
    }
  };

  const handleView = async () => {
    if (viewed) return;

    // await apiClient.post('v1/views', {
    //   collection: contentType === 'reels' ? 'reel' : 'content',
    //   documentId: contentId,
    // });

    setViewed(true);
  };

  const muteReel = () => {
    if (contentRef.current) {
      const video = contentRef.current.querySelector('video');
      if (video) setMuted(!muted);
    }
  };

  const handlePinnedReels = (action: 'add' | 'delete') => {
    if (!Array.isArray(pinnedReels)) {
      return toast.error('Please reload your pinned reels and try again.');
    }

    const storedReels =
      window.localStorage.getItem('pinnedReels') || JSON.stringify([]);

    let reels;
    try {
      reels = JSON.parse(storedReels);
    } catch {
      reels = [];
    }

    if (!(reels instanceof Array) || reels.length > 5) reels = [];

    let reel: any;

    if (reels.length > 0) {
      reel = reels.find((obj: any) => obj._id === contentId);
    }

    if (action === 'delete') {
      if (reel) {
        reels = reels.filter((obj) => obj._id !== contentId);
        if (setPinnedReels)
          setPinnedReels((prev) =>
            (prev as any[]).filter((obj) => obj._id !== contentId)
          );
      }

      toast.success('Video removed from pinned reels.');
    } else {
      if (reel) {
        return toast.error('This reel is already pinned.');
      } else {
        if (reels.length >= 5) {
          return toast.error('You can only pin five reels.');
        }

        const obj = {
          _id: contentId,
          src: data.src,
          time: new Date(),
        };

        reels.push(obj);

        if (setPinnedReels)
          setPinnedReels((prev) => [
            ...(prev || []),
            {
              _id: contentId,
              src: data.src,
              time: new Date(),
              username: user.username,
              photo: user.photo,
              hasStory,
              hasUnviewedStory,
            },
          ]);

        toast.success('Video added to pinned reels.');
      }
    }

    localStorage.setItem('pinnedReels', JSON.stringify(reels));
  };

  const isReelPinned = () => {
    if (!Array.isArray(pinnedReels) || pinnedReels.length === 0) return false;

    const reel = pinnedReels.find((obj) => obj._id === contentId);

    return !!reel;
  };

  return (
    <LikeContext.Provider
      value={{
        like,
        setLike,
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
      }}
    >
      {shareMedia && (
        <ShareMedia
          setShareMedia={setShareMedia}
          activeVideo={activeVideo}
          post={data}
          postType={contentType === 'reels' ? 'reel' : 'content'}
          setShares={setShares}
        />
      )}

      {viewComment && (
        <CommentBox
          setViewComment={setViewComment}
          data={{
            postId: contentId,
            user,
            aspectRatio,
            type,
            media:
              contentType === 'reels'
                ? src
                : media.length === 1
                ? media[0].src
                : media,
          }}
          isFollowing={isFollowing}
          save={save}
          setSave={setSave}
          setShareMedia={setShareMedia}
          reels={contentType === 'reels'}
          description={description}
          engagementObj={{
            handleUserFollow,
            excludeContent,
            loading,
            handleLike,
            getEngagementValue,
            commentsCount,
            comments,
            setComments,
            hasStory,
            hasUnviewedStory,
            collaborators,
            handleSave,
            shares,
          }}
        />
      )}

      <article
        className={`${styles.content} ${
          contentType === 'reels' ? styles['reels-content'] : ''
        }`}
        ref={contentRef}
      >
        {contentType !== 'reels' && (
          <h1 className={styles['content-head']}>
            <span className={styles['content-head-box']}>
              {collaborators.length === 0 ? (
                <span className={styles['content-name-box']}>
                  <a
                    className={styles['user-link']}
                    href={`/@${user.username}`}
                  >
                    <span className={styles['content-nickname']}>
                      {user.name}
                    </span>
                    <span className={styles['content-username']}>
                      @{user.username}
                    </span>
                  </a>
                </span>
              ) : (
                <span className={styles['content-name-box2']}>
                  {getNames()}
                </span>
              )}
              <BsDot className={styles.dot} />
              <span className={styles['content-time']}>
                {getTime(createdAt)}
              </span>
            </span>

            <div className={styles['menu-div']} ref={menuRef}>
              <HiOutlineDotsHorizontal
                className={`${styles['content-menu']} ${
                  showMenu ? styles['active-menu'] : ''
                }`}
                onClick={() => {
                  setShowMenu(!showMenu);
                  setHideMenu(false);
                }}
              />

              <HiOutlineDotsVertical
                className={`${styles['content-menu2']} ${
                  showMenu ? styles['active-menu'] : ''
                }`}
                onClick={() => setShowMobileMenu && setShowMobileMenu(true)}
              />

              {!hideMenu && (
                <ul className={styles['menu-list']} ref={listRef}>
                  <li
                    className={`${styles['menu-item']} ${styles['menu-red']}`}
                    onClick={handleUserFollow}
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </li>
                  <li
                    className={`${styles['menu-item']} ${styles['menu-red']}`}
                    onClick={() => {
                      setShowMenu(false);
                      toast.success(
                        'Thanks for reporting. We’ll review and take action if necessary.'
                      );
                    }}
                  >
                    Report
                  </li>
                  <li className={styles['menu-item']} onClick={excludeContent}>
                    Not interested
                  </li>
                  {/* <li className={styles['menu-item']}>Add to story</li> */}
                  <li
                    className={styles['menu-item']}
                    onClick={() => {
                      setHideData(true);
                      setShowMenu(false);
                    }}
                  >
                    Clear display
                  </li>
                </ul>
              )}
            </div>
          </h1>
        )}

        <div
          className={`${styles['content-box']} ${
            contentType === 'reels' ? styles['reels-content-box'] : ''
          }`}
        >
          <div className={styles['carousel-container']}>
            {type === 'carousel' ? (
              <Carousel
                data={media}
                aspectRatio={aspectRatio}
                setDescriptionWidth={setDescriptionWidth}
                hideData={hideData}
                setHideData={setHideData}
                type="content"
                viewObj={{ viewed, setViewed, handleView }}
              />
            ) : (
              <ContentItem
                item={{
                  src: contentType === 'reels' ? data.src : media[0].src,
                  type,
                  name: user.name,
                  description:
                    contentType === 'reels'
                      ? description
                      : media[0].description,
                  contentType: contentType === 'reels' ? 'reels' : 'single',
                  createdAt,
                  hasSound,
                }}
                aspectRatio={aspectRatio}
                setDescriptionWidth={setDescriptionWidth}
                hideData={hideData}
                setHideData={setHideData}
                viewObj={{ viewed, setViewed, handleView }}
              />
            )}

            {contentType === 'reels' && (
              <div className={styles['reel-menu-div']} ref={menuRef}>
                {!hideMenu && (
                  <ul
                    className={`${styles['menu-list']} ${
                      contentType === 'reels' ? styles['reel-menu-list'] : ''
                    }`}
                    ref={listRef}
                  >
                    <li
                      className={`${styles['menu-item']} ${styles['menu-red']}`}
                      onClick={handleUserFollow}
                    >
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </li>
                    <li
                      className={`${styles['menu-item']} ${styles['menu-red']}`}
                      onClick={() => {
                        setShowMenu(false);
                        toast.success(
                          'Thanks for reporting. We’ll review and take action if necessary.'
                        );
                      }}
                    >
                      Report
                    </li>
                    <li className={styles['menu-item']} onClick={muteReel}>
                      {muted ? 'Unmute' : 'Mute'}
                    </li>
                    <li
                      className={styles['menu-item']}
                      onClick={() =>
                        handlePinnedReels(isReelPinned() ? 'delete' : 'add')
                      }
                    >
                      {isReelPinned() ? 'Unpin' : 'Pin'}
                    </li>
                    <li
                      className={styles['menu-item']}
                      onClick={excludeContent}
                    >
                      Not interested
                    </li>
                    {/* <li className={styles['menu-item']}>Add to story</li> */}
                    <li
                      className={styles['menu-item']}
                      onClick={() => {
                        setHideData(true);
                        setShowMenu(false);
                      }}
                    >
                      Clear display
                    </li>
                  </ul>
                )}
              </div>
            )}
          </div>

          <div
            className={`${styles['menu-container']} ${
              contentType === 'reels' && !hideData
                ? styles['reels-menu-container']
                : ''
            }`}
          >
            <div
              className={`${styles['profile-img-box']} ${
                contentType === 'reels' ? styles['hide-profile-box'] : ''
              }`}
            >
              <span
                className={`${styles['profile-img-span']} ${
                  hasStory && hasUnviewedStory
                    ? styles['profile-img-span3']
                    : hasStory
                    ? styles['profile-img-span2']
                    : ''
                }`}
              >
                <img
                  src={getUrl(user.photo, 'users')}
                  className={styles['profile-img']}
                />
              </span>

              {contentType !== 'following' ? (
                follow ? (
                  <span
                    className={styles['profile-icon-box2']}
                    title="Unfollow"
                    onClick={handleUserFollow}
                  >
                    <PiCheckFatFill className={styles['profile-icon2']} />{' '}
                  </span>
                ) : (
                  <span
                    className={styles['profile-icon-box']}
                    title="Follow"
                    onClick={handleUserFollow}
                  >
                    <HiPlus className={styles['profile-icon']} />
                  </span>
                )
              ) : (
                ''
              )}
            </div>

            <div className={styles['menu-box']}>
              <span
                className={`${styles['menu-icon-box']} ${
                  loading.like ? styles['menu-icon-box2'] : ''
                }`}
                title="Like"
                onClick={handleLike}
              >
                <IoMdHeart
                  className={`${styles['menu-icon']} ${styles['like-icon']} ${
                    like.value ? styles['red-icon'] : ''
                  } ${loading.like ? styles['like-skeleton'] : ''}`}
                />
              </span>

              <span className={styles['menu-text']}>
                {getEngagementValue(like.count)}
              </span>
            </div>

            <div className={styles['menu-box']}>
              <span
                className={styles['menu-icon-box']}
                title="Comment"
                onClick={() => {
                  activeVideo?.pause();
                  setActiveVideo(null);
                  setViewComment(true);
                }}
              >
                <FaCommentDots className={styles['menu-icon']} />
              </span>
              <span className={styles['menu-text']}>
                {getEngagementValue(comments.totalCount)}
              </span>
            </div>

            <div className={styles['menu-box']}>
              <span
                className={`${styles['menu-icon-box']} ${
                  loading.save ? styles['menu-icon-box2'] : ''
                }`}
                title="Save"
                onClick={handleSave}
              >
                <IoBookmark
                  className={`${styles['menu-icon']} ${
                    save.value ? styles['saved-icon'] : ''
                  } ${loading.save ? styles['save-skeleton'] : ''}`}
                />
              </span>
              <span className={styles['menu-text']}>
                {getEngagementValue(save.count)}
              </span>
            </div>

            <div className={styles['menu-box']}>
              <span
                className={styles['menu-icon-box']}
                title="Share"
                onClick={() => {
                  activeVideo?.pause();
                  setShareMedia(true);
                }}
              >
                <FaShare className={styles['menu-icon']} />
              </span>
              <span className={styles['menu-text']}>
                {getEngagementValue(shares)}
              </span>
            </div>

            <HiOutlineDotsHorizontal
              className={`${styles['reel-content-menu']} ${
                showMenu ? styles['active-menu'] : ''
              }`}
              onClick={() => setShowMobileMenu && setShowMobileMenu(true)}
            />
          </div>

          {contentType !== 'reels' && (
            <div className={styles['small-menu-container']}>
              <span className={styles['small-details-box']}>
                <IoMdHeart
                  className={`${styles['small-details-icon']} ${
                    like ? styles['red-icon'] : ''
                  }`}
                  title="Like"
                />

                <span className={styles['small-details-value']}>21K</span>
              </span>

              <span
                className={styles['small-details-box']}
                onClick={() => {
                  activeVideo?.pause();
                  setActiveVideo(null);
                  setViewComment(true);
                }}
              >
                <FaCommentDots className={styles['small-details-icon']} />

                <span className={styles['small-details-value']}>2345</span>
              </span>

              <span
                className={styles['small-details-box']}
                onClick={handleSave}
              >
                <IoBookmark
                  className={`${styles['small-details-icon']} ${
                    save.value ? styles['saved-icon'] : ''
                  }`}
                />

                <span className={styles['small-details-value']}>954</span>
              </span>

              <span
                className={styles['small-details-box']}
                onClick={() => {
                  activeVideo?.pause();
                  setShareMedia(true);
                }}
              >
                <FaShare className={styles['small-details-icon']} />

                <span className={styles['small-details-value']}>217</span>
              </span>
            </div>
          )}
        </div>

        {contentType !== 'reels' && description && (
          <>
            <div
              className={`${styles['content-description']} ${
                description !== '' ? styles['non-empty-desc'] : ''
              } ${
                !hideMore && !showMore ? styles['content-description2'] : ''
              } ${showMore ? styles['show-more'] : ''}`}
              style={{ width: `${descriptionWidth}px` }}
              ref={descriptionRef}
            ></div>

            {!hideMore && !showMore && (
              <div className={styles['more-text']} onClick={handleDescription}>
                show more
              </div>
            )}
          </>
        )}

        {contentType !== 'reels' && description === '' && (
          <div className={styles['empty-disc']}></div>
        )}
      </article>
    </LikeContext.Provider>
  );
};

export default ContentBox;
