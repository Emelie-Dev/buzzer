import ReactDOM from 'react-dom';
import React, { useContext, useEffect, useRef, useState } from 'react';
import styles from '../styles/CommentBox.module.css';
import CarouselItem from './CarouselItem';
import { HiOutlineDotsHorizontal } from 'react-icons/hi';
import { FaCommentDots, FaShare } from 'react-icons/fa';
import { IoBookmark } from 'react-icons/io5';
import CommentContent from './CommentContent';
import { IoClose } from 'react-icons/io5';
import { FaArrowUp } from 'react-icons/fa';
import Carousel from './Carousel';
import { ContentContext, LikeContext } from '../Contexts';
import { apiClient, debounce, getUrl, sanitizeInput } from '../Utilities';
import { toast } from 'sonner';
import { IoMdHeart } from 'react-icons/io';
import LoadingAnimation from './LoadingAnimation';
import { CommentData } from './ContentBox';
import { BsDot } from 'react-icons/bs';

type CommentBoxProps = {
  data: CommentData;
  setViewComment: React.Dispatch<React.SetStateAction<boolean>>;
  isFollowing: boolean;
  save: {
    value: any;
    count: number;
  };
  setSave: React.Dispatch<
    React.SetStateAction<{
      value: any;
      count: number;
    }>
  >;
  setShareMedia: React.Dispatch<React.SetStateAction<boolean>>;
  reels?: boolean;
  description?: string;
  engagementObj: any;
};

const getUsers = async (...args: any[]) => {
  const [query, page, cursor] = args;
  try {
    const { data } = await apiClient(
      `v1/search/users?query=${query}&page=${page}&cursor=${cursor}`
    );

    return data.data.result;
  } catch {
    return 'error';
  }
};

const debouncedQuery = debounce(getUsers, 300);

const CommentBox = ({
  data,
  setViewComment,
  isFollowing,
  save,
  reels,
  description,
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
    handleSave,
    shares,
  } = engagementObj;
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showList, setShowList] = useState<boolean>(false);
  const [hideMenu, setHideMenu] = useState<boolean>(true);
  const [hideList, setHideList] = useState<boolean>(true);
  const [newComment, setNewComment] = useState<string>('');
  const [scrollHeight, setScrollHeight] = useState<number>(0);
  const [hideData, setHideData] = useState<boolean>(false);
  const { setActiveVideo } = useContext(ContentContext);
  const { like } = useContext(LikeContext);
  const [cursor, setCursor] = useState<string>(null!);
  const [loadingComments, setLoadingComments] = useState({
    value: false,
    end: false,
  });
  const [savedRange, setSavedRange] = useState<Range>();
  const [tagList, setTagList] = useState<Set<string>>(new Set());
  const [newTag, setNewTag] = useState<boolean>(false);
  const [searching, setSearching] = useState({ value: false, query: '' });
  const [tagResult, setTagResult] = useState<any[]>([]);
  const [tagData, setTagData] = useState({ page: 1, cursor: null, end: false });
  const [isEmpty, setIsEmpty] = useState({ post: true, div: true });
  const [posting, setPosting] = useState(false);
  const [reply, setReply] = useState<any>(undefined);
  const [seenSlides, setSeenSlides] = useState(new Set());
  const [viewed, setViewed] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null!);
  const listRef = useRef<HTMLUListElement>(null!);
  const textRef = useRef<HTMLDivElement>(null!);
  const commentRef = useRef<HTMLDivElement>(null!);
  const tagListRef = useRef<HTMLDivElement>(null!);
  const tagRef = useRef<HTMLDivElement>(null!);

  const target = document.getElementById('comment-portal') || document.body;

  const getComments = async () => {
    if (cursor) {
      setLoadingComments({ ...loadingComments, value: true });
    } else {
      setComments((prevValue: any) => ({ ...prevValue, value: null }));
    }

    try {
      const { data } = await apiClient.post(`v1/comments`, {
        collection: reels ? 'reel' : 'content',
        documentId: postId,
        cursor,
      });

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
      comments.value !== 'error' &&
      container &&
      container.scrollHeight <= container.clientHeight &&
      !loadingComments.end &&
      loadingComments.value === false
    ) {
      getComments();
    }
  }, [comments]);

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
    const clickHandler = (e: Event) => {
      if (e.target) {
        if (showList && !tagRef.current.contains(e.target as Node)) {
          setShowList(false);
          setNewTag(false);
          setSearching({ query: '', value: false });
        }
      }
    };

    if (!showList) {
      setNewTag(false);
      setSearching({ value: false, query: '' });
      setTagData({ page: 1, cursor: null, end: false });
    }

    let animation;

    if (tagListRef.current) {
      if (showList) {
        animation = tagListRef.current.animate(
          {
            height: ['0', `15rem`],
          },
          {
            fill: 'both',
            duration: 200,
          }
        );
      } else {
        animation = tagListRef.current.animate(
          {
            height: [`15rem`, '0'],
          },
          {
            fill: 'both',
            duration: 200,
          }
        );

        animation.onfinish = () => setHideList(true);
      }
    }

    window.removeEventListener('click', clickHandler);

    window.addEventListener('click', clickHandler);

    return () => {
      window.removeEventListener('click', clickHandler);
    };
  }, [showList]);

  useEffect(() => {
    const getMentions = async () => {
      if (searching.value) {
        const result = await debouncedQuery(
          searching.query,
          tagData.page,
          tagData.cursor
        );

        if (result === 'error') {
          setShowList(false);
        } else {
          const filteredResults = (result as []).filter(
            (obj: any) => !tagResult.find((data) => data._id === obj._id)
          );

          setSearching({ ...searching, value: false });
          setTagResult([...tagResult, ...filteredResults]);
          setTagData({ ...tagData, end: (result as []).length < 30 });
        }
      }
    };

    getMentions();
  }, [searching]);

  useEffect(() => {
    const users = Array.from(
      textRef.current.querySelectorAll('.app-user-tags')
    );

    const ids = users
      .map((user) => user.getAttribute('data-tag-index') || '')
      .filter((id) => id);

    setTagList(new Set(ids));

    const text = textRef.current.textContent;
    setIsEmpty({ post: text?.trim().length === 0, div: text?.length === 0 });
  }, [newComment]);

  useEffect(() => {
    textRef.current.innerHTML = '';
    textRef.current.focus();
    setNewComment('');
    setShowList(false);
    setTagList(new Set());
  }, [reply]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setActiveVideo(null);
      setViewComment(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollHeight(target.scrollTop);
    setShowMenu(false);

    const isBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 50;

    if (isBottom && !loadingComments.end && loadingComments.value === false)
      getComments();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const pasted = e.clipboardData.getData('text/plain');

    // Detect line breaks
    const hasLineBreaks = /[\r\n]/.test(pasted);
    if (hasLineBreaks) return;

    if (pasted === '@') {
      e.preventDefault();
      return addTag();
    }

    setSearching({
      ...searching,
      query: `${searching.query}${pasted || ''}`,
    });
  };

  const handleBeforeInput = (e: React.FormEvent<HTMLDivElement>) => {
    const data = (e as any).data;
    if (typeof data !== 'string') e.preventDefault();

    if (data === '@') {
      e.preventDefault();
      return addTag();
    }
  };

  const handleCommentInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const event = e.nativeEvent as InputEvent;

    if (!event.inputType.includes('delete')) {
      const formatted = sanitizeInput(newComment);

      const div = document.createElement('div');
      div.innerHTML = formatted;

      if ((div.textContent || '').length >= 2000) {
        textRef.current.innerHTML = newComment;

        const selection = window.getSelection();
        const range = savedRange ? savedRange : selection!.getRangeAt(0);

        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);

          range.deleteContents();
          range.setStartAfter(textRef.current);
        }

        return toast.info(`Comment can’t exceed 2000 characters.`);
      }
    }

    setNewComment(target.innerHTML || '');

    if (newTag) {
      if (
        event.data === null &&
        event.inputType.includes('delete') &&
        !searching.query
      ) {
        setShowList(false);
      } else {
        setTagResult([]);
        setTagData({ page: 1, cursor: null, end: false });

        if (event.inputType.includes('delete')) {
          setSearching({
            value: true,
            query: String(
              savedRange?.commonAncestorContainer.textContent?.replace('@', '')
            ),
          });
        } else {
          setSearching({
            value: true,
            query: `${searching.query}${event.data || ''}`,
          });
        }
      }
    } else {
      if (event.data !== ' ') setShowList(false);
    }

    textRef.current.style.height = 'auto';
    textRef.current.style.height = `${textRef.current.scrollHeight}px`;

    if (tagListRef.current) {
      tagListRef.current.style.bottom = `${
        Math.max(30, textRef.current.offsetHeight) + 20
      }px`;
    }
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection) {
      if (selection.rangeCount > 0) {
        setSavedRange(selection.getRangeAt(0));
      }
    }
  };

  const addTag = () => {
    textRef.current.focus();

    if (comments.value === null || comments.value === 'error') return;

    const selection = window.getSelection();
    const range = savedRange ? savedRange : selection!.getRangeAt(0);

    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range); // Restore the saved range

      // Insert text at the cursor position
      range.deleteContents(); // Remove any selected content
      const textNode = document.createElement('span');
      textNode.setAttribute('class', 'app-tag');
      textNode.innerHTML = '@';

      range.insertNode(textNode);
      range.detach();

      setNewTag(true);

      textRef.current.style.height = 'auto';
      textRef.current.style.height = `${textRef.current.scrollHeight}px`;

      // Move the cursor after the inserted text
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    setSearching({ value: true, query: '' });
    setTagResult([]);
    setTagData({ page: 1, cursor: null, end: false });
    setNewComment(textRef.current.innerHTML!);
    setShowList(true);
    setHideList(false);
    saveSelection();
  };

  const updateTagList = (name: string, id: string, username: string) => () => {
    textRef.current.focus();

    const selection = window.getSelection();
    const range = savedRange ? savedRange : selection!.getRangeAt(0);

    if (!tagList.has(id)) {
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range); // Restore the saved range

        // Insert text at the cursor position
        range.deleteContents(); // Remove any selected content
        const textNode = document.createElement('span');
        textNode.setAttribute('class', 'app-user-tags');
        textNode.setAttribute('data-tag-index', id);
        textNode.setAttribute('href', `/@${username}`);

        textNode.innerHTML = `@${name}`;
        textNode.setAttribute('contentEditable', 'false');

        const elem = textRef.current.children[range.startOffset - 1];

        if (elem && elem.classList.item(0) === 'app-tag')
          textRef.current.removeChild(elem);

        range.insertNode(textNode);
        range.detach();

        setNewTag(false);

        textRef.current.style.height = 'auto';
        textRef.current.style.height = `${textRef.current.scrollHeight}px`;

        // Move the cursor after the inserted text
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);

        setTagList(new Set(tagList.add(id)));
      }
    } else {
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);

        const users = Array.from(
          textRef.current.querySelectorAll('.app-user-tags')
        );

        const user = users.find(
          (elem) => elem && elem.getAttribute('data-tag-index') === id
        );

        if (user) textRef.current.removeChild(user);

        const set = new Set(tagList);
        set.delete(id);
        setTagList(set);
      }
    }

    setNewComment(textRef.current.innerHTML!);
    saveSelection();
  };

  const handleTagScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;

    const isBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 50;

    if (isBottom && !tagData.end) {
      if (searching.query === '') {
        setTagData({
          ...tagData,
          cursor: tagResult[tagResult.length - 1].createdAt,
        });
      } else {
        setTagData({
          ...tagData,
          page: tagData.page + 1,
        });
      }

      setSearching({ ...searching, value: true });
    }
  };

  const addComment = () => async () => {
    const formatted = sanitizeInput(newComment);

    setPosting(true);

    try {
      const { data } = await apiClient.post('v1/comments/add', {
        collection: reels ? 'reel' : 'content',
        documentId: postId,
        text: formatted,
        reply,
        mentions: [...tagList],
      });

      toast.success(data.data.message);

      textRef.current.innerHTML = '';
      textRef.current.style.height = 'unset';
      setNewComment('');
      setTagList(new Set());

      if (reply) {
        const setter = reply.setter;
        const setExcludeArray = reply.setExcludeArray;

        setter(({ value, count }: any) => ({
          value: [...value, data.data.comment],
          count,
        }));

        setExcludeArray((prev: any) => [...prev, data.data.comment._id]);
        setReply(undefined);
      } else {
        setComments((prevValue: any) => ({
          totalCount: prevValue.totalCount + 1,
          value: [data.data.comment, ...prevValue.value],
        }));
      }
    } catch {
      toast.error(
        `Could not ${reply ? 'send reply' : 'post comment'}. Please Try again.`
      );
    } finally {
      setPosting(false);
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
        {window.matchMedia('(min-width: 801px)').matches && (
          <div className={styles['carousel-container']}>
            {type === 'carousel' ? (
              <Carousel
                data={media}
                aspectRatio={aspectRatio}
                type="comment"
                hideData={hideData}
                setHideData={setHideData}
                viewObj={{ viewed, setViewed, handleView }}
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
                viewsData={{ seenSlides, setSeenSlides }}
              />
            )}
          </div>
        )}

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

            <div className={`${styles['menu-box']} ${styles['share-box']}`}>
              <span
                className={styles['menu-icon-box']}
                onClick={() => setShareMedia(true)}
              >
                <FaShare className={styles['menu-icon']} />
              </span>
              <span className={styles['menu-text']}>
                {' '}
                {getEngagementValue(shares)}
              </span>
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
                  setReply={setReply}
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
            <div className={styles['new-comment-box']} ref={tagRef}>
              <div
                className={styles['new-comment-text']}
                contentEditable={true}
                ref={textRef}
                onBeforeInput={handleBeforeInput}
                onInput={handleCommentInput}
                onPaste={handlePaste}
                onKeyUp={saveSelection}
                onMouseUp={saveSelection}
                onDrop={(e) => e.preventDefault()}
              ></div>

              {isEmpty.div && (
                <span
                  className={styles['comment-placeholder']}
                  contentEditable={false}
                >
                  {reply ? `Reply to ${reply.name}` : 'Add Comment....'}
                </span>
              )}

              <div className={styles['new-comment-tags']}>
                {reply && (
                  <IoClose
                    className={styles['cancel-reply']}
                    onClick={() => setReply(undefined)}
                  />
                )}

                <span
                  className={`${styles['comment-tag']} ${
                    showList ? styles['active-tag'] : ''
                  }`}
                  onClick={addTag}
                >
                  @
                </span>
              </div>

              {!hideList && (
                <div
                  className={`${styles['tag-container']} ${
                    showList ? styles['show-tags'] : ''
                  }`}
                  ref={tagListRef}
                  onScroll={handleTagScroll}
                >
                  {searching.value &&
                  tagData.page === 1 &&
                  tagData.cursor === null ? (
                    <div className={styles['tag-loader']}>
                      <LoadingAnimation
                        style={{
                          width: '3rem',
                          height: '3rem',
                          transform: 'scale(2.5)',
                        }}
                      />
                    </div>
                  ) : tagResult.length === 0 ? (
                    <div className={styles['tag-loader']}>
                      No matching user found.
                    </div>
                  ) : (
                    <ul className={styles['tag-list']}>
                      {tagResult.map((user) => (
                        <li
                          key={user._id}
                          className={styles['tag-item']}
                          onClick={updateTagList(
                            user.name,
                            `${user._id}`,
                            user.username
                          )}
                        >
                          <img
                            className={styles['tag-img']}
                            src={getUrl(user.photo, 'users')}
                          />

                          <div className={styles['tag-name-box']}>
                            <span className={styles['tag-name']}>
                              {user.name || <>&nbsp;</>}

                              {user.type && (
                                <span className={styles['tag-text']}>
                                  <BsDot className={styles['tag-dot']} />
                                  {user.type}
                                </span>
                              )}
                            </span>
                            <span className={styles['tag-username']}>
                              @{user.username}
                            </span>
                          </div>

                          <input
                            className={styles['tag-input']}
                            type="checkbox"
                            checked={tagList.has(user._id)}
                            readOnly
                          />
                        </li>
                      ))}
                    </ul>
                  )}

                  {searching.value &&
                    (tagData.page !== 1 || tagData.cursor !== null) && (
                      <span>
                        <div className={styles['tag-loader2']}>
                          <LoadingAnimation
                            style={{
                              width: '2rem',
                              height: '2rem',
                              transform: 'scale(2.5)',
                            }}
                          />
                        </div>
                      </span>
                    )}
                </div>
              )}
            </div>

            <span
              className={`${styles['new-comment-post']} ${
                !isEmpty.post && !posting ? styles['post-comment'] : ''
              }`}
              onClick={addComment()}
            >
              {posting ? (
                <LoadingAnimation
                  style={{
                    width: '2rem',
                    height: '2rem',
                    transform: 'scale(2.5)',
                  }}
                />
              ) : (
                <span
                  className={`${
                    isEmpty.post || posting ? styles['stop-comment'] : ''
                  }`}
                >
                  Post
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </section>,
    target
  );
};

export default CommentBox;
