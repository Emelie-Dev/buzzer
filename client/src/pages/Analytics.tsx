import NavBar from '../components/NavBar';
import styles from '../styles/Analytics.module.css';
import { useContext, useEffect, useRef, useState } from 'react';
import SwitchAccount from '../components/SwitchAccount';
import EngagementAnalytics from '../components/EngagementAnalytics';
import ContentAnalytics from '../components/ContentAnalytics';
import FollowersAnalytics from '../components/FollowersAnalytics';
import AsideHeader from '../components/AsideHeader';
import { IoArrowBack } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { GeneralContext } from '../Contexts';

const mediumSize = window.matchMedia('(max-width: 1100px)').matches;

const Analytics = () => {
  const [isMediumSize, setIsMediumSize] = useState<boolean>(mediumSize);
  const [category, setCategory] = useState<
    'Engagement' | 'Content' | 'Followers'
  >('Engagement');
  const [switchAccount, setSwitchAccount] = useState<boolean>(false);

  const { setShowSearchPage } = useContext(GeneralContext);

  const sectionRef = useRef<HTMLDivElement>(null!);

  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Buzzer - Analytics';

    const resizeHandler = () => {
      const mediumSize = window.matchMedia('(max-width: 1100px)').matches;
      setIsMediumSize(mediumSize);
    };

    resizeHandler();

    window.addEventListener('resize', resizeHandler);

    return () => {
      setShowSearchPage(false);
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  return (
    <>
      <NavBar page="analytics" />

      <section className={styles.section} ref={sectionRef}>
        <header className={styles['section-header']}>
          <h1 className={styles['section-head']}>
            <IoArrowBack
              className={styles['back-icon']}
              onClick={() => navigate(-1)}
            />
            Analytics
          </h1>

          <ul className={styles['header-list']}>
            <li
              className={`${styles['header-item']} ${
                category === 'Engagement' ? styles['active-item'] : ''
              }`}
              onClick={() => setCategory('Engagement')}
            >
              Engagement
            </li>
            <li
              className={`${styles['header-item']} ${
                category === 'Content' ? styles['active-item'] : ''
              }`}
              onClick={() => setCategory('Content')}
            >
              Post
            </li>
            <li
              className={`${styles['header-item']} ${
                category === 'Followers' ? styles['active-item'] : ''
              }`}
              onClick={() => setCategory('Followers')}
            >
              Followers
            </li>
          </ul>

          {!isMediumSize && <AsideHeader second />}
        </header>

        {category === 'Engagement' ? (
          <EngagementAnalytics />
        ) : category === 'Content' ? (
          <ContentAnalytics sectionRef={sectionRef} />
        ) : (
          <FollowersAnalytics />
        )}
      </section>

      {switchAccount && <SwitchAccount setSwitchAccount={setSwitchAccount} />}
    </>
  );
};

export default Analytics;
