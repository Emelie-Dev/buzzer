import { BsDot } from 'react-icons/bs';
import { HiOutlineDotsHorizontal, HiPlus } from 'react-icons/hi';
import Carousel from '../components/Carousel';
import { FaHeart, FaCommentDots, FaShare } from 'react-icons/fa';
import { IoBookmark } from 'react-icons/io5';
import styles from '../styles/ContentBox.module.css';
import { useEffect, useRef, useState } from 'react';
import { Content } from './CarouselItem';
import { PiCheckFatFill } from 'react-icons/pi';
import { LikeContext } from '../Contexts';
import CommentBox from './CommentBox';
import ShareMedia from '../components/ShareMedia';

type ContentBoxProps = {
  data: {
    media: Content[];
    description?: string;
    username: string;
    name?: string;
    time: string;
    photo: string;
    aspectRatio: number;
  };
};

const ContentBox = ({ data }: ContentBoxProps) => {
  const { media, description, username, name, time, photo, aspectRatio } = data;

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

  const descriptionRef = useRef<HTMLDivElement>(null!);
  const contentRef = useRef<HTMLDivElement>(null!);
  const menuRef = useRef<HTMLDivElement>(null!);
  const listRef = useRef<HTMLUListElement>(null!);

  useEffect(() => {
    if (descriptionRef.current) descriptionRef.current.innerHTML = description!;
  }, []);

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
    <LikeContext.Provider value={{ like, setLike, setHideLike }}>
      {shareMedia && <ShareMedia setShareMedia={setShareMedia} />}

      {viewComment && (
        <CommentBox
          setViewComment={setViewComment}
          data={{
            media,
            username,
            name,
            photo,
            aspectRatio,
          }}
          isFollowing={isFollowing}
          saved={saved}
          hideLike={hideLike}
          setSaved={setSaved}
          setShareMedia={setShareMedia}
        />
      )}

      <article className={styles.content} ref={contentRef}>
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

            {!hideMenu && (
              <ul className={styles['menu-list']} ref={listRef}>
                <li className={`${styles['menu-item']} ${styles['menu-red']}`}>
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </li>
                <li className={`${styles['menu-item']} ${styles['menu-red']}`}>
                  Report
                </li>
                <li className={styles['menu-item']}>Not interested</li>
                <li className={styles['menu-item']}>Add to story</li>
                <li className={styles['menu-item']}>Go to post</li>
                <li className={styles['menu-item']}>Clear display</li>
              </ul>
            )}
          </div>
        </h1>
        <div className={styles['content-box']}>
          <div className={styles['carousel-container']}>
            <Carousel
              data={media}
              aspectRatio={aspectRatio}
              setDescriptionWidth={setDescriptionWidth}
              type="content"
            />
          </div>
          <div className={styles['menu-container']}>
            <div className={styles['profile-img-box']}>
              <img
                src={`../../assets/images/users/${photo}`}
                className={styles['profile-img']}
              />

              {isFollowing ? (
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
                onClick={() => setShareMedia(true)}
              >
                <FaShare className={styles['menu-icon']} />
              </span>
              <span className={styles['menu-text']}>217</span>
            </div>
          </div>
        </div>

        {description && (
          <>
            <div
              className={`${styles['content-description']}  ${
                !showMore ? styles['content-description2'] : ''
              } ${showMore ? styles['show-more'] : ''}`}
              style={{ width: `${descriptionWidth}px` }}
              ref={descriptionRef}
            ></div>

            {!showMore && (
              <div className={styles['more-text']} onClick={handleDescription}>
                show more
              </div>
            )}
          </>
        )}
      </article>
    </LikeContext.Provider>
  );
};

export default ContentBox;
