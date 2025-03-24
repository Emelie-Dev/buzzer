import { useEffect, useRef, useState, useContext } from 'react';
import NavBar from '../components/NavBar';
import styles from '../styles/Inbox.module.css';
import { BiMessageDetail } from 'react-icons/bi';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { IoArrowBack } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import useScrollHandler from '../hooks/useScrollHandler';
import { GeneralContext } from '../Contexts';

const Inbox = () => {
  const [category, setCategory] = useState<'friends' | 'others'>('friends');
  const { scrollHandler } = useScrollHandler(true);

  const containerRef = useRef<HTMLDivElement>(null!);

  const { setShowSearchPage } = useContext(GeneralContext);

  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Buzzer - Inbox';

    return () => {
      setShowSearchPage(false);
    };
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      if (category === 'others') {
        containerRef.current.style.transform = `translateX(-100%)`;
      } else {
        containerRef.current.style.transform = `translateX(0%)`;
      }
    }
  }, [category]);

  return (
    <>
      <NavBar page="inbox" />

      <section className={styles.main}>
        <section className={styles['users-section']} onScroll={scrollHandler}>
          <Header page="inbox" />

          <h1 className={`${styles['user-head']} ${styles['user-head2']}`}>
            <IoArrowBack
              className={styles['back-icon']}
              onClick={() => navigate(-1)}
            />
            Inbox
          </h1>

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

            <div className={styles['users-div']} ref={containerRef}>
              <div className={styles['friends-container']}>
                <article className={styles['friend-box']}>
                  <img
                    src="../../assets/images/users/user14.jpeg"
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
                    src="../../assets/images/users/user14.jpeg"
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
                    src="../../assets/images/users/user14.jpeg"
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
              <div className={styles['friends-container']}>
                <article className={styles['friend-box']}>
                  <img
                    src="../../assets/images/users/user3.jpeg"
                    className={styles['friend-img']}
                  />

                  <span className={styles['friend-details']}>
                    <span className={styles['friend-data']}>
                      <span className={styles['friend-name']}>Jo Youri💖</span>

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
                    src="../../assets/images/users/user3.jpeg"
                    className={styles['friend-img']}
                  />

                  <span className={styles['friend-details']}>
                    <span className={styles['friend-data']}>
                      <span className={styles['friend-name']}>Jo Youri💖</span>

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
                    src="../../assets/images/users/user3.jpeg"
                    className={styles['friend-img']}
                  />

                  <span className={styles['friend-details']}>
                    <span className={styles['friend-data']}>
                      <span className={styles['friend-name']}>Jo Youri💖</span>

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

          <Footer page={'none'} />
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
