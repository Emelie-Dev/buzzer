import React, { useContext, useEffect, useRef, useState } from 'react';
import styles from '../styles/CommentBox.module.css';
import { Content } from './CarouselItem';
import { HiOutlineDotsHorizontal } from 'react-icons/hi';
import { FaHeart, FaCommentDots, FaShare } from 'react-icons/fa';
import { IoBookmark } from 'react-icons/io5';
import CommentContent from './CommentContent';
import { PiCheckFatFill } from 'react-icons/pi';
import { IoReloadOutline } from 'react-icons/io5';
import { IoClose } from 'react-icons/io5';
import { FaArrowUp } from 'react-icons/fa';
import Carousel from './Carousel';
import { LikeContext } from '../Contexts';

type CommentBoxProps = {
  data: {
    media: Content[];
    username: string;
    name?: string;
    photo: string;
    aspectRatio: number;
  };
  setViewComment: React.Dispatch<React.SetStateAction<boolean>>;
  isFollowing: boolean;
  saved: boolean;
  hideLike: boolean;
  setSaved: React.Dispatch<React.SetStateAction<boolean>>;
  setShareMedia: React.Dispatch<React.SetStateAction<boolean>>;
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
  hideLike,
  setSaved,
  setShareMedia,
}: CommentBoxProps) => {
  const { media, username, name, photo, aspectRatio } = data;
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [hideMenu, setHideMenu] = useState<boolean>(true);
  const [newComment, setNewComment] = useState<string>('');
  const [showList, setShowList] = useState<boolean>(false);
  const [savedRange, setSavedRange] = useState<Range>();
  const [tagList, setTagList] = useState<number[]>([]);
  const [searching, setSearching] = useState<boolean | 'done'>(false);
  const [newTag, setNewTag] = useState<boolean>(false);
  const [scrollHeight, setScrollHeight] = useState<number>(0);

  const { like, setLike, setHideLike } = useContext(LikeContext);

  const menuRef = useRef<HTMLDivElement>(null!);
  const listRef = useRef<HTMLUListElement>(null!);
  const textRef = useRef<HTMLDivElement>(null!);
  const followersRef = useRef<HTMLUListElement>(null!);
  const tagRef = useRef<HTMLDivElement>(null!);
  const commentRef = useRef<HTMLDivElement>(null!);

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

    let timeout: number;

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
    if (e.target === e.currentTarget) setViewComment(false);
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

  return (
    <section className={styles.section} onClick={handleClick}>
      <span
        className={styles['close-icon-box']}
        title="Close"
        onClick={() => setViewComment(false)}
      >
        <IoClose className={styles['close-icon']} />
      </span>

      <div className={styles.container}>
        <div className={styles['carousel-container']}>
          <Carousel data={media} aspectRatio={aspectRatio} type="comment" />
        </div>

        <div
          className={styles['comment-container']}
          ref={commentRef}
          onScroll={(e: React.UIEvent<HTMLDivElement>) =>
            setScrollHeight((e.target as HTMLDivElement).scrollTop)
          }
        >
          <div className={styles['comment-header']}>
            <div className={styles['comment-header-details']}>
              <span className={styles['profile-img-box']}>
                <img
                  className={styles['profile-img']}
                  src={`../../assets/images/users/${photo}`}
                />
              </span>

              <span className={styles['name-box']}>
                <span className={styles['name']}>{name}</span>
                <span className={styles['username']}>{username}</span>
              </span>
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
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </li>
                  <li
                    className={`${styles['menu-item']} ${styles['menu-red']}`}
                  >
                    Report
                  </li>
                  <li className={styles['menu-item']}>Not interested</li>
                  <li className={styles['menu-item']}>Add to story</li>
                  <li className={styles['menu-item']}>Go to post</li>
                  <li className={styles['menu-item']}>Clear display</li>
                </ul>
              )}
            </div>
          </div>

          <div className={styles['engage-div']}>
            <div className={styles['menu-box']}>
              {!hideLike ? (
                <img
                  src="../../assets/images/Animation - 1731349965809.gif"
                  className={styles['like-icon']}
                />
              ) : (
                <span
                  className={styles['menu-icon-box']}
                  title="Like"
                  onClick={() => {
                    setLike(!like);
                    setHideLike(like === true ? true : false);
                  }}
                >
                  <FaHeart
                    className={`${styles['menu-icon']} ${
                      like ? styles['red-icon'] : ''
                    }`}
                  />
                </span>
              )}

              <span className={styles['menu-text']}>21K</span>
            </div>

            <div className={styles['menu-box']}>
              <span
                className={styles['menu-icon-box']}
                title="Comment"
                onClick={() => textRef.current.focus()}
              >
                <FaCommentDots className={styles['menu-icon']} />
              </span>
              <span className={styles['menu-text']}>2345</span>
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

          <div className={styles['comment-div']}>
            <div className={styles['comments-head']}>Comments (512)</div>

            {new Array(5).fill(0).map((value) => (
              <CommentContent key={value} />
            ))}

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
    </section>
  );
};

export default CommentBox;
