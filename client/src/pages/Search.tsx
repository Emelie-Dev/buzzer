import { useState, useEffect, useRef, useContext } from 'react';
import NavBar from '../components/NavBar';
import styles from '../styles/Search.module.css';
import { HiPlus } from 'react-icons/hi';
import { PiCheckFatFill } from 'react-icons/pi';
import { FaPlay } from 'react-icons/fa6';
import SwitchAccount from '../components/SwitchAccount';
import AsideHeader from '../components/AsideHeader';
import { IoClose, IoSearchSharp, IoArrowBack } from 'react-icons/io5';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext, GeneralContext } from '../Contexts';
import { MdOutlineHourglassEmpty, MdOutlineWifiOff } from 'react-icons/md';
import LoadingAnimation from '../components/LoadingAnimation';
import Skeleton from 'react-loading-skeleton';
import {
  apiClient,
  getEngagementValue,
  getTime,
  getUrl,
  parseHTML,
} from '../Utilities';
import { toast } from 'sonner';
import { TbHourglassEmpty } from 'react-icons/tb';

const mediumSize = window.matchMedia('(max-width: 1100px)').matches;

const Search = () => {
  const location = useLocation();
  const { setUser } = useContext(AuthContext);
  const searchQuery = new URLSearchParams(location.search).get('q');
  const [isMediumSize, setIsMediumSize] = useState<boolean>(mediumSize);
  const [category, setCategory] = useState<'all' | 'users' | 'contents'>('all');
  const [switchAccount, setSwitchAccount] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>(searchQuery || '');
  const [overlaySearch, setOverlaySearch] = useState<boolean>(false);
  const [result, setResult] = useState<{
    users: any[];
    posts: any[];
    topUsers: any[];
  }>({
    users: [],
    posts: [],
    topUsers: [],
  });
  const [loading, setLoading] = useState<boolean | 'error' | 'empty'>(true);
  const [resultData, setResultData] = useState({
    users: false,
    posts: false,
    page: 1,
  });
  const [skeletonDim, setSkeletonDim] = useState(70);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followData, setFollowData] = useState<{
    queue: Set<string>;
    list: Set<string>;
  }>({
    queue: new Set(),
    list: new Set(),
  });

  const { setShowSearchPage } = useContext(GeneralContext);

  const navigate = useNavigate();

  const searchInputRef = useRef<HTMLInputElement>(null!);
  const containerRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    document.title = 'Buzzer - Search';

    const resizeHandler = () => {
      const mediumSize = window.matchMedia('(max-width: 1100px)').matches;
      setIsMediumSize(mediumSize);

      if (window.matchMedia('(max-width: 600px)').matches) {
        setSkeletonDim(50);
      } else if (window.matchMedia('(max-width: 1000px)').matches) {
        setSkeletonDim(60);
      } else {
        setSkeletonDim(70);
      }
    };

    resizeHandler();

    window.addEventListener('resize', resizeHandler);

    return () => {
      setShowSearchPage(false);
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  useEffect(() => {
    if (loading === true) getSearchResult();
  }, [loading]);

  useEffect(() => {
    const container =
      containerRef.current.children[
        category === 'all' ? 0 : category === 'users' ? 1 : 2
      ];
    const isFinished =
      category === 'all'
        ? resultData.users && resultData.posts
        : category === 'contents'
          ? resultData.posts
          : resultData.users;
    const data =
      category === 'all'
        ? [...result.users, ...result.posts]
        : category === 'contents'
          ? result.posts
          : result.users;

    if (
      loading === false &&
      data.length > 0 &&
      container &&
      container.scrollHeight <= container.clientHeight &&
      !isFinished
    ) {
      setResultData({ ...resultData, page: resultData.page + 1 });
      setLoading(true);
    }
  }, [result, category]);

  useEffect(() => {
    setResult({
      users: [],
      posts: [],
      topUsers: [],
    });
    setResultData({
      users: false,
      posts: false,
      page: 1,
    });
    setFollowersList([]);
    setFollowData({
      queue: new Set(),
      list: new Set(),
    });
    setCategory('all');
    setSearchText(searchQuery || '');
    containerRef.current.children[0].scrollIntoView();
    setLoading(true);
  }, [location.search]);

  const getSearchResult = async () => {
    if (!searchQuery || searchQuery.trim() === '') {
      return setLoading('empty');
    }

    try {
      const { data } = await apiClient(
        `v1/search?query=${searchQuery}&page=${resultData.page}`,
      );

      let { users, posts } = data.data.results;
      const dataLength = data.data.dataLength;

      setUser(data.data.user);

      users = users.filter(
        (user: any) => !result.users.find((data) => data._id === user._id),
      );
      posts = posts.filter(
        (post: any) => !result.posts.find((data) => data._id === post._id),
      );

      setResult((prev) => ({
        topUsers: resultData.page === 1 ? users.slice(0, 3) : prev.topUsers,
        users: resultData.page === 1 ? users : [...prev.users, ...users],
        posts: resultData.page === 1 ? posts : [...prev.posts, ...posts],
      }));
      setResultData((prev) => ({
        ...prev,
        users: dataLength.users < 20,
        posts: dataLength.posts < 10,
      }));

      const list = users
        .map((user: any) => user.followObj)
        .filter((obj: any) => obj);

      setFollowersList((prev) => [...prev, ...list]);
      setFollowData((prev) => ({
        ...prev,
        list: new Set([
          ...prev.list,
          ...list.map((user: any) => user.following),
        ]),
      }));

      setLoading(false);
    } catch {
      toast.error('Could not get search results.');

      setLoading('error');
    }
  };

  const handleScroll =
    (type: 'top' | 'users' | 'posts') => (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;

      const isBottom =
        target.scrollTop + target.clientHeight >= target.scrollHeight - 100;

      const isFinished =
        type === 'top'
          ? resultData.users && resultData.posts
          : resultData[type];

      if (isBottom && !isFinished && loading !== true) {
        setResultData({
          ...resultData,
          page: loading === false ? resultData.page + 1 : resultData.page,
        });
        setLoading(true);
      }
    };

  const handleFollow =
    (id: string, action: 'follow' | 'unfollow') =>
    async (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
      e.preventDefault();

      if (followData.queue.has(id)) return;

      const newList = new Set(followData.queue).add(id);
      setFollowData((prev) => ({ ...prev, queue: newList }));

      try {
        if (action === 'follow') {
          const { data } = await apiClient.post(`v1/follow/${id}`);
          const follow = data.data.follow;

          setFollowersList((prevValue) => [...prevValue, follow]);
          setFollowData((prev) => ({ ...prev, list: prev.list.add(id) }));
        } else {
          const followId = followersList.find(
            (data) => data.following === id,
          )._id;
          await apiClient.delete(`v1/follow/${followId}`);

          const list = new Set(followData.list);
          list.delete(id);

          setFollowersList((prevValue) =>
            prevValue.filter((follow) => follow._id !== followId),
          );
          setFollowData((prev) => ({ ...prev, list }));
        }
      } catch {
        toast.error(`Could not ${action} user. Please Try again.`);
      } finally {
        newList.delete(id);
        setFollowData((prev) => ({ ...prev, queue: new Set(newList) }));
      }
    };

  const followersCount = (user: any) => {
    let count = user.followers;

    count = user.followObj
      ? !followData.list.has(user._id)
        ? (count -= 1)
        : count
      : followData.list.has(user._id)
        ? (count += 1)
        : count;

    return count;
  };

  return (
    <>
      <NavBar
        page="search"
        overlaySearch={overlaySearch}
        setOverlaySearch={setOverlaySearch}
      />

      <section className={styles.section}>
        <header className={styles['section-header']}>
          <div className={styles['show-search-div']}>
            <IoArrowBack
              className={styles['back-icon']}
              onClick={() => navigate(-1)}
            />

            <div className={styles['search-box']}>
              <IoSearchSharp className={styles['search-icon']} />
              <input
                type="text"
                className={styles['search-input']}
                placeholder="Search...."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                ref={searchInputRef}
                onClick={() => setOverlaySearch(true)}
                onFocus={() => setOverlaySearch(true)}
              />

              <IoClose
                className={`${styles['close-search-icon']} ${
                  searchText.trim().length < 1 ? styles['hide-search'] : ''
                }`}
                title="Clear"
                onClick={() => {
                  setSearchText('');
                  searchInputRef.current.focus();
                }}
              />
            </div>
          </div>

          <ul className={styles['header-list']}>
            <li
              className={`${styles['header-item']} ${
                category === 'all' ? styles['active-item'] : ''
              }`}
              onClick={() => {
                setCategory('all');
                containerRef.current.children[0].scrollIntoView();
              }}
            >
              Top Results
            </li>
            <li
              className={`${styles['header-item']} ${
                category === 'users' ? styles['active-item'] : ''
              }`}
              onClick={() => {
                setCategory('users');
                containerRef.current.children[1].scrollIntoView();
              }}
            >
              Users
            </li>
            <li
              className={`${styles['header-item']} ${
                category === 'contents' ? styles['active-item'] : ''
              }`}
              onClick={() => {
                setCategory('contents');
                containerRef.current.children[2].scrollIntoView();
              }}
            >
              Contents
            </li>
          </ul>

          {!isMediumSize && <AsideHeader second />}
        </header>

        <div className={styles['main-container']} ref={containerRef}>
          <div
            className={styles['top-result-container']}
            onScroll={handleScroll('top')}
          >
            {loading === 'empty' ? (
              <div className={styles['error-div']}>
                <MdOutlineHourglassEmpty className={styles['empty-icon']} />
                <span>No search query provided!</span>
              </div>
            ) : [...result.posts, ...result.users].length === 0 ? (
              loading === true ? (
                <div className={styles['top-skeleton-container']}>
                  <div className={styles['top-users-skeleton-container']}>
                    <div className={styles['top-users-skeleton-item']}>
                      <div className={styles['top-users-skeleton-profile']}>
                        <Skeleton
                          circle
                          width={skeletonDim}
                          height={skeletonDim}
                        />
                        <div
                          className={
                            styles['top-users-skeleton-profile-details']
                          }
                        >
                          <Skeleton width={'100%'} height={15} />
                          <Skeleton width={'100%'} height={15} />
                          <Skeleton width={'100%'} height={15} />
                        </div>
                      </div>
                      <div className={styles['top-users-skeleton-item-media']}>
                        <Skeleton width={'100%'} height={120} />
                        <Skeleton width={'100%'} height={120} />
                      </div>
                    </div>
                    <div className={styles['top-users-skeleton-item']}>
                      <div className={styles['top-users-skeleton-profile']}>
                        <Skeleton
                          circle
                          width={skeletonDim}
                          height={skeletonDim}
                        />
                        <div
                          className={
                            styles['top-users-skeleton-profile-details']
                          }
                        >
                          <Skeleton width={'100%'} height={15} />
                          <Skeleton width={'100%'} height={15} />
                          <Skeleton width={'100%'} height={15} />
                        </div>
                      </div>
                      <div className={styles['top-users-skeleton-item-media']}>
                        <Skeleton width={'100%'} height={120} />
                        <Skeleton width={'100%'} height={120} />
                      </div>
                    </div>
                    <div className={styles['top-users-skeleton-item']}>
                      <div className={styles['top-users-skeleton-profile']}>
                        <Skeleton
                          circle
                          width={skeletonDim}
                          height={skeletonDim}
                        />
                        <div
                          className={
                            styles['top-users-skeleton-profile-details']
                          }
                        >
                          <Skeleton width={'100%'} height={15} />
                          <Skeleton width={'100%'} height={15} />
                          <Skeleton width={'100%'} height={15} />
                        </div>
                      </div>
                      <div className={styles['top-users-skeleton-item-media']}>
                        <Skeleton width={'100%'} height={120} />
                        <Skeleton width={'100%'} height={120} />
                      </div>
                    </div>
                  </div>
                  <div className={styles['top-contents-skeleton-container']}>
                    <div className={styles['top-contents-skeleton-item']}>
                      <div
                        className={styles['top-contents-skeleton-item-profile']}
                      >
                        <Skeleton inline circle height={50} width={50} />
                        <Skeleton width={'100%'} height={30} />
                      </div>

                      <Skeleton height={230} />
                      <Skeleton height={40} />
                    </div>
                    <div className={styles['top-contents-skeleton-item']}>
                      <div
                        className={styles['top-contents-skeleton-item-profile']}
                      >
                        <Skeleton inline circle height={50} width={50} />
                        <Skeleton width={'100%'} height={30} />
                      </div>

                      <Skeleton height={230} />
                      <Skeleton height={40} />
                    </div>
                    <div className={styles['top-contents-skeleton-item']}>
                      <div
                        className={styles['top-contents-skeleton-item-profile']}
                      >
                        <Skeleton inline circle height={50} width={50} />
                        <Skeleton width={'100%'} height={30} />
                      </div>

                      <Skeleton height={230} />
                      <Skeleton height={40} />
                    </div>
                  </div>
                </div>
              ) : loading === 'error' ? (
                <div className={styles['error-div']}>
                  <MdOutlineWifiOff className={styles['empty-icon']} />
                  <span>Could not get search results.</span>
                  <button
                    className={styles['error-btn']}
                    onClick={getSearchResult}
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div className={styles['error-div']}>
                  <TbHourglassEmpty className={styles['empty-icon2']} />
                  <span>
                    No result found for <b>"{searchQuery}"</b>
                  </span>
                </div>
              )
            ) : (
              <>
                {result.users.length > 0 && (
                  <div className={styles['users-container']}>
                    <span className={styles['users-container-head']}>
                      Users
                    </span>

                    <div className={styles['users-div']}>
                      {result.topUsers.slice(0, 3).map((user: any) => (
                        <article key={user._id} className={styles.user}>
                          <Link
                            className={styles['user-content']}
                            to={`/@${user.username}`}
                          >
                            <span className={styles['user-img-box']}>
                              <img
                                className={styles['user-img']}
                                src={getUrl(user.photo, 'users')}
                              />

                              {followData.list.has(user._id) ? (
                                <span
                                  className={styles['follow-icon-box2']}
                                  onClick={handleFollow(user._id, 'unfollow')}
                                >
                                  <PiCheckFatFill
                                    className={styles['follow-icon2']}
                                  />
                                </span>
                              ) : (
                                <span
                                  className={styles['follow-icon-box']}
                                  onClick={handleFollow(user._id, 'follow')}
                                >
                                  <HiPlus className={styles['follow-icon']} />
                                </span>
                              )}
                            </span>

                            <div className={styles['user-details']}>
                              <span className={styles['user-name']}>
                                {user.name || <>&nbsp;</>}
                              </span>
                              <span className={styles['user-handle']}>
                                @{user.username}
                              </span>
                              <span className={styles['user-followers']}>
                                <span className={styles['user-follower-count']}>
                                  {getEngagementValue(followersCount(user))}
                                </span>{' '}
                                Follower
                                {followersCount(user) !== 1 && 's'}
                              </span>
                            </div>
                          </Link>

                          <div
                            className={`${
                              user.posts.length > 1
                                ? styles['user-latest-content']
                                : styles['user-latest-content2']
                            } `}
                          >
                            {user.posts.map((post: any) => {
                              return post.media ? (
                                post.media[0].mediaType === 'video' ? (
                                  <div key={post._id}>
                                    <video
                                      className={styles['user-latest-img']}
                                      muted
                                    >
                                      <source
                                        src={getUrl(
                                          post.media[0].src,
                                          'contents',
                                        )}
                                      />
                                      Your browser does not support playing
                                      video.
                                    </video>

                                    <time className={styles['content-time']}>
                                      {getTime(post.createdAt, true)}
                                    </time>
                                  </div>
                                ) : (
                                  <div key={post._id}>
                                    <img
                                      className={styles['user-latest-img']}
                                      src={getUrl(
                                        post.media[0].src,
                                        'contents',
                                      )}
                                    />
                                    <time className={styles['content-time']}>
                                      {getTime(post.createdAt, true)}
                                    </time>
                                  </div>
                                )
                              ) : (
                                <div key={post._id}>
                                  <video
                                    className={styles['user-latest-img']}
                                    muted
                                  >
                                    <source src={getUrl(post.src, 'reels')} />
                                    Your browser does not support playing video.
                                  </video>
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
                                        y1="skeletonDim.2584"
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
                                  <time className={styles['content-time']}>
                                    {getTime(post.createdAt, true)}
                                  </time>
                                </div>
                              );
                            })}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                {result.posts.length > 0 && (
                  <div className={styles['contents-container']}>
                    <span className={styles['users-container-head']}>
                      Contents
                    </span>

                    <div className={styles['contents-div']}>
                      {result.posts.map((post) => (
                        <article key={post._id} className={styles.content}>
                          <Link
                            className={styles['content-name']}
                            to={`/@${post.owner.username}`}
                          >
                            <img
                              className={styles['content-img']}
                              src={getUrl(post.owner.photo, 'users')}
                            />

                            <span className={styles['content-handle']}>
                              {post.owner.username}
                            </span>
                          </Link>

                          <div className={styles['content-item-box']}>
                            {post.type === 'content' ? (
                              post.media[0].mediaType === 'video' ? (
                                <video className={styles['content-item']} muted>
                                  <source
                                    src={getUrl(post.media[0].src, 'contents')}
                                  />
                                  Your browser does not support playing video.
                                </video>
                              ) : (
                                <img
                                  className={styles['content-item']}
                                  src={getUrl(post.media[0].src, 'contents')}
                                />
                              )
                            ) : (
                              <video className={styles['content-item']} muted>
                                <source src={getUrl(post.src, 'reels')} />
                                Your browser does not support playing video.
                              </video>
                            )}

                            <time className={styles['content-time']}>
                              {getTime(post.createdAt, true)}
                            </time>
                            <span className={styles['content-views']}>
                              <FaPlay
                                className={styles['content-views-icon']}
                              />
                              {getEngagementValue(post.views)}
                            </span>
                          </div>

                          <div className={styles['content-description']}>
                            {parseHTML(post.description || '')}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                {resultData.page > 1 && loading === true && (
                  <div className={styles['loading-box']}>
                    <LoadingAnimation
                      style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        transform: 'scale(2.5)',
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <div
            className={`${styles['users-category-container']} ${
              result.users.length > 0 ? styles['users-category-container2'] : ''
            }`}
          >
            {loading === 'empty' ? (
              <div className={styles['error-div']}>
                <MdOutlineHourglassEmpty className={styles['empty-icon']} />
                <span>No search query provided!</span>
              </div>
            ) : result.users.length === 0 ? (
              loading === true ? (
                <div className={styles['users-skeleton-container']}>
                  <div>
                    <Skeleton circle width={skeletonDim} height={skeletonDim} />
                    <div className={styles['user-details-skeleton']}>
                      <Skeleton height={15} />
                      <Skeleton height={15} />
                      <Skeleton height={15} />
                    </div>

                    <Skeleton width={100} height={35} />
                  </div>
                  <div>
                    <Skeleton circle width={skeletonDim} height={skeletonDim} />
                    <div className={styles['user-details-skeleton']}>
                      <Skeleton height={15} />
                      <Skeleton height={15} />
                      <Skeleton height={15} />
                    </div>

                    <Skeleton width={100} height={35} />
                  </div>
                  <div>
                    <Skeleton circle width={skeletonDim} height={skeletonDim} />
                    <div className={styles['user-details-skeleton']}>
                      <Skeleton height={15} />
                      <Skeleton height={15} />
                      <Skeleton height={15} />
                    </div>

                    <Skeleton width={100} height={35} />
                  </div>
                  <div>
                    <Skeleton circle width={skeletonDim} height={skeletonDim} />
                    <div className={styles['user-details-skeleton']}>
                      <Skeleton height={15} />
                      <Skeleton height={15} />
                      <Skeleton height={15} />
                    </div>

                    <Skeleton width={100} height={35} />
                  </div>
                  <div>
                    <Skeleton circle width={skeletonDim} height={skeletonDim} />
                    <div className={styles['user-details-skeleton']}>
                      <Skeleton height={15} />
                      <Skeleton height={15} />
                      <Skeleton height={15} />
                    </div>

                    <Skeleton width={100} height={35} />
                  </div>
                  <div>
                    <Skeleton circle width={skeletonDim} height={skeletonDim} />
                    <div className={styles['user-details-skeleton']}>
                      <Skeleton height={15} />
                      <Skeleton height={15} />
                      <Skeleton height={15} />
                    </div>

                    <Skeleton width={100} height={35} />
                  </div>
                </div>
              ) : loading === 'error' ? (
                <div className={styles['error-div']}>
                  <MdOutlineWifiOff className={styles['empty-icon']} />
                  <span>Could not get search results.</span>
                  <button
                    className={styles['error-btn']}
                    onClick={getSearchResult}
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div className={styles['error-div']}>
                  <TbHourglassEmpty className={styles['empty-icon2']} />
                  <span>
                    No result found for <b>"{searchQuery}"</b>
                  </span>
                </div>
              )
            ) : (
              <>
                {result.users.map((user) => (
                  <Link
                    key={user._id}
                    className={styles['user-category-item']}
                    to={`/@${user.username}`}
                  >
                    <img
                      className={styles['user-img']}
                      src={getUrl(user.photo, 'users')}
                    />
                    <div className={styles['user-details2']}>
                      <span className={styles['user-name']}>
                        {user.name || <>&nbsp;</>}
                      </span>
                      <span className={styles['user-handle']}>
                        @{user.username}
                      </span>
                      <span className={styles['user-followers']}>
                        <span className={styles['user-follower-count']}>
                          {getEngagementValue(followersCount(user))}{' '}
                        </span>
                        Follower
                        {followersCount(user) !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <span
                      className={styles['following-box']}
                      onClick={handleFollow(user._id, 'unfollow')}
                    >
                      {followData.list.has(user._id) ? (
                        <span className={styles['following-txt']}>
                          Following
                        </span>
                      ) : (
                        <button
                          className={styles['follow-btn']}
                          onClick={handleFollow(user._id, 'follow')}
                        >
                          Follow
                        </button>
                      )}
                    </span>
                  </Link>
                ))}

                {resultData.page > 1 && loading === true && (
                  <div className={styles['loading-box']}>
                    <LoadingAnimation
                      style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        transform: 'scale(2.5)',
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <div className={styles['contents-section']}>
            <div
              className={`${styles['contents-div']} ${
                result.posts.length > 0 ? styles['contents-div2'] : ''
              }`}
            >
              {loading === 'empty' ? (
                <div className={styles['error-div']}>
                  <MdOutlineHourglassEmpty className={styles['empty-icon']} />
                  <span>No search query provided!</span>
                </div>
              ) : result.posts.length === 0 ? (
                loading === true ? (
                  <div className={styles['contents-skeleton-container']}>
                    <div className={styles['top-contents-skeleton-item']}>
                      <div
                        className={styles['top-contents-skeleton-item-profile']}
                      >
                        <Skeleton inline circle height={50} width={50} />
                        <Skeleton width={'100%'} height={30} />
                      </div>

                      <Skeleton height={230} />
                      <Skeleton height={40} />
                    </div>
                    <div className={styles['top-contents-skeleton-item']}>
                      <div
                        className={styles['top-contents-skeleton-item-profile']}
                      >
                        <Skeleton inline circle height={50} width={50} />
                        <Skeleton width={'100%'} height={30} />
                      </div>

                      <Skeleton height={230} />
                      <Skeleton height={40} />
                    </div>
                    <div className={styles['top-contents-skeleton-item']}>
                      <div
                        className={styles['top-contents-skeleton-item-profile']}
                      >
                        <Skeleton inline circle height={50} width={50} />
                        <Skeleton width={'100%'} height={30} />
                      </div>

                      <Skeleton height={230} />
                      <Skeleton height={40} />
                    </div>
                    <div className={styles['top-contents-skeleton-item']}>
                      <div
                        className={styles['top-contents-skeleton-item-profile']}
                      >
                        <Skeleton inline circle height={50} width={50} />
                        <Skeleton width={'100%'} height={30} />
                      </div>

                      <Skeleton height={230} />
                      <Skeleton height={40} />
                    </div>
                    <div className={styles['top-contents-skeleton-item']}>
                      <div
                        className={styles['top-contents-skeleton-item-profile']}
                      >
                        <Skeleton inline circle height={50} width={50} />
                        <Skeleton width={'100%'} height={30} />
                      </div>

                      <Skeleton height={230} />
                      <Skeleton height={40} />
                    </div>
                    <div className={styles['top-contents-skeleton-item']}>
                      <div
                        className={styles['top-contents-skeleton-item-profile']}
                      >
                        <Skeleton inline circle height={50} width={50} />
                        <Skeleton width={'100%'} height={30} />
                      </div>

                      <Skeleton height={230} />
                      <Skeleton height={40} />
                    </div>
                  </div>
                ) : loading === 'error' ? (
                  <div className={styles['error-div']}>
                    <MdOutlineWifiOff className={styles['empty-icon']} />
                    <span>Could not get search results.</span>
                    <button
                      className={styles['error-btn']}
                      onClick={getSearchResult}
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <div className={styles['error-div']}>
                    <TbHourglassEmpty className={styles['empty-icon2']} />
                    <span>
                      No result found for <b>"{searchQuery}"</b>
                    </span>
                  </div>
                )
              ) : (
                result.posts.map((post) => (
                  <article key={post._id} className={styles.content}>
                    <Link
                      className={styles['content-name']}
                      to={`/@${post.owner.username}`}
                    >
                      <img
                        className={styles['content-img']}
                        src={getUrl(post.owner.photo, 'users')}
                      />

                      <span className={styles['content-handle']}>
                        {post.owner.username}
                      </span>
                    </Link>

                    <div className={styles['content-item-box']}>
                      {post.type === 'content' ? (
                        post.media[0].mediaType === 'video' ? (
                          <video className={styles['content-item']} muted>
                            <source
                              src={getUrl(post.media[0].src, 'contents')}
                            />
                            Your browser does not support playing video.
                          </video>
                        ) : (
                          <img
                            className={styles['content-item']}
                            src={getUrl(post.media[0].src, 'contents')}
                          />
                        )
                      ) : (
                        <video className={styles['content-item']} muted>
                          <source src={getUrl(post.src, 'reels')} />
                          Your browser does not support playing video.
                        </video>
                      )}

                      <time className={styles['content-time']}>
                        {getTime(post.createdAt, true)}
                      </time>
                      <span className={styles['content-views']}>
                        <FaPlay className={styles['content-views-icon']} />
                        {getEngagementValue(post.views)}
                      </span>
                    </div>

                    <div className={styles['content-description']}>
                      {parseHTML(post.description || '')}
                    </div>
                  </article>
                ))
              )}
            </div>

            {resultData.page > 1 && loading === true && (
              <div className={styles['loading-box']}>
                <LoadingAnimation
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    transform: 'scale(2.5)',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {switchAccount && <SwitchAccount setSwitchAccount={setSwitchAccount} />}
    </>
  );
};

export default Search;
