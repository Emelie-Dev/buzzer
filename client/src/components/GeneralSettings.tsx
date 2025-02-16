import { useState } from 'react';
import styles from '../styles/GeneralSettings.module.css';
import Engagements from './Engagements';
import Switch from './Switch';

const GeneralSettings = () => {
  const [category, setCategory] = useState<'light' | 'dark' | 'device'>(
    'light'
  );

  const [engagementModal, setEngagementModal] = useState<
    'followers' | 'following' | 'friends' | 'suggested' | 'private' | null
  >(null);

  const [privateAccount, setPrivateAccount] = useState<boolean>(false);

  return (
    <>
      <section className={styles.section}>
        <div className={styles.category}>
          <span className={styles['category-head']}>Display</span>

          <div className={styles['display-box']}>
            <span className={styles['mode-box']}>
              <span
                className={`${styles['img-box']} ${
                  category === 'light' ? styles['current-category'] : ''
                }`}
                onClick={() => setCategory('light')}
              >
                <img
                  className={styles['mode-img']}
                  src="../../assets/images/others/light-mode.png"
                />
                <input
                  className={styles['mode-input']}
                  type="radio"
                  checked={category === 'light'}
                />
              </span>
              <span className={styles['mode-name']}>Light</span>
            </span>

            <span className={styles['mode-box']}>
              <span
                className={`${styles['img-box']} ${
                  category === 'dark' ? styles['current-category'] : ''
                }`}
                onClick={() => setCategory('dark')}
              >
                <img
                  className={styles['mode-img']}
                  src="../../assets/images/others/dark-mode.png"
                />
                <input
                  className={styles['mode-input']}
                  type="radio"
                  checked={category === 'dark'}
                />
              </span>
              <span className={styles['mode-name']}>Dark</span>
            </span>

            <span className={styles['mode-box']}>
              <span
                className={`${styles['img-box']} ${
                  category === 'device' ? styles['current-category'] : ''
                }`}
                onClick={() => setCategory('device')}
              >
                <img
                  className={styles['mode-img']}
                  src="../../assets/images/others/default.jpg"
                />
                <input
                  className={styles['mode-input']}
                  type="radio"
                  checked={category === 'device'}
                />
              </span>
              <span className={styles['mode-name']}>Device default</span>
            </span>
          </div>
        </div>

        <div className={styles.category}>
          <span className={styles['category-head']}>Inbox</span>

          <div className={styles['inbox-div']}>
            <span className={styles['inbox-text']}>Who can message you.</span>
            {/* Everyone, friends, followers, no one */}
            <div className={styles['inbox-list']}>
              <span className={styles['inbox-box']}>
                <input
                  className={styles['inbox-input']}
                  type="radio"
                  id="inbox-everyone"
                  name="inbox-value"
                  defaultChecked={true}
                />
                <label
                  className={styles['inbox-label']}
                  htmlFor="inbox-everyone"
                >
                  Everyone
                </label>
              </span>
              <span className={styles['inbox-box']}>
                <input
                  className={styles['inbox-input']}
                  type="radio"
                  id="inbox-friends"
                  name="inbox-value"
                />
                <label
                  className={styles['inbox-label']}
                  htmlFor="inbox-friends"
                >
                  Friends
                </label>
              </span>
              <span className={styles['inbox-box']}>
                <input
                  className={styles['inbox-input']}
                  type="radio"
                  id="inbox-followers"
                  name="inbox-value"
                />
                <label
                  className={styles['inbox-label']}
                  htmlFor="inbox-followers"
                >
                  Followers
                </label>
              </span>
              <span className={styles['inbox-box']}>
                <input
                  className={styles['inbox-input']}
                  type="radio"
                  id="inbox-no-one"
                  name="inbox-value"
                />
                <label className={styles['inbox-label']} htmlFor="inbox-no-one">
                  No one
                </label>
              </span>
            </div>
          </div>
        </div>

        <div className={styles.category}>
          <span className={styles['category-head']}>Private Account</span>

          <div className={styles['privacy-div']}>
            <span className={styles['privacy-box']}>
              <span className={styles['privacy-text']}>
                When your account is private, only approved users can follow you
                and view your content. Your followers won't be affected.
              </span>

              <Switch value={privateAccount} setter={setPrivateAccount} />
            </span>

            <button
              className={`${styles['privacy-btn']} ${
                !privateAccount ? styles['disable-btn'] : ''
              }`}
              onClick={
                privateAccount ? () => setEngagementModal('private') : undefined
              }
            >
              Edit approved users
            </button>
          </div>
        </div>
      </section>

      {engagementModal === 'private' && (
        <Engagements value={engagementModal} setValue={setEngagementModal} />
      )}
    </>
  );
};

export default GeneralSettings;
