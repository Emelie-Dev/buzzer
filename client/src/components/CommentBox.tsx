import ReactDOM from 'react-dom';
import React, { useContext, useEffect, useRef, useState } from 'react';
import styles from '../styles/CommentBox.module.css';
import CarouselItem from './CarouselItem';
import { HiOutlineDotsHorizontal } from 'react-icons/hi';
import { FaCommentDots, FaShare } from 'react-icons/fa';
import { IoBookmark } from 'react-icons/io5';
import CommentContent from './CommentContent';
import { PiCheckFatFill } from 'react-icons/pi';
import { IoReloadOutline } from 'react-icons/io5';
import { IoClose } from 'react-icons/io5';
import { FaArrowUp } from 'react-icons/fa';
import Carousel from './Carousel';
import { ContentContext, LikeContext } from '../Contexts';
import { apiClient, getUrl } from '../Utilities';
import { toast } from 'sonner';
import { IoMdHeart } from 'react-icons/io';
import LoadingAnimation from './LoadingAnimation';
import { CommentData } from './ContentBox';

type CommentBoxProps = {
  data: CommentData;
  setViewComment: React.Dispatch<React.SetStateAction<boolean>>;
  isFollowing: boolean;
  saved: boolean;
  setSaved: React.Dispatch<React.SetStateAction<boolean>>;
  setShareMedia: React.Dispatch<React.SetStateAction<boolean>>;
  reels?: boolean;
  description?: string;
  engagementObj: any;
};

const followers = [
  {
    id: 1,
    name: 'Alice Johnson',
    userhandle: 'alicejohnson2024',
    isFollowing: true,
  },
  {
    id: 2,
    name: 'Bob Smith',
    userhandle: 'bob_smith_official',
    isFollowing: false,
  },
  { id: 3, name: 'Charlie Davis', userhandle: 'charlied', isFollowing: true },
  {
    id: 4,
    name: 'Diana Garcia',
    userhandle: 'dianagarcia123',
    isFollowing: false,
  },
  {
    id: 5,
    name: 'Ethan Brown',
    userhandle: 'ethanbrown_live',
    isFollowing: true,
  },
];

const CommentBox = ({
  data,
  setViewComment,
  isFollowing,
  saved,
  reels,
  description,
  setSaved,
  setShareMedia,
  engagementObj,
}: CommentBoxProps) => {
  const { postId, media, user, aspectRatio, type } = data;
  const { username, name, photo } = user;
  const {
    handleUserFollow,
    excludeContent,
    loading,
    handleLike,
    getEngagementValue,
    comments,
    setComments,
    hasStory,
    hasUnviewedStory,
    collaborators,
  } = engagementObj;
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [hideMenu, setHideMenu] = useState<boolean>(true);
  const [newComment, setNewComment] = useState<string>('');
  const [showList, setShowList] = useState<boolean>(false);
  const [savedRange, setSavedRange] = useState<Range>();
  const [tagList, setTagList] = useState<number[]>([]);
  const [searching, setSearching] = useState<boolean | 'done'>(false);
  const [newTag, setNewTag] = useState<boolean>(false);
  const [scrollHeight, setScrollHeight] = useState<number>(0);
  const [hideData, setHideData] = useState<boolean>(false);
  const { setActiveVideo } = useContext(ContentContext);
  const { like } = useContext(LikeContext);
  const [cursor, setCursor] = useState<string>(null!);
  const [loadingComments, setLoadingComments] = useState({
    value: false,
    end: false,
  });

  const menuRef = useRef<HTMLDivElement>(null!);
  const listRef = useRef<HTMLUListElement>(null!);
  const textRef = useRef<HTMLDivElement>(null!);
  const followersRef = useRef<HTMLUListElement>(null!);
  const tagRef = useRef<HTMLDivElement>(null!);
  const commentRef = useRef<HTMLDivElement>(null!);

  const target = document.getElementById('comment-portal') || document.body;

  const getComments = async () => {
    if (cursor) {
      setLoadingComments({ ...loadingComments, value: true });
    } else {
      setComments((prevValue: any) => ({ ...prevValue, value: null }));
    }

    try {
      const { data } = await apiClient(
        `v1/comments?collection=${
          reels ? 'reel' : 'content'
        }&documentId=${postId}&cursor=${cursor}`
      );

      const commentsArr = data.data.comments;

      setComments((prevValue: any) => ({
        totalCount: data.data.totalCount,
        value: cursor ? [...prevValue.value, ...commentsArr] : commentsArr,
      }));

      setCursor(data.data.nextCursor ? data.data.nextCursor : cursor);

      setLoadingComments({ value: false, end: commentsArr.length < 20 });
    } catch {
      setComments((prevValue: any) => ({ ...prevValue, value: 'error' }));
      setLoadingComments({ ...loadingComments, value: false });
    }
  };

  useEffect(() => {
    getComments();
  }, []);

  useEffect(() => {
    const container = commentRef.current;

    if (
      comments.value !== null &&
      container &&
      container.scrollHeight <= container.clientHeight &&
      !loadingComments.end
    ) {
      getComments();
    }
  }, [comments]);

  useEffect(() => {
    const clickHandler = (e: Event) => {
      if (showList) {
        if (
          e.target !== tagRef.current &&
          e.target !== followersRef.current &&
          !followersRef.current.contains(e.target as Node)
        ) {
          setShowList(false);
        }
      }
    };

    window.removeEventListener('click', clickHandler);

    window.addEventListener('click', clickHandler);

    return () => {
      window.removeEventListener('click', clickHandler);
    };
  }, [showList]);

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

    window.removeEventListener('click', clickHandler);

    window.addEventListener('click', clickHandler);

    return () => {
      window.removeEventListener('click', clickHandler);
    };
  }, [showMenu]);

  useEffect(() => {
    const set = new Set(tagList);

    followers.forEach((user) => {
      if (tagList.includes(user.id)) {
        const isPresent = [
          ...textRef.current.querySelectorAll('.app-user-tags'),
        ].find((elem) => elem.getAttribute('data-tag-index') === `${user.id}`);

        if (!isPresent) set.delete(user.id);
      }
    });

    setTagList([...set]);

    let timeout: number | NodeJS.Timeout;

    if (searching === true) {
      timeout = setTimeout(() => {
        setSearching('done');
      }, 1000);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [newComment]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setActiveVideo(null);
      setViewComment(false);
    }
  };

  const handleCommentHeight = () => {
    setNewComment(textRef.current.textContent || '');

    if (newTag) setSearching(true);
    else setShowList(false);

    textRef.current.style.height = 'auto';
    textRef.current.style.height = `${textRef.current.scrollHeight}px`;
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection) {
      if (selection.rangeCount > 0) {
        setSavedRange(selection.getRangeAt(0));
      }
    }
  };

  const updateTagList = (handle: string, id: number) => () => {
    textRef.current.focus();

    if (!tagList.includes(id)) {
      if (savedRange) {
        const selection = window.getSelection();
        if (selection) {
          const tags = document.querySelectorAll('.app-tag');

          selection.removeAllRanges();
          selection.addRange(savedRange); // Restore the saved range

          // Insert text at the cursor position
          savedRange.deleteContents(); // Remove any selected content
          const textNode = document.createElement('span');
          textNode.setAttribute('class', 'app-user-tags');
          textNode.setAttribute('data-tag-index', `${id}`);

          textNode.innerHTML = ` @${handle} `;
          textNode.setAttribute('contentEditable', 'false');

          if (tags[tags.length - 1])
            textRef.current.removeChild(tags[tags.length - 1]);

          setNewComment((prev) => `${prev} @${handle} `);
          savedRange.insertNode(textNode);
          savedRange.detach();

          setNewTag(false);

          textRef.current.style.height = 'auto';
          textRef.current.style.height = `${textRef.current.scrollHeight}px`;

          // Move the cursor after the inserted text
          savedRange.setStartAfter(textNode);
          savedRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(savedRange);
        }
      }

      setTagList([...tagList, id]);
    } else {
      const follower = [
        ...textRef.current.querySelectorAll('.app-user-tags'),
      ].find((elem) => elem.getAttribute('data-tag-index') === `${id}`);

      if (follower) textRef.current.removeChild(follower);

      const set = new Set(tagList);
      set.delete(id);

      setTagList([...set]);
    }
  };

  const addTag = () => {
    textRef.current.focus();

    if (savedRange) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRange); // Restore the saved range

        // Insert text at the cursor position
        savedRange.deleteContents(); // Remove any selected content
        const textNode = document.createElement('span');
        textNode.setAttribute('class', 'app-tag');
        textNode.innerHTML = ` @`;
        setNewComment((prev) => `${prev} @`);
        setNewTag(true);

        savedRange.insertNode(textNode);
        savedRange.detach();

        textRef.current.style.height = 'auto';
        textRef.current.style.height = `${textRef.current.scrollHeight}px`;

        // Move the cursor after the inserted text
        savedRange.setStartAfter(textNode);
        savedRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(savedRange);
      }
    }

    setShowList(true);
  };

  const addToTagList = (handle: string) => () => {
    textRef.current.focus();

    if (savedRange) {
      const selection = window.getSelection();
      if (selection) {
        const tags = document.querySelectorAll('.app-tag');

        selection.removeAllRanges();
        selection.addRange(savedRange); // Restore the saved range

        // Insert text at the cursor position
        savedRange.deleteContents(); // Remove any selected content
        const textNode = document.createElement('span');
        textNode.setAttribute('class', 'app-user-tags');

        textNode.innerHTML = ` @${handle} `;
        textNode.setAttribute('contentEditable', 'false');

        if (tags[tags.length - 1])
          textRef.current.removeChild(tags[tags.length - 1]);

        setNewComment((prev) => `${prev} @${handle} `);
        savedRange.insertNode(textNode);
        savedRange.detach();

        setNewTag(false);
        setShowList(false);
        setSearching(false);

        textRef.current.style.height = 'auto';
        textRef.current.style.height = `${textRef.current.scrollHeight}px`;

        // Move the cursor after the inserted text
        savedRange.setStartAfter(textNode);
        savedRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(savedRange);
      }
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollHeight(target.scrollTop);
    setShowMenu(false);

    const isBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 50;

    if (isBottom && !loadingComments.end) getComments();
  };

  return ReactDOM.createPortal(
    <section className={styles.section} onClick={handleClick}>
      <span
        className={styles['close-icon-box']}
        title="Close"
        onClick={() => {
          setActiveVideo(null);
          setViewComment(false);
        }}
      >
        <IoClose className={styles['close-icon']} />
      </span>

      <div
        className={styles.container}
        onClick={(e) => {
          if (window.matchMedia('(max-width: 800px)').matches) handleClick(e);
        }}
      >
        <div className={styles['carousel-container']}>
          {type === 'carousel' ? (
            <Carousel
              data={media}
              aspectRatio={aspectRatio}
              type="comment"
              hideData={hideData}
              setHideData={setHideData}
            />
          ) : (
            <CarouselItem
              item={{ src: media, type }}
              aspectRatio={aspectRatio}
              hideData={hideData}
              setHideData={setHideData}
              contentIndex={0}
              itemIndex={0}
              viewType="comment"
              contentType={reels ? 'reels' : 'single'}
              description={description}
            />
          )}
        </div>

        <div
          className={styles['comment-container']}
          ref={commentRef}
          onScroll={handleScroll}
        >
          <div className={styles['comment-header']}>
            <div className={styles['comment-header-details']}>
              <a className={styles['user-link']} href={`/@${username}`}>
                <span
                  className={`${styles['profile-img-box']} ${
                    hasStory && hasUnviewedStory
                      ? styles['profile-img-box3']
                      : hasStory
                      ? styles['profile-img-box2']
                      : ''
                  }`}
                >
                  <img
                    className={styles['profile-img']}
                    src={getUrl(photo, 'users')}
                  />
                </span>

                <span className={styles['name-box']}>
                  <span className={styles['name']}>{name}</span>
                  <span className={styles['username']}>@{username}</span>
                </span>
              </a>
            </div>

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

              {!hideMenu && (
                <ul className={styles['menu-list']} ref={listRef}>
                  <li
                    className={`${styles['menu-item']} ${styles['menu-red']}`}
                    onClick={() => {
                      setShowMenu(false);
                      handleUserFollow();
                    }}
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
                  <li
                    className={styles['menu-item']}
                    onClick={() => {
                      setShowMenu(false);
                      excludeContent();
                    }}
                  >
                    Not interested
                  </li>
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
          </div>

          <div className={styles['engage-div']}>
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
                onClick={() => textRef.current.focus()}
              >
                <FaCommentDots className={styles['menu-icon']} />
              </span>
              <span className={styles['menu-text']}>
                {getEngagementValue(comments.totalCount)}
              </span>
            </div>

            <div className={styles['menu-box']}>
              <span
                className={styles['menu-icon-box']}
                title="Save"
                onClick={() => setSaved(!saved)}
              >
                <IoBookmark
                  className={`${styles['menu-icon']} ${
                    saved ? styles['saved-icon'] : ''
                  }`}
                />
              </span>
              <span className={styles['menu-text']}>954</span>
            </div>

            <div className={`${styles['menu-box']} ${styles['share-box']}`}>
              <span
                className={styles['menu-icon-box']}
                onClick={() => setShareMedia(true)}
              >
                <FaShare className={styles['menu-icon']} />
              </span>
              <span className={styles['menu-text']}>217</span>
            </div>
          </div>

          <div
            className={`${styles['comment-div']} ${
              comments.value === null ||
              comments.value === 'error' ||
              comments.value.length === 0
                ? styles['loading-div']
                : ''
            }`}
          >
            <div className={styles['comments-head']}>
              Comments ({comments.totalCount})
            </div>

            {comments.value === null ? (
              <div className={styles['loader-box']}>
                <LoadingAnimation
                  style={{
                    width: '10rem',
                    height: '10rem',
                  }}
                />
              </div>
            ) : comments.value === 'error' ? (
              <div className={styles['empty-comments']}>
                Oops! We couldn't load the comments. Please click the button to
                retry.
                <button className={styles['retry-btn']} onClick={getComments}>
                  Retry
                </button>
              </div>
            ) : comments.value.length === 0 ? (
              <div className={styles['empty-comments']}>
                No comments for now — start the conversation!
              </div>
            ) : (
              comments.value.map((comment: any) => (
                <CommentContent
                  key={comment._id}
                  creator={{ user, hasStory, hasUnviewedStory }}
                  data={comment}
                  setComments={setComments}
                  collaborators={collaborators}
                />
              ))
            )}

            {loadingComments.value && (
              <div className={styles['loader-box2']}>
                <LoadingAnimation
                  style={{
                    width: '2rem',
                    height: '2rem',
                    transform: 'scale(2.5)',
                  }}
                />
              </div>
            )}

            {scrollHeight > 150 && (
              <span
                className={styles['scroll-up-box']}
                onClick={() => (commentRef.current.scrollTop = 0)}
              >
                <FaArrowUp className={styles['scroll-up-icon']} />
              </span>
            )}
          </div>

          <div className={styles['new-comment-div']}>
            <div className={styles['new-comment-box']}>
              <div
                className={styles['new-comment-text']}
                onInput={handleCommentHeight}
                ref={textRef}
                contentEditable={true}
                onKeyUp={saveSelection}
                onMouseUp={saveSelection}
              ></div>

              {newComment.trim().length === 0 && (
                <span
                  className={styles['comment-placeholder']}
                  contentEditable={false}
                >
                  Add Comment....
                </span>
              )}

              <div
                className={`${styles['new-comment-tags']} ${
                  showList ? styles['active-comment-tag'] : ''
                }`}
                ref={tagRef}
                onClick={addTag}
              >
                @
              </div>

              {showList && (
                <ul
                  className={styles['new-comment-tag-list']}
                  ref={followersRef}
                >
                  {searching === 'done' ? (
                    followers.map((user) => (
                      <li
                        key={user.id}
                        className={styles['followers-item2']}
                        onClick={addToTagList(user.userhandle)}
                      >
                        <span className={styles['followers-img-box']}>
                          <img
                            src="../../assets/images/users/user13.jpeg"
                            className={styles['followers-img']}
                          />
                          {user.isFollowing && (
                            <span className={styles['followers-icon-box']}>
                              <PiCheckFatFill
                                className={styles['followers-icon']}
                              />
                            </span>
                          )}
                        </span>

                        <span className={styles['followers-name-box']}>
                          <span className={styles['followers-name']}>
                            {user.name}
                          </span>
                          <span className={styles['followers-username']}>
                            {`@${user.userhandle}`}
                          </span>
                        </span>
                      </li>
                    ))
                  ) : searching ? (
                    <li className={styles['searchig-box']}>
                      <IoReloadOutline className={styles['searchig-icon']} />
                      Searching....
                    </li>
                  ) : (
                    followers.map((user) => (
                      <li key={user.id} className={styles['followers-item']}>
                        <span className={styles['followers-img-box']}>
                          <img
                            src="../../assets/images/users/user13.jpeg"
                            className={styles['followers-img']}
                          />
                          {user.isFollowing && (
                            <span className={styles['followers-icon-box']}>
                              <PiCheckFatFill
                                className={styles['followers-icon']}
                              />
                            </span>
                          )}
                        </span>

                        <span className={styles['followers-name-box']}>
                          <span className={styles['followers-name']}>
                            {user.name}
                          </span>
                          <span className={styles['followers-username']}>
                            {`@${user.userhandle}`}
                          </span>
                        </span>

                        <input
                          type="checkbox"
                          className={styles['radio-btn']}
                          onChange={updateTagList(user.userhandle, user.id)}
                          checked={tagList.includes(user.id)}
                        />
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>

            <span
              className={`${styles['new-comment-post']} ${
                newComment.trim().length > 0 ? styles['post-comment'] : ''
              }`}
            >
              Post
            </span>
          </div>
        </div>
      </div>
    </section>,
    target
  );
};

export default CommentBox;
