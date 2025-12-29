import styles from '../styles/Analytics.module.css';
import { getDate } from '../Utilities';

type PeriodComponentProps = {
  period: {
    value: '1y' | '1m' | '1w' | '1d' | 'all' | 'custom';
    custom: {
      start: string;
      end: string;
    };
    done: boolean;
  };
  setPeriod: React.Dispatch<
    React.SetStateAction<{
      value: '1y' | '1m' | '1w' | '1d' | 'all' | 'custom';
      custom: {
        start: string;
        end: string;
      };
      done: boolean;
    }>
  >;
};

export const PeriodComponent = ({
  period,
  setPeriod,
}: PeriodComponentProps) => {
  return (
    <div
      className={`${styles['select-div']} ${
        period.value === 'custom' && !period.done
          ? styles['custom-select-div']
          : ''
      }`}
    >
      <span className={styles['period-text']}>Select Period:</span>

      {period.value === 'custom' && !period.done ? (
        <div className={styles['custom-period-div']}>
          <div className={styles['custom-period-container']}>
            <span className={styles['custom-period-box']}>
              <span className={styles['period-text']}>Start Date:</span>
              <input
                className={styles['period-input']}
                type="date"
                value={period.custom.start || ''}
                onChange={(e) =>
                  setPeriod((prev) => ({
                    ...prev,
                    custom: { ...prev.custom, start: e.target.value },
                  }))
                }
              />
            </span>

            <span className={styles['custom-period-box']}>
              <span className={styles['period-text']}>End Date:</span>
              <input
                className={styles['period-input']}
                type="date"
                value={period.custom.end || ''}
                onChange={(e) =>
                  setPeriod((prev) => ({
                    ...prev,
                    custom: { ...prev.custom, end: e.target.value },
                  }))
                }
              />
            </span>
          </div>

          <button
            className={`${styles['period-btn']} ${
              !(period.custom.start && period.custom.end)
                ? styles['disable-btn']
                : ''
            }`}
            onClick={() => setPeriod((prev) => ({ ...prev, done: true }))}
          >
            Done
          </button>
        </div>
      ) : (
        <div className={styles['select-box']}>
          <select
            className={styles['period-select']}
            value={period.value}
            onChange={(e) =>
              setPeriod((prev) => ({
                ...prev,
                value: e.target.value as
                  | '1y'
                  | '1m'
                  | '1w'
                  | '1d'
                  | 'all'
                  | 'custom',
                done: false,
              }))
            }
          >
            <option value={'all'}>All Time</option>
            <option value={'1y'}>1y</option>
            <option value={'1m'}>1m</option>
            <option value={'1w'}>1w</option>
            <option value={'1d'}>1d</option>
            <option value={'custom'}>Custom</option>
          </select>

          {period.value === 'custom' && period.done && (
            <div className={styles['custom-date-box']}>
              <span className={styles['custom-date']}>
                {getDate(period.custom.start)}
              </span>
              &nbsp;&nbsp;-&nbsp;&nbsp;
              <span className={styles['custom-date']}>
                {getDate(period.custom.end)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
