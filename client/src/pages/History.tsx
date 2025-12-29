import { useState, useEffect, useContext, useRef } from 'react';
import styles from '../styles/History.module.css';
import NavBar from '../components/NavBar';
import SwitchAccount from '../components/SwitchAccount';
import AsideHeader from '../components/AsideHeader';
import { PeriodComponent } from '../components/PeriodComponent';
import { FaPlay } from 'react-icons/fa6';
import { IoArrowBack } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { GeneralContext } from '../Contexts';
import {
  apiClient,
  getEngagementValue,
  getUrl,
  monthLabels,
} from '../Utilities';
import Skeleton from 'react-loading-skeleton';
import LoadingAnimation from '../components/LoadingAnimation';
import { toast } from 'sonner';

const mediumSize = window.matchMedia('(max-width: 900px)').matches;

const History = () => {
  const { setShowSearchPage } = useContext(GeneralContext);
  const [isMediumSize, setIsMediumSize] = useState<boolean>(mediumSize);
  const [switchAccount, setSwitchAccount] = useState<boolean>(false);
  const [deleteList, setDeleteList] = useState<
    { id: string; collection: string }[]
  >([]);
  const [history, setHistory] = useState<any[]>(null!);
  const [historyGroups, setHistoryGroups] = useState<Map<string, any[]>>(
    new Map()
  );
  const [historyData, setHistoryData] = useState<{
    loading: boolean | 'error';
    cursor: Date;
    end: boolean;
  }>({ loading: true, cursor: null!, end: false });
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
  const [deleting, setDeleting] = useState<boolean>(false);

  const sectionRef = useRef<HTMLDivElement>(null!);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Buzzer - History';

    const resizeHandler = () => {
      const mediumSize = window.matchMedia('(max-width: 900px)').matches;
      setIsMediumSize(mediumSize);
    };

    resizeHandler();

    window.addEventListener('resize', resizeHandler);

    return () => {
      setShowSearchPage(false);
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  useEffect(() => {
    if (historyData.loading === true) getHistory();
  }, [historyData.loading]);

  useEffect(() => {
    const container = sectionRef.current;

    if (
      historyGroups.size > 0 &&
      container &&
      container.scrollHeight <= container.clientHeight &&
      historyData.loading === false &&
      !historyData.end
    ) {
      setHistoryData((prev) => {
        return {
          ...prev,
          loading: true,
          cursor: history? history[history.length - 1]?.createdAt:null!,
        };
      });
    }
  }, [historyGroups]);

  useEffect(() => {
    if (history !== null) {
      if (history.length === 0 && historyData.end === false) {
        setHistoryData({
          loading: true,
          cursor: null!,
          end: false,
        });
      }
    }
  }, [history]);

  useEffect(() => {
    if (period.value === 'custom') {
      if (period.done) {
        setHistoryData({
          loading: true,
          cursor: null!,
          end: false,
        });
        setHistory(null!);
        setHistoryGroups(new Map());
      }
    } else {
      setHistoryData({
        loading: true,
        cursor: null!,
        end: false,
      });
      setHistory(null!);
      setHistoryGroups(new Map());
    }
  }, [period]);

  const getHistory = async () => {
    try {
      const { data } = await apiClient.post('v1/views/history', {
        cursor: historyData.cursor,
        period: period.value === 'custom' ? period.custom : period.value,
      });
      const result: any[] = data.data.history;

      setHistory((prev) => {
        const arr = result.filter(
          (obj) => !(prev || []).find((data) => data._id === obj._id)
        );

        return [...(prev || []), ...arr];
      });

      setHistoryGroups((prev) => {
        const map = new Map(prev);

        result.forEach((obj) => {
          const date = new Date(obj.createdAt);
          date.setHours(0, 0, 0, 0);

          const dateString = date.toISOString();
          const arr = map.get(dateString);

          if (arr) {
            if (!arr.find((item) => item._id === obj._id)) arr.push(obj);
          } else {
            map.set(dateString, [obj]);
          }
        });

        return map;
      });

      setHistoryData((prev) => ({
        ...prev,
        loading: false,
        end: data.data.history.length < 20,
      }));
    } catch {
      setHistoryData((prev) => ({ ...prev, loading: 'error' }));
      return toast.error('Failed to load watch history.');
    }
  };

  const getDateValue = (date: string) => {
    const dateValue = new Date(date);

    const year = dateValue.getFullYear();
    const month = dateValue.getMonth();
    const dateNumber = dateValue.getDate();
    const currentDate = new Date();

    if (
      year === currentDate.getFullYear() &&
      month === currentDate.getMonth() &&
      dateNumber === currentDate.getDate()
    ) {
      return 'Today';
    }

    return `${monthLabels[month]} ${dateNumber}, ${year}`;
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 50;

    if (isBottom && !historyData.end && historyData.loading === false) {
      setHistoryData((prev) => {
        return {
          ...prev,
          loading: true,
          cursor:
            prev.loading === 'error'
              ? prev.cursor
              : history
              ? history[history.length - 1]?.createdAt
              : null!,
        };
      });
    }
  };

  const handleDeleteList = (id: string, collection: string) => () => {
    const data = deleteList.find(
      (obj) => obj.id === id && obj.collection === collection
    );

    if (!data) {
      if (deleteList.length >= 1000) {
        return toast.error('Delete list is too large!');
      }
    }

    setDeleteList((prev) => {
      const item = prev.find(
        (obj) => obj.id === id && obj.collection === collection
      );

      if (item) {
        return prev.filter(
          (obj) => obj.id !== id && obj.collection !== collection
        );
      } else {
        return [...prev, { id, collection }];
      }
    });
  };

  const handleGroupDeleteList = (key: string) => () => {
    const group = historyGroups.get(key);
    if (!group) return;

    setDeleteList((prev) => {
      const makeKey = (id: string, collection: string) => `${collection}:${id}`;

      const prevSet = new Set(
        prev.map((item) => makeKey(item.id, item.collection))
      );

      const groupSet = new Set(
        group.map((obj) => makeKey(obj._id, obj.collection))
      );

      const isGroupChecked = [...groupSet].every((k) => prevSet.has(k));

      if (isGroupChecked) {
        // REMOVE group
        return prev.filter(
          (item) => !groupSet.has(makeKey(item.id, item.collection))
        );
      }

      // ADD missing items
      const next = [...prev];
      group.forEach((obj) => {
        const k = makeKey(obj._id, obj.collection);
        if (!prevSet.has(k)) {
          next.push({ id: obj._id, collection: obj.collection });
        }
      });

      return next;
    });
  };

  const isGroupChecked = (key: string) => {
    const group = historyGroups.get(key);
    if (!group) return;

    const makeKey = (id: string, collection: string) => `${collection}:${id}`;

    const prevSet = new Set(
      deleteList.map((item) => makeKey(item.id, item.collection))
    );

    const groupSet = new Set(
      group.map((obj) => makeKey(obj._id, obj.collection))
    );

    return [...groupSet].every((k) => prevSet.has(k));
  };

  const deleteHistory = async () => {
    if (deleting) return;
    setDeleting(true);

    if (deleteList.length > 1000) {
      setDeleting(false);
      return toast.error('Delete list is too large!');
    }

    try {
      const body = deleteList;
      await apiClient.delete('v1/views/history', {
        data: {
          history: body,
        },
      });

      toast.success('Deleted successfully!');
      setDeleteList((prev) =>
        prev.filter((obj) => !body.find((data) => obj.id === data.id))
      );
      setHistory((prev) =>
        prev.filter((obj) => !body.find((data) => data.id === obj._id))
      );
      setHistoryGroups((prev) => {
        const map = new Map(prev);

        for (const [key, value] of map.entries()) {
          const result = value.filter(
            (obj) => !body.find((data) => obj._id === data.id)
          );

          if (result.length === 0) map.delete(key);
          else map.set(key, result);
        }

        return map;
      });
    } catch {
      toast.error('Could not delete watch history.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <NavBar page="history" />

      <section
        className={styles.section}
        ref={sectionRef}
        onScroll={handleScroll}
      >
        <header className={styles['section-header']}>
          <IoArrowBack
            className={styles['back-icon']}
            onClick={() => navigate(-1)}
          />
          <h1 className={styles.head}>Watch History</h1>

          {!isMediumSize && <AsideHeader second />}
        </header>

        {deleteList.length > 0 ? (
          <div className={styles['select-div']}>
            <span className={styles['select-text']}>
              <b>{deleteList.length}</b>
              {deleteList.length === 1 ? ' post ' : ' posts '}
              selected
            </span>
            <div className={styles['btn-div']}>
              <button
                className={`${styles['cancel-btn']} ${
                  deleting ? styles['disable-btn'] : ''
                }`}
                onClick={() => setDeleteList([])}
              >
                Cancel
              </button>
              <button
                className={`${styles['delete-btn']} ${
                  deleting ? styles['disable-btn'] : ''
                }`}
                onClick={deleteHistory}
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className={styles['period-box']}>
            <PeriodComponent period={period} setPeriod={setPeriod} />
          </div>
        )}

        <div className={styles['category-container']}>
          {historyData.loading === true && historyGroups.size === 0 ? (
            <div className={styles['skeleton-container']}>
              {Array.from({ length: 15 }).map((_, index) => (
                <Skeleton key={index} className={styles['skeleton-item']} />
              ))}
            </div>
          ) : historyData.end === false && historyGroups.size === 0 ? (
            <div className={styles['skeleton-container']}>
              {Array.from({ length: 15 }).map((_, index) => (
                <Skeleton key={index} className={styles['skeleton-item']} />
              ))}
            </div>
          ) : historyData.loading === 'error' && historyGroups.size === 0 ? (
            <div className={styles['no-data-text']}>
              Unable to load watch history. Check your connection and try again.
              <div className={styles['error-btn']}>
                <button
                  onClick={() => {
                    setHistoryData((prev) => ({
                      ...prev,
                      loading: true,
                    }));
                  }}
                >
                  Try again
                </button>
              </div>
            </div>
          ) : historyGroups.size === 0 ? (
            <div className={styles['no-data-text']}>
              You have no watch history
              {period.value !== 'all' ? ' for this period' : ''}.
            </div>
          ) : (
            <>
              {Array.from(historyGroups.entries()).map(([key, value]) => (
                <div key={key} className={styles.category}>
                  <span className={styles['category-head']}>
                    {getDateValue(key)}

                    <input
                      className={`${styles['category-checkbox']} ${
                        deleteList.length > 0 ? styles['show-checkbox'] : ''
                      }`}
                      type="checkbox"
                      checked={isGroupChecked(key)}
                      onChange={handleGroupDeleteList(key)}
                    />
                  </span>

                  <div className={styles['category-div']}>
                    {value.map((obj) => (
                      <article key={obj._id} className={styles['category-box']}>
                        <input
                          className={`${styles.checkbox} ${
                            deleteList.length > 0 ? styles['show-checkbox'] : ''
                          }`}
                          type="checkbox"
                          checked={
                            !!deleteList.find((data) => data.id === obj._id)
                          }
                          onChange={handleDeleteList(obj._id, obj.collection)}
                        />

                        {obj.collection === 'reel' ? (
                          <video className={styles.media}>
                            <source
                              src={getUrl(obj.src, 'reels')}
                              type="video/mp4"
                            />
                            Your browser does not support playing video.
                          </video>
                        ) : obj.type === 'video' ? (
                          <video className={styles.media}>
                            <source
                              src={getUrl(obj.src, 'contents')}
                              type="video/mp4"
                            />
                            Your browser does not support playing video.
                          </video>
                        ) : (
                          <img
                            className={styles.media}
                            src={getUrl(obj.src, 'contents')}
                          />
                        )}

                        <div className={styles['details-box']}>
                          {obj.collection === 'reel' ? (
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
                          ) : (
                            <>&nbsp;</>
                          )}

                          <span className={styles['view-box']}>
                            <FaPlay className={styles['view-icon']} />{' '}
                            {getEngagementValue(obj.views)}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}

              {historyData.loading === true && historyData.cursor !== null && (
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

      {switchAccount && <SwitchAccount setSwitchAccount={setSwitchAccount} />}
    </>
  );
};

export default History;
