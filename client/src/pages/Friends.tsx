import NavBar from '../components/NavBar';
import styles from '../styles/Friends.module.css';
import { PiCheckFatFill } from 'react-icons/pi';
import { useEffect, useRef, useState, useContext } from 'react';
import { ContentContext, GeneralContext } from '../Contexts';
import ContentBox from '../components/ContentBox';
import useScrollHandler from '../hooks/useScrollHandler';
import AsideHeader from '../components/AsideHeader';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MobileMenu from '../components/MobileMenu';
import { IoPeopleSharp } from 'react-icons/io5';
import FriendRequests from '../components/FriendRequests';
import Skeleton from 'react-loading-skeleton';
import LoadingAnimation from '../components/LoadingAnimation';
import { apiClient, getUrl } from '../Utilities';
import { toast } from 'sonner';
import { MdOutlineHourglassEmpty, MdOutlineWifiOff } from 'react-icons/md';
import { Link } from 'react-router-dom';

const Friends = () => {
  const [category, setCategory] = useState<'users' | 'contents' | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [showFriendRequests, setShowFriendRequests] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null!);
  const mainRef = useRef<HTMLDivElement>(null!);

  const {
    activeVideo,
    setActiveVideo,
    contentRef,
    scrollHandler,
    posts: contents,
    setPosts: setContents,
    postData,
  } = useScrollHandler(false, 'v1/contents?category=friends');

  const { setShowSearchPage } = useContext(GeneralContext);

  const [requestsData, setRequestsData] = useState<{
    type: 'sent' | 'received';
    value: any[];
    loading: boolean | 'error';
  }>({ type: 'received', value: [], loading: false });

  const [replyQueue, setReplyQueue] = useState<Set<string>>(new Set());

  useEffect(() => {
    document.title = 'Buzzer - Friends';

    scrollHandler();

    return () => {
      setShowSearchPage(false);
    };
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      if (category === 'contents') {
        // containerRef.current.style.transform = `translateX(-100%)`;

        // containerRef.current.animate(
        //   {
        //     transform: ['translateX(100%)', 'translateX(0)'],
        //   },
        //   {
        //     fill: 'both',
        //     duration: 200,
        //   }
        // );
        if (activeVideo) activeVideo.play();
      } else if (category === 'users') {
        // containerRef.current.style.transform = `translateX(0%)`;
        // containerRef.current.animate(
        //   {
        //     transform: ['translateX(-100%)', 'translateX(0)'],
        //   },
        //   {
        //     fill: 'both',
        //     duration: 200,
        //   }
        // );
        if (activeVideo) activeVideo.pause();
      }
      mainRef.current.scrollTop = 0;
    }
  }, [category]);

  useEffect(() => {
    getRequests();
  }, [requestsData.type]);

  const getRequests = async () => {
    if (requestsData.loading === true) return;

    setRequestsData((prev) => ({ ...prev, loading: true }));

    try {
      const { data } = await apiClient(
        `v1/friends/requests?type=${requestsData.type}&page=true`
      );

      setRequestsData((prev) => ({
        ...prev,
        value: data.data.requests,
        loading: false,
      }));
    } catch {
      setRequestsData((prev) => ({
        ...prev,
        loading: 'error',
      }));

      toast.error(`An error occured while getting friend requests.`);
    }
  };

  const handleRequests = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRequestsData({
      value: [],
      type: e.target.value as 'sent' | 'received',
      loading: false,
    });
  };

  const replyRequest =
    (action: 'accept' | 'reject', id: string) =>
    async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();
      if (replyQueue.has(id)) return;

      const queue = new Set(replyQueue).add(id);
      setReplyQueue(queue);

      try {
        await apiClient.post(`v1/friends/request/respond/${id}`, { action });

        setRequestsData((prev) => ({
          ...prev,
          value: prev.value.filter((request) => request._id !== id),
        }));
      } catch (err: any) {
        if (!err.response) {
          toast.error(`Could not ${action} request. Please Try again.`);
        } else {
          toast.error(err.response.data.message);
        }
      } finally {
        queue.delete(id);
        setReplyQueue(new Set(queue));
      }
    };

  console.log(requestsData.value);

  return (
    <>
      <NavBar page="friends" />

      <section className={styles.main}>
        <section
          className={styles['main-container']}
          ref={mainRef}
          onScroll={scrollHandler}
        >
          <Header
            page="friends"
            friendsCategory={category}
            setFriendsCategory={setCategory}
            setShowFriendRequests={setShowFriendRequests}
          />

          <div className={styles.header}>
            <ul className={styles['header-list']}>
              <li
                className={`${styles['header-item']} ${
                  category === 'users' || category === null
                    ? styles['active-item']
                    : ''
                }`}
                onClick={() => setCategory('users')}
              >
                Users
              </li>
              <li
                className={`${styles['header-item']} ${
                  category === 'contents' ? styles['active-item'] : ''
                }`}
                onClick={() => setCategory('contents')}
              >
                Contents
              </li>
            </ul>

            <span
              className={styles['request-details']}
              onClick={() => setShowFriendRequests(true)}
            >
              <IoPeopleSharp className={styles['friends-icon']} />
              <span className={styles['request-length']}>10</span>
            </span>
          </div>

          <div className={styles['category-container']} ref={containerRef}>
            <div
              className={`${styles['users-container']} ${
                category === 'contents' ? styles['hide-section'] : ''
              }`}
            >
              <article className={styles['user']}>
                <img
                  className={styles['user-content']}
                  src="../../assets/images/content/content28.jpeg"
                />

                <div className={styles['user-details']}>
                  <span className={styles['user-img-box']}>
                    <img
                      className={styles['user-img']}
                      src="../../assets/images/users/profile5.jpeg"
                    />
                  </span>

                  <span className={styles['user-name-box']}>
                    <span className={styles['user-name']}>Don Jazzy</span>
                    <span className={styles['user-handle']}>donjazzy👑👑</span>
                  </span>

                  <button className={styles['user-follow-btn']}>Follow</button>
                </div>
              </article>

              <article className={styles['user']}>
                <img
                  className={styles['user-content']}
                  src="../../assets/images/content/content28.jpeg"
                />

                <div className={styles['user-details']}>
                  <span className={styles['user-img-box']}>
                    <img
                      className={styles['user-img']}
                      src="../../assets/images/users/profile5.jpeg"
                    />
                  </span>

                  <span className={styles['user-name-box']}>
                    <span className={styles['user-name']}>Don Jazzy</span>
                    <span className={styles['user-handle']}>donjazzy👑👑</span>
                  </span>

                  <button className={styles['user-follow-btn']}>Follow</button>
                </div>
              </article>

              <article className={styles['user']}>
                <img
                  className={styles['user-content']}
                  src="../../assets/images/content/content28.jpeg"
                />

                <div className={styles['user-details']}>
                  <span className={styles['user-img-box']}>
                    <img
                      className={styles['user-img']}
                      src="../../assets/images/users/profile5.jpeg"
                    />
                  </span>

                  <span className={styles['user-name-box']}>
                    <span className={styles['user-name']}>Don Jazzy</span>
                    <span className={styles['user-handle']}>donjazzy👑👑</span>
                  </span>

                  <button className={styles['user-follow-btn']}>Follow</button>
                </div>
              </article>

              <article className={styles['user']}>
                <img
                  className={styles['user-content']}
                  src="../../assets/images/content/content28.jpeg"
                />

                <div className={styles['user-details']}>
                  <span className={styles['user-img-box']}>
                    <img
                      className={styles['user-img']}
                      src="../../assets/images/users/profile5.jpeg"
                    />
                  </span>

                  <span className={styles['user-name-box']}>
                    <span className={styles['user-name']}>Don Jazzy</span>
                    <span className={styles['user-handle']}>donjazzy👑👑</span>
                  </span>

                  <button className={styles['user-follow-btn']}>Follow</button>
                </div>
              </article>

              <article className={styles['user']}>
                <img
                  className={styles['user-content']}
                  src="../../assets/images/content/content28.jpeg"
                />

                <div className={styles['user-details']}>
                  <span className={styles['user-img-box']}>
                    <img
                      className={styles['user-img']}
                      src="../../assets/images/users/profile5.jpeg"
                    />
                  </span>

                  <span className={styles['user-name-box']}>
                    <span className={styles['user-name']}>Don Jazzy</span>
                    <span className={styles['user-handle']}>donjazzy👑👑</span>
                  </span>

                  <button className={styles['user-follow-btn']}>Follow</button>
                </div>
              </article>

              <article className={styles['user']}>
                <img
                  className={styles['user-content']}
                  src="../../assets/images/content/content28.jpeg"
                />

                <div className={styles['user-details']}>
                  <span className={styles['user-img-box']}>
                    <img
                      className={styles['user-img']}
                      src="../../assets/images/users/profile5.jpeg"
                    />
                  </span>

                  <span className={styles['user-name-box']}>
                    <span className={styles['user-name']}>Don Jazzy</span>
                    <span className={styles['user-handle']}>donjazzy👑👑</span>
                  </span>

                  <button className={styles['user-follow-btn']}>Follow</button>
                </div>
              </article>

              <article className={styles['user']}>
                <img
                  className={styles['user-content']}
                  src="../../assets/images/content/content28.jpeg"
                />

                <div className={styles['user-details']}>
                  <span className={styles['user-img-box']}>
                    <img
                      className={styles['user-img']}
                      src="../../assets/images/users/profile5.jpeg"
                    />
                  </span>

                  <span className={styles['user-name-box']}>
                    <span className={styles['user-name']}>Don Jazzy</span>
                    <span className={styles['user-handle']}>donjazzy👑👑</span>
                  </span>

                  <button className={styles['user-follow-btn']}>Follow</button>
                </div>
              </article>

              <article className={styles['user']}>
                <img
                  className={styles['user-content']}
                  src="../../assets/images/content/content28.jpeg"
                />

                <div className={styles['user-details']}>
                  <span className={styles['user-img-box']}>
                    <img
                      className={styles['user-img']}
                      src="../../assets/images/users/profile5.jpeg"
                    />
                  </span>

                  <span className={styles['user-name-box']}>
                    <span className={styles['user-name']}>Don Jazzy</span>
                    <span className={styles['user-handle']}>donjazzy👑👑</span>
                  </span>

                  <button className={styles['user-follow-btn']}>Follow</button>
                </div>
              </article>

              <article className={styles['user']}>
                <img
                  className={styles['user-content']}
                  src="../../assets/images/content/content28.jpeg"
                />

                <div className={styles['user-details']}>
                  <span className={styles['user-img-box']}>
                    <img
                      className={styles['user-img']}
                      src="../../assets/images/users/profile5.jpeg"
                    />
                  </span>

                  <span className={styles['user-name-box']}>
                    <span className={styles['user-name']}>Don Jazzy</span>
                    <span className={styles['user-handle']}>donjazzy👑👑</span>
                  </span>

                  <button className={styles['user-follow-btn']}>Follow</button>
                </div>
              </article>
            </div>

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
                      contentType="home"
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
          </div>
          <Footer page={'none'} />
        </section>

        <section className={styles.aside}>
          <AsideHeader activeVideo={activeVideo} />

          <div className={styles['friends-request-container']}>
            <span className={styles['friends-request-header']}>
              <span className={styles['friends-request-text']}>
                Friend requests
              </span>
              <select
                className={styles['request-type-select']}
                value={requestsData.type}
                onChange={handleRequests}
              >
                <option value="received">Received</option>
                <option value="sent">Sent</option>
              </select>
            </span>

            <div className={styles['friend-requests']}>
              {requestsData.loading === true ? (
                <div className={styles['request-skeleton-container']}>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className={styles['request-skeleton-box']}>
                      <Skeleton circle height={55} width={55} />
                      <div className={styles['request-skeleton-details']}>
                        <Skeleton height={14} width="100%" />
                        <div>
                          <Skeleton height={28} width={65} />
                          <Skeleton height={28} width={65} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : requestsData.loading === 'error' ? (
                <div className={styles['error-div']}>
                  <MdOutlineWifiOff className={styles['empty-icon']} />
                  <span>Could not get friend requests.</span>
                  <button className={styles['error-btn']} onClick={getRequests}>
                    Try Again
                  </button>
                </div>
              ) : requestsData.value.length === 0 ? (
                <div className={styles['error-div']}>
                  <MdOutlineHourglassEmpty className={styles['empty-icon2']} />
                  <span>You don’t have any friend requests at the moment.</span>
                </div>
              ) : (
                requestsData.value.map((request) => (
                  <article
                    key={request._id}
                    className={styles['friend-request']}
                  >
                    <Link to={`/@${request.requester.username}`}>
                      <span className={styles['friend-request-img-box']}>
                        <img
                          className={styles['friend-request-img']}
                          src={getUrl(request.requester.photo, 'users')}
                        />

                        {request.isFollowing && (
                          <span className={styles['friend-request-icon-box']}>
                            <PiCheckFatFill
                              className={styles['friend-request-icon']}
                            />
                          </span>
                        )}
                      </span>

                      <div className={styles['friend-request-details']}>
                        <span className={styles['friend-request-username']}>
                          {request.requester.username}
                        </span>

                        <div className={styles['friend-btn-box']}>
                          <button
                            className={`${styles['friend-accept-btn']} ${
                              replyQueue.has(request._id)
                                ? styles['disable-btn']
                                : ''
                            }`}
                            onClick={replyRequest('accept', request._id)}
                          >
                            Accept
                          </button>
                          <button
                            className={`${styles['friend-decline-btn']} ${
                              replyQueue.has(request._id)
                                ? styles['disable-btn']
                                : ''
                            }`}
                            onClick={replyRequest('reject', request._id)}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))
              )}
            </div>

            {requestsData.value.length >= 10 && (
              <span
                className={styles['friends-request-all']}
                onClick={() => setShowFriendRequests(true)}
              >
                View all
              </span>
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

      {showFriendRequests && (
        <FriendRequests setShowFriendRequests={setShowFriendRequests} />
      )}
    </>
  );
};

export default Friends;
