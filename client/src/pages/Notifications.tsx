import NavBar from '../components/NavBar';
import styles from '../styles/Notifications.module.css';
import AsideHeader from '../components/AsideHeader';
import { useState, useEffect, useContext } from 'react';
import NotificationGroup from '../components/NotificationGroup';
import Footer from '../components/Footer';
import Header from '../components/Header';
import ProfileViews from '../components/ProfileViews';
import useScrollHandler from '../hooks/useScrollHandler';
import { GeneralContext, NotificationContext } from '../Contexts';
import { apiClient, getUrl } from '../Utilities';
import { toast } from 'sonner';
import Skeleton from 'react-loading-skeleton';
import { Link, useNavigate } from 'react-router-dom';
import { MdOutlineHourglassEmpty, MdOutlineWifiOff } from 'react-icons/md';
import { FaUserFriends } from 'react-icons/fa';
import { RiTeamFill } from 'react-icons/ri';
import LoadingAnimation from '../components/LoadingAnimation';

const Notifications = () => {
  const [category, setCategory] = useState<
    'all' | 'posts' | 'mentions' | 'followers' | 'requests' | 'system'
  >('all');
  const [deleteData, setDeleteData] = useState<{
    list: Set<string>;
    loading: boolean;
  }>({ list: new Set(), loading: false });
  const [showProfileViews, setShowProfileViews] = useState<boolean>(false);
  const [profileViews, setProfileViews] = useState<any[]>([]);
  const [viewsData, setViewsData] = useState<{
    loading: boolean | 'error';
    end: boolean;
    cursor: { followers: number; createdAt: Date };
  }>({
    loading: true,
    end: true,
    cursor: { followers: null!, createdAt: null! },
  });
  const [following, setFollowing] = useState<{
    queue: Set<string>;
    list: Set<string>;
    value: any[];
  }>({ queue: new Set(), list: new Set(), value: [] });
  const [notificationsCategories, setNotificationsCategories] = useState<{
    all: any[];
    posts: any[];
    mentions: any[];
    followers: any[];
    requests: any[];
    system: any[];
  }>({
    all: [],
    posts: [],
    mentions: [],
    followers: [],
    requests: [],
    system: [],
  });
  const [notificationGroups, setNotificationGroups] = useState<any>({});
  const [notificationsData, setNotificationsData] = useState<{
    value: any[];
    loading: boolean | 'error';
    cursor: Date;
    end: boolean;
  }>({ value: null!, loading: true, cursor: null!, end: true });
  const [requests, setRequests] = useState<{
    friendRequest: boolean;
    collaborationRequest: boolean;
  }>({ friendRequest: false, collaborationRequest: false });

  const [likes, setLikes] = useState<{
    content: { value: string; obj: any }[];
    reel: { value: string; obj: any }[];
    story: { value: string; obj: any }[];
    comment: { value: string; obj: any }[];
  }>({
    content: [],
    reel: [],
    story: [],
    comment: [],
  });

  const [followingList, setFollowingList] = useState<any[]>([]);
  const [isGrouping, setIsGrouping] = useState<boolean>(false);

  const { scrollHandler } = useScrollHandler(true, undefined, true);

  const {
    setShowSearchPage,
    setShowCollaborationRequests,
    setShowFriendRequests,
  } = useContext(GeneralContext);

  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Buzzer - Notifications';

    getProfileViews();

    return () => {
      setShowSearchPage(false);
    };
  }, []);

  useEffect(() => {
    if (profileViews.length > 0) {
      const followObjs = profileViews
        .map((view) => view.isFollowing)
        .filter((view) => view);

      setFollowing((prev) => ({
        ...prev,
        value: followObjs,
        list: new Set(followObjs.map((obj) => obj.following)),
      }));

      setViewsData((prev) => ({
        ...prev,
        cursor: {
          createdAt: profileViews[profileViews.length - 1].createdAt,
          followers: profileViews[profileViews.length - 1].followersCount,
        },
      }));
    }
  }, [profileViews]);

  useEffect(() => {
    if (notificationsData.value !== null) {
      const groups = notificationsCategories[category].reduce(
        (accumulator, value) => {
          const date = new Date(value.createdAt);
          date.setHours(0, 0, 0, 0);

          const key = date.toISOString();
          if (!accumulator[key]) {
            accumulator[key] = {
              value: [value],
              key: `${value._id}-${Math.random()}-${Date.now()}-${Date.now()}`,
            };
          } else {
            if (
              !accumulator[key].value.find((obj: any) => obj._id === value._id)
            )
              accumulator[key].value.push(value);
          }

          return accumulator;
        },
        {}
      );

      setNotificationGroups(groups);
      setIsGrouping(false);
    }
  }, [category, notificationsCategories]);

  useEffect(() => {
    getNotifications();
  }, [notificationsData.cursor]);

  const getProfileViews = async () => {
    try {
      const { data } = await apiClient(
        `v1/views/profile?count=${viewsData.cursor.followers}&createdAt=${viewsData.cursor.createdAt}`
      );

      const views = data.data.views;

      if (views.length > 0) {
        setProfileViews((prev) => {
          const filteredViews = views.filter(
            (view: any) => !(prev || []).find((obj) => obj._id === view._id)
          );

          return [...(prev || []), ...filteredViews];
        });
      }

      setViewsData((prev) => ({
        ...prev,
        loading: false,
        end: views.length < 20,
      }));
    } catch {
      setViewsData((prev) => ({ ...prev, loading: 'error' }));
      toast.error('Could not load your profile views.');
    }
  };

  const getNotifications = async () => {
    setNotificationsData((prev) => ({ ...prev, loading: true }));
    try {
      const { data } = await apiClient(
        `v1/notifications?cursor=${notificationsData.cursor}`
      );
      let newNotifications: any[] = data.data.notifications;

      setNotificationsData((prev) => {
        if (newNotifications.length > 0)
          newNotifications = newNotifications.filter(
            (obj) => !(prev.value || []).find((data) => obj._id === data._id)
          );

        return {
          ...prev,
          value: [...(prev.value || []), ...newNotifications],
          end: data.data.notifications.length < 20,
        };
      });

      setIsGrouping(true);
      setNotificationsCategories((prev) => {
        if (newNotifications.length > 0)
          newNotifications = newNotifications.filter(
            (obj) =>
              !(notificationsData.value || []).find(
                (data) => obj._id === data._id
              )
          );

        const categories = newNotifications.reduce(
          (accumulator, value) => {
            const { all, posts, mentions, followers, requests, system } =
              accumulator;

            const [type] = value.type;

            switch (type) {
              case 'like':
              case 'comment':
              case 'reply':
                if (!posts.find((obj: any) => obj._id === value._id))
                  posts.push(value);
                break;

              case 'mention':
                if (!mentions.find((obj: any) => obj._id === value._id))
                  mentions.push(value);
                break;

              case 'follow':
                if (!followers.find((obj: any) => obj._id == value._id))
                  followers.push(value);
                break;

              case 'friend_request':
              case 'collaborate':
                if (!requests.find((obj: any) => obj._id === value._id))
                  requests.push(value);
                break;

              case 'security':
                if (!system.find((obj: any) => obj._id === value._id))
                  system.push(value);
                break;
            }

            if (!all.find((obj: any) => obj._id === value._id)) all.push(value);

            accumulator = { all, posts, mentions, followers, requests, system };
            return accumulator;
          },
          {
            all: [],
            posts: [],
            mentions: [],
            followers: [],
            requests: [],
            system: [],
          }
        );

        for (const prop in categories) {
          categories[prop] = [
            ...prev[
              prop as
                | 'all'
                | 'posts'
                | 'mentions'
                | 'followers'
                | 'requests'
                | 'system'
            ],
            ...categories[prop],
          ];
        }
        return categories;
      });

      setLikes((prev) => {
        if (newNotifications.length > 0)
          newNotifications = newNotifications.filter(
            (obj) =>
              !(notificationsData.value || []).find(
                (data) => obj._id === data._id
              )
          );

        const likesArr = newNotifications.reduce(
          (accumulator, value) => {
            const [notificationType, typeName] = value.type;
            const collection =
              notificationType === 'comment' || notificationType === 'reply'
                ? 'comment'
                : typeName;

            const docId = value.data?.commentId || value.documentId;
            const typeArray = accumulator[collection];

            if (value.likeObj) {
              if (!typeArray.find((data: any) => data.value === docId))
                accumulator[collection].push({
                  value: docId,
                  obj: value.likeObj,
                });
            }

            return accumulator;
          },
          {
            content: [],
            reel: [],
            story: [],
            comment: [],
          }
        );

        for (const prop in likesArr) {
          likesArr[prop] = [
            ...prev[prop as 'content' | 'reel' | 'story' | 'comment'],
            ...likesArr[prop],
          ];
        }

        return likesArr;
      });

      setFollowingList((prev) => {
        if (newNotifications.length > 0)
          newNotifications = newNotifications.filter(
            (obj) =>
              !(notificationsData.value || []).find(
                (data) => obj._id === data._id
              )
          );

        const list = newNotifications.reduce((accumulator, value) => {
          if (value.isFollowing) {
            const obj = accumulator.find(
              (data: any) => data.value === value.secondUser._id
            );

            if (!obj) {
              accumulator.push({
                value: value.secondUser._id,
                obj: value.isFollowing,
              });
            }
          }

          return accumulator;
        }, []);

        return [...prev, ...list];
      });

      setRequests({
        friendRequest: data.data.friendRequest,
        collaborationRequest: data.data.collaborationRequest,
      });
    } catch {
      setNotificationsData((prev) => ({ ...prev, loading: 'error' }));
      setIsGrouping(false);
      toast.error('Could not load notifications.');
    } finally {
      setNotificationsData((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleFollow =
    (id: string) =>
    async (
      e: React.MouseEvent<HTMLButtonElement | HTMLSpanElement, MouseEvent>
    ) => {
      e.preventDefault();

      if (following.queue.has(id)) return;

      setFollowing((prev) => ({ ...prev, queue: new Set(prev.queue).add(id) }));

      const action = following.list.has(id) ? 'unfollow' : 'follow';

      try {
        if (action === 'follow') {
          const { data } = await apiClient.post(`v1/follow/${id}`);

          const follow = data.data.follow;

          setFollowing((prev) => ({
            ...prev,
            value: [...prev.value, follow],
            list: new Set(prev.list.add(id)),
          }));
        } else {
          const followId = following.value.find(
            (obj) => obj.following === id
          )._id;

          await apiClient.delete(`v1/follow/${followId}`);

          setFollowing((prev) => {
            const list = new Set(prev.list);
            list.delete(id);

            return {
              ...prev,
              value: prev.value.filter((obj) => obj.following !== id),
              list,
            };
          });
        }
      } catch {
        toast.error(`Could not ${action} user.`);
      } finally {
        setFollowing((prev) => {
          const queue = new Set(prev.queue);
          queue.delete(id);

          return {
            ...prev,
            queue,
          };
        });
      }
    };

  const changeCategory =
    (
      type: 'all' | 'posts' | 'mentions' | 'followers' | 'requests' | 'system'
    ) =>
    () => {
      setCategory(type);
    };

  const viewRequests = (type: 'friends' | 'collaboration') => () => {
    if (type === 'friends') {
      setShowFriendRequests(true);
      navigate('/friends');
    } else {
      setShowCollaborationRequests(true);
      navigate('/home');
    }
  };

  const deleteNotifications = async () => {
    if (deleteData.loading) return;

    setDeleteData((prev) => ({ ...prev, loading: true }));

    if (deleteData.list.size > 1000) {
      setDeleteData((prev) => ({ ...prev, loading: false }));
      toast.error('Delete list is too large!');
      return;
    }

    try {
      await apiClient.delete('v1/notifications', {
        data: {
          notifications: [...deleteData.list],
        },
      });

      setNotificationsData((prev) => ({
        ...prev,
        value: prev.value.filter((obj) => !deleteData.list.has(obj._id)),
      }));

      setIsGrouping(true);
      setNotificationsCategories(() => {
        const newNotifications = notificationsData.value.filter(
          (obj) => !deleteData.list.has(obj._id)
        );

        const categories = newNotifications.reduce(
          (accumulator, value) => {
            const { all, posts, mentions, followers, requests, system } =
              accumulator;

            const [type] = value.type;

            switch (type) {
              case 'like':
              case 'comment':
              case 'reply':
                if (!posts.find((obj: any) => obj._id === value._id))
                  posts.push(value);
                break;

              case 'mention':
                if (!mentions.find((obj: any) => obj._id === value._id))
                  mentions.push(value);
                break;

              case 'follow':
                if (!followers.find((obj: any) => obj._id == value._id))
                  followers.push(value);
                break;

              case 'friend_request':
              case 'collaborate':
                if (!requests.find((obj: any) => obj._id === value._id))
                  requests.push(value);
                break;

              case 'security':
                if (!system.find((obj: any) => obj._id === value._id))
                  system.push(value);
                break;
            }

            if (!all.find((obj: any) => obj._id === value._id)) all.push(value);

            accumulator = { all, posts, mentions, followers, requests, system };
            return accumulator;
          },
          {
            all: [],
            posts: [],
            mentions: [],
            followers: [],
            requests: [],
            system: [],
          }
        );

        return categories;
      });

      setDeleteData((prev) => ({ ...prev, list: new Set() }));
      toast.success(
        `Notification${
          deleteData.list.size > 1 ? 's' : ''
        }  deleted successfully.`
      );
    } catch {
      setIsGrouping(false);
      toast.error(
        `Unable to delete notification${
          deleteData.list.size > 1 ? 's' : ''
        }. Please try again.`
      );
    } finally {
      setDeleteData((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    scrollHandler();

    const target = e.target as HTMLDivElement;

    const isBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 50;

    if (
      isBottom &&
      notificationsData.loading !== true &&
      !notificationsData.end
    ) {
      if (notificationsData.loading === 'error') {
        return getNotifications();
      }

      setNotificationsData((prev) => ({
        ...prev,
        loading: true,
        cursor:
          notificationsData.value[notificationsData.value.length - 1].createdAt,
      }));
    }
  };

  return (
    <>
      <NavBar page="notifications" />

      <section className={styles.main}>
        <NotificationContext.Provider
          value={{
            likes,
            setLikes,
            followingList,
            setFollowingList,
            deleteData,
            setDeleteData,
            deleteNotifications,
          }}
        >
          <section className={styles['main-container']} onScroll={handleScroll}>
            <Header
              page="notifications"
              notificationsCategory={category}
              setNotificationsCategory={setCategory}
              setShowProfileViews={setShowProfileViews}
            />

            <header className={styles.header}>
              <ul
                className={`${styles['category-list']} ${
                  deleteData.list.size > 0 ? styles['hide-scroll'] : ''
                }`}
              >
                <li
                  className={`${styles['category-item']} ${
                    category === 'all' ? styles['current-category'] : ''
                  } ${deleteData.list.size > 0 ? styles['hide-items'] : ''}`}
                  onClick={changeCategory('all')}
                >
                  View All
                  <span className={styles['category-count']}>
                    {notificationsCategories.all.length}
                  </span>
                </li>
                <li
                  className={`${styles['category-item']} ${
                    category === 'posts' ? styles['current-category'] : ''
                  }  ${deleteData.list.size > 0 ? styles['hide-items'] : ''}`}
                  onClick={changeCategory('posts')}
                >
                  Posts
                  <span className={styles['category-count']}>
                    {notificationsCategories.posts.length}
                  </span>
                </li>
                <li
                  className={`${styles['category-item']} ${
                    category === 'mentions' ? styles['current-category'] : ''
                  }  ${deleteData.list.size > 0 ? styles['hide-items'] : ''}`}
                  onClick={changeCategory('mentions')}
                >
                  Mentions
                  <span className={styles['category-count']}>
                    {notificationsCategories.mentions.length}
                  </span>
                </li>
                <li
                  className={`${styles['category-item']} ${
                    category === 'followers' ? styles['current-category'] : ''
                  }  ${deleteData.list.size > 0 ? styles['hide-items'] : ''}`}
                  onClick={changeCategory('followers')}
                >
                  Followers
                  <span className={styles['category-count']}>
                    {notificationsCategories.followers.length}
                  </span>
                </li>
                <li
                  className={`${styles['category-item']} ${
                    category === 'requests' ? styles['current-category'] : ''
                  }  ${deleteData.list.size > 0 ? styles['hide-items'] : ''}`}
                  onClick={changeCategory('requests')}
                >
                  Requests
                  <span className={styles['category-count']}>
                    {notificationsCategories.requests.length}
                  </span>
                </li>
                <li
                  className={`${styles['category-item']} ${
                    category === 'system' ? styles['current-category'] : ''
                  }  ${deleteData.list.size > 0 ? styles['hide-items'] : ''}`}
                  onClick={changeCategory('system')}
                >
                  System
                  <span className={styles['category-count']}>
                    {notificationsCategories.system.length}
                  </span>
                </li>
              </ul>

              <img
                className={styles['profile-view-icon']}
                src="../../assets/images/others/profile_view.png"
                onClick={() => setShowProfileViews(true)}
              />

              {deleteData.list.size > 0 && (
                <div className={styles['select-box']}>
                  <span>
                    Selected {deleteData.list.size}{' '}
                    {deleteData.list.size === 1 ? 'item' : 'items'}
                  </span>

                  <div className={styles['select-btn-box']}>
                    <button
                      className={`${styles['cancel-btn']} ${
                        deleteData.loading ? styles['disable-btn'] : ''
                      }`}
                      onClick={() =>
                        setDeleteData((prev) => ({ ...prev, list: new Set() }))
                      }
                    >
                      Cancel
                    </button>
                    <button
                      className={`${styles['delete-btn']} ${
                        deleteData.loading ? styles['disable-btn'] : ''
                      }`}
                      onClick={deleteNotifications}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </header>

            <div className={styles['notifications-container']}>
              {category === 'requests' && (
                <div className={styles['requests-container']}>
                  {requests.friendRequest && (
                    <article className={styles['request-box']}>
                      <span className={styles['notification-logo-box']}>
                        <FaUserFriends
                          className={styles['notification-logo']}
                        />
                      </span>

                      <div className={styles['request-text']}>
                        <span className={styles['request-message']}>
                          You have pending friends requests.
                        </span>
                        <span className={styles['request-btn-box']}>
                          <button
                            className={styles['request-btn']}
                            onClick={viewRequests('friends')}
                          >
                            View Requests
                          </button>
                        </span>
                      </div>
                    </article>
                  )}

                  {requests.collaborationRequest && (
                    <article className={styles['request-box']}>
                      <span className={styles['notification-logo-box']}>
                        <RiTeamFill className={styles['notification-logo']} />
                      </span>

                      <div className={styles['request-text']}>
                        <span className={styles['request-message']}>
                          You have pending collboration requests.
                        </span>
                        <span className={styles['request-btn-box']}>
                          <button
                            className={styles['request-btn']}
                            onClick={viewRequests('collaboration')}
                          >
                            View Requests
                          </button>
                        </span>
                      </div>
                    </article>
                  )}
                </div>
              )}

              {notificationsData.loading === true &&
              Object.keys(notificationGroups).length < 1 ? (
                <div className={styles['skeleton-container']}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className={styles['skeleton-box']}>
                      <Skeleton className={styles['skeleton-user']} circle />
                      <Skeleton width={'100%'} height={100} />
                    </div>
                  ))}
                </div>
              ) : isGrouping ? (
                <div className={styles['skeleton-container']}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className={styles['skeleton-box']}>
                      <Skeleton className={styles['skeleton-user']} circle />
                      <Skeleton width={'100%'} height={100} />
                    </div>
                  ))}
                </div>
              ) : notificationsData.loading === 'error' &&
                Object.keys(notificationGroups).length < 1 ? (
                <div className={styles['error-div']}>
                  <MdOutlineWifiOff className={styles['empty-icon']} />
                  <span>
                    Failed to load notifications. Click the button below to try
                    again.
                  </span>
                  <button
                    className={styles['error-btn']}
                    onClick={getNotifications}
                  >
                    Try Again
                  </button>
                </div>
              ) : notificationsData.loading === false &&
                Object.keys(notificationGroups).length < 1 ? (
                <div className={styles['error-div']}>
                  <MdOutlineHourglassEmpty className={styles['empty-icon2']} />
                  <span>
                    You don’t have any {category === 'all' ? '' : category}{' '}
                    notifications at the moment.
                  </span>
                </div>
              ) : (
                Object.entries(notificationGroups).map(
                  (value: [string, any], index) => (
                    <NotificationGroup
                      key={value[1].key}
                      index={index}
                      date={value[0]}
                      data={value[1].value}
                      category={category}
                    />
                  )
                )
              )}

              {notificationsData.loading === true &&
                Object.keys(notificationGroups).length > 1 && (
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

            <Footer page="none" />
          </section>
        </NotificationContext.Provider>

        <section className={styles.aside}>
          <AsideHeader activeVideo={null} />

          <div className={styles['profile-views-container']}>
            <span className={styles['profile-views-text']}>Profile Views</span>

            <div className={styles['profile-viewers-div']}>
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

            {profileViews.length > 10 && (
              <div>
                <span
                  className={styles['more-users-text']}
                  onClick={() => setShowProfileViews(true)}
                >
                  Show more
                </span>
              </div>
            )}

            <span className={styles['views-text']}>
              This shows who visited your profile in the last 30 days!
            </span>
          </div>
        </section>
      </section>

      {showProfileViews && (
        <ProfileViews
          setShowProfileViews={setShowProfileViews}
          profileViews={profileViews}
          getProfileViews={getProfileViews}
          handleFollow={handleFollow}
          viewsData={viewsData}
          following={following}
          setViewsData={setViewsData}
        />
      )}
    </>
  );
};
export default Notifications;
