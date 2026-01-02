import { useEffect, useState } from 'react';
import styles from '../styles/ContentAnalytics.module.css';
import { PeriodComponent } from './PeriodComponent';
import { IoClose } from 'react-icons/io5';
import { FaSortAmountUp, FaSortAmountDown } from 'react-icons/fa';
import { apiClient, getDate, getEngagementValue, getUrl } from '../Utilities';
import { toast } from 'sonner';
import LoadingAnimation from './LoadingAnimation';

type ContentAnalyticsProps = {
  sectionRef: React.MutableRefObject<HTMLDivElement>;
};

const ContentAnalytics = ({ sectionRef }: ContentAnalyticsProps) => {
  const [viewData, setViewData] = useState<boolean>(false);
  const [period, setPeriod] = useState<{
    value: '1y' | '1m' | '1w' | '1d' | 'all' | 'custom';
    custom: {
      start: string;
      end: string;
    };
    done: boolean;
  }>({
    value: 'all',
    custom: {
      start: null!,
      end: null!,
    },
    done: true,
  });
  const [sort, setSort] = useState<'likes' | 'views' | 'createdAt'>(
    'createdAt'
  );
  const [order, setOrder] = useState<'up' | 'down'>('down');
  const [posts, setPosts] = useState<{ value: any[]; count: number }>({
    value: [],
    count: 0,
  });
  const [postsData, setPostsData] = useState<{
    loading: boolean | 'error';
    end: boolean;
    cursor: Date;
    likes: number;
    views: number;
  }>({ loading: true, end: false, cursor: null!, likes: null!, views: null! });
  const [postInfo, setPostInfo] = useState<{
    id: string;
    type: 'content' | 'reel';
    value: any;
  }>({ id: null!, type: null!, value: {} });

  useEffect(() => {
    const container = sectionRef.current;

    if (container) {
      container.removeEventListener('scroll', handleScroll);
      container.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [postsData, posts, sectionRef]);

  useEffect(() => {
    if (postsData.loading === true) getPosts();
  }, [postsData.loading]);

  useEffect(() => {
    if (period.value === 'custom') {
      if (period.done) {
        setPostsData({
          loading: true,
          end: false,
          cursor: null!,
          likes: null!,
          views: null!,
        });
        setPosts({ value: [], count: 0 });
      }
    } else {
      setPostsData({
        loading: true,
        end: false,
        cursor: null!,
        likes: null!,
        views: null!,
      });
      setPosts({ value: [], count: 0 });
    }
  }, [period]);

  useEffect(() => {
    setPostsData({
      loading: true,
      end: false,
      cursor: null!,
      likes: null!,
      views: null!,
    });
    setPosts({ value: [], count: 0 });
  }, [sort, order]);

  useEffect(() => {
    if (postInfo.value === null) getPostInfo();
  }, [postInfo.value]);

  const getPosts = async () => {
    try {
      const { data } = await apiClient.post('v1/analytics/posts', {
        sort,
        period: period.value === 'custom' ? period.custom : period.value,
        order,
        cursor: postsData.cursor,
        likes: postsData.likes,
        views: postsData.views,
      });
      const result: any[] = data.data.posts;
      const count = data.data.count;

      setPosts((prev) => {
        const arr = result.filter(
          (obj) => !prev.value.find((data) => data._id === obj._id)
        );

        return { value: [...prev.value, ...arr], count };
      });
      setPostsData((prev) => ({
        ...prev,
        loading: false,
        end: result.length < 20,
      }));
    } catch {
      setPostsData((prev) => ({
        ...prev,
        loading: 'error',
      }));
      return toast.error('Could not get posts.');
    }
  };

  const handleScroll = () => {
    const target = sectionRef.current;
    const isBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 50;

    if (isBottom && !postsData.end && postsData.loading !== true) {
      setPostsData((prev) => {
        return {
          ...prev,
          loading: true,
          cursor:
            prev.loading === 'error'
              ? prev.cursor
              : posts.value[posts.value.length - 1]?.createdAt,
          likes:
            prev.loading === 'error'
              ? prev.likes
              : posts.value[posts.value.length - 1]?.likes,
          views:
            prev.loading === 'error'
              ? prev.views
              : posts.value[posts.value.length - 1]?.views,
        };
      });
    }
  };

  const getPostInfo = async () => {
    try {
      const { data } = await apiClient(
        `v1/analytics/posts/${postInfo.id}?type=${postInfo.type}`
      );

      setPostInfo((prev) => ({ ...prev, value: data.data.stats }));
    } catch {
      setPostInfo((prev) => ({ ...prev, value: 'error' }));
      return toast.error('Could not get post data.');
    }
  };

  const getTimeString = (time: number) => {
    const timeValue = +time;

    const hour = Math.trunc(timeValue / 3600);
    const minute = Math.trunc((timeValue - hour * 3600) / 60);
    const seconds = timeValue - hour * 3600 - minute * 60;

    return `${hour}h:${String(minute).padStart(2, '0')}m:${String(
      seconds
    ).padStart(2, '0')}s`;
  };

  return (
    <>
      <section className={styles.section}>
        <header className={styles.header}>
          <div className={styles['post-count-box']}>
            <span>Post Count:</span>
            <span>{posts.count}</span>
          </div>

          <div className={styles['header-box']}>
            <PeriodComponent period={period} setPeriod={setPeriod} />

            <div className={styles['select-box']}>
              <span className={styles['period-text']}>Sort By:</span>

              <select
                className={styles['period-select']}
                value={sort}
                onChange={(e) =>
                  setSort(e.target.value as 'likes' | 'views' | 'createdAt')
                }
              >
                <option value={'createdAt'}>Default</option>
                <option value={'views'}>Views</option>
                <option value={'likes'}>Likes</option>
              </select>
            </div>
          </div>
        </header>

        <div className={styles['table-container']}>
          {posts.value.length === 0 && postsData.loading === true ? (
            <div className={styles['no-data-text']}>
              <LoadingAnimation
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  transform: 'scale(2.5)',
                }}
              />
            </div>
          ) : posts.value.length === 0 && postsData.loading === 'error' ? (
            <div className={styles['no-data-text']}>
              Unable to load posts. Check your connection and try again.
              <div className={styles['error-btn']}>
                <button
                  onClick={() => {
                    setPostsData((prev) => ({
                      ...prev,
                      loading: true,
                    }));
                  }}
                >
                  Try again
                </button>
              </div>
            </div>
          ) : posts.value.length === 0 ? (
            <>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.thead}>
                    <th className={styles['table-head']}>
                      <span className={styles['sort-box']}>
                        {order === 'up' ? (
                          <FaSortAmountDown
                            className={styles['sort-icon']}
                            title="Sort Descending"
                            onClick={() => setOrder('down')}
                          />
                        ) : (
                          <FaSortAmountUp
                            className={styles['sort-icon']}
                            title="Sort Ascending"
                            onClick={() => setOrder('up')}
                          />
                        )}
                        S/N
                      </span>
                    </th>
                    <th className={styles['table-head']}>Post</th>
                    <th className={styles['table-head']}>
                      {sort === 'likes' ? 'Likes' : 'Views'}
                    </th>
                    <th className={styles['table-head']}>Date Posted</th>
                    <th className={styles['table-head']}>Action</th>
                  </tr>
                </thead>
              </table>

              <div className={styles['no-data-text']}>
                {period.value === 'all'
                  ? 'You have not created any post yet.'
                  : 'No posts for the selected period.'}
              </div>
            </>
          ) : (
            <>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.thead}>
                    <th className={styles['table-head']}>
                      <span className={styles['sort-box']}>
                        {order === 'up' ? (
                          <FaSortAmountDown
                            className={styles['sort-icon']}
                            title="Sort Descending"
                            onClick={() => setOrder('down')}
                          />
                        ) : (
                          <FaSortAmountUp
                            className={styles['sort-icon']}
                            title="Sort Ascending"
                            onClick={() => setOrder('up')}
                          />
                        )}
                        S/N
                      </span>
                    </th>
                    <th className={styles['table-head']}>Post</th>
                    <th className={styles['table-head']}>
                      {sort === 'likes' ? 'Likes' : 'Views'}
                    </th>
                    <th className={styles['table-head']}>Date Posted</th>
                    <th className={styles['table-head']}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {posts.value.map((post, index) => (
                    <tr key={`${post.type}-${post._id}`}>
                      <td className={styles['content-index']}>{index + 1}</td>
                      <td className={styles['content-data']}>
                        <div className={styles['content-box']}>
                          <div className={styles['media-box']}>
                            {post.type === 'reel' && (
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

                            {post.type === 'reel' ? (
                              <video className={styles.media}>
                                <source src={getUrl(post.src, 'reels')} />
                                Your browser does not support playing video.
                              </video>
                            ) : post.mediaType === 'video' ? (
                              <video className={styles.media}>
                                <source src={getUrl(post.src, 'contents')} />
                                Your browser does not support playing video.
                              </video>
                            ) : (
                              <img
                                className={styles.media}
                                src={getUrl(post.src, 'contents')}
                              />
                            )}
                          </div>

                          <span
                            className={styles['content-description']}
                            dangerouslySetInnerHTML={{
                              __html: post.description,
                            }}
                          ></span>
                        </div>
                      </td>
                      <td className={styles['content-value']}>
                        {getEngagementValue(
                          sort === 'likes' ? post.likes : post.views
                        )}
                      </td>
                      <td className={styles['content-date']}>
                        {getDate(post.createdAt)}
                      </td>
                      <td className={styles['content-action']}>
                        <button
                          className={styles['view-btn']}
                          onClick={() => {
                            setPostInfo({
                              id: post._id,
                              type: post.type,
                              value: null,
                            });
                            setViewData(true);
                          }}
                        >
                          View Data
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {postsData.loading === true && posts.value.length > 0 && (
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
      </section>

      {viewData && (
        <section
          className={styles['data-section']}
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewData(false);
          }}
        >
          <div className={styles['data-container']}>
            <header className={styles['container-header']}>
              <h1 className={styles['container-head']}>Data Overview</h1>

              <IoClose
                className={styles['close-icon']}
                onClick={() => setViewData(false)}
              />
            </header>

            {postInfo.value === null ||
            Object.keys(postInfo.value).length === 0 ? (
              <div className={styles['no-data-text']}>
                <LoadingAnimation
                  style={{
                    width: '3.5rem',
                    height: '3.5rem',
                    transform: 'scale(2.5)',
                  }}
                />
              </div>
            ) : postInfo.value === 'error' ? (
              <div className={styles['no-data-text']}>
                Unable to load post data. Please try again.
                <div className={styles['error-btn']}>
                  <button
                    onClick={() =>
                      setPostInfo((prev) => ({ ...prev, value: null }))
                    }
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles['table-div']}>
                  <table className={styles['data-table']}>
                    <tbody>
                      <tr>
                        <th>Date Posted:</th>
                        <td> {getDate(postInfo.value.createdAt)}</td>
                      </tr>

                      <tr>
                        <th>Views:</th>
                        <td>{postInfo.value.views}</td>
                      </tr>

                      <tr>
                        <th>Viewers:</th>
                        <td>{postInfo.value.viewers}</td>
                      </tr>

                      <tr>
                        <th>Likes:</th>
                        <td>{postInfo.value.likes}</td>
                      </tr>

                      <tr>
                        <th>Comments:</th>
                        <td>{postInfo.value.comments}</td>
                      </tr>

                      <tr>
                        <th>Shares:</th>
                        <td>{postInfo.value.shares}</td>
                      </tr>

                      <tr>
                        <th>Saves:</th>
                        <td>{postInfo.value.saves}</td>
                      </tr>

                      <tr>
                        <th>New Followers:</th>
                        <td>{postInfo.value.followers}</td>
                      </tr>

                      <tr>
                        <th>Total Play Time:</th>
                        <td>{getTimeString(postInfo.value.totalPlayTime)}</td>
                      </tr>

                      <tr>
                        <th>Average Play Time:</th>
                        <td>{getTimeString(postInfo.value.avgPlayTime)}</td>
                      </tr>

                      <tr>
                        <th>Watched Fully:</th>
                        <td>{postInfo.value.watchedFully}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className={styles['data-text']}>
                  This data was being collected since you created this post.
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </>
  );
};

export default ContentAnalytics;
