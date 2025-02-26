import styles from '../styles/Analytics.module.css';
import { useState } from 'react';
import { getDate } from '../Utilities';

export const PeriodComponent = () => {
  const [period, setPeriod] = useState<string>('all');
  const [customPeriod, setCustomPeriod] = useState<{
    value: string[];
    done: boolean;
  }>({ value: [], done: true });

  return (
    <div className={styles['select-div']}>
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
            <option value={'all'}>All</option>
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
  );
};
