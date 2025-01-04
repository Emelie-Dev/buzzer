import { useState } from 'react';
import NavBar from '../components/NavBar';
import styles from '../styles/Inbox.module.css';
import { BiMessageDetail } from 'react-icons/bi';

const Inbox = () => {
  const [category, setCategory] = useState<'friends' | 'others'>('friends');

  return (
    <>
      <NavBar page="inbox" />

      <section className={styles.main}>
        <section className={styles['users-section']}>
          <h1 className={styles['user-head']}>Inbox</h1>

          <div className={styles['user-container']}>
            <ul className={styles['user-head-list']}>
              <li
                className={`${styles['user-item']} ${
                  category === 'friends' ? styles['current-category'] : ''
                }`}
                onClick={() => setCategory('friends')}
              >
                Friends
              </li>
              <li
                className={`${styles['user-item']} ${
                  category === 'others' ? styles['current-category'] : ''
                }`}
                onClick={() => setCategory('others')}
              >
                Others
              </li>
            </ul>

            <div className={styles['users-div']}>
              <div className={styles['friends-container']}>
                <article className={styles['friend-box']}>
                  <img
                    src="../../public/assets/images/users/user14.jpeg"
                    className={styles['friend-img']}
                  />

                  <span className={styles['friend-details']}>
                    <span className={styles['friend-data']}>
                      <span className={styles['friend-name']}>Godfather👑</span>

                      <time className={styles['msg-time']}>11:00 AM</time>
                    </span>

                    <span className={styles['msg-data']}>
                      <span className={styles['friend-msg']}>
                        Please send the full video
                        mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm
                      </span>

                      <span className={styles['msg-count']}>2</span>
                    </span>
                  </span>
                </article>

                <article className={styles['friend-box']}>
                  <img
                    src="../../public/assets/images/users/user14.jpeg"
                    className={styles['friend-img']}
                  />

                  <span className={styles['friend-details']}>
                    <span className={styles['friend-data']}>
                      <span className={styles['friend-name']}>Godfather👑</span>

                      <time
                        className={`${styles['msg-time']} ${styles['msg-time2']}`}
                      >
                        11:00 AM
                      </time>
                    </span>

                    <span className={styles['msg-data']}>
                      <span className={styles['friend-msg']}>
                        Please send the full video
                        mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm
                      </span>

                      <span
                        className={`${styles['msg-count']} ${styles['msg-count2']}`}
                      >
                        2
                      </span>
                    </span>
                  </span>
                </article>

                <article className={styles['friend-box']}>
                  <img
                    src="../../public/assets/images/users/user14.jpeg"
                    className={styles['friend-img']}
                  />

                  <span className={styles['friend-details']}>
                    <span className={styles['friend-data']}>
                      <span className={styles['friend-name']}>Godfather👑</span>

                      <time
                        className={`${styles['msg-time']} ${styles['msg-time2']}`}
                      >
                        11:00 AM
                      </time>
                    </span>

                    <span className={styles['msg-data']}>
                      <span className={styles['friend-msg']}></span>

                      <span
                        className={`${styles['msg-count']} ${styles['msg-count2']}`}
                      ></span>
                    </span>
                  </span>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className={styles['chat-section']}>
          <div className={styles['chat-div']}>
            <span className={styles['chat-icon-box']}>
              <BiMessageDetail className={styles['chat-icon']} />
            </span>
            <span className={styles['chat-text']}>
              Select a user to start a conversation.
            </span>
          </div>
        </section>
      </section>
    </>
  );
};
export default Inbox;
