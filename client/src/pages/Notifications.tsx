import NavBar from '../components/NavBar';
import styles from '../styles/Notifications.module.css';
import AsideHeader from '../components/AsideHeader';
import { useState } from 'react';
import NotificationGroup from '../components/NotificationGroup';

const Notifications = () => {
  const [category, setCategory] = useState<
    'all' | 'posts' | 'mentions' | 'followers' | 'requests' | 'system'
  >('all');
  const [selectCount, setSelectCount] = useState<number>(0);

  return (
    <>
      <NavBar page="notifications" />

      <section className={styles.main}>
        <section className={styles['main-container']}>
          <header className={styles.header}>
            <ul className={styles['category-list']}>
              <li
                className={`${styles['category-item']} ${
                  category === 'all' ? styles['current-category'] : ''
                } ${selectCount > 0 ? styles['hide-items'] : ''}`}
                onClick={() => setCategory('all')}
              >
                View All
                <span className={styles['category-count']}>15</span>
              </li>
              <li
                className={`${styles['category-item']} ${
                  category === 'posts' ? styles['current-category'] : ''
                }  ${selectCount > 0 ? styles['hide-items'] : ''}`}
                onClick={() => setCategory('posts')}
              >
                Posts
                <span className={styles['category-count']}>5</span>
              </li>
              <li
                className={`${styles['category-item']} ${
                  category === 'mentions' ? styles['current-category'] : ''
                }  ${selectCount > 0 ? styles['hide-items'] : ''}`}
                onClick={() => setCategory('mentions')}
              >
                Mentions
                <span className={styles['category-count']}>3</span>
              </li>
              <li
                className={`${styles['category-item']} ${
                  category === 'followers' ? styles['current-category'] : ''
                }  ${selectCount > 0 ? styles['hide-items'] : ''}`}
                onClick={() => setCategory('followers')}
              >
                Followers
                <span className={styles['category-count']}>2</span>
              </li>
              <li
                className={`${styles['category-item']} ${
                  category === 'requests' ? styles['current-category'] : ''
                }  ${selectCount > 0 ? styles['hide-items'] : ''}`}
                onClick={() => setCategory('requests')}
              >
                Requests
                <span className={styles['category-count']}>4</span>
              </li>
              <li
                className={`${styles['category-item']} ${
                  category === 'system' ? styles['current-category'] : ''
                }  ${selectCount > 0 ? styles['hide-items'] : ''}`}
                onClick={() => setCategory('system')}
              >
                System
                <span className={styles['category-count']}>1</span>
              </li>
            </ul>

            {selectCount > 0 && (
              <div className={styles['select-box']}>
                <span>
                  Selected {selectCount} {selectCount === 1 ? 'item' : 'items'}
                </span>

                <div className={styles['select-btn-box']}>
                  <button
                    className={styles['cancel-btn']}
                    onClick={() => setSelectCount(0)}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles['delete-btn']}
                    onClick={() => setSelectCount(0)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </header>

          <div className={styles['notifications-container']}>
            {new Array(3).fill(null).map((_, index) => (
              <NotificationGroup
                key={index}
                index={index}
                setSelectCount={setSelectCount}
                selectCount={selectCount}
              />
            ))}
          </div>
        </section>

        <section className={styles.aside}>
          <AsideHeader activeVideo={null} />

          <div className={styles['profile-views-container']}>
            <span className={styles['profile-views-text']}>Profile Views</span>

            <div className={styles['profile-viewers-div']}>
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
      </section>
    </>
  );
};
export default Notifications;
