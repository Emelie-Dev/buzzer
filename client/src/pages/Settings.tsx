import { useEffect, useRef, useState } from 'react';
import NavBar from '../components/NavBar';
import styles from '../styles/Settings.module.css';
import GeneralSettings from '../components/GeneralSettings';
import AccountSettings from '../components/AccountSettings';
import SecuritySettings from '../components/SecuritySettings';
import ContentSettings from '../components/ContentSettings';

const Settings = () => {
  const [category, setCategory] = useState<string>('general');

  const sectionRef = useRef<HTMLDivElement>(null!);

  const accountCategories = ['profile', 'password', 'deactivate', 'delete'];
  const settingCategories = ['alerts', 'devices'];
  const contentCategories = ['notifications'];

  useEffect(() => {
    if (sectionRef.current) sectionRef.current.scrollTop = 0;
  }, [category]);

  return (
    <>
      <NavBar page="settings" />

      <section className={styles.main}>
        <section className={styles['left-section']}>
          <h1 className={styles['left-section-head']}>Settings</h1>

          <div className={styles['category-container']}>
            <div className={styles.category}>
              <span
                className={`${styles['category-head']} ${
                  styles['general-head']
                } ${category === 'general' ? styles['current-category'] : ''}`}
                onClick={() => setCategory('general')}
              >
                General
              </span>
            </div>

            <div className={styles.category}>
              <span className={styles['category-head']}>Account</span>

              <ul className={styles['category-list']}>
                <li
                  className={`${styles['category-item']} ${
                    category === 'profile' ? styles['current-category'] : ''
                  }`}
                  onClick={() => setCategory('profile')}
                >
                  Edit profile
                </li>
                <li
                  className={`${styles['category-item']} ${
                    category === 'password' ? styles['current-category'] : ''
                  }`}
                  onClick={() => setCategory('password')}
                >
                  Change password
                </li>
                <li
                  className={`${styles['category-item']} ${
                    category === 'deactivate' ? styles['current-category'] : ''
                  }`}
                  onClick={() => setCategory('deactivate')}
                >
                  Deactivate account
                </li>
                <li
                  className={`${styles['category-item']} ${
                    category === 'delete' ? styles['current-category'] : ''
                  }`}
                  onClick={() => setCategory('delete')}
                >
                  Delete account
                </li>
              </ul>
            </div>

            <div className={styles.category}>
              <span className={styles['category-head']}>Security</span>

              <ul className={styles['category-list']}>
                <li
                  className={`${styles['category-item']} ${
                    category === 'alerts' ? styles['current-category'] : ''
                  }`}
                  onClick={() => setCategory('alerts')}
                >
                  Security alerts
                </li>
                <li
                  className={`${styles['category-item']} ${
                    category === 'devices' ? styles['current-category'] : ''
                  }`}
                  onClick={() => setCategory('devices')}
                >
                  Manage devices
                </li>
                <li className={styles['category-item']}>2-step verification</li>
              </ul>
            </div>

            <div className={styles.category}>
              <span className={styles['category-head']}>Content</span>

              <ul className={styles['category-list']}>
                <li
                  className={`${styles['category-item']} ${
                    category === 'notifications'
                      ? styles['current-category']
                      : ''
                  }`}
                  onClick={() => setCategory('notifications')}
                >
                  Notifications
                </li>
                <li className={styles['category-item']}>Time management</li>
                <li className={styles['category-item']}>Interactions</li>
              </ul>
            </div>

            <div className={styles.category}>
              <span className={styles['category-head']}>Info & Support</span>

              <ul className={styles['category-list']}>
                <li className={styles['category-item']}>Terms and policies</li>
                <li className={styles['category-item']}>Report a problem</li>
              </ul>
            </div>

            <div className={styles.category}>
              <span className={styles['category-head']}>Authentication</span>

              <ul className={styles['category-list']}>
                <li className={styles['category-item']}>Switch account</li>
                <li className={styles['category-item']}>Log out</li>
              </ul>
            </div>
          </div>
        </section>

        <section className={styles['right-section']} ref={sectionRef}>
          {category === 'general' && <GeneralSettings />}

          {accountCategories.includes(category) && (
            <AccountSettings category={category} />
          )}

          {settingCategories.includes(category) && (
            <SecuritySettings category={category} />
          )}

          {contentCategories.includes(category) && (
            <ContentSettings category={category} />
          )}
        </section>
      </section>
    </>
  );
};

export default Settings;
