import { useState } from 'react';
import styles from '../styles/ContentAnalytics.module.css';
import { PeriodComponent } from './PeriodComponent';
import { IoClose } from 'react-icons/io5';

const ContentAnalytics = () => {
  const [viewData, setViewData] = useState<boolean>(false);

  return (
    <>
      <section className={styles.section}>
        <header className={styles.header}>
          <PeriodComponent />

          <div className={styles['select-box']}>
            <span className={styles['period-text']}>Sort By:</span>

            <select className={styles['period-select']}>
              <option value={'views'}>Views</option>
              <option value={'likes'}>Likes</option>
            </select>
          </div>
        </header>

        <div className={styles['table-container']}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.thead}>
                <th className={styles['table-head']}>S/N</th>
                <th className={styles['table-head']}>Content</th>
                <th className={styles['table-head']}>Views</th>
                <th className={styles['table-head']}>Date Posted</th>
                <th className={styles['table-head']}>Action</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td className={styles['content-index']}>1</td>
                <td className={styles['content-data']}>
                  <div className={styles['content-box']}>
                    <video className={styles.media}>
                      <source
                        src={'../../assets/images/content/content25.mp4'}
                        type="video/mp4"
                      />
                      Your browser does not support playing video.
                    </video>

                    <span className={styles['content-description']}>
                      #coding #mernstackdeveloper #nodejs #mongodb #express
                      #react
                    </span>
                  </div>
                </td>
                <td className={styles['content-value']}>2456</td>
                <td className={styles['content-date']}>Mar 10, 2024</td>
                <td className={styles['content-action']}>
                  <button
                    className={styles['view-btn']}
                    onClick={() => setViewData(true)}
                  >
                    View Data
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
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

            <div className={styles['table-div']}>
              <table className={styles['data-table']}>
                <tbody>
                  <tr>
                    <th>Views:</th>
                    <td>25089</td>
                  </tr>

                  <tr>
                    <th>Viewers:</th>
                    <td>20003</td>
                  </tr>

                  <tr>
                    <th>Likes:</th>
                    <td>12,014</td>
                  </tr>

                  <tr>
                    <th>Comments:</th>
                    <td>3896</td>
                  </tr>

                  <tr>
                    <th>Shares:</th>
                    <td>124</td>
                  </tr>

                  <tr>
                    <th>New Followers:</th>
                    <td>47</td>
                  </tr>

                  <tr>
                    <th>Total Play Time:</th>
                    <td>10h:30m:15s</td>
                  </tr>

                  <tr>
                    <th>Average Play Time:</th>
                    <td>30.5s</td>
                  </tr>

                  <tr>
                    <th>Watched Fully:</th>
                    <td>15%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={styles['data-text']}>
              This data was being collected since you posted this content.
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default ContentAnalytics;
