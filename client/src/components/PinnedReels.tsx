import styles from '../styles/PinnedReels.module.css';
import { IoClose } from 'react-icons/io5';
import { RiUnpinFill } from 'react-icons/ri';

type PinnedReelsProps = {
  setShowPinnedVideos: React.Dispatch<React.SetStateAction<boolean>>;
};

const PinnedReels = ({ setShowPinnedVideos }: PinnedReelsProps) => {
  return (
    <section
      className={styles.section}
      onClick={(e) => {
        if (e.target === e.currentTarget) setShowPinnedVideos(false);
      }}
    >
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.head}>Pinned Reels</span>
          <span
            className={styles['close-icon-box']}
            onClick={() => setShowPinnedVideos(false)}
          >
            <IoClose className={styles['close-icon']} />
          </span>
        </header>

        <div className={styles['pinned-videos-div']}>
          <article className={styles['pinned-video-box']}>
            <video className={styles['pinned-video']}>
              <source
                src={`../../assets/images/content/content21.mp4`}
                type="video/mp4"
              />
              Your browser does not support playing video.
            </video>

            <div className={styles['pinned-video-details']}>
              <RiUnpinFill className={styles['unpin-icon']} title="Unpin" />

              <div className={styles['pinned-video-data']}>
                <span className={styles['profile-img-span']}>
                  <img
                    src={`../../assets/images/users/user8.jpeg`}
                    className={styles['profile-img2']}
                  />
                </span>

                <span className={styles['pinned-video-username']}>
                  Jon Snow🦅
                </span>
              </div>

              <span className={styles['pinned-video-duration']}>02:30</span>
            </div>
          </article>

          <article className={styles['pinned-video-box']}>
            <video className={styles['pinned-video']}>
              <source
                src={`../../assets/images/content/content24.mp4`}
                type="video/mp4"
              />
              Your browser does not support playing video.
            </video>

            <div className={styles['pinned-video-details']}>
              <RiUnpinFill className={styles['unpin-icon']} title="Unpin" />

              <div className={styles['pinned-video-data']}>
                <span className={styles['profile-img-span']}>
                  <img
                    src={`../../assets/images/users/user8.jpeg`}
                    className={styles['profile-img2']}
                  />
                </span>

                <span className={styles['pinned-video-username']}>
                  aryastark
                </span>
              </div>

              <span className={styles['pinned-video-duration']}>00:47</span>
            </div>
          </article>

          <article className={styles['pinned-video-box']}>
            <video className={styles['pinned-video']}>
              <source
                src={`../../assets/images/content/content25.mp4`}
                type="video/mp4"
              />
              Your browser does not support playing video.
            </video>

            <div className={styles['pinned-video-details']}>
              <RiUnpinFill className={styles['unpin-icon']} title="Unpin" />

              <div className={styles['pinned-video-data']}>
                <span className={styles['profile-img-span']}>
                  <img
                    src={`../../assets/images/users/user8.jpeg`}
                    className={styles['profile-img2']}
                  />
                </span>

                <span className={styles['pinned-video-username']}>
                  missandei
                </span>
              </div>

              <span className={styles['pinned-video-duration']}>01:08</span>
            </div>
          </article>

          <article className={styles['pinned-video-box']}>
            <video className={styles['pinned-video']}>
              <source
                src={`../../assets/images/content/content27.mp4`}
                type="video/mp4"
              />
              Your browser does not support playing video.
            </video>

            <div className={styles['pinned-video-details']}>
              <RiUnpinFill className={styles['unpin-icon']} title="Unpin" />

              <div className={styles['pinned-video-data']}>
                <span className={styles['profile-img-span']}>
                  <img
                    src={`../../assets/images/users/user8.jpeg`}
                    className={styles['profile-img2']}
                  />
                </span>

                <span className={styles['pinned-video-username']}>
                  antonella_roccuzzo
                </span>
              </div>

              <span className={styles['pinned-video-duration']}>12:35</span>
            </div>
          </article>

          <article className={styles['pinned-video-box']}>
            <video className={styles['pinned-video']}>
              <source
                src={`../../assets/images/content/content29.mp4`}
                type="video/mp4"
              />
              Your browser does not support playing video.
            </video>

            <div className={styles['pinned-video-details']}>
              <RiUnpinFill className={styles['unpin-icon']} title="Unpin" />

              <div className={styles['pinned-video-data']}>
                <span className={styles['profile-img-span']}>
                  <img
                    src={`../../assets/images/users/user8.jpeg`}
                    className={styles['profile-img2']}
                  />
                </span>

                <span className={styles['pinned-video-username']}>
                  antonella_roccuzzo
                </span>
              </div>

              <span className={styles['pinned-video-duration']}>09:16</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};

export default PinnedReels;
