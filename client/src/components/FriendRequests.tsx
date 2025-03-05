import styles from '../styles/FriendRequests.module.css';
import { IoClose } from 'react-icons/io5';
import { PiCheckFatFill } from 'react-icons/pi';

type FriendRequestsProps = {
  setShowFriendRequests: React.Dispatch<React.SetStateAction<boolean>>;
};

const FriendRequests = ({ setShowFriendRequests }: FriendRequestsProps) => {
  return (
    <section
      className={styles.section}
      onClick={(e) => {
        if (e.target === e.currentTarget) setShowFriendRequests(false);
      }}
    >
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.head}>Friend requests</span>
          <span
            className={styles['close-icon-box']}
            onClick={() => setShowFriendRequests(false)}
          >
            <IoClose className={styles['close-icon']} />
          </span>
        </header>

        <div className={styles['friends-request-container']}>
          <article className={styles['friend-request']}>
            <span className={styles['friend-request-img-box']}>
              <img
                className={styles['friend-request-img']}
                src="../../assets/images/users/user13.jpeg"
              />

              <span className={styles['friend-request-icon-box']}>
                <PiCheckFatFill className={styles['friend-request-icon']} />
              </span>
            </span>

            <div className={styles['friend-request-details']}>
              <span className={styles['friend-request-username']}>
                travis_scott
              </span>

              <div className={styles['friend-btn-box']}>
                <button className={styles['friend-accept-btn']}>Accept</button>
                <button className={styles['friend-decline-btn']}>
                  Decline
                </button>
              </div>
            </div>
          </article>

          <article className={styles['friend-request']}>
            <span className={styles['friend-request-img-box']}>
              <img
                className={styles['friend-request-img']}
                src="../../assets/images/users/user10.jpeg"
              />
            </span>

            <div className={styles['friend-request-details']}>
              <span className={styles['friend-request-username']}>
                travis_scott
              </span>

              <div className={styles['friend-btn-box']}>
                <button className={styles['friend-accept-btn']}>Accept</button>
                <button className={styles['friend-decline-btn']}>
                  Decline
                </button>
              </div>
            </div>
          </article>

          <article className={styles['friend-request']}>
            <span className={styles['friend-request-img-box']}>
              <img
                className={styles['friend-request-img']}
                src="../../assets/images/users/user1.jpeg"
              />

              <span className={styles['friend-request-icon-box']}>
                <PiCheckFatFill className={styles['friend-request-icon']} />
              </span>
            </span>

            <div className={styles['friend-request-details']}>
              <span className={styles['friend-request-username']}>
                travis_scott
              </span>

              <div className={styles['friend-btn-box']}>
                <button className={styles['friend-accept-btn']}>Accept</button>
                <button className={styles['friend-decline-btn']}>
                  Decline
                </button>
              </div>
            </div>
          </article>

          <article className={styles['friend-request']}>
            <span className={styles['friend-request-img-box']}>
              <img
                className={styles['friend-request-img']}
                src="../../assets/images/users/user4.jpeg"
              />
            </span>

            <div className={styles['friend-request-details']}>
              <span className={styles['friend-request-username']}>
                travis_scott
              </span>

              <div className={styles['friend-btn-box']}>
                <button className={styles['friend-accept-btn']}>Accept</button>
                <button className={styles['friend-decline-btn']}>
                  Decline
                </button>
              </div>
            </div>
          </article>

          <article className={styles['friend-request']}>
            <span className={styles['friend-request-img-box']}>
              <img
                className={styles['friend-request-img']}
                src="../../assets/images/users/user5.jpeg"
              />
            </span>

            <div className={styles['friend-request-details']}>
              <span className={styles['friend-request-username']}>
                travis_scott
              </span>

              <div className={styles['friend-btn-box']}>
                <button className={styles['friend-accept-btn']}>Accept</button>
                <button className={styles['friend-decline-btn']}>
                  Decline
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};

export default FriendRequests;
