import { useEffect, useRef, useState } from 'react';
import styles from '../styles/EngagementAnalytics.module.css';
import { FaArrowTrendUp } from 'react-icons/fa6';
import { Line } from 'react-chartjs-2';
import { ChartEvent, ActiveElement } from 'chart.js';
import { Chart as ChartJS } from 'chart.js';
import crosshairPlugin from 'chartjs-plugin-crosshair';
import { apiClient } from '../Utilities';
import { PeriodComponent } from './PeriodComponent';
import Skeleton from 'react-loading-skeleton';
import { toast } from 'sonner';

// Register the plugin with Chart.js
ChartJS.register(crosshairPlugin);

const EngagementAnalytics = () => {
  const [category, setCategory] = useState<
    'profile' | 'post' | 'likes' | 'comments' | 'shares'
  >('profile');

  const [graphWidth, setGraphWidth] = useState<number>(0);
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
  const [monthlyStats, setMonthlyStats] = useState<{
    value: {
      profile: {
        count: number;
        diff: string;
        percent: number;
      };
      post: {
        count: number;
        diff: string;
        percent: number;
      };
      likes: {
        count: number;
        diff: string;
        percent: number;
      };
      comments: {
        count: number;
        diff: string;
        percent: number;
      };
      shares: {
        count: number;
        diff: string;
        percent: number;
      };
    };
    loading: boolean | 'error';
  }>({ value: null!, loading: true });
  const [engagementStats, setEngagementStats] = useState<{
    labels: string[];
    value: number[];
    loading: boolean | 'error';
  }>({ labels: [], value: [], loading: true });

  const graphRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    getMonthlyStats();
  }, []);

  useEffect(() => {
    if (engagementStats.loading === true) getEngagementStats();
  }, [engagementStats.loading]);

  useEffect(() => {
    setEngagementStats((prev) => ({ ...prev, loading: true }));
  }, [category]);

  useEffect(() => {
    if (period.value === 'custom') {
      if (period.done) {
        setEngagementStats({ labels: [], value: [], loading: true });
      }
    } else {
      setEngagementStats({ labels: [], value: [], loading: true });
    }
  }, [period]);

  const lineData = {
    labels: engagementStats.labels,
    datasets: [
      {
        data: engagementStats.value,
        fill: `#a855f7`,
        backgroundColor: `#a855f7`,
        borderColor: `#a855f7`,
        borderWidth: 3,
        pointRadius: 3,
        tension: 0.4,
      },
    ],
  };

  const lineOptions = {
    responsive: false,
    maintainAspectRatio: false,
    interaction: {
      intersect: false, // allows the tooltip to show even if not directly intersecting a point
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: 'gray',
          font: {
            size: 14,
          },
          maxRotation: 0,
          minRotation: 0,
        },
      },
      y: {
        ticks: {
          color: 'gray',
          font: {
            size: 14,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      crosshair: {
        line: {
          color: 'rgba(128,128,128,0.5)', // Crosshair line color
          width: 1, // Crosshair line width
        },
        sync: {
          enabled: false, // Disable syncing with other charts
        },
        zoom: {
          enabled: false, // Disable zooming with the crosshair
        },
        snap: {
          enabled: true, // Enable snapping to data points
        },
      },
    },
    onHover: (event: ChartEvent, chartElement: ActiveElement[]) => {
      if (event.native?.target instanceof HTMLElement) {
        event.native.target.style.cursor =
          chartElement.length > 0 ? 'pointer' : 'default';
      }
    },
  };

  const getMonthlyStats = async () => {
    try {
      const { data } = await apiClient('v1/analytics/engagements');
      setMonthlyStats({ value: data.data.stats, loading: false });
    } catch {
      setMonthlyStats((prev) => ({ ...prev, loading: 'error' }));
      return toast.error('Failed to load monthly stats.');
    }
  };

  const getEngagementStats = async () => {
    try {
      const { data } = await apiClient.post(
        `v1/analytics/engagements/${category}`,
        {
          period: period.value === 'custom' ? period.custom : period.value,
        }
      );
      const stats: any[] = data.data.stats;

      const rangeType: 'y' | 'm' | 'r' | 'd' | 'h' = data.data.rangeType;
      const width = {
        y: 1200,
        m: 1200,
        r: 1800,
        d: 1200,
        h: 1500,
      };

      setEngagementStats(() => ({
        labels: stats.map((obj) => obj.label),
        value: stats.map((obj) => obj.value),
        loading: false,
      }));
      setGraphWidth(width[rangeType]);
    } catch {
      setEngagementStats((prev) => ({ ...prev, loading: 'error' }));
      return toast.error('Could not get stats.');
    }
  };

  return (
    <section className={styles.main}>
      <header className={styles['main-header']}>
        <div
          className={`${styles.category} ${
            category === 'profile' ? styles['current-category'] : ''
          }`}
          onClick={() => setCategory('profile')}
        >
          <span className={styles['category-details']}>
            <span className={styles['category-name']}>Profile Views</span>
            <span className={styles['category-value']}>
              {monthlyStats.loading === true ? (
                <Skeleton width={60} />
              ) : monthlyStats.loading === 'error' ? (
                0
              ) : (
                monthlyStats.value.profile.count
              )}
            </span>
            <span
              className={`${styles['category-percentage']} ${
                monthlyStats.loading === false
                  ? monthlyStats.value.profile.percent > 0
                    ? styles['category-percentage2']
                    : monthlyStats.value.profile.percent < 0
                    ? styles['category-percentage3']
                    : ''
                  : ''
              }`}
            >
              {monthlyStats.loading === true ? (
                <Skeleton width={90} />
              ) : monthlyStats.loading === 'error' ? (
                '0 (0%)'
              ) : (
                `${monthlyStats.value.profile.diff} (${monthlyStats.value.profile.percent}%)`
              )}
            </span>
            <span className={styles['category-range']}>vs last month</span>
          </span>

          <FaArrowTrendUp
            className={`${styles['category-icon']} ${
              monthlyStats.loading === false
                ? monthlyStats.value.profile.percent > 0
                  ? styles['category-icon2']
                  : monthlyStats.value.profile.percent < 0
                  ? styles['category-icon3']
                  : ''
                : ''
            }`}
          />
        </div>

        <div
          className={`${styles.category} ${
            category === 'post' ? styles['current-category'] : ''
          }`}
          onClick={() => setCategory('post')}
        >
          <span className={styles['category-details']}>
            <span className={styles['category-name']}>Post Views</span>
            <span className={styles['category-value']}>
              {monthlyStats.loading === true ? (
                <Skeleton width={60} />
              ) : monthlyStats.loading === 'error' ? (
                0
              ) : (
                monthlyStats.value.post.count
              )}
            </span>
            <span
              className={`${styles['category-percentage']} ${
                monthlyStats.loading === false
                  ? monthlyStats.value.post.percent > 0
                    ? styles['category-percentage2']
                    : monthlyStats.value.post.percent < 0
                    ? styles['category-percentage3']
                    : ''
                  : ''
              }`}
            >
              {monthlyStats.loading === true ? (
                <Skeleton width={90} />
              ) : monthlyStats.loading === 'error' ? (
                '0 (0%)'
              ) : (
                `${monthlyStats.value.post.diff} (${monthlyStats.value.post.percent}%)`
              )}
            </span>
            <span className={styles['category-range']}>vs last month</span>
          </span>

          <FaArrowTrendUp
            className={`${styles['category-icon']} ${
              monthlyStats.loading === false
                ? monthlyStats.value.post.percent > 0
                  ? styles['category-icon2']
                  : monthlyStats.value.post.percent < 0
                  ? styles['category-icon3']
                  : ''
                : ''
            }`}
          />
        </div>

        <div
          className={`${styles.category} ${
            category === 'likes' ? styles['current-category'] : ''
          }`}
          onClick={() => setCategory('likes')}
        >
          <span className={styles['category-details']}>
            <span className={styles['category-name']}>Likes</span>
            <span className={styles['category-value']}>
              {monthlyStats.loading === true ? (
                <Skeleton width={60} />
              ) : monthlyStats.loading === 'error' ? (
                0
              ) : (
                monthlyStats.value.likes.count
              )}
            </span>
            <span
              className={`${styles['category-percentage']} ${
                monthlyStats.loading === false
                  ? monthlyStats.value.likes.percent > 0
                    ? styles['category-percentage2']
                    : monthlyStats.value.likes.percent < 0
                    ? styles['category-percentage3']
                    : ''
                  : ''
              }`}
            >
              {monthlyStats.loading === true ? (
                <Skeleton width={90} />
              ) : monthlyStats.loading === 'error' ? (
                '0 (0%)'
              ) : (
                `${monthlyStats.value.likes.diff} (${monthlyStats.value.likes.percent}%)`
              )}
            </span>
            <span className={styles['category-range']}>vs last month</span>
          </span>

          <FaArrowTrendUp
            className={`${styles['category-icon']} ${
              monthlyStats.loading === false
                ? monthlyStats.value.likes.percent > 0
                  ? styles['category-icon2']
                  : monthlyStats.value.likes.percent < 0
                  ? styles['category-icon3']
                  : ''
                : ''
            }`}
          />
        </div>

        <div
          className={`${styles.category} ${
            category === 'comments' ? styles['current-category'] : ''
          }`}
          onClick={() => setCategory('comments')}
        >
          <span className={styles['category-details']}>
            <span className={styles['category-name']}>Comments</span>
            <span className={styles['category-value']}>
              {monthlyStats.loading === true ? (
                <Skeleton width={60} />
              ) : monthlyStats.loading === 'error' ? (
                0
              ) : (
                monthlyStats.value.comments.count
              )}
            </span>
            <span
              className={`${styles['category-percentage']} ${
                monthlyStats.loading === false
                  ? monthlyStats.value.comments.percent > 0
                    ? styles['category-percentage2']
                    : monthlyStats.value.comments.percent < 0
                    ? styles['category-percentage3']
                    : ''
                  : ''
              }`}
            >
              {monthlyStats.loading === true ? (
                <Skeleton width={90} />
              ) : monthlyStats.loading === 'error' ? (
                '0 (0%)'
              ) : (
                `${monthlyStats.value.comments.diff} (${monthlyStats.value.comments.percent}%)`
              )}
            </span>
            <span className={styles['category-range']}>vs last month</span>
          </span>

          <FaArrowTrendUp
            className={`${styles['category-icon']} ${
              monthlyStats.loading === false
                ? monthlyStats.value.comments.percent > 0
                  ? styles['category-icon2']
                  : monthlyStats.value.comments.percent < 0
                  ? styles['category-icon3']
                  : ''
                : ''
            }`}
          />
        </div>

        <div
          className={`${styles.category} ${
            category === 'shares' ? styles['current-category'] : ''
          }`}
          onClick={() => setCategory('shares')}
        >
          <span className={styles['category-details']}>
            <span className={styles['category-name']}>Shares</span>
            <span className={styles['category-value']}>
              {monthlyStats.loading === true ? (
                <Skeleton width={60} />
              ) : monthlyStats.loading === 'error' ? (
                0
              ) : (
                monthlyStats.value.shares.count
              )}
            </span>
            <span
              className={`${styles['category-percentage']} ${
                monthlyStats.loading === false
                  ? monthlyStats.value.shares.percent > 0
                    ? styles['category-percentage2']
                    : monthlyStats.value.shares.percent < 0
                    ? styles['category-percentage3']
                    : ''
                  : ''
              }`}
            >
              {monthlyStats.loading === true ? (
                <Skeleton width={90} />
              ) : monthlyStats.loading === 'error' ? (
                '0 (0%)'
              ) : (
                `${monthlyStats.value.shares.diff} (${monthlyStats.value.shares.percent}%)`
              )}
            </span>
            <span className={styles['category-range']}>vs last month</span>
          </span>

          <FaArrowTrendUp
            className={`${styles['category-icon']} ${
              monthlyStats.loading === false
                ? monthlyStats.value.shares.percent > 0
                  ? styles['category-icon2']
                  : monthlyStats.value.shares.percent < 0
                  ? styles['category-icon3']
                  : ''
                : ''
            }`}
          />
        </div>
      </header>

      <div className={styles['period-div']}>
        <PeriodComponent period={period} setPeriod={setPeriod} />
      </div>

      <div className={styles['graph-box']} ref={graphRef}>
        {engagementStats.loading === true ? (
          <Skeleton width={graphWidth} height={350} />
        ) : engagementStats.loading === 'error' ? (
          <div className={styles['no-data-text']}>
            Unable to load stats. Check your connection and try again.
            <div className={styles['error-btn']}>
              <button
                onClick={() => {
                  setEngagementStats((prev) => ({
                    ...prev,
                    loading: true,
                  }));
                }}
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.graph}>
            <Line
              data={lineData}
              options={lineOptions}
              height={350}
              width={graphWidth}
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default EngagementAnalytics;
