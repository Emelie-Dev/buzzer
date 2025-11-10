import { useEffect, useState } from 'react';
import styles from '../styles/FriendRequests.module.css';
import { IoClose } from 'react-icons/io5';
import { PiCheckFatFill } from 'react-icons/pi';
import { apiClient, getUrl } from '../Utilities';
import { toast } from 'sonner';
import Skeleton from 'react-loading-skeleton';
import LoadingAnimation from '../components/LoadingAnimation';
import { MdOutlineHourglassEmpty, MdOutlineWifiOff } from 'react-icons/md';
import { Link } from 'react-router-dom';

type FriendRequestsProps = {
  setShowFriendRequests: React.Dispatch<React.SetStateAction<boolean>>;
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

const FriendRequests = ({
  setShowFriendRequests,
  requests,
  setRequests,
  replyRequest,
  cancelRequest,
  replyQueue,
  requestType,
}: FriendRequestsProps) => {
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
    getRequests();
  }, [requestsData.type, requestsData.cursor]);

  const getRequests = async () => {
    setRequestsData((prev) => ({
      ...prev,
      loading: true,
    }));

    try {
      const { data } = await apiClient(
        `v1/friends/requests?type=${requestsData.type}&cursor=${requestsData.cursor}`
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

      toast.error(`An error occured while getting friend requests.`);
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
        return getRequests();
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
        if (e.target === e.currentTarget) setShowFriendRequests(false);
      }}
    >
      <div className={styles.container} onScroll={handleScroll}>
        <header className={styles.header}>
          <div className={styles['header-box']}>
            <span className={styles.head}>Friend requests</span>

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
            onClick={() => setShowFriendRequests(false)}
          >
            <IoClose className={styles['close-icon']} />
          </span>
        </header>

        <div className={styles['friends-request-container']}>
          {requestsData.cursor === null && requestsData.loading === true ? (
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
          ) : requestsData.cursor === null &&
            requestsData.loading === 'error' ? (
            <div className={styles['error-div']}>
              <MdOutlineWifiOff className={styles['empty-icon']} />
              <span>Could not get friend requests.</span>
              <button className={styles['error-btn']} onClick={getRequests}>
                Try Again
              </button>
            </div>
          ) : requestsData.cursor === null &&
            requests[requestsData.type].value.length === 0 ? (
            <div className={styles['error-div']}>
              <MdOutlineHourglassEmpty className={styles['empty-icon2']} />
              <span>You don’t have any friend requests at the moment.</span>
            </div>
          ) : (
            requests[requestsData.type].value.map((request) =>
              requestsData.type === 'received' ? (
                <article
                  key={request._id}
                  className={`${styles['friend-request']} ${
                    replyQueue.has(request._id) ? styles['disable-link'] : ''
                  }`}
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
                          className={`${styles['friend-accept-btn']} `}
                          onClick={replyRequest('accept', request._id)}
                        >
                          Accept
                        </button>
                        <button
                          className={`${styles['friend-decline-btn']} `}
                          onClick={replyRequest('reject', request._id)}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </Link>
                </article>
              ) : (
                <article
                  key={request._id}
                  className={`${styles['friend-request']} ${
                    replyQueue.has(request._id) ? styles['disable-link'] : ''
                  }`}
                >
                  <Link to={`/@${request.recipient.username}`}>
                    <span className={styles['friend-request-img-box']}>
                      <img
                        className={styles['friend-request-img']}
                        src={getUrl(request.recipient.photo, 'users')}
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
                        {request.recipient.username}
                      </span>

                      <div className={styles['friend-btn-box']}>
                        <button
                          className={`${styles['friend-decline-btn']} ${styles['friend-decline-btn2']}`}
                          onClick={cancelRequest(request._id)}
                        >
                          Cancel Request
                        </button>
                      </div>
                    </div>
                  </Link>
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

export default FriendRequests;
