import styles from '../styles/PinnedReels.module.css';
import { IoClose } from 'react-icons/io5';
import { RiUnpinFill } from 'react-icons/ri';
import Skeleton from 'react-loading-skeleton';
import { getTime, getUrl } from '../Utilities';
import { Link, useNavigate } from 'react-router-dom';

type PinnedReelsProps = {
  setShowPinnedVideos: React.Dispatch<React.SetStateAction<boolean>>;
  pinnedReels: any[] | 'error';
  getPinnedReels: () => Promise<void>;
  unPinReel: (
    e: React.MouseEvent<SVGElement, MouseEvent>,
    id: string
  ) => Promise<void>;
};

const PinnedReels = ({
  setShowPinnedVideos,
  pinnedReels,
  getPinnedReels,
  unPinReel,
}: PinnedReelsProps) => {
  const navigate = useNavigate();

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
          {pinnedReels === null ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={index}
                className={styles['pinned-reels-skeleton']}
              />
            ))
          ) : pinnedReels === 'error' ? (
            <div className={styles['error-div']}>
              <span>Could not load pinned reels.</span>
              <button className={styles['error-btn']} onClick={getPinnedReels}>
                Try Again
              </button>
            </div>
          ) : pinnedReels.length === 0 ? (
            <div className={styles['error-div']}>
              <span>You don't have any pinned reels.</span>
            </div>
          ) : (
            pinnedReels.map((reel, index) => (
              <article key={index} className={styles['pinned-video-box']}>
                <Link to={'#'}>
                  <video className={styles['pinned-video']}>
                    <source src={getUrl(reel.src, 'reels')} type="video/mp4" />
                    Your browser does not support playing video.
                  </video>

                  <div className={styles['pinned-video-details']}>
                    <RiUnpinFill
                      className={styles['unpin-icon']}
                      title="Unpin"
                      onClick={(e) => unPinReel(e, reel._id)}
                    />

                    <span
                      className={styles['pinned-video-data']}
                      onClick={() => navigate(`/@${reel.username}`)}
                    >
                      <span
                        className={`${styles['profile-img-span']} ${
                          reel.hasStory && reel.hasUnviewedStory
                            ? styles['profile-img-span3']
                            : reel.hasStory
                            ? styles['profile-img-span2']
                            : ''
                        }`}
                      >
                        <img
                          className={`${styles['profile-img2']} ${
                            !reel.hasStory ? styles['no-story-img'] : ''
                          }`}
                          src={getUrl(reel.photo, 'users')}
                        />
                      </span>

                      <span className={styles['pinned-video-username']}>
                        {reel.username}
                      </span>
                    </span>

                    <span className={styles['pinned-video-duration']}>
                      {getTime(reel.time)}
                    </span>
                  </div>
                </Link>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default PinnedReels;
