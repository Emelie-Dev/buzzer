import { BsDot } from 'react-icons/bs';
import {
  HiOutlineDotsHorizontal,
  HiPlus,
  HiOutlineDotsVertical,
} from 'react-icons/hi';
import Carousel from '../components/Carousel';
import { FaHeart, FaCommentDots, FaShare } from 'react-icons/fa';
import { IoBookmark } from 'react-icons/io5';
import styles from '../styles/ContentBox.module.css';
import { useContext, useEffect, useRef, useState } from 'react';
import { PiCheckFatFill } from 'react-icons/pi';
import { ContentContext, GeneralContext, LikeContext } from '../Contexts';
import CommentBox from './CommentBox';
import ShareMedia from '../components/ShareMedia';
import { DataItem } from '../pages/Following';

import { Content } from '../components/CarouselItem';
import ContentItem from './ContentItem';

type ContentBoxProps = {
  data: DataItem;
  contentType: 'following' | 'home' | 'reels';
  setShowMobileMenu?: React.Dispatch<React.SetStateAction<boolean>>;
};

export type CommentData =
  | {
      media: Content[];
      username: string;
      name?: string;
      photo: string;
      aspectRatio: number;
      type: 'carousel';
    }
  | {
      media: string;
      username: string;
      name?: string;
      photo: string;
      aspectRatio: number;
      type: 'image' | 'video';
    };

const ContentBox = ({
  data,
  contentType,
  setShowMobileMenu,
}: ContentBoxProps) => {
  const { media, description, username, name, time, photo, aspectRatio, type } =
    data;

  const [showMore, setShowMore] = useState<boolean>(false);
  const [descriptionWidth, setDescriptionWidth] = useState<number>(0);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [hideMenu, setHideMenu] = useState<boolean>(true);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [like, setLike] = useState<boolean>(false);
  const [hideLike, setHideLike] = useState<boolean>(true);
  const [saved, setSaved] = useState<boolean>(false);
  const [shareMedia, setShareMedia] = useState<boolean>(false);
  const [viewComment, setViewComment] = useState<boolean>(false);
  const [hideMore, setHideMore] = useState<boolean>(false);
  const [hideData, setHideData] = useState<boolean>(false);
  const { activeVideo, setActiveVideo } = useContext(ContentContext);
  const { scrollingUp } = useContext(GeneralContext);

  const descriptionRef = useRef<HTMLDivElement>(null!);
  const contentRef = useRef<HTMLDivElement>(null!);
  const menuRef = useRef<HTMLDivElement>(null!);
  const listRef = useRef<HTMLUListElement>(null!);
  const reelMenuRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.innerHTML = description!;
    }
  }, []);

  useEffect(() => {
    if (descriptionRef.current) {
      if (descriptionRef.current.scrollHeight <= 42) {
        setHideMore(true);
      }
    }
  }, [descriptionWidth]);

  useEffect(() => {
    if (like) {
      setTimeout(() => {
        setHideLike(true);
      }, 400);
    }
  }, [like]);

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

  return (
    <LikeContext.Provider
      value={{
        like,
        setLike,
        setHideLike,
        setShowMenu,
        setHideMenu,
        reelMenuRef,
        viewComment,
        setShowMobileMenu,
      }}
    >
      {shareMedia && (
        <ShareMedia setShareMedia={setShareMedia} activeVideo={activeVideo} />
      )}

      {viewComment && (
        <CommentBox
          setViewComment={setViewComment}
          data={
            {
              username,
              name,
              photo,
              aspectRatio,
              type,
              media,
            } as CommentData
          }
          isFollowing={isFollowing}
          saved={saved}
          hideLike={hideLike}
          setSaved={setSaved}
          setShareMedia={setShareMedia}
          reels={contentType === 'reels'}
          description={description}
        />
      )}

      <article
        className={`${styles.content} ${
          contentType === 'reels' ? styles['reels-content'] : ''
        } ${scrollingUp ? styles['scroll-reels'] : ''}`}
        ref={contentRef}
      >
        {contentType !== 'reels' && (
          <h1 className={styles['content-head']}>
            <span className={styles['content-head-box']}>
              <span className={styles['content-name-box']}>
                <span className={styles['content-nickname']}>{name}</span>
                <span className={styles['content-username']}>{username}</span>
              </span>
              <BsDot className={styles.dot} />
              <span className={styles['content-time']}>{time}</span>
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
                  <li className={styles['menu-item']}>Clear display</li>
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
              />
            ) : (
              <ContentItem
                src={media}
                aspectRatio={aspectRatio}
                setDescriptionWidth={setDescriptionWidth}
                type={type}
                contentType={contentType === 'reels' ? 'reels' : 'single'}
                description={description}
                name={name}
                hideData={hideData}
                setHideData={setHideData}
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
                    >
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </li>
                    <li
                      className={`${styles['menu-item']} ${styles['menu-red']}`}
                    >
                      Report
                    </li>
                    <li className={styles['menu-item']}>Mute</li>
                    <li className={styles['menu-item']}>Pin</li>
                    <li className={styles['menu-item']}>Not interested</li>
                    <li className={styles['menu-item']}>Add to story</li>
                    <li className={styles['menu-item']}>Clear display</li>
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
              <span className={styles['profile-img-span']}>
                <img
                  src={`../../assets/images/users/${photo}`}
                  className={styles['profile-img']}
                />
              </span>

              {contentType !== 'following' ? (
                isFollowing ? (
                  <span
                    className={styles['profile-icon-box2']}
                    title="Unfollow"
                    onClick={() => setIsFollowing(!isFollowing)}
                  >
                    <PiCheckFatFill className={styles['profile-icon2']} />{' '}
                  </span>
                ) : (
                  <span
                    className={styles['profile-icon-box']}
                    title="Follow"
                    onClick={() => setIsFollowing(!isFollowing)}
                  >
                    <HiPlus className={styles['profile-icon']} />
                  </span>
                )
              ) : (
                ''
              )}
            </div>

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
                onClick={() => {
                  activeVideo?.pause();
                  setActiveVideo(null);
                  setViewComment(true);
                }}
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
              <span className={styles['menu-text']}>217</span>
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
              <span
                className={styles['small-details-box']}
                onClick={() => {
                  setLike(!like);
                  setHideLike(like === true ? true : false);
                }}
              >
                {!hideLike ? (
                  <img
                    src="../../assets/images/Animation - 1731349965809.gif"
                    className={styles['like-icon']}
                  />
                ) : (
                  <FaHeart
                    className={`${styles['small-details-icon']} ${
                      like ? styles['red-icon'] : ''
                    }`}
                    title="Like"
                  />
                )}

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
                onClick={() => setSaved(!saved)}
              >
                <IoBookmark
                  className={`${styles['small-details-icon']} ${
                    saved ? styles['saved-icon'] : ''
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
