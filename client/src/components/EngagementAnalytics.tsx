import { useEffect, useRef, useState } from 'react';
import styles from '../styles/EngagementAnalytics.module.css';
import { FaArrowTrendDown } from 'react-icons/fa6';
import { FaArrowTrendUp } from 'react-icons/fa6';
import { monthLabels } from '../Utilities';
import { Line } from 'react-chartjs-2';
import { ChartEvent, ActiveElement } from 'chart.js';
import { Chart as ChartJS } from 'chart.js';
import crosshairPlugin from 'chartjs-plugin-crosshair';

// Register the plugin with Chart.js
ChartJS.register(crosshairPlugin);

const EngagementAnalytics = () => {
  const [category, setCategory] = useState<
    'profile' | 'post' | 'likes' | 'comments' | 'shares'
  >('profile');

  const [period, setPeriod] = useState<string>('1y');
  const [customPeriod, setCustomPeriod] = useState<{
    value: string[];
    done: boolean;
  }>({ value: [], done: true });
  const [graphWidth, setGraphWidth] = useState<number>(0);

  const graphRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    setGraphWidth(graphRef.current.offsetWidth - 40);
  }, []);

  const getDate = (value: string) => {
    const date = new Date(value);

    return `${
      monthLabels[date.getMonth()]
    } ${date.getDate()}, ${date.getFullYear()}`;
  };

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

      <div className={styles['period-box']}>
        <span className={styles['period-text']}>Select Period:</span>

        {period === 'custom' && !customPeriod.done ? (
          <div className={styles['custom-period-div']}>
            <span className={styles['custom-period-box']}>
              <span className={styles['period-text']}>Start Date:</span>
              <input
                className={styles['period-input']}
                type="date"
                value={customPeriod.value[0]}
                onChange={(e) =>
                  setCustomPeriod({
                    ...customPeriod,
                    value: [e.target.value, customPeriod.value[1]],
                  })
                }
              />
            </span>

            <span className={styles['custom-period-box']}>
              <span className={styles['period-text']}>End Date:</span>
              <input
                className={styles['period-input']}
                type="date"
                value={customPeriod.value[1]}
                onChange={(e) =>
                  setCustomPeriod({
                    ...customPeriod,
                    value: [customPeriod.value[0], e.target.value],
                  })
                }
              />
            </span>

            <button
              className={`${styles['period-btn']} ${
                !(customPeriod.value[0] && customPeriod.value[1])
                  ? styles['disable-btn']
                  : ''
              }`}
              onClick={() => setCustomPeriod({ ...customPeriod, done: true })}
            >
              Done
            </button>
          </div>
        ) : (
          <div className={styles['select-box']}>
            <select
              className={styles['period-select']}
              value={period}
              onChange={(e) => {
                if (e.target.value === 'custom')
                  setCustomPeriod({ ...customPeriod, done: false });
                setPeriod(e.target.value);
              }}
            >
              <option value={'1y'}>1y</option>
              <option value={'1m'}>1m</option>
              <option value={'1w'}>1w</option>
              <option value={'1d'}>1d</option>
              <option value={'custom'}>Custom</option>
            </select>

            {period === 'custom' && (
              <div className={styles['custom-date-box']}>
                <span className={styles['custom-date']}>
                  {getDate(customPeriod.value[0])}
                </span>
                &nbsp;&nbsp;-&nbsp;&nbsp;
                <span className={styles['custom-date']}>
                  {getDate(customPeriod.value[1])}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles['graph-box']} ref={graphRef}>
        {graphWidth ? (
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
