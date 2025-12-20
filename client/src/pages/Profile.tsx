import styles from '../styles/Profile.module.css';
import NavBar from '../components/NavBar';
import { RiGitRepositoryPrivateLine } from 'react-icons/ri';
import { HiOutlineBookmark } from 'react-icons/hi';
import { FiHeart } from 'react-icons/fi';
import { MdOutlineGridOn } from 'react-icons/md';
import { useContext, useEffect, useRef, useState } from 'react';
import { FaPlay } from 'react-icons/fa6';
import { FaHeart, FaCommentDots } from 'react-icons/fa';
import { IoClose, IoMenu, IoSettingsOutline } from 'react-icons/io5';
import { QRCodeCanvas } from 'qrcode.react';
import { FaCopy, FaInstagram } from 'react-icons/fa6';
import { Arrow } from '../pages/Home';
import {
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdOutlineHistory,
  MdOutlineMailOutline,
} from 'react-icons/md';
import Engagements from '../components/Engagements';
import { AuthContext, GeneralContext } from '../Contexts';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { RiArrowDownSLine, RiYoutubeLine } from 'react-icons/ri';
import SwitchAccount from '../components/SwitchAccount';
import { BiSort } from 'react-icons/bi';
import { TbBrandGoogleAnalytics } from 'react-icons/tb';
import { BiMessageDetail } from 'react-icons/bi';
import { IoMdNotificationsOutline } from 'react-icons/io';
import {
  apiClient,
  getEngagementValue,
  getTime,
  getUrl,
  serverUrl,
} from '../Utilities';
import { toast } from 'sonner';
import { HiOutlineGlobe } from 'react-icons/hi';
import Skeleton from 'react-loading-skeleton';
import LoadingAnimation from '../components/LoadingAnimation';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const profileLink = `${serverUrl}@${user.username}`;
  const [category, setcategory] = useState<
    'all' | 'reels' | 'private' | 'bookmarks' | 'liked'
  >('all');
  const [shareModal, setShareModal] = useState<boolean>(false);
  const [showArrow, setShowArrow] = useState<Arrow>({
    left: false,
    right: true,
  });
  const [engagementModal, setEngagementModal] = useState<
    'followers' | 'following' | 'friends' | 'suggested' | 'private' | null
  >(null);
  const [posts, setPosts] = useState<{
    all: any[];
    reels: any[];
    private: any[];
    bookmarks: any[];
    liked: any[];
  }>({
    all: null!,
    reels: null!,
    private: null!,
    bookmarks: null!,
    liked: null!,
  });
  const [postsData, setPostsData] = useState<{
    all: {
      loading: boolean | 'error';
      cursor: Date;
      views: number;
      end: boolean;
    };
    reels: {
      loading: boolean | 'error';
      cursor: Date;
      views: number;
      end: boolean;
    };
    private: {
      loading: boolean | 'error';
      cursor: Date;
      views: number;
      end: boolean;
    };
    bookmarks: {
      loading: boolean | 'error';
      cursor: Date;
      views: number;
      end: boolean;
    };
    liked: {
      loading: boolean | 'error';
      cursor: Date;
      views: number;
      end: boolean;
    };
  }>({
    all: {
      loading: false,
      cursor: null!,
      views: null!,
      end: false,
    },
    reels: {
      loading: false,
      cursor: null!,
      views: null!,
      end: false,
    },
    private: {
      loading: false,
      cursor: null!,
      views: null!,
      end: false,
    },
    bookmarks: {
      loading: false,
      cursor: null!,
      views: null!,
      end: false,
    },
    liked: {
      loading: false,
      cursor: null!,
      views: null!,
      end: false,
    },
  });
  const [sort, setSort] = useState<'oldest' | 'latest' | 'popular'>('latest');
  const [scrollTop, setScrollTop] = useState<{
    all: number;
    reels: number;
    private: number;
    bookmarks: number;
    liked: number;
  }>({ all: 0, reels: 0, private: 0, bookmarks: 0, liked: 0 });

  const {
    setSettingsCategory,
    setShowSearchPage,
    profileData,
    setProfileData,
  } = useContext(GeneralContext);
  const like = useState<boolean>(false)[0];
  const setHideLike = useState<boolean>(true)[1];
  const [switchAccount, setSwitchAccount] = useState<boolean>(false);
  const [mobileMenu, setMobileMenu] = useState<boolean>(false);
  const [showSort, setShowSort] = useState<boolean>(false);

  const optionsRef = useRef<HTMLDivElement>(null!);
  const inputRef = useRef<HTMLInputElement>(null!);
  const listRef = useRef<HTMLUListElement>(null!);
  const containerRef = useRef<HTMLDivElement>(null!);
  const mainRef = useRef<HTMLDivElement>(null!);
  const sortRef = useRef<HTMLDivElement>(null!);
  const categoryContainerRef = useRef<{
    all: HTMLDivElement;
    reels: HTMLDivElement;
    private: HTMLDivElement;
    bookmarks: HTMLDivElement;
    liked: HTMLDivElement;
  }>({
    all: null!,
    reels: null!,
    private: null!,
    bookmarks: null!,
    liked: null!,
  });

  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Buzzer - Profile';

    const getProfileData = async () => {
      try {
        const { data } = await apiClient('v1/users/profile');
        setProfileData(data.data);
      } catch {
        toast.error(
          'Failed to load some profile details. Please refresh and try again.'
        );
      }
    };

    const clickHandler = (e: Event) => {
      const target = e.target as HTMLElement;

      if (showSort) {
        if (target !== sortRef.current && !sortRef.current.contains(target)) {
          setShowSort(false);
        }
      }
    };

    window.addEventListener('click', clickHandler);

    getProfileData();

    return () => {
      setShowSearchPage(false);
      window.removeEventListener('click', clickHandler);
    };
  }, []);

  useEffect(() => {
    if (like) {
      setTimeout(() => {
        setHideLike(true);
      }, 400);
    }
  }, [like]);

  useEffect(() => {
    if (mobileMenu) {
      listRef.current.animate(
        {
          height: ['0px', `${listRef.current.scrollHeight}px`],
        },
        {
          fill: 'both',
          duration: 150,
        }
      );
    }
  }, [mobileMenu]);

  useEffect(() => {
    const index =
      category === 'all'
        ? 0
        : category === 'reels'
        ? 1
        : category === 'private'
        ? 2
        : category === 'bookmarks'
        ? 3
        : 4;

    if (containerRef.current) {
      containerRef.current.scroll({
        left: index * containerRef.current.clientWidth,
        behavior: 'smooth',
      });
    }

    if (posts[category] === null && postsData[category].loading !== true) {
      setPostsData((prev) => ({
        ...prev,
        [category]: { ...prev[category], loading: true },
      }));
    }

    if (mainRef.current) {
      mainRef.current.scrollTop = scrollTop[category];
    }
  }, [category]);

  useEffect(() => {
    if (posts[category] !== null && postsData[category].loading !== true) {
      setPostsData((prev) => ({
        ...prev,
        [category]: { loading: true, cursor: null!, views: null!, end: false },
      }));
      setPosts({
        all: null!,
        reels: null!,
        private: null!,
        bookmarks: null!,
        liked: null!,
      });
    }
  }, [sort]);

  useEffect(() => {
    if (postsData[category].loading === true) getPosts();
  }, [postsData]);

  const addToRef =
    (
      ref: React.MutableRefObject<{
        all: HTMLDivElement;
        reels: HTMLDivElement;
        private: HTMLDivElement;
        bookmarks: HTMLDivElement;
        liked: HTMLDivElement;
      }>,
      prop: typeof category
    ) =>
    (el: HTMLDivElement) => {
      if (el && !ref.current[prop]) {
        ref.current[prop] = el;
      }
    };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;

    setShowArrow({
      left: target.scrollLeft > 30,
      right: !(
        target.scrollLeft + target.clientWidth >=
        target.scrollWidth - 5
      ),
    });
  };

  const copyLink = () => {
    const copyText = inputRef.current;

    navigator.clipboard.writeText(copyText.value);
  };

  const getAppLink = (type: string) => {
    let link = profileLink;

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const message = `Check out my profile on Buzzer:\n${profileLink}`;

    const smsHref = isIOS ? `sms:&body=${message}` : `sms:?body=${message}`;

    switch (type) {
      case 'whatsapp':
        link = `https://wa.me/?text=${encodeURIComponent(message)}`;
        break;

      case 'x':
        link = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          message
        )}`;
        break;

      case 'facebook':
        link = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          message
        )}`;
        break;

      case 'telegram':
        link = `https://t.me/share/url?url=${encodeURIComponent(
          profileLink
        )}&text=${encodeURIComponent(`\nCheck out my profile on Buzzer.`)}`;
        break;

      case 'email':
        link = `mailto:?subject=${encodeURIComponent(
          'Buzzer Profile'
        )}&body=${encodeURIComponent(message)}`;
        break;

      case 'messenger':
        link = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(
          profileLink
        )}&app_id=1830966198299023&redirect_uri=${encodeURIComponent(
          serverUrl
        )}`;
        break;

      case 'snapchat':
        link = `https://www.snapchat.com/share?link=${encodeURIComponent(
          profileLink
        )}`;
        break;

      case 'reddit':
        link = `https://www.reddit.com/submit?url=${encodeURIComponent(
          profileLink
        )}&title=${encodeURIComponent(`Check out my profile on Buzzer!`)}`;
        break;

      case 'sms':
        link = smsHref;
        break;
    }

    return link;
  };

  const getPosts = async () => {
    try {
      const { data } = await apiClient(
        `v1/users/posts/${category}?sort=${sort}&cursor=${postsData[category].cursor}&views=${postsData[category].views}`
      );

      setPosts((prev) => {
        const postArr = data.data.posts.filter(
          (obj: any) =>
            !(prev[category] || []).find((data: any) => data._id === obj._id)
        );

        return {
          ...prev,
          [category]: [...(prev[category] || []), ...postArr],
        };
      });
      setPostsData((prev) => ({
        ...prev,
        [category]: {
          ...prev[category],
          loading: false,
          end: data.data.posts.length < 20,
        },
      }));
    } catch {
      setPostsData((prev) => ({
        ...prev,
        [category]: { ...prev[category], loading: 'error' },
      }));

      return toast.error('Failed to load posts.');
    }
  };

  const handlePostsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 100;

    setScrollTop((prev) => ({
      ...prev,
      [category]: target.scrollTop,
    }));

    if (
      isBottom &&
      !postsData[category].end &&
      postsData[category].loading === false
    ) {
      setPostsData((prev) => {
        const arr = posts[category];
        const cursor =
          arr.length > 0
            ? arr[arr.length - 1].savedAt ||
              arr[arr.length - 1].likedAt ||
              arr[arr.length - 1].createdAt
            : null;
        const views = arr.length > 0 ? arr[arr.length - 1].views : Infinity;

        return {
          ...prev,
          [category]: {
            ...prev[category],
            loading: true,
            cursor:
              prev[category].loading === 'error'
                ? prev[category].cursor
                : cursor,
            views:
              prev[category].loading === 'error' ? prev[category].views : views,
          },
        };
      });
    }
  };

  return (
    <>
      <NavBar page="profile" />

      <section
        className={styles.main}
        onScroll={handlePostsScroll}
        ref={mainRef}
      >
        <section className={styles['top-section']}>
          <header className={styles['mobile-header']}>
            <span
              className={styles['user-handle2']}
              onClick={() => setSwitchAccount(true)}
            >
              {user.username}
              <RiArrowDownSLine className={styles['down-arrow']} />
            </span>

            <IoMenu
              className={styles['menu-icon']}
              onClick={() => setMobileMenu(true)}
            />
          </header>

          <figure className={styles['img-box']}>
            <img className={styles.img} src={getUrl(user.photo, 'users')} />
            <figcaption className={styles['user-name']}>{user.name}</figcaption>
          </figure>

          <div className={styles['profile-details']}>
            <span className={styles['user-handle']}>{user.username}</span>

            <div className={styles['btn-div']}>
              <button
                className={styles['edit-btn']}
                onClick={() => {
                  setSettingsCategory('profile');
                  navigate('/settings');
                }}
              >
                Edit Profile
              </button>
              <button
                className={styles['share-btn']}
                onClick={() => setShareModal(true)}
              >
                Share Profile
              </button>
            </div>

            <div className={styles['profile-data']}>
              <span
                className={`${styles['data-box']} ${styles['data-box2']}`}
                onClick={() => setEngagementModal('followers')}
              >
                <span className={styles['data-value']}>
                  {getEngagementValue(profileData.followers)}
                </span>
                <span className={styles['data-field']}>Followers</span>
              </span>

              <span
                className={`${styles['data-box']} ${styles['data-box2']}`}
                onClick={() => setEngagementModal('following')}
              >
                <span className={styles['data-value']}>
                  {getEngagementValue(profileData.following)}
                </span>
                <span className={styles['data-field']}>Following</span>
              </span>

              <span
                className={`${styles['data-box']} ${styles['data-box2']}`}
                onClick={() => setEngagementModal('friends')}
              >
                <span className={styles['data-value']}>
                  {getEngagementValue(profileData.friends)}
                </span>
                <span className={styles['data-field']}>Friends</span>
              </span>

              <span className={styles['data-box']}>
                <span className={styles['data-value']}>
                  {getEngagementValue(profileData.posts)}
                </span>
                <span className={styles['data-field']}>Posts</span>
              </span>

              <span className={styles['data-box']}>
                <span className={styles['data-value']}>
                  {getEngagementValue(profileData.likes)}
                </span>
                <span className={styles['data-field']}>Likes</span>
              </span>
            </div>

            <div className={styles.description}>{user.bio}</div>

            <div className={styles.links}>
              {user.settings.account.emailVisibility && (
                <div className={styles['link-item']}>
                  <span className={styles['link-icon-box']}>
                    <MdOutlineMailOutline className={styles['link-icon']} />:
                  </span>
                  <a
                    className={styles.link}
                    href={`mailto:${user.email}`}
                    target="_blank"
                  >
                    {user.email}
                  </a>
                </div>
              )}

              {user.links.website && (
                <div className={styles['link-item']}>
                  <span className={styles['link-icon-box']}>
                    <HiOutlineGlobe className={styles['link-icon']} />:
                  </span>
                  <a
                    className={styles.link}
                    href={user.links.website}
                    target="_blank"
                  >
                    {user.links.website}
                  </a>
                </div>
              )}

              {user.links.youtube && (
                <div className={styles['link-item']}>
                  <span className={styles['link-icon-box']}>
                    <RiYoutubeLine className={styles['link-icon']} />:
                  </span>
                  <a
                    className={styles.link}
                    href={user.links.youtube}
                    target="_blank"
                  >
                    {user.links.youtube}
                  </a>
                </div>
              )}

              {user.links.instagram && (
                <div className={styles['link-item']}>
                  <span className={styles['link-icon-box']}>
                    <FaInstagram className={styles['link-icon']} />:
                  </span>
                  <a
                    className={styles.link}
                    href={user.links.instagram}
                    target="_blank"
                  >
                    {user.links.instagram}
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className={styles['bottom-section']}>
          <header className={styles['bottom-header']}>
            <ul className={styles['category-list']}>
              <li
                className={`${styles['category-item']} ${
                  category === 'all' ? styles['current-category'] : ''
                }`}
                onClick={() => {
                  setcategory('all');
                }}
              >
                <MdOutlineGridOn className={styles['category-icon']} />
                <span className={styles['category-text']}>Posts</span>
              </li>
              <li
                className={`${styles['category-item']} ${
                  category === 'reels' ? styles['current-category'] : ''
                }`}
                onClick={() => setcategory('reels')}
              >
                <svg
                  className={styles['category-icon']}
                  version="1.1"
                  viewBox="0 0 100 100"
                >
                  <defs></defs>
                  <g
                    style={{
                      stroke: 'none',
                      strokeWidth: 0,
                      strokeDasharray: 'none',
                      strokeLinecap: 'butt',
                      strokeLinejoin: 'miter',
                      strokeMiterlimit: 10,
                      fill: 'none',
                      fillRule: 'nonzero',
                      opacity: 1,
                      transform:
                        'translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)}',
                    }}
                  >
                    <linearGradient
                      id="SVGID_44"
                      gradientUnits="userSpaceOnUse"
                      x1="20.9489"
                      y1="70.2584"
                      x2="72.2486"
                      y2="16.3831"
                    >
                      <stop offset="0%" />
                      <stop offset="50%" />
                      <stop offset="100%" />
                    </linearGradient>
                    <path
                      d="M 61.692 0.878 H 28.307 C 12.699 0.878 0 13.577 0 29.186 v 31.629 c 0 15.608 12.699 28.307 28.307 28.307 h 33.385 C 77.301 89.121 90 76.423 90 60.814 V 29.186 C 90 13.577 77.301 0.878 61.692 0.878 z M 81.6 25.186 H 67.854 L 58.78 8.878 h 2.912 C 71.52 8.878 79.737 15.898 81.6 25.186 z M 39.888 25.186 L 30.815 8.878 h 18.811 l 9.073 16.307 H 39.888 z M 22.186 9.825 l 8.546 15.36 H 8.4 C 9.859 17.913 15.213 12.035 22.186 9.825 z M 61.692 81.121 H 28.307 C 17.11 81.121 8 72.012 8 60.814 V 33.186 h 74 v 27.629 C 82 72.012 72.89 81.121 61.692 81.121 z"
                      style={{
                        stroke: 'none',
                        strokeWidth: 1,
                        strokeDasharray: 'none',
                        strokeLinecap: 'butt',
                        strokeLinejoin: 'miter',
                        strokeMiterlimit: 10,
                        fillRule: 'nonzero',
                        opacity: 1,
                        transform: ' matrix(1 0 0 1 0 0) ',
                      }}
                      className={`${styles.path} ${
                        category === 'reels' ? styles['current-path'] : ''
                      }`}
                      strokeLinecap="round"
                    />
                    <linearGradient
                      id="SVGID_45"
                      gradientUnits="userSpaceOnUse"
                      x1="24.1901"
                      y1="73.3447"
                      x2="75.4898"
                      y2="19.4693"
                    >
                      <stop offset="0%" />
                      <stop offset="50%" />
                      <stop offset="100%" />
                    </linearGradient>
                    <path
                      d="M 56.367 51.97 l -17.41 -9.305 c -2.366 -1.265 -5.227 0.45 -5.227 3.133 v 18.611 c 0 2.683 2.861 4.398 5.227 3.133 l 17.41 -9.305 C 58.871 56.898 58.871 53.309 56.367 51.97 z"
                      style={{
                        stroke: 'none',
                        strokeWidth: 1,
                        strokeDasharray: 'none',
                        strokeLinecap: 'butt',
                        strokeLinejoin: 'miter',
                        strokeMiterlimit: 10,
                        fillRule: 'nonzero',
                        opacity: 1,
                        transform: ' matrix(1 0 0 1 0 0) ',
                      }}
                      className={`${styles.path} ${
                        category === 'reels' ? styles['current-path'] : ''
                      }`}
                      strokeLinecap="round"
                    />
                  </g>
                </svg>
                <span className={styles['category-text']}>Reels</span>
              </li>

              <li
                className={`${styles['category-item']} ${
                  category === 'private' ? styles['current-category'] : ''
                }`}
                onClick={() => setcategory('private')}
              >
                <RiGitRepositoryPrivateLine
                  className={styles['category-icon']}
                />
                <span className={styles['category-text']}>Private</span>
              </li>

              <li
                className={`${styles['category-item']} ${
                  category === 'bookmarks' ? styles['current-category'] : ''
                }`}
                onClick={() => setcategory('bookmarks')}
              >
                <HiOutlineBookmark className={styles['category-icon']} />
                <span className={styles['category-text']}>Saved</span>
              </li>

              <li
                className={`${styles['category-item']} ${
                  category === 'liked' ? styles['current-category'] : ''
                }`}
                onClick={() => setcategory('liked')}
              >
                <FiHeart className={styles['category-icon']} />
                <span className={styles['category-text']}>Liked</span>
              </li>
            </ul>

            <div className={styles['sort-div']}>
              <span className={styles['sort-div-txt']}>Sort by:</span>

              <select
                className={styles['sort-select']}
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
              >
                <option value={'latest'}>Latest</option>
                <option value={'oldest'}>Oldest</option>
                <option value={'popular'}>Popular</option>
              </select>
            </div>
          </header>

          <div className={styles['posts-container']} ref={containerRef}>
            {/* All Posts */}
            <div
              className={`${styles['contents-container']} ${
                category === 'all' ? styles['show-container'] : ''
              }`}
              style={{ left: 0 }}
              ref={addToRef(categoryContainerRef, 'all')}
            >
              {posts.all === null && postsData.all.loading === 'error' ? (
                <div className={styles['no-data-text']}>
                  Unable to load posts. Check your connection and try again.
                  <div className={styles['error-btn']}>
                    <button onClick={getPosts}>Try again</button>
                  </div>
                </div>
              ) : posts.all === null && category !== 'all' ? (
                ''
              ) : posts.all === null ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className={styles.media} />
                ))
              ) : posts.all.length === 0 ? (
                <div className={styles['no-data-text']}>
                  You don’t have any post yet.
                </div>
              ) : (
                <>
                  {posts.all.map((post) => (
                    <article key={post._id} className={styles.content}>
                      {post.postType === 'reel' && (
                        <svg
                          className={styles['reel-icon']}
                          version="1.1"
                          viewBox="0 0 100 100"
                        >
                          <defs></defs>
                          <g
                            style={{
                              stroke: 'none',
                              strokeWidth: 0,
                              strokeDasharray: 'none',
                              strokeLinecap: 'butt',
                              strokeLinejoin: 'miter',
                              strokeMiterlimit: 10,
                              fill: 'none',
                              fillRule: 'nonzero',
                              opacity: 1,
                              transform:
                                'translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)}',
                            }}
                          >
                            <linearGradient
                              id="SVGID_44"
                              gradientUnits="userSpaceOnUse"
                              x1="20.9489"
                              y1="70.2584"
                              x2="72.2486"
                              y2="16.3831"
                            >
                              <stop offset="0%" />
                              <stop offset="50%" />
                              <stop offset="100%" />
                            </linearGradient>
                            <path
                              d="M 61.692 0.878 H 28.307 C 12.699 0.878 0 13.577 0 29.186 v 31.629 c 0 15.608 12.699 28.307 28.307 28.307 h 33.385 C 77.301 89.121 90 76.423 90 60.814 V 29.186 C 90 13.577 77.301 0.878 61.692 0.878 z M 81.6 25.186 H 67.854 L 58.78 8.878 h 2.912 C 71.52 8.878 79.737 15.898 81.6 25.186 z M 39.888 25.186 L 30.815 8.878 h 18.811 l 9.073 16.307 H 39.888 z M 22.186 9.825 l 8.546 15.36 H 8.4 C 9.859 17.913 15.213 12.035 22.186 9.825 z M 61.692 81.121 H 28.307 C 17.11 81.121 8 72.012 8 60.814 V 33.186 h 74 v 27.629 C 82 72.012 72.89 81.121 61.692 81.121 z"
                              style={{
                                stroke: 'none',
                                strokeWidth: 1,
                                strokeDasharray: 'none',
                                strokeLinecap: 'butt',
                                strokeLinejoin: 'miter',
                                strokeMiterlimit: 10,
                                fill: `white`,
                                fillRule: 'nonzero',
                                opacity: 1,
                                transform: ' matrix(1 0 0 1 0 0) ',
                              }}
                              strokeLinecap="round"
                            />
                            <linearGradient
                              id="SVGID_45"
                              gradientUnits="userSpaceOnUse"
                              x1="24.1901"
                              y1="73.3447"
                              x2="75.4898"
                              y2="19.4693"
                            >
                              <stop offset="0%" />
                              <stop offset="50%" />
                              <stop offset="100%" />
                            </linearGradient>
                            <path
                              d="M 56.367 51.97 l -17.41 -9.305 c -2.366 -1.265 -5.227 0.45 -5.227 3.133 v 18.611 c 0 2.683 2.861 4.398 5.227 3.133 l 17.41 -9.305 C 58.871 56.898 58.871 53.309 56.367 51.97 z"
                              style={{
                                stroke: 'none',
                                strokeWidth: 1,
                                strokeDasharray: 'none',
                                strokeLinecap: 'butt',
                                strokeLinejoin: 'miter',
                                strokeMiterlimit: 10,
                                fill: `white`,
                                fillRule: 'nonzero',
                                opacity: 1,
                                transform: ' matrix(1 0 0 1 0 0) ',
                              }}
                              strokeLinecap="round"
                            />
                          </g>
                        </svg>
                      )}

                      {post.postType === 'reel' ? (
                        <video className={styles.media}>
                          <source src={getUrl(post.src, 'reels')} />
                          Your browser does not support playing video.
                        </video>
                      ) : post.media[0].mediaType === 'video' ? (
                        <video className={styles.media}>
                          <source src={getUrl(post.media[0].src, 'contents')} />
                          Your browser does not support playing video.
                        </video>
                      ) : (
                        <img
                          className={styles.media}
                          src={getUrl(post.media[0].src, 'contents')}
                        />
                      )}

                      <div className={styles['content-details']}>
                        <span className={styles['content-data']}>
                          {getTime(post.createdAt, true)}
                        </span>

                        <span className={styles['content-data']}>
                          <FaPlay className={styles['views-icon']} />
                          {getEngagementValue(post.views)}
                        </span>
                      </div>

                      <div className={styles['engagement-div']}>
                        <span className={styles['engagement-box']}>
                          <FaHeart className={styles['engagement-icon']} />
                          {getEngagementValue(post.likes)}
                        </span>
                        <span className={styles['engagement-box']}>
                          <FaCommentDots
                            className={styles['engagement-icon']}
                          />
                          {getEngagementValue(post.comments)}
                        </span>
                      </div>
                    </article>
                  ))}

                  {postsData.all.loading === true &&
                    postsData.all.cursor !== null && (
                      <div className={styles['loader-box']}>
                        <LoadingAnimation
                          style={{
                            width: '2rem',
                            height: '2rem',
                            transform: 'scale(2.5)',
                          }}
                        />
                      </div>
                    )}
                </>
              )}
            </div>

            {/* Reels */}
            <div
              className={`${styles['contents-container']} ${
                category === 'reels' ? styles['show-container'] : ''
              }`}
              style={{ left: '100%' }}
              ref={addToRef(categoryContainerRef, 'reels')}
            >
              {posts.reels === null && postsData.reels.loading === 'error' ? (
                <div className={styles['no-data-text']}>
                  Unable to load reels. Check your connection and try again.
                  <div className={styles['error-btn']}>
                    <button onClick={getPosts}>Try again</button>
                  </div>
                </div>
              ) : posts.reels === null && category !== 'reels' ? (
                ''
              ) : posts.reels === null ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className={styles.media} />
                ))
              ) : posts.reels.length === 0 ? (
                <div className={styles['no-data-text']}>
                  You don’t have any reel yet.
                </div>
              ) : (
                <>
                  {posts.reels.map((post) => (
                    <article key={post._id} className={styles.content}>
                      <svg
                        className={styles['reel-icon']}
                        version="1.1"
                        viewBox="0 0 100 100"
                      >
                        <defs></defs>
                        <g
                          style={{
                            stroke: 'none',
                            strokeWidth: 0,
                            strokeDasharray: 'none',
                            strokeLinecap: 'butt',
                            strokeLinejoin: 'miter',
                            strokeMiterlimit: 10,
                            fill: 'none',
                            fillRule: 'nonzero',
                            opacity: 1,
                            transform:
                              'translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)}',
                          }}
                        >
                          <linearGradient
                            id="SVGID_44"
                            gradientUnits="userSpaceOnUse"
                            x1="20.9489"
                            y1="70.2584"
                            x2="72.2486"
                            y2="16.3831"
                          >
                            <stop offset="0%" />
                            <stop offset="50%" />
                            <stop offset="100%" />
                          </linearGradient>
                          <path
                            d="M 61.692 0.878 H 28.307 C 12.699 0.878 0 13.577 0 29.186 v 31.629 c 0 15.608 12.699 28.307 28.307 28.307 h 33.385 C 77.301 89.121 90 76.423 90 60.814 V 29.186 C 90 13.577 77.301 0.878 61.692 0.878 z M 81.6 25.186 H 67.854 L 58.78 8.878 h 2.912 C 71.52 8.878 79.737 15.898 81.6 25.186 z M 39.888 25.186 L 30.815 8.878 h 18.811 l 9.073 16.307 H 39.888 z M 22.186 9.825 l 8.546 15.36 H 8.4 C 9.859 17.913 15.213 12.035 22.186 9.825 z M 61.692 81.121 H 28.307 C 17.11 81.121 8 72.012 8 60.814 V 33.186 h 74 v 27.629 C 82 72.012 72.89 81.121 61.692 81.121 z"
                            style={{
                              stroke: 'none',
                              strokeWidth: 1,
                              strokeDasharray: 'none',
                              strokeLinecap: 'butt',
                              strokeLinejoin: 'miter',
                              strokeMiterlimit: 10,
                              fill: `white`,
                              fillRule: 'nonzero',
                              opacity: 1,
                              transform: ' matrix(1 0 0 1 0 0) ',
                            }}
                            strokeLinecap="round"
                          />
                          <linearGradient
                            id="SVGID_45"
                            gradientUnits="userSpaceOnUse"
                            x1="24.1901"
                            y1="73.3447"
                            x2="75.4898"
                            y2="19.4693"
                          >
                            <stop offset="0%" />
                            <stop offset="50%" />
                            <stop offset="100%" />
                          </linearGradient>
                          <path
                            d="M 56.367 51.97 l -17.41 -9.305 c -2.366 -1.265 -5.227 0.45 -5.227 3.133 v 18.611 c 0 2.683 2.861 4.398 5.227 3.133 l 17.41 -9.305 C 58.871 56.898 58.871 53.309 56.367 51.97 z"
                            style={{
                              stroke: 'none',
                              strokeWidth: 1,
                              strokeDasharray: 'none',
                              strokeLinecap: 'butt',
                              strokeLinejoin: 'miter',
                              strokeMiterlimit: 10,
                              fill: `white`,
                              fillRule: 'nonzero',
                              opacity: 1,
                              transform: ' matrix(1 0 0 1 0 0) ',
                            }}
                            strokeLinecap="round"
                          />
                        </g>
                      </svg>

                      <video className={styles.media}>
                        <source src={getUrl(post.src, 'reels')} />
                        Your browser does not support playing video.
                      </video>

                      <div className={styles['content-details']}>
                        <span className={styles['content-data']}>
                          {getTime(post.createdAt, true)}
                        </span>

                        <span className={styles['content-data']}>
                          <FaPlay className={styles['views-icon']} />
                          {getEngagementValue(post.views)}
                        </span>
                      </div>

                      <div className={styles['engagement-div']}>
                        <span className={styles['engagement-box']}>
                          <FaHeart className={styles['engagement-icon']} />
                          {getEngagementValue(post.likes)}
                        </span>
                        <span className={styles['engagement-box']}>
                          <FaCommentDots
                            className={styles['engagement-icon']}
                          />
                          {getEngagementValue(post.comments)}
                        </span>
                      </div>
                    </article>
                  ))}

                  {postsData.reels.loading === true &&
                    postsData.reels.cursor !== null && (
                      <div className={styles['loader-box']}>
                        <LoadingAnimation
                          style={{
                            width: '2rem',
                            height: '2rem',
                            transform: 'scale(2.5)',
                          }}
                        />
                      </div>
                    )}
                </>
              )}
            </div>

            {/* Private */}
            <div
              className={`${styles['contents-container']} ${
                category === 'private' ? styles['show-container'] : ''
              }`}
              style={{ left: '200%' }}
              ref={addToRef(categoryContainerRef, 'private')}
            >
              {posts.private === null &&
              postsData.private.loading === 'error' ? (
                <div className={styles['no-data-text']}>
                  Unable to load private posts. Check your connection and try
                  again.
                  <div className={styles['error-btn']}>
                    <button onClick={getPosts}>Try again</button>
                  </div>
                </div>
              ) : posts.private === null && category !== 'private' ? (
                ''
              ) : posts.private === null ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className={styles.media} />
                ))
              ) : posts.private.length === 0 ? (
                <div className={styles['no-data-text']}>
                  You don’t have any private post yet.
                </div>
              ) : (
                <>
                  {posts.private.map((post) => (
                    <article key={post._id} className={styles.content}>
                      {post.postType === 'reel' && (
                        <svg
                          className={styles['reel-icon']}
                          version="1.1"
                          viewBox="0 0 100 100"
                        >
                          <defs></defs>
                          <g
                            style={{
                              stroke: 'none',
                              strokeWidth: 0,
                              strokeDasharray: 'none',
                              strokeLinecap: 'butt',
                              strokeLinejoin: 'miter',
                              strokeMiterlimit: 10,
                              fill: 'none',
                              fillRule: 'nonzero',
                              opacity: 1,
                              transform:
                                'translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)}',
                            }}
                          >
                            <linearGradient
                              id="SVGID_44"
                              gradientUnits="userSpaceOnUse"
                              x1="20.9489"
                              y1="70.2584"
                              x2="72.2486"
                              y2="16.3831"
                            >
                              <stop offset="0%" />
                              <stop offset="50%" />
                              <stop offset="100%" />
                            </linearGradient>
                            <path
                              d="M 61.692 0.878 H 28.307 C 12.699 0.878 0 13.577 0 29.186 v 31.629 c 0 15.608 12.699 28.307 28.307 28.307 h 33.385 C 77.301 89.121 90 76.423 90 60.814 V 29.186 C 90 13.577 77.301 0.878 61.692 0.878 z M 81.6 25.186 H 67.854 L 58.78 8.878 h 2.912 C 71.52 8.878 79.737 15.898 81.6 25.186 z M 39.888 25.186 L 30.815 8.878 h 18.811 l 9.073 16.307 H 39.888 z M 22.186 9.825 l 8.546 15.36 H 8.4 C 9.859 17.913 15.213 12.035 22.186 9.825 z M 61.692 81.121 H 28.307 C 17.11 81.121 8 72.012 8 60.814 V 33.186 h 74 v 27.629 C 82 72.012 72.89 81.121 61.692 81.121 z"
                              style={{
                                stroke: 'none',
                                strokeWidth: 1,
                                strokeDasharray: 'none',
                                strokeLinecap: 'butt',
                                strokeLinejoin: 'miter',
                                strokeMiterlimit: 10,
                                fill: `white`,
                                fillRule: 'nonzero',
                                opacity: 1,
                                transform: ' matrix(1 0 0 1 0 0) ',
                              }}
                              strokeLinecap="round"
                            />
                            <linearGradient
                              id="SVGID_45"
                              gradientUnits="userSpaceOnUse"
                              x1="24.1901"
                              y1="73.3447"
                              x2="75.4898"
                              y2="19.4693"
                            >
                              <stop offset="0%" />
                              <stop offset="50%" />
                              <stop offset="100%" />
                            </linearGradient>
                            <path
                              d="M 56.367 51.97 l -17.41 -9.305 c -2.366 -1.265 -5.227 0.45 -5.227 3.133 v 18.611 c 0 2.683 2.861 4.398 5.227 3.133 l 17.41 -9.305 C 58.871 56.898 58.871 53.309 56.367 51.97 z"
                              style={{
                                stroke: 'none',
                                strokeWidth: 1,
                                strokeDasharray: 'none',
                                strokeLinecap: 'butt',
                                strokeLinejoin: 'miter',
                                strokeMiterlimit: 10,
                                fill: `white`,
                                fillRule: 'nonzero',
                                opacity: 1,
                                transform: ' matrix(1 0 0 1 0 0) ',
                              }}
                              strokeLinecap="round"
                            />
                          </g>
                        </svg>
                      )}

                      {post.postType === 'reel' ? (
                        <video className={styles.media}>
                          <source src={getUrl(post.src, 'reels')} />
                          Your browser does not support playing video.
                        </video>
                      ) : post.media[0].mediaType === 'video' ? (
                        <video className={styles.media}>
                          <source src={getUrl(post.media[0].src, 'contents')} />
                          Your browser does not support playing video.
                        </video>
                      ) : (
                        <img
                          className={styles.media}
                          src={getUrl(post.media[0].src, 'contents')}
                        />
                      )}

                      <div className={styles['content-details']}>
                        <span className={styles['content-data']}>
                          {getTime(post.createdAt, true)}
                        </span>

                        <span className={styles['content-data']}>
                          <FaPlay className={styles['views-icon']} />
                          {getEngagementValue(post.views)}
                        </span>
                      </div>

                      <div className={styles['engagement-div']}>
                        <span className={styles['engagement-box']}>
                          <FaHeart className={styles['engagement-icon']} />
                          {getEngagementValue(post.likes)}
                        </span>
                        <span className={styles['engagement-box']}>
                          <FaCommentDots
                            className={styles['engagement-icon']}
                          />
                          {getEngagementValue(post.comments)}
                        </span>
                      </div>
                    </article>
                  ))}

                  {postsData.private.loading === true &&
                    postsData.private.cursor !== null && (
                      <div className={styles['loader-box']}>
                        <LoadingAnimation
                          style={{
                            width: '2rem',
                            height: '2rem',
                            transform: 'scale(2.5)',
                          }}
                        />
                      </div>
                    )}
                </>
              )}
            </div>

            {/* Bookmarks */}
            <div
              className={`${styles['contents-container']} ${
                category === 'bookmarks' ? styles['show-container'] : ''
              }`}
              style={{ left: '300%' }}
              ref={addToRef(categoryContainerRef, 'bookmarks')}
            >
              {posts.bookmarks === null &&
              postsData.bookmarks.loading === 'error' ? (
                <div className={styles['no-data-text']}>
                  Unable to load saved posts. Check your connection and try
                  again.
                  <div className={styles['error-btn']}>
                    <button onClick={getPosts}>Try again</button>
                  </div>
                </div>
              ) : posts.bookmarks === null && category !== 'bookmarks' ? (
                ''
              ) : posts.bookmarks === null ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className={styles.media} />
                ))
              ) : posts.bookmarks.length === 0 ? (
                <div className={styles['no-data-text']}>
                  You have not saved any post yet.
                </div>
              ) : (
                <>
                  {posts.bookmarks.map((post) => (
                    <article key={post._id} className={styles.content}>
                      {post.postType === 'reel' && (
                        <svg
                          className={styles['reel-icon']}
                          version="1.1"
                          viewBox="0 0 100 100"
                        >
                          <defs></defs>
                          <g
                            style={{
                              stroke: 'none',
                              strokeWidth: 0,
                              strokeDasharray: 'none',
                              strokeLinecap: 'butt',
                              strokeLinejoin: 'miter',
                              strokeMiterlimit: 10,
                              fill: 'none',
                              fillRule: 'nonzero',
                              opacity: 1,
                              transform:
                                'translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)}',
                            }}
                          >
                            <linearGradient
                              id="SVGID_44"
                              gradientUnits="userSpaceOnUse"
                              x1="20.9489"
                              y1="70.2584"
                              x2="72.2486"
                              y2="16.3831"
                            >
                              <stop offset="0%" />
                              <stop offset="50%" />
                              <stop offset="100%" />
                            </linearGradient>
                            <path
                              d="M 61.692 0.878 H 28.307 C 12.699 0.878 0 13.577 0 29.186 v 31.629 c 0 15.608 12.699 28.307 28.307 28.307 h 33.385 C 77.301 89.121 90 76.423 90 60.814 V 29.186 C 90 13.577 77.301 0.878 61.692 0.878 z M 81.6 25.186 H 67.854 L 58.78 8.878 h 2.912 C 71.52 8.878 79.737 15.898 81.6 25.186 z M 39.888 25.186 L 30.815 8.878 h 18.811 l 9.073 16.307 H 39.888 z M 22.186 9.825 l 8.546 15.36 H 8.4 C 9.859 17.913 15.213 12.035 22.186 9.825 z M 61.692 81.121 H 28.307 C 17.11 81.121 8 72.012 8 60.814 V 33.186 h 74 v 27.629 C 82 72.012 72.89 81.121 61.692 81.121 z"
                              style={{
                                stroke: 'none',
                                strokeWidth: 1,
                                strokeDasharray: 'none',
                                strokeLinecap: 'butt',
                                strokeLinejoin: 'miter',
                                strokeMiterlimit: 10,
                                fill: `white`,
                                fillRule: 'nonzero',
                                opacity: 1,
                                transform: ' matrix(1 0 0 1 0 0) ',
                              }}
                              strokeLinecap="round"
                            />
                            <linearGradient
                              id="SVGID_45"
                              gradientUnits="userSpaceOnUse"
                              x1="24.1901"
                              y1="73.3447"
                              x2="75.4898"
                              y2="19.4693"
                            >
                              <stop offset="0%" />
                              <stop offset="50%" />
                              <stop offset="100%" />
                            </linearGradient>
                            <path
                              d="M 56.367 51.97 l -17.41 -9.305 c -2.366 -1.265 -5.227 0.45 -5.227 3.133 v 18.611 c 0 2.683 2.861 4.398 5.227 3.133 l 17.41 -9.305 C 58.871 56.898 58.871 53.309 56.367 51.97 z"
                              style={{
                                stroke: 'none',
                                strokeWidth: 1,
                                strokeDasharray: 'none',
                                strokeLinecap: 'butt',
                                strokeLinejoin: 'miter',
                                strokeMiterlimit: 10,
                                fill: `white`,
                                fillRule: 'nonzero',
                                opacity: 1,
                                transform: ' matrix(1 0 0 1 0 0) ',
                              }}
                              strokeLinecap="round"
                            />
                          </g>
                        </svg>
                      )}

                      {post.postType === 'reel' ? (
                        <video className={styles.media}>
                          <source src={getUrl(post.post.src, 'reels')} />
                          Your browser does not support playing video.
                        </video>
                      ) : post.post.media[0].mediaType === 'video' ? (
                        <video className={styles.media}>
                          <source
                            src={getUrl(post.post.media[0].src, 'contents')}
                          />
                          Your browser does not support playing video.
                        </video>
                      ) : (
                        <img
                          className={styles.media}
                          src={getUrl(post.post.media[0].src, 'contents')}
                        />
                      )}

                      <div className={styles['content-details']}>
                        <span className={styles['content-data']}>
                          {getTime(post.savedAt, true)}
                        </span>

                        <span className={styles['content-data']}>
                          <FaPlay className={styles['views-icon']} />
                          {getEngagementValue(post.views)}
                        </span>
                      </div>

                      <div className={styles['engagement-div']}>
                        <span className={styles['engagement-box']}>
                          <FaHeart className={styles['engagement-icon']} />
                          {getEngagementValue(post.likes)}
                        </span>
                        <span className={styles['engagement-box']}>
                          <FaCommentDots
                            className={styles['engagement-icon']}
                          />
                          {getEngagementValue(post.comments)}
                        </span>
                      </div>
                    </article>
                  ))}

                  {postsData.bookmarks.loading === true &&
                    postsData.bookmarks.cursor !== null && (
                      <div className={styles['loader-box']}>
                        <LoadingAnimation
                          style={{
                            width: '2rem',
                            height: '2rem',
                            transform: 'scale(2.5)',
                          }}
                        />
                      </div>
                    )}
                </>
              )}
            </div>

            {/* Liked */}
            <div
              className={`${styles['contents-container']} ${
                category === 'liked' ? styles['show-container'] : ''
              }`}
              style={{ left: '400%' }}
              ref={addToRef(categoryContainerRef, 'liked')}
            >
              {posts.liked === null && postsData.liked.loading === 'error' ? (
                <div className={styles['no-data-text']}>
                  Unable to load liked posts. Check your connection and try
                  again.
                  <div className={styles['error-btn']}>
                    <button onClick={getPosts}>Try again</button>
                  </div>
                </div>
              ) : posts.liked === null && category !== 'liked' ? (
                ''
              ) : posts.liked === null ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className={styles.media} />
                ))
              ) : posts.liked.length === 0 ? (
                <div className={styles['no-data-text']}>
                  You have not liked any post yet.
                </div>
              ) : (
                <>
                  {posts.liked.map((post) => (
                    <article key={post._id} className={styles.content}>
                      {post.postType === 'reel' && (
                        <svg
                          className={styles['reel-icon']}
                          version="1.1"
                          viewBox="0 0 100 100"
                        >
                          <defs></defs>
                          <g
                            style={{
                              stroke: 'none',
                              strokeWidth: 0,
                              strokeDasharray: 'none',
                              strokeLinecap: 'butt',
                              strokeLinejoin: 'miter',
                              strokeMiterlimit: 10,
                              fill: 'none',
                              fillRule: 'nonzero',
                              opacity: 1,
                              transform:
                                'translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)}',
                            }}
                          >
                            <linearGradient
                              id="SVGID_44"
                              gradientUnits="userSpaceOnUse"
                              x1="20.9489"
                              y1="70.2584"
                              x2="72.2486"
                              y2="16.3831"
                            >
                              <stop offset="0%" />
                              <stop offset="50%" />
                              <stop offset="100%" />
                            </linearGradient>
                            <path
                              d="M 61.692 0.878 H 28.307 C 12.699 0.878 0 13.577 0 29.186 v 31.629 c 0 15.608 12.699 28.307 28.307 28.307 h 33.385 C 77.301 89.121 90 76.423 90 60.814 V 29.186 C 90 13.577 77.301 0.878 61.692 0.878 z M 81.6 25.186 H 67.854 L 58.78 8.878 h 2.912 C 71.52 8.878 79.737 15.898 81.6 25.186 z M 39.888 25.186 L 30.815 8.878 h 18.811 l 9.073 16.307 H 39.888 z M 22.186 9.825 l 8.546 15.36 H 8.4 C 9.859 17.913 15.213 12.035 22.186 9.825 z M 61.692 81.121 H 28.307 C 17.11 81.121 8 72.012 8 60.814 V 33.186 h 74 v 27.629 C 82 72.012 72.89 81.121 61.692 81.121 z"
                              style={{
                                stroke: 'none',
                                strokeWidth: 1,
                                strokeDasharray: 'none',
                                strokeLinecap: 'butt',
                                strokeLinejoin: 'miter',
                                strokeMiterlimit: 10,
                                fill: `white`,
                                fillRule: 'nonzero',
                                opacity: 1,
                                transform: ' matrix(1 0 0 1 0 0) ',
                              }}
                              strokeLinecap="round"
                            />
                            <linearGradient
                              id="SVGID_45"
                              gradientUnits="userSpaceOnUse"
                              x1="24.1901"
                              y1="73.3447"
                              x2="75.4898"
                              y2="19.4693"
                            >
                              <stop offset="0%" />
                              <stop offset="50%" />
                              <stop offset="100%" />
                            </linearGradient>
                            <path
                              d="M 56.367 51.97 l -17.41 -9.305 c -2.366 -1.265 -5.227 0.45 -5.227 3.133 v 18.611 c 0 2.683 2.861 4.398 5.227 3.133 l 17.41 -9.305 C 58.871 56.898 58.871 53.309 56.367 51.97 z"
                              style={{
                                stroke: 'none',
                                strokeWidth: 1,
                                strokeDasharray: 'none',
                                strokeLinecap: 'butt',
                                strokeLinejoin: 'miter',
                                strokeMiterlimit: 10,
                                fill: `white`,
                                fillRule: 'nonzero',
                                opacity: 1,
                                transform: ' matrix(1 0 0 1 0 0) ',
                              }}
                              strokeLinecap="round"
                            />
                          </g>
                        </svg>
                      )}

                      {post.postType === 'reel' ? (
                        <video className={styles.media}>
                          <source src={getUrl(post.post.src, 'reels')} />
                          Your browser does not support playing video.
                        </video>
                      ) : post.post.media[0].mediaType === 'video' ? (
                        <video className={styles.media}>
                          <source
                            src={getUrl(post.post.media[0].src, 'contents')}
                          />
                          Your browser does not support playing video.
                        </video>
                      ) : (
                        <img
                          className={styles.media}
                          src={getUrl(post.post.media[0].src, 'contents')}
                        />
                      )}

                      <div className={styles['content-details']}>
                        <span className={styles['content-data']}>
                          {getTime(post.likedAt, true)}
                        </span>

                        <span className={styles['content-data']}>
                          <FaPlay className={styles['views-icon']} />
                          {getEngagementValue(post.views)}
                        </span>
                      </div>

                      <div className={styles['engagement-div']}>
                        <span className={styles['engagement-box']}>
                          <FaHeart className={styles['engagement-icon']} />
                          {getEngagementValue(post.likes)}
                        </span>
                        <span className={styles['engagement-box']}>
                          <FaCommentDots
                            className={styles['engagement-icon']}
                          />
                          {getEngagementValue(post.comments)}
                        </span>
                      </div>
                    </article>
                  ))}

                  {postsData.liked.loading === true &&
                    postsData.liked.cursor !== null && (
                      <div className={styles['loader-box']}>
                        <LoadingAnimation
                          style={{
                            width: '2rem',
                            height: '2rem',
                            transform: 'scale(2.5)',
                          }}
                        />
                      </div>
                    )}
                </>
              )}
            </div>
          </div>

          <div
            className={styles['sort-container']}
            onClick={() => setShowSort(true)}
            ref={sortRef}
          >
            <span className={styles['sort-icon-box']}>
              <BiSort className={styles['sort-icon']} />
            </span>

            {showSort && (
              <div className={styles['sort-div2']}>
                <select
                  className={styles['sort-select2']}
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                >
                  <option value={'latest'}>Latest</option>
                  <option value={'oldest'}>Oldest</option>
                  <option value={'popular'}>Popular</option>
                </select>
              </div>
            )}
          </div>
        </section>

        <Footer page="profile" />
      </section>

      {shareModal && (
        <section
          className={styles['edit-section']}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShareModal(false);
          }}
        >
          <div className={styles['edit-container']}>
            <span className={styles['edit-head']}>
              Share Profile
              <span
                className={styles['close-icon-box']}
                onClick={() => setShareModal(false)}
              >
                <IoClose className={styles['close-icon']} title="Close" />
              </span>
            </span>

            <div className={styles['qrcode-box']}>
              <QRCodeCanvas
                value={profileLink}
                size={200}
                level="Q"
                title="Profile Link"
              />
            </div>

            <span className={styles['link-box']}>
              <input
                className={styles['link-value']}
                value={profileLink}
                readOnly
                ref={inputRef}
              />
              <FaCopy
                className={styles['copy-icon']}
                title="copy"
                onClick={copyLink}
              />
            </span>

            <div className={styles['options-section']}>
              <div
                className={styles['options-container']}
                ref={optionsRef}
                onScroll={handleScroll}
              >
                <span
                  className={`${styles['left-arrow-box']} ${
                    !showArrow.left ? styles['hide-icon'] : ''
                  }`}
                  onClick={() => (optionsRef.current.scrollLeft -= 300)}
                >
                  <MdKeyboardArrowLeft className={styles['left-arrow']} />
                </span>

                <div className={styles['options-div']}>
                  <a
                    href={getAppLink('whatsapp')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles['share-option']}
                  >
                    <img
                      className={styles['option-img']}
                      src="../../assets/images/media/1_Whatsapp2_colored_svg-128.webp"
                    />
                    <span className={styles['share-icon-text']}>Whatsapp</span>
                  </a>

                  <a
                    href={getAppLink('x')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles['share-option']}
                  >
                    <img
                      className={styles['option-img']}
                      src="../../assets/images/media/x-logo-twitter-new-brand-contained-128.webp"
                    />
                    <span className={styles['share-icon-text']}>X</span>
                  </a>

                  <a
                    href={getAppLink('facebook')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles['share-option']}
                  >
                    <img
                      className={styles['option-img']}
                      src="../../assets/images/media/Colored_Facebook3_svg-128.webp"
                    />
                    <span className={styles['share-icon-text']}>Facebook</span>
                  </a>

                  <a
                    href={getAppLink('telegram')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles['share-option']}
                  >
                    <img
                      className={styles['option-img']}
                      src="../../assets/images/media/telegram-64.webp"
                    />
                    <span className={styles['share-icon-text']}>Telegram</span>
                  </a>

                  <a
                    href={getAppLink('email')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles['share-option']}
                  >
                    <img
                      className={styles['option-img']}
                      src="../../assets/images/media/112-gmail_email_mail-64.webp"
                    />
                    <span className={styles['share-icon-text']}>Email</span>
                  </a>

                  <a
                    href={getAppLink('messenger')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles['share-option']}
                  >
                    <img
                      className={styles['option-img']}
                      src="../../assets/images/media/social-facebook-messenger-square2-64.webp"
                    />
                    <span className={styles['share-icon-text']}>Messenger</span>
                  </a>

                  <a
                    href={getAppLink('snapchat')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles['share-option']}`}
                  >
                    <img
                      className={styles['option-img']}
                      src="../../assets/images/media/1_Snapchat_colored_svg-64.webp"
                    />
                    <span className={styles['share-icon-text']}>Snapchat</span>
                  </a>

                  <a
                    href={getAppLink('reddit')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles['share-option']}`}
                  >
                    <img
                      className={styles['option-img']}
                      src="../../assets/images/media/reddit.webp"
                    />
                    <span className={styles['share-icon-text']}>Reddit</span>
                  </a>

                  <a
                    href={getAppLink('sms')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles['share-option']} ${styles['last-option']}`}
                  >
                    <img
                      className={styles['option-img']}
                      src="../../assets/images/media/sms.webp"
                    />
                    <span className={styles['share-icon-text']}>SMS</span>
                  </a>
                </div>

                <span
                  className={`${styles['right-arrow-box']} ${
                    !showArrow.right ? styles['hide-icon'] : ''
                  }`}
                  onClick={() => (optionsRef.current.scrollLeft += 300)}
                >
                  <MdKeyboardArrowRight className={styles['right-arrow']} />
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {mobileMenu && (
        <section
          className={styles['menu-section']}
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileMenu(false);
          }}
        >
          <ul className={styles['menu-list']} ref={listRef}>
            <li
              className={styles['menu-item']}
              onClick={() => navigate('/inbox')}
            >
              <BiMessageDetail className={styles['menu-item-icon']} /> Inbox
            </li>
            <li
              className={styles['menu-item']}
              onClick={() => navigate('/notifications')}
            >
              <IoMdNotificationsOutline className={styles['menu-item-icon']} />
              Notifications
            </li>
            <li
              className={styles['menu-item']}
              onClick={() => navigate('/history')}
            >
              <MdOutlineHistory className={styles['menu-item-icon']} />
              Watch History
            </li>
            <li
              className={styles['menu-item']}
              onClick={() => navigate('/analytics')}
            >
              <TbBrandGoogleAnalytics className={styles['menu-item-icon']} />
              Analytics
            </li>
            <li
              className={styles['menu-item']}
              onClick={() => navigate('/settings')}
            >
              <IoSettingsOutline className={styles['menu-item-icon']} />
              Settings
            </li>
          </ul>
        </section>
      )}

      {engagementModal && (
        <Engagements value={engagementModal} setValue={setEngagementModal} />
      )}

      {switchAccount && <SwitchAccount setSwitchAccount={setSwitchAccount} />}
    </>
  );
};
export default Profile;
