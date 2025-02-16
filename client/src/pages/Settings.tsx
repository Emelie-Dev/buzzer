import { useState } from 'react';
import NavBar from '../components/NavBar';
import styles from '../styles/Settings.module.css';
import GeneralSettings from '../components/GeneralSettings';
import AccountSettings from '../components/AccountSettings';

const Settings = () => {
  const [category, setCategory] = useState<string>('general');

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
                <li className={styles['category-item']}>Change password</li>
                <li className={styles['category-item']}>Deactivate account </li>
                <li className={styles['category-item']}>Delete account </li>
              </ul>
            </div>

            <div className={styles.category}>
              <span className={styles['category-head']}>Security</span>

              <ul className={styles['category-list']}>
                <li className={styles['category-item']}>Security alerts</li>
                <li className={styles['category-item']}>Manage devices</li>
                <li className={styles['category-item']}>2-step verification</li>
              </ul>
            </div>

            <div className={styles.category}>
              <span className={styles['category-head']}>Content</span>

              <ul className={styles['category-list']}>
                <li className={styles['category-item']}>Notifications</li>
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

        <section className={styles['right-section']}>
          {category === 'general' && <GeneralSettings />}
          {category === 'profile' && <AccountSettings category={category} />}
        </section>
      </section>
    </>
  );
};

export default Settings;
