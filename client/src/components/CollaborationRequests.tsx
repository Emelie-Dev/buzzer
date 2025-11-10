import { useEffect, useState } from 'react';
import styles from '../styles/CollaborationRequests.module.css';
import { IoClose } from 'react-icons/io5';
import { apiClient, getTime, getUrl } from '../Utilities';
import { toast } from 'sonner';
import Skeleton from 'react-loading-skeleton';
import LoadingAnimation from '../components/LoadingAnimation';
import { MdOutlineHourglassEmpty, MdOutlineWifiOff } from 'react-icons/md';
import { Link } from 'react-router-dom';

type CollaborationRequestsProps = {
  setShowCollaborationRequests: React.Dispatch<React.SetStateAction<boolean>>;
  requests: {
    sent: {
      value: any[];
      end: boolean;
    };
    received: {
      value: any[];
      end: boolean;
    };
  };
  setRequests: React.Dispatch<
    React.SetStateAction<{
      sent: {
        value: any[];
        end: boolean;
      };
      received: {
        value: any[];
        end: boolean;
      };
    }>
  >;
  replyRequest: (
    action: 'accept' | 'reject',
    id: string
  ) => (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => Promise<void>;
  cancelRequest: (
    id: string
  ) => (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => Promise<void>;
  replyQueue: Set<string>;
  requestType: 'sent' | 'received';
};

const CollaborationRequests = ({
  setShowCollaborationRequests,
  requests,
  setRequests,
  replyRequest,
  cancelRequest,
  replyQueue,
  requestType,
}: CollaborationRequestsProps) => {
  const [requestsData, setRequestsData] = useState<{
    type: 'sent' | 'received';
    loading: boolean | 'error';
    cursor: Date;
  }>({
    type: requestType,
    loading: true,
    cursor: null!,
  });

  useEffect(() => {
    getCollaborationRequests();
  }, [requestsData.type, requestsData.cursor]);

  const getCollaborationRequests = async () => {
    setRequestsData((prev) => ({
      ...prev,
      loading: true,
    }));

    try {
      const { data } = await apiClient(
        `v1/users/collaborate?type=${requestsData.type}&cursor=${requestsData.cursor}`
      );

      let requestArr = data.data.requests;

      if (requestArr.length > 0)
        requestArr = requestArr.filter(
          (obj: any) =>
            !requests[requestsData.type].value.find(
              (request: any) => request._id === obj._id
            )
        );

      setRequestsData((prev) => ({
        ...prev,
        loading: false,
      }));
      setRequests((prev) => ({
        ...prev,
        [requestsData.type]: {
          value: [...prev[requestsData.type].value, ...requestArr],
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

  const handleRequests = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRequestsData({
      loading: true,
      type: e.target.value as 'sent' | 'received',
      cursor: null!,
    });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;

    const isBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 50;

    if (
      isBottom &&
      requestsData.loading !== true &&
      !requests[requestsData.type].end
    ) {
      if (requestsData.loading === 'error') {
        return getCollaborationRequests();
      }

      setRequestsData((prev) => ({
        ...prev,
        loading: true,
        cursor: new Date(
          requests[prev.type].value[
            requests[prev.type].value.length - 1
          ].createdAt
        ),
      }));
    }
  };

  return (
    <section
      className={styles.section}
      onClick={(e) => {
        if (e.target === e.currentTarget) setShowCollaborationRequests(false);
      }}
    >
      <div className={styles.container} onScroll={handleScroll}>
        <header className={styles.header}>
          <div className={styles['header-box']}>
            <span className={styles.head}>Collaboration Requests</span>

            <select
              className={styles['request-type-select']}
              value={requestsData.type}
              onChange={handleRequests}
            >
              <option value="received">Received</option>
              <option value="sent">Sent</option>
            </select>
          </div>

          <span
            className={styles['close-icon-box']}
            onClick={() => setShowCollaborationRequests(false)}
          >
            <IoClose className={styles['close-icon']} />
          </span>
        </header>

        <div className={styles['pinned-videos-div']}>
          {requestsData.cursor === null && requestsData.loading === true ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div className={styles['collab-skeleton']} key={index}>
                <Skeleton className={styles['pinned-reels-skeleton']} />

                <span className={styles['collab-skeleton-btn-box']}>
                  <Skeleton height={30} />
                  <Skeleton height={30} />
                </span>
              </div>
            ))
          ) : requestsData.cursor === null &&
            requestsData.loading === 'error' ? (
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
          ) : requestsData.cursor === null &&
            requests[requestsData.type].value.length === 0 ? (
            <div className={styles['error-div']}>
              <MdOutlineHourglassEmpty className={styles['empty-icon2']} />
              <span>
                You don’t have any{' '}
                {requestsData.type === 'received' ? 'collaboration' : 'sent'}{' '}
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
                  <Link to={'#'}>
                    {request.post.type === 'video' ? (
                      <video className={styles['pinned-video']}>
                        <source
                          src={getUrl(request.post.src, `${request.type[1]}s`)}
                          type="video/mp4"
                        />
                        Your browser does not support playing video.
                      </video>
                    ) : (
                      <img
                        className={styles['pinned-video']}
                        src={getUrl(request.post.src, `${request.type[1]}s`)}
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
                              !request.hasStory ? styles['no-story-img'] : ''
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
                  <Link to={'#'}>
                    {request.post.type === 'video' ? (
                      <video className={styles['pinned-video']}>
                        <source
                          src={getUrl(request.post.src, `${request.type[1]}s`)}
                          type="video/mp4"
                        />
                        Your browser does not support playing video.
                      </video>
                    ) : (
                      <img
                        className={styles['pinned-video']}
                        src={getUrl(request.post.src, `${request.type[1]}s`)}
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
                              !request.hasStory ? styles['no-story-img'] : ''
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

          {requestsData.loading === true &&
            requests[requestsData.type].value.length > 0 && (
              <div className={styles['loader-box']}>
                <LoadingAnimation
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    transform: 'scale(2.5)',
                  }}
                />
              </div>
            )}
        </div>
      </div>
    </section>
  );
};

export default CollaborationRequests;
