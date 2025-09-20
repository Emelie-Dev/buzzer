import { useContext, useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import styles from '../styles/Home.module.css';
import { Content } from '../components/CarouselItem';
import ContentBox from '../components/ContentBox';
import { ContentContext, GeneralContext } from '../Contexts';
import useScrollHandler from '../hooks/useScrollHandler';
import AsideHeader from '../components/AsideHeader';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MobileMenu from '../components/MobileMenu';
import Skeleton from 'react-loading-skeleton';
import LoadingAnimation from '../components/LoadingAnimation';
import { apiClient, getUrl } from '../Utilities';
import { toast } from 'sonner';
import Engagements from '../components/Engagements';
import { Link } from 'react-router-dom';

type CarouselData = {
  media: Content[];
  name: string;
  username: string;
  photo: string;
  time: string;
  aspectRatio: number;
  type: 'carousel';
  description: string;
};

type MediaData = {
  media: string;
  name: string;
  username: string;
  photo: string;
  time: string;
  aspectRatio: number;
  type: 'image' | 'video';
  description: string;
};

export type DataItem = CarouselData | MediaData;

const Following = () => {
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const {
    activeVideo,
    setActiveVideo,
    contentRef,
    scrollHandler,
    posts: contents,
    setPosts: setContents,
    postData,
  } = useScrollHandler(false, 'v1/contents?category=following');

  const [followList, setFollowList] = useState<Set<string>>(new Set());
  const [engagementModal, setEngagementModal] = useState<
    'followers' | 'following' | 'friends' | 'suggested' | 'private' | null
  >(null);

  const { setShowSearchPage, suggestedUsers, setSuggestedUsers } =
    useContext(GeneralContext);

  useEffect(() => {
    document.title = 'Buzzer - Following';

    scrollHandler();

    return () => {
      setShowSearchPage(false);
    };
  }, []);

  const hasViewedAll = (stories: any[]) => {
    return stories.every((story) => story.hasViewed);
  };

  const followUser = async (id: string) => {
    const newList = new Set(followList);
    newList.add(id);
    setFollowList(newList);

    try {
      await apiClient.post(`v1/follow/${id}`);

      setSuggestedUsers((prevValue) =>
        prevValue.filter((user) => user._id !== id)
      );
    } catch (err: any) {
      if (!err.response) {
        toast.error(`Could not follow user. Please Try again.`);
      } else {
        toast.error(err.response.data.message);
      }
    } finally {
      newList.delete(id);
      setFollowList(new Set(newList));
    }
  };

  return (
    <>
      <NavBar page="following" />

      <section className={styles.main}>
        <section className={styles['main-container2']} onScroll={scrollHandler}>
          <Header />

          <ContentContext.Provider
            value={{ contentRef, activeVideo, setActiveVideo }}
          >
            <div className={styles['content-container']}>
              {contents === null ? (
                Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className={styles['content-skeleton-div']}>
                    <div className={styles['top-content-skeleton']}>
                      <Skeleton inline height={22} />
                      <Skeleton inline height={10} />
                    </div>
                    <div className={styles['bottom-content-skeleton']}>
                      <Skeleton inline height={500} />
                      <div className={styles['engagement-content-skeleton']}>
                        <Skeleton circle width={50} height={50} />
                        <br />
                        <span className={styles['engagement-skeleton-box']}>
                          <Skeleton circle width={40} height={40} />
                          <Skeleton width={30} height={12} />
                        </span>
                        <span className={styles['engagement-skeleton-box']}>
                          <Skeleton circle width={40} height={40} />
                          <Skeleton width={30} height={12} />
                        </span>
                        <span className={styles['engagement-skeleton-box']}>
                          <Skeleton circle width={40} height={40} />
                          <Skeleton width={30} height={12} />
                        </span>
                        <span className={styles['engagement-skeleton-box']}>
                          <Skeleton circle width={40} height={40} />
                          <Skeleton width={30} height={12} />
                        </span>
                      </div>
                    </div>
                    <Skeleton inline width={'80%'} height={40} />
                  </div>
                ))
              ) : contents.length === 0 ? (
                <div className={styles['no-data-text']}>
                  Something went wrong while loading contents. Please refresh
                  the page or check your connection.
                </div>
              ) : (
                contents.map((data, index) => (
                  <ContentBox
                    key={index}
                    data={data}
                    contentType="following"
                    setContents={setContents}
                    setShowMobileMenu={setShowMobileMenu}
                  />
                ))
              )}

              {postData.loading && (
                <LoadingAnimation
                  style={{
                    width: '3rem',
                    height: '3rem',
                    transform: 'scale(2.5)',
                  }}
                />
              )}
            </div>
          </ContentContext.Provider>

          <Footer page={'following'} />
        </section>

        <section className={styles.aside}>
          <AsideHeader activeVideo={activeVideo} />

          <div className={styles['suggested-container']}>
            <span className={styles['suggested-text']}>Suggested for you</span>

            <div className={styles['suggested-users']}>
              {suggestedUsers === null ? (
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
              ) : suggestedUsers.length === 0 ? (
                <div className={styles['no-data-text']}>
                  We couldn’t find any users at the moment.
                </div>
              ) : (
                suggestedUsers.slice(0, 10).map((user) => (
                  <article key={user._id} className={styles['suggested-user']}>
                    <Link to={`/@${user.username}`}>
                      <span
                        className={`${styles['suggested-img-box']} ${
                          user.stories.length > 0
                            ? hasViewedAll(user.stories)
                              ? styles['suggested-img-box2']
                              : styles['suggested-img-box3']
                            : ''
                        }`}
                      >
                        <img
                          src={getUrl(user.photo, 'users')}
                          className={styles['suggested-user-img']}
                        />
                      </span>

                      <span className={styles['suggested-user-names']}>
                        <span className={styles['suggested-user-username']}>
                          {user.name}
                        </span>
                        <span className={styles['suggested-user-handle']}>
                          @{user.username}
                        </span>
                      </span>

                      <span
                        className={styles['follow-btn-box']}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className={`${styles['follow-btn']} ${
                            followList.has(user._id)
                              ? styles['disable-btn']
                              : ''
                          }`}
                          onClick={() => followUser(user._id)}
                        >
                          <span
                            className={`${
                              followList.has(user._id)
                                ? styles['follow-txt']
                                : ''
                            } `}
                          >
                            Follow
                          </span>
                        </button>

                        {followList.has(user._id) && (
                          <LoadingAnimation
                            style={{
                              position: 'absolute',
                              zIndex: 2,
                              width: 60,
                              height: 60,
                              opacity: 0.7,
                            }}
                          />
                        )}
                      </span>
                    </Link>
                  </article>
                ))
              )}
            </div>

            {suggestedUsers && suggestedUsers.length > 10 && (
              <div>
                <span
                  className={styles['more-users-text']}
                  onClick={() => setEngagementModal('suggested')}
                >
                  Show more
                </span>
              </div>
            )}
          </div>
        </section>
      </section>

      {showMobileMenu && (
        <MobileMenu
          showMobileMenu={showMobileMenu}
          setShowMobileMenu={setShowMobileMenu}
        />
      )}

      {engagementModal && (
        <Engagements value={engagementModal} setValue={setEngagementModal} />
      )}
    </>
  );
};

export default Following;
