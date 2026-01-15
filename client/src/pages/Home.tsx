import { useContext, useEffect, useRef, useState } from 'react';
import NavBar from '../components/NavBar';
import styles from '../styles/Home.module.css';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import ContentBox from '../components/ContentBox';
import {
  ContentContext,
  GeneralContext,
  AuthContext,
  StoryContext,
} from '../Contexts';
import useScrollHandler from '../hooks/useScrollHandler';
import AsideHeader from '../components/AsideHeader';
import { GoPlus } from 'react-icons/go';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Skeleton from 'react-loading-skeleton';
import { apiClient, getTime, getUrl } from '../Utilities';
import Engagements from '../components/Engagements';
import { toast } from 'sonner';
import LoadingAnimation from '../components/LoadingAnimation';
import { MdOutlineHourglassEmpty, MdOutlineWifiOff } from 'react-icons/md';
import CollaborationRequests from '../components/CollaborationRequests';

export interface User {
  name: string;
}

export interface Arrow {
  left: boolean;
  right: boolean;
}

const Home = () => {
  const [showArrow, setShowArrow] = useState<Arrow>({
    left: false,
    right: true,
  });

  const {
    activeVideo,
    setActiveVideo,
    contentRef,
    scrollHandler,
    posts: contents,
    setPosts: setContents,
    postData,
  } = useScrollHandler(false, 'v1/contents?category=home');
  const {
    setCreateCategory,
    setShowSearchPage,
    showCollaborationRequests,
    setShowCollaborationRequests,
  } = useContext(GeneralContext);
  const { user } = useContext(AuthContext);
  const { stories, userStory, setStoryIndex, setViewStory } =
    useContext(StoryContext);
  const [engagementModal, setEngagementModal] = useState<
    'followers' | 'following' | 'friends' | 'suggested' | 'private' | null
  >(null);

  const [requestsData, setRequestsData] = useState<{
    type: 'sent' | 'received';
    loading: boolean | 'error';
  }>({ type: 'received', loading: true });

  const [requests, setRequests] = useState<{
    sent: { value: any[]; end: boolean };
    received: { value: any[]; end: boolean };
  }>({ sent: { value: [], end: false }, received: { value: [], end: false } });

  const [replyQueue, setReplyQueue] = useState<Set<string>>(new Set());

  const storyRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    document.title = 'Buzzer - Home';
    scrollHandler();

    return () => {
      setShowSearchPage(false);
    };
  }, []);

  useEffect(() => {
    const target = storyRef.current;

    setShowArrow({
      left: target.scrollLeft > 30,
      right: !(
        target.scrollLeft + target.clientWidth >=
        target.scrollWidth - 5
      ),
    });
  }, [stories]);

  useEffect(() => {
    getCollaborationRequests();
  }, [requestsData.type]);

  const getCollaborationRequests = async () => {
    try {
      const { data } = await apiClient(
        `v1/users/collaborate?type=${requestsData.type}`
      );

      setRequestsData((prev) => ({
        ...prev,
        loading: false,
      }));
      setRequests((prev) => ({
        ...prev,
        [requestsData.type]: {
          value: data.data.requests,
          end: data.data.requests.length < 20,
        },
      }));
    } catch {
      setRequestsData((prev) => ({
        ...prev,
        loading: 'error',
      }));

      toast.error(`An error occured while getting collaboration requests.`);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;

    setShowArrow({
      left: target.scrollLeft > 30,
      right: !(
        target.scrollLeft + target.clientWidth >=
        target.scrollWidth - 5
      ),
    });
  };

  const handleRequests = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRequestsData({
      type: e.target.value as 'sent' | 'received',
      loading: true,
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
        const { data } = await apiClient.post(
          `v1/users/collaborate/respond/${id}`,
          { action }
        );

        setRequests((prev) => ({
          ...prev,
          received: {
            ...prev.received,
            value: prev.received.value.filter((request) => request._id !== id),
          },
        }));
        toast.success(data.message);
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

  const cancelRequest =
    (id: string) =>
    async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();
      if (replyQueue.has(id)) return;

      const queue = new Set(replyQueue).add(id);
      setReplyQueue(queue);

      try {
        await apiClient.delete(`v1/users/collaborate/${id}`);

        setRequests((prev) => ({
          ...prev,
          sent: {
            ...prev.sent,
            value: prev.sent.value.filter((request) => request._id !== id),
          },
        }));
        toast.success(`Collaboration request cancelled.`);
      } catch (err: any) {
        if (!err.response) {
          toast.error(`Could not cancel request. Please Try again.`);
        } else {
          toast.error(err.response.data.message);
        }
      } finally {
        queue.delete(id);
        setReplyQueue(new Set(queue));
      }
    };

  return (
    <>
      <NavBar page="home" />

      <section className={styles.main}>
        <section className={styles['main-container']} onScroll={scrollHandler}>
          <Header />

          <div className={styles['scroll-div']}>
            <span
              className={`${styles['left-arrow-box']} ${
                !showArrow.left ? styles['hide-icon'] : ''
              }`}
              onClick={() => (storyRef.current.scrollLeft -= 300)}
            >
              <MdKeyboardArrowLeft className={styles['left-arrow']} />
            </span>

            <div
              className={styles['stories-container']}
              ref={storyRef}
              onScroll={handleScroll}
            >
              {stories === null ? (
                <div className={styles['story-skeleton-container']}>
                  <Skeleton
                    count={7}
                    height={66}
                    width={66}
                    circle
                    inline
                    className={styles['story-skeleton']}
                  />
                  <Skeleton
                    count={7}
                    height={15}
                    width={66}
                    inline
                    className={styles['story-skeleton']}
                  />
                </div>
              ) : stories.length === 0 ? (
                userStory.length > 0 ? (
                  <article
                    className={styles.userStory}
                    onClick={() => {
                      setStoryIndex(0);
                      setViewStory(true);
                    }}
                  >
                    <span className={styles['user-pics-box']}>
                      <img
                        src={getUrl(user.photo, 'users')}
                        alt={user.username}
                        className={styles['user-pics']}
                      />
                    </span>

                    <span
                      className={`${styles['user-name']} ${styles['owner-name']}`}
                    >
                      Your Story
                    </span>
                  </article>
                ) : (
                  <article
                    className={`${styles.user}`}
                    onClick={() => {
                      setCreateCategory('story');
                    }}
                  >
                    <Link to={'/create'}>
                      <span className={styles['add-story']}>
                        <span className={styles['add-story-box']}>
                          <GoPlus className={styles['add-story-icon']} />
                        </span>
                      </span>

                      <span
                        className={`${styles['user-name']} ${styles['owner-name']}`}
                      >
                        Your Story
                      </span>
                    </Link>
                  </article>
                )
              ) : (
                <>
                  {userStory.length > 0 ? (
                    <article
                      className={styles.userStory}
                      onClick={() => {
                        setStoryIndex(0);
                        setViewStory(true);
                      }}
                    >
                      <span className={styles['user-pics-box']}>
                        <img
                          src={getUrl(user.photo, 'users')}
                          alt={user.username}
                          className={styles['user-pics']}
                        />
                      </span>

                      <span
                        className={`${styles['user-name']} ${styles['owner-name']}`}
                      >
                        Your Story
                      </span>
                    </article>
                  ) : (
                    <article
                      className={`${styles.user}`}
                      onClick={() => {
                        setCreateCategory('story');
                      }}
                    >
                      <Link to={'/create'}>
                        <span className={styles['add-story']}>
                          <span className={styles['add-story-box']}>
                            <GoPlus className={styles['add-story-icon']} />
                          </span>
                        </span>

                        <span
                          className={`${styles['user-name']} ${styles['owner-name']}`}
                        >
                          Your Story
                        </span>
                      </Link>
                    </article>
                  )}

                  {stories.map(({ user }, index) => (
                    <article
                      key={index}
                      className={styles.userStory}
                      onClick={() => {
                        setStoryIndex(userStory.length > 0 ? index + 1 : index);
                        setViewStory(true);
                      }}
                    >
                      <span className={styles['user-pics-box']}>
                        <img
                          src={getUrl(user.photo, 'users')}
                          alt={user.username}
                          className={styles['user-pics']}
                        />
                      </span>

                      <span className={styles['user-name']}>
                        {user.username}
                      </span>
                    </article>
                  ))}
                </>
              )}
            </div>

            <span
              className={`${styles['right-arrow-box']}  ${
                !showArrow.right || stories === null ? styles['hide-icon'] : ''
              }`}
              onClick={() => (storyRef.current.scrollLeft += 300)}
            >
              <MdKeyboardArrowRight className={styles['right-arrow']} />
            </span>
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
                  <br /> <br />
                  Something went wrong while loading contents. Please refresh
                  the page or check your connection.
                </div>
              ) : (
                contents.map((data) => (
                  <ContentBox
                    key={data._id}
                    data={data}
                    contentType="home"
                    setContents={setContents}
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

          <Footer page={'home'} />
        </section>

        <section className={styles.aside}>
          <AsideHeader activeVideo={activeVideo} />

          <div className={styles['suggested-container']}>
            <span className={styles['friends-request-header']}>
              <span className={styles['friends-request-text']}>
                Collaboration Requests
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

            <div className={styles['suggested-users']}>
              {requestsData.loading === true ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div className={styles['collab-skeleton']} key={index}>
                    <Skeleton className={styles['pinned-reels-skeleton']} />

                    <span className={styles['collab-skeleton-btn-box']}>
                      <Skeleton height={30} />
                      <Skeleton height={30} />
                    </span>
                  </div>
                ))
              ) : requestsData.loading === 'error' ? (
                <div className={styles['error-div']}>
                  <MdOutlineWifiOff className={styles['empty-icon']} />
                  <span>Could not get collaboration requests.</span>
                  <button
                    className={styles['error-btn']}
                    onClick={getCollaborationRequests}
                  >
                    Try Again
                  </button>
                </div>
              ) : requests[requestsData.type].value.length === 0 ? (
                <div className={styles['error-div']}>
                  <MdOutlineHourglassEmpty className={styles['empty-icon2']} />
                  <span>
                    You don’t have any{' '}
                    {requestsData.type === 'received'
                      ? 'collaboration'
                      : 'sent'}{' '}
                    requests at the moment.
                  </span>
                </div>
              ) : (
                requests[requestsData.type].value.slice(0, 5).map((request) =>
                  requestsData.type === 'received' ? (
                    <article
                      key={request._id}
                      className={styles['pinned-video-box']}
                    >
                      <Link to={'#'} className={styles['pinned-video-link']}>
                        {request.post.type === 'video' ? (
                          <video className={styles['pinned-video']}>
                            <source
                              src={getUrl(
                                request.post.src,
                                `${request.type[1]}s`
                              )}
                              type="video/mp4"
                            />
                            Your browser does not support playing video.
                          </video>
                        ) : (
                          <img
                            className={styles['pinned-video']}
                            src={getUrl(
                              request.post.src,
                              `${request.type[1]}s`
                            )}
                          />
                        )}

                        <div className={styles['pinned-video-details']}>
                          <div className={styles['pinned-video-data']}>
                            <span
                              className={`${styles['profile-img-span']} ${
                                request.hasStory && request.hasUnviewedStory
                                  ? styles['profile-img-span3']
                                  : request.hasStory
                                  ? styles['profile-img-span2']
                                  : ''
                              }`}
                            >
                              <img
                                className={`${styles['profile-img2']} ${
                                  !request.hasStory
                                    ? styles['no-story-img']
                                    : ''
                                }`}
                                src={getUrl(request.requester.photo, 'users')}
                              />
                            </span>

                            <span className={styles['pinned-video-username']}>
                              {request.requester.username}
                            </span>
                          </div>

                          <span className={styles['pinned-video-duration']}>
                            {getTime(request.createdAt)}
                          </span>
                        </div>
                      </Link>

                      <div className={styles['friend-btn-box']}>
                        <button
                          className={`${styles['friend-accept-btn']} ${
                            replyQueue.has(request._id)
                              ? styles['disable-link']
                              : ''
                          }`}
                          onClick={replyRequest('accept', request._id)}
                        >
                          Accept
                        </button>
                        <button
                          className={`${styles['friend-decline-btn']} ${
                            replyQueue.has(request._id)
                              ? styles['disable-link']
                              : ''
                          }`}
                          onClick={replyRequest('reject', request._id)}
                        >
                          Decline
                        </button>
                      </div>
                    </article>
                  ) : (
                    <article
                      key={request._id}
                      className={styles['pinned-video-box']}
                    >
                      <Link to={'#'} className={styles['pinned-video-link']}>
                        {request.post.type === 'video' ? (
                          <video className={styles['pinned-video']}>
                            <source
                              src={getUrl(
                                request.post.src,
                                `${request.type[1]}s`
                              )}
                              type="video/mp4"
                            />
                            Your browser does not support playing video.
                          </video>
                        ) : (
                          <img
                            className={styles['pinned-video']}
                            src={getUrl(
                              request.post.src,
                              `${request.type[1]}s`
                            )}
                          />
                        )}

                        <div className={styles['pinned-video-details']}>
                          <div className={styles['pinned-video-data']}>
                            <span
                              className={`${styles['profile-img-span']} ${
                                request.hasStory && request.hasUnviewedStory
                                  ? styles['profile-img-span3']
                                  : request.hasStory
                                  ? styles['profile-img-span2']
                                  : ''
                              }`}
                            >
                              <img
                                className={`${styles['profile-img2']} ${
                                  !request.hasStory
                                    ? styles['no-story-img']
                                    : ''
                                }`}
                                src={getUrl(request.recipient.photo, 'users')}
                              />
                            </span>

                            <span className={styles['pinned-video-username']}>
                              {request.recipient.username}
                            </span>
                          </div>

                          <span className={styles['pinned-video-duration']}>
                            {getTime(request.createdAt)}
                          </span>
                        </div>
                      </Link>

                      <div className={styles['friend-btn-box']}>
                        <button
                          className={`${styles['friend-decline-btn']} ${
                            replyQueue.has(request._id)
                              ? styles['disable-link']
                              : ''
                          }`}
                          onClick={cancelRequest(request._id)}
                        >
                          Cancel Request
                        </button>
                      </div>
                    </article>
                  )
                )
              )}
            </div>

            {requests[requestsData.type].value.length > 5 && (
              <div>
                <span
                  className={styles['more-users-text']}
                  onClick={() => setShowCollaborationRequests(true)}
                >
                  Show more
                </span>
              </div>
            )}
          </div>
        </section>
      </section>

      {engagementModal && (
        <Engagements value={engagementModal} setValue={setEngagementModal} />
      )}

      {showCollaborationRequests && (
        <CollaborationRequests
          setShowCollaborationRequests={setShowCollaborationRequests}
          requests={requests}
          setRequests={setRequests}
          replyRequest={replyRequest}
          replyQueue={replyQueue}
          requestType={requestsData.type}
          cancelRequest={cancelRequest}
        />
      )}
    </>
  );
};

export default Home;
