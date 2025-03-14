import styles from '../styles/FollowersAnalytics.module.css';
import { monthLabels } from '../Utilities';
import { PeriodComponent } from './PeriodComponent';
import { Line } from 'react-chartjs-2';
import { ChartEvent, ActiveElement } from 'chart.js';
import { useEffect, useRef, useState } from 'react';

const FollowersAnalytics = () => {
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
        data: [2, 3, 2, 3, 1, 5, 7, 2, 3, 4, 1, 6, 1],
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
    <section className={styles.section}>
      <div className={styles['data-box']}>
        <span className={styles['data-name']}>Total Followers:</span>
        <span className={styles['data-value']}>23567</span>
      </div>

      <div className={styles['data-box2']}>
        <span className={styles['data-name']}>New Followers</span>

        <PeriodComponent />
      </div>

      <div className={styles['graph-box']} ref={graphRef}>
        {showGraph ? (
          <Line
            data={lineData}
            options={lineOptions}
            width={graphWidth}
            height={450}
          />
        ) : (
          <>&nbsp;</>
        )}
      </div>
    </section>
  );
};

export default FollowersAnalytics;
