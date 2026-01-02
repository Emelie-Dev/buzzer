import styles from '../styles/FollowersAnalytics.module.css';
import { apiClient } from '../Utilities';
import { PeriodComponent } from './PeriodComponent';
import { Line } from 'react-chartjs-2';
import { ChartEvent, ActiveElement } from 'chart.js';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import Skeleton from 'react-loading-skeleton';

const FollowersAnalytics = () => {
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

  const [followersStats, setFollowersStats] = useState<{
    labels: string[];
    value: number[];
    count: number;
    loading: boolean | 'error';
  }>({ labels: [], value: [], count: 0, loading: true });

  const graphRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    if (followersStats.loading === true) getFollowersStats();
  }, [followersStats.loading]);

  useEffect(() => {
    if (period.value === 'custom') {
      if (period.done) {
        setFollowersStats({ labels: [], value: [], count: 0, loading: true });
      }
    } else {
      setFollowersStats({ labels: [], value: [], count: 0, loading: true });
    }
  }, [period]);

  const lineData = {
    labels: followersStats.labels,
    datasets: [
      {
        data: followersStats.value,
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
      intersect: false,
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

  const getFollowersStats = async () => {
    try {
      const { data } = await apiClient.post('v1/analytics/followers', {
        period: period.value === 'custom' ? period.custom : period.value,
      });
      const stats: any[] = data.data.stats;

      const rangeType: 'y' | 'm' | 'r' | 'd' | 'h' = data.data.rangeType;
      const width = {
        y: 1200,
        m: 1200,
        r: 1800,
        d: 1200,
        h: 1500,
      };

      setFollowersStats(() => ({
        labels: stats.map((obj) => obj.label),
        value: stats.map((obj) => obj.value),
        count: data.data.count,
        loading: false,
      }));
      setGraphWidth(width[rangeType]);
    } catch {
      setFollowersStats((prev) => ({ ...prev, loading: 'error' }));
      return toast.error('Could not get stats.');
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles['data-box']}>
        <span className={styles['data-name']}>Followers Count:</span>
        <span className={styles['data-value']}>{followersStats.count}</span>
      </div>

      <div className={styles['data-box2']}>
        <span className={styles['data-name2']}>New Followers</span>

        <PeriodComponent period={period} setPeriod={setPeriod} />
      </div>

      <div className={styles['graph-box']} ref={graphRef}>
        {followersStats.loading === true ? (
          <Skeleton width={graphWidth} height={350} />
        ) : followersStats.loading === 'error' ? (
          <div className={styles['no-data-text']}>
            Unable to load stats. Check your connection and try again.
            <div className={styles['error-btn']}>
              <button
                onClick={() => {
                  setFollowersStats((prev) => ({
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

export default FollowersAnalytics;
