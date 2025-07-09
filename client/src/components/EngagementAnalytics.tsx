import { useEffect, useRef, useState } from 'react';
import styles from '../styles/EngagementAnalytics.module.css';
import { FaArrowTrendDown } from 'react-icons/fa6';
import { FaArrowTrendUp } from 'react-icons/fa6';
import { Line } from 'react-chartjs-2';
import { ChartEvent, ActiveElement } from 'chart.js';
import { Chart as ChartJS } from 'chart.js';
import crosshairPlugin from 'chartjs-plugin-crosshair';
import { monthLabels } from '../Utilities';
import { PeriodComponent } from './PeriodComponent';

// Register the plugin with Chart.js
ChartJS.register(crosshairPlugin);

const EngagementAnalytics = () => {
  const [category, setCategory] = useState<
    'profile' | 'post' | 'likes' | 'comments' | 'shares'
  >('profile');

  const [graphWidth, setGraphWidth] = useState<number>(0);
  const [showGraph, setShowGraph] = useState<boolean>(true);

  const graphRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const resizeHandler = () => {
      setShowGraph(false);

      if (window.matchMedia('(max-width: 500px)').matches) {
        setGraphWidth(500);
      } else if (window.matchMedia('(max-width: 600px)').matches) {
        setGraphWidth(graphRef.current.offsetWidth);
      } else if (window.matchMedia('(max-width: 800px)').matches) {
        setGraphWidth(graphRef.current.offsetWidth - 16);
      } else {
        setGraphWidth(graphRef.current.offsetWidth - 32);
      }

      setTimeout(() => {
        setShowGraph(true);
      }, 100);
    };

    resizeHandler();

    window.addEventListener('resize', resizeHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  const lineData = {
    labels: monthLabels,
    datasets: [
      {
        data: [2, 3, 2, 3, 1, 5, 7, 2, 3, 4, 1, 6],
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
            <span className={styles['category-value']}>25</span>
            <span className={styles['category-percentage']}>+3 (30%)</span>
          </span>

          <FaArrowTrendUp className={styles['category-icon']} />
        </div>

        <div
          className={`${styles.category} ${
            category === 'post' ? styles['current-category'] : ''
          }`}
          onClick={() => setCategory('post')}
        >
          <span className={styles['category-details']}>
            <span className={styles['category-name']}>Post Views</span>
            <span className={styles['category-value']}>25</span>
            <span className={styles['category-percentage2']}>-3 (-30%)</span>
          </span>

          <FaArrowTrendDown className={styles['category-icon2']} />
        </div>

        <div
          className={`${styles.category} ${
            category === 'likes' ? styles['current-category'] : ''
          }`}
          onClick={() => setCategory('likes')}
        >
          <span className={styles['category-details']}>
            <span className={styles['category-name']}>Likes</span>
            <span className={styles['category-value']}>25</span>
            <span className={styles['category-percentage']}>+3 (30%)</span>
          </span>

          <FaArrowTrendUp className={styles['category-icon']} />
        </div>

        <div
          className={`${styles.category} ${
            category === 'comments' ? styles['current-category'] : ''
          }`}
          onClick={() => setCategory('comments')}
        >
          <span className={styles['category-details']}>
            <span className={styles['category-name']}>Comments</span>
            <span className={styles['category-value']}>25</span>
            <span className={styles['category-percentage']}>+3 (30%)</span>
          </span>

          <FaArrowTrendUp className={styles['category-icon']} />
        </div>

        <div
          className={`${styles.category} ${
            category === 'shares' ? styles['current-category'] : ''
          }`}
          onClick={() => setCategory('shares')}
        >
          <span className={styles['category-details']}>
            <span className={styles['category-name']}>Shares</span>
            <span className={styles['category-value']}>25</span>
            <span className={styles['category-percentage2']}>-3 (-30%)</span>
          </span>

          <FaArrowTrendDown className={styles['category-icon2']} />
        </div>
      </header>

      <div className={styles['period-div']}>
        <PeriodComponent />
      </div>

      <div className={styles['graph-box']} ref={graphRef}>
        {showGraph ? (
          <Line
            data={lineData}
            options={lineOptions}
            width={graphWidth}
            height={350}
          />
        ) : (
          <>&nbsp;</>
        )}
      </div>
    </section>
  );
};

export default EngagementAnalytics;
