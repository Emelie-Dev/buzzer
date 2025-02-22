import NavBar from '../components/NavBar';
import styles from '../styles/Analytics.module.css';
import { useState } from 'react';
import { HiPlusSm } from 'react-icons/hi';
import { BiMessageDetail } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import StoryModal from '../components/StoryModal';
import SwitchAccount from '../components/SwitchAccount';
import EngagementAnalytics from '../components/EngagementAnalytics';
import ContentAnalytics from '../components/ContentAnalytics';

const Settings = () => {
  const [category, setCategory] = useState<
    'Engagement' | 'Content' | 'Followers'
  >('Engagement');
  const [viewStory, setViewStory] = useState<boolean>(false);
  const [switchAccount, setSwitchAccount] = useState<boolean>(false);

  const navigate = useNavigate();

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

          <div className={styles['aside-header']}>
            <button
              className={styles['create-btn']}
              onClick={() => navigate('/create')}
            >
              Create <HiPlusSm className={styles['create-icon']} />
            </button>

            <span
              className={styles['inbox-box']}
              title="Inbox"
              onClick={() => navigate('/inbox')}
            >
              <BiMessageDetail className={styles['inbox-icon']} />
              <span className={styles['inbox-number']}>
                <span className={styles['inbox-length']}>9</span>
              </span>
            </span>

            <div className={styles['profile-box']}>
              <span className={styles['profile-img-box']}>
                <img
                  className={styles['profile-img']}
                  src="../../assets/images/users/user14.jpeg"
                />
              </span>

              <ul className={styles['view-list']}>
                <li
                  className={styles['view-item']}
                  onClick={() => navigate('/profile')}
                >
                  View profile
                </li>
                <li
                  className={styles['view-item']}
                  onClick={() => setViewStory(true)}
                >
                  View story
                </li>
                <li
                  className={styles['view-item']}
                  onClick={() => setSwitchAccount(true)}
                >
                  Switch account
                </li>
              </ul>
            </div>
          </div>
        </header>

        {category === 'Engagement' ? (
          <EngagementAnalytics />
        ) : category === 'Content' ? (
          <ContentAnalytics />
        ) : (
          ''
        )}
      </section>

      {viewStory && <StoryModal setViewStory={setViewStory} itemIndex={0} />}

      {switchAccount && <SwitchAccount setSwitchAccount={setSwitchAccount} />}
    </>
  );
};

export default Settings;
