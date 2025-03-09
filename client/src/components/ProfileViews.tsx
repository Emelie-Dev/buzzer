import styles from '../styles/ProfileViews.module.css';
import { IoClose } from 'react-icons/io5';

type ProfileViewsProps = {
  setShowProfileViews: React.Dispatch<React.SetStateAction<boolean>>;
};

const ProfileViews = ({ setShowProfileViews }: ProfileViewsProps) => {
  return (
    <section
      className={styles.section}
      onClick={(e) => {
        if (e.target === e.currentTarget) setShowProfileViews(false);
      }}
    >
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.head}>Profile Views</span>
          <span
            className={styles['close-icon-box']}
            onClick={() => setShowProfileViews(false)}
          >
            <IoClose className={styles['close-icon']} />
          </span>
        </header>

        <div className={styles['profile-views-container']}>
          <article className={styles['profile-viewer']}>
            <img
              src="../../assets/images/users/user10.jpeg"
              className={styles['profile-viewer-img']}
            />

            <span className={styles['profile-viewer-names']}>
              <span className={styles['profile-viewer-username']}>
                Cyplus Nation
              </span>
              <span className={styles['profile-viewer-handle']}>
                @cyplus_001
              </span>
            </span>

            <button className={styles['follow-btn']}>Follow</button>
          </article>
          <article className={styles['profile-viewer']}>
            <img
              src="../../assets/images/users/user10.jpeg"
              className={styles['profile-viewer-img']}
            />

            <span className={styles['profile-viewer-names']}>
              <span className={styles['profile-viewer-username']}>
                Cyplus Nation
              </span>
              <span className={styles['profile-viewer-handle']}>
                @cyplus_001
              </span>
            </span>

            <span className={styles['following-text']}>Following</span>
          </article>
          <article className={styles['profile-viewer']}>
            <img
              src="../../assets/images/users/user10.jpeg"
              className={styles['profile-viewer-img']}
            />

            <span className={styles['profile-viewer-names']}>
              <span className={styles['profile-viewer-username']}>
                Cyplus Nation
              </span>
              <span className={styles['profile-viewer-handle']}>
                @cyplus_001
              </span>
            </span>

            <button className={styles['follow-btn']}>Follow</button>
          </article>
          <article className={styles['profile-viewer']}>
            <img
              src="../../assets/images/users/user10.jpeg"
              className={styles['profile-viewer-img']}
            />

            <span className={styles['profile-viewer-names']}>
              <span className={styles['profile-viewer-username']}>
                Cyplus Nation
              </span>
              <span className={styles['profile-viewer-handle']}>
                @cyplus_001
              </span>
            </span>

            <span className={styles['following-text']}>Following</span>
          </article>
          <article className={styles['profile-viewer']}>
            <img
              src="../../assets/images/users/user10.jpeg"
              className={styles['profile-viewer-img']}
            />

            <span className={styles['profile-viewer-names']}>
              <span className={styles['profile-viewer-username']}>
                Cyplus Nation
              </span>
              <span className={styles['profile-viewer-handle']}>
                @cyplus_001
              </span>
            </span>

            <button className={styles['follow-btn']}>Follow</button>
          </article>
        </div>

        <span className={styles['views-text']}>
          This shows who visited your profile in the last 30 days!
        </span>
      </div>
    </section>
  );
};

export default ProfileViews;
