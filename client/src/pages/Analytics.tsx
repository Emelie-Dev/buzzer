import NavBar from '../components/NavBar';
import styles from '../styles/Analytics.module.css';
import { useState } from 'react';
import StoryModal from '../components/StoryModal';
import SwitchAccount from '../components/SwitchAccount';
import EngagementAnalytics from '../components/EngagementAnalytics';
import ContentAnalytics from '../components/ContentAnalytics';
import FollowersAnalytics from '../components/FollowersAnalytics';
import AsideHeader from '../components/AsideHeader';

const Settings = () => {
  const [category, setCategory] = useState<
    'Engagement' | 'Content' | 'Followers'
  >('Engagement');
  const [viewStory, setViewStory] = useState<boolean>(false);
  const [switchAccount, setSwitchAccount] = useState<boolean>(false);

  return (
    <>
      <NavBar page="analytics" />

      <section className={styles.section}>
        <header className={styles['section-header']}>
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
              Content
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

          <AsideHeader second />
        </header>

        {category === 'Engagement' ? (
          <EngagementAnalytics />
        ) : category === 'Content' ? (
          <ContentAnalytics />
        ) : (
          <FollowersAnalytics />
        )}
      </section>

      {viewStory && <StoryModal setViewStory={setViewStory} itemIndex={0} />}

      {switchAccount && <SwitchAccount setSwitchAccount={setSwitchAccount} />}
    </>
  );
};

export default Settings;
