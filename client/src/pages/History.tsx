import { useState, useEffect } from 'react';
import styles from '../styles/History.module.css';
import NavBar from '../components/NavBar';
import StoryModal from '../components/StoryModal';
import SwitchAccount from '../components/SwitchAccount';
import AsideHeader from '../components/AsideHeader';
import { PeriodComponent } from '../components/PeriodComponent';
import { FaPlay } from 'react-icons/fa6';
import { IoArrowBack } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

const mediumSize = window.matchMedia('(max-width: 900px)').matches;

const History = () => {
  const [isMediumSize, setIsMediumSize] = useState<boolean>(mediumSize);
  const [viewStory, setViewStory] = useState<boolean>(false);
  const [switchAccount, setSwitchAccount] = useState<boolean>(false);
  const [selectCount, setSelectCount] = useState<number>(0);

  const navigate = useNavigate();

  const handleSelectCount = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectCount((prev) => prev + 1);
    else setSelectCount((prev) => prev - 1);
  };

  useEffect(() => {
    const resizeHandler = () => {
      const mediumSize = window.matchMedia('(max-width: 900px)').matches;
      setIsMediumSize(mediumSize);
    };

    resizeHandler();

    window.addEventListener('resize', resizeHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  return (
    <>
      <NavBar page="history" />

      <section className={styles.section}>
        <header className={styles['section-header']}>
          <IoArrowBack
            className={styles['back-icon']}
            onClick={() => navigate(-1)}
          />
          <h1 className={styles.head}>Watch History</h1>

          {!isMediumSize && <AsideHeader second />}
        </header>

        {selectCount > 0 ? (
          <div className={styles['select-div']}>
            <span className={styles['select-text']}>
              <b>{selectCount}</b>
              {selectCount === 1 ? ' content ' : ' contents '}
              selected
            </span>
            <div className={styles['btn-div']}>
              <button
                className={styles['cancel-btn']}
                onClick={() => setSelectCount(0)}
              >
                Cancel
              </button>
              <button className={styles['delete-btn']}>Delete</button>
            </div>
          </div>
        ) : (
          <div className={styles['period-box']}>
            <PeriodComponent />
          </div>
        )}

        <div className={styles['category-container']}>
          <div className={styles.category}>
            <span className={styles['category-head']}>Today</span>

            <div className={styles['category-div']}>
              <article className={styles['category-box']}>
                <input
                  className={styles.checkbox}
                  type="checkbox"
                  onChange={handleSelectCount}
                />

                <video className={styles.media}>
                  <source
                    src={'../../assets/images/content/content25.mp4'}
                    type="video/mp4"
                  />
                  Your browser does not support playing video.
                </video>

                <div className={styles['details-box']}>
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

                  <span className={styles['view-box']}>
                    <FaPlay className={styles['view-icon']} /> 3.9M
                  </span>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {viewStory && <StoryModal setViewStory={setViewStory} itemIndex={0} />}

      {switchAccount && <SwitchAccount setSwitchAccount={setSwitchAccount} />}
    </>
  );
};

export default History;
