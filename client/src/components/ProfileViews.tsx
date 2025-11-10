import styles from '../styles/ProfileViews.module.css';
import { IoClose } from 'react-icons/io5';
import Skeleton from 'react-loading-skeleton';
import { Link } from 'react-router-dom';
import { getUrl } from '../Utilities';
import LoadingAnimation from './LoadingAnimation';

type ProfileViewsProps = {
  setShowProfileViews: React.Dispatch<React.SetStateAction<boolean>>;
  profileViews: any[];
  getProfileViews: () => Promise<void>;
  handleFollow: (
    id: string
  ) => (
    e: React.MouseEvent<HTMLSpanElement | HTMLButtonElement, MouseEvent>
  ) => Promise<void>;
  following: {
    queue: Set<string>;
    list: Set<string>;
    value: any[];
  };
  viewsData: {
    loading: boolean | 'error';
    end: boolean;
    cursor: {
      followers: number;
      createdAt: Date;
    };
  };
  setViewsData: React.Dispatch<
    React.SetStateAction<{
      loading: boolean | 'error';
      end: boolean;
      cursor: {
        followers: number;
        createdAt: Date;
      };
    }>
  >;
};

const ProfileViews = ({
  setShowProfileViews,
  profileViews,
  handleFollow,
  getProfileViews,
  viewsData,
  following,
  setViewsData,
}: ProfileViewsProps) => {
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;

    const isBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 150;

    if (isBottom && !viewsData.end && !(viewsData.loading === true)) {
      setViewsData((prev) => ({ ...prev, loading: true }));
      getProfileViews();
    }
  };

  return (
    <section
      className={styles.section}
      onClick={(e) => {
        if (e.target === e.currentTarget) setShowProfileViews(false);
      }}
    >
      <div className={styles.container} onScroll={handleScroll}>
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
          {viewsData.loading === true && profileViews.length === 0 ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className={styles['suggested-skeleton-box']}>
                <Skeleton circle height={48} width={48} />
                <div className={styles['suggested-skeleton-box2']}>
                  <Skeleton height={14} width="50%" />
                  <Skeleton height={14} width="80%" />
                </div>
                <Skeleton height={30} width={60} />
              </div>
            ))
          ) : viewsData.loading === 'error' && profileViews.length === 0 ? (
            <div className={styles['no-data-text']}>
              Could not load your profile views.
            </div>
          ) : viewsData.loading === false && profileViews.length === 0 ? (
            <div className={styles['no-data-text']}>
              You don't have any profile views at the moment.
            </div>
          ) : (
            profileViews.slice(0, 10).map((view) => (
              <article
                key={view._id}
                className={`${styles['profile-viewer']} ${
                  following.queue.has(view.user._id)
                    ? styles['disable-item']
                    : ''
                }`}
              >
                <Link to={`/@${view.user.username}`}>
                  <img
                    src={getUrl(view.user.photo, 'users')}
                    className={styles['profile-viewer-img']}
                  />

                  <span className={styles['profile-viewer-names']}>
                    <span className={styles['profile-viewer-username']}>
                      {view.user.name || <>&nbsp;</>}
                    </span>
                    <span className={styles['profile-viewer-handle']}>
                      @{view.user.username}
                    </span>
                  </span>

                  {following.list.has(view.user._id) ? (
                    <span
                      className={styles['following-text']}
                      onClick={handleFollow(view.user._id)}
                    >
                      Following
                    </span>
                  ) : (
                    <button
                      className={styles['follow-btn']}
                      onClick={handleFollow(view.user._id)}
                    >
                      Follow
                    </button>
                  )}
                </Link>
              </article>
            ))
          )}
        </div>

        {profileViews.length > 0 && viewsData.loading === true && (
          <div className={styles['animation-box']}>
            <LoadingAnimation
              style={{
                width: '3rem',
                height: '3rem',
                transform: 'scale(2.5)',
              }}
            />
          </div>
        )}

        <span className={styles['views-text']}>
          This shows who visited your profile in the last 30 days!
        </span>
      </div>
    </section>
  );
};

export default ProfileViews;
