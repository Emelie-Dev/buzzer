import { useContext, useEffect, useRef, useState } from 'react';
import styles from '../styles/Engagements.module.css';
import { IoClose, IoSearchSharp } from 'react-icons/io5';
import ReactDOM from 'react-dom';
import { AuthContext, GeneralContext } from '../Contexts';
import { apiClient, debounce, getEngagementValue, getUrl } from '../Utilities';
import Skeleton from 'react-loading-skeleton';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import LoadingAnimation from './LoadingAnimation';

type EngagementsProps = {
  value: 'followers' | 'following' | 'friends' | 'suggested' | 'private' | null;
  setValue: React.Dispatch<
    React.SetStateAction<
      'followers' | 'following' | 'friends' | 'suggested' | 'private' | null
    >
  >;
};

const getUsers = async (...args: any[]) => {
  const [query, page, category] = args;

  try {
    const { data } = await apiClient(
      `v1/search/users?query=${query}&page=${page}&engagement=true${
        category === 'followers' || category === 'following'
          ? `&type=${category}`
          : ''
      }`
    );

    return { result: data.data.result, resultLength: data.data.resultLength };
  } catch {
    return 'error';
  }
};

const debouncedQuery = debounce(getUsers, 300);

const Engagements = ({ value, setValue }: EngagementsProps) => {
  const [category, setCategory] = useState<
    'followers' | 'following' | 'friends' | 'private' | 'suggested' | null
  >(value);
  const { profileData, suggestedUsers, setSuggestedUsers, setProfileData } =
    useContext(GeneralContext);
  const { user: authUser, setUser } = useContext(AuthContext);
  const [users, setUsers] = useState<{
    private: any[];
    followers: any[];
    following: any[];
    friends: any[];
  }>({ private: null!, followers: null!, following: null!, friends: null! });
  const [usersData, setUsersData] = useState<{
    private: {
      loading: boolean | 'error';
      page: number;
      end: boolean;
    };
    followers: {
      loading: boolean | 'error';
      cursor: Date;
      end: boolean;
    };
    following: {
      loading: boolean | 'error';
      cursor: Date;
      end: boolean;
    };
    friends: {
      loading: boolean | 'error';
      cursor: Date;
      end: boolean;
    };
  }>({
    private: {
      loading: false,
      page: 1,
      end: false,
    },
    followers: {
      loading: false,
      cursor: null!,
      end: false,
    },
    following: {
      loading: false,
      cursor: null!,
      end: false,
    },
    friends: {
      loading: false,
      cursor: null!,
      end: false,
    },
  });
  const [followData, setFollowData] = useState<{
    queue: Set<string>;
    list: Map<string, string>;
  }>({ queue: new Set(), list: new Map() });
  const [userQueue, setUserQueue] = useState<{
    private: Set<string>;
    followers: Set<string>;
    following: Set<string>;
    friends: Set<string>;
    suggested: Set<string>;
  }>({
    private: new Set(),
    followers: new Set(),
    following: new Set(),
    friends: new Set(),
    suggested: new Set(),
  });
  const [searchQuery, setSearchQuery] = useState<{
    private: string;
    followers: string;
    following: string;
    friends: string;
  }>({ private: '', followers: '', following: '', friends: '' });
  const [searchResult, setSearchResult] = useState<{
    private: any[];
    followers: any[];
    following: any[];
    friends: any[];
  }>({ private: [], followers: [], following: [], friends: [] });
  const [searchData, setSearchData] = useState<{
    private: {
      loading: boolean | 'error';
      page: number;
      end: boolean;
    };
    followers: {
      loading: boolean | 'error';
      page: number;
      end: boolean;
    };
    following: {
      loading: boolean | 'error';
      page: number;
      end: boolean;
    };
    friends: {
      loading: boolean | 'error';
      page: number;
      end: boolean;
    };
  }>({
    private: {
      loading: false,
      page: 1,
      end: false,
    },
    followers: {
      loading: false,
      page: 1,
      end: false,
    },
    following: {
      loading: false,
      page: 1,
      end: false,
    },
    friends: {
      loading: false,
      page: 1,
      end: false,
    },
  });

  const navigate = useNavigate();

  const searchRef = useRef<HTMLInputElement>(null!);
  const itemRef = useRef<{
    followers: HTMLLIElement;
    following: HTMLLIElement;
    friends: HTMLLIElement;
    private: HTMLLIElement;
    suggested: HTMLLIElement;
  }>({
    followers: null!,
    following: null!,
    friends: null!,
    private: null!,
    suggested: null!,
  });
  const categoryContainerRef = useRef<{
    followers: HTMLDivElement;
    following: HTMLDivElement;
    friends: HTMLDivElement;
    private: HTMLDivElement;
    suggested: HTMLDivElement;
  }>({
    followers: null!,
    following: null!,
    friends: null!,
    private: null!,
    suggested: null!,
  });
  const containerRef = useRef<HTMLDivElement>(null!);

  const target = document.getElementById('engagements-portal') || document.body;

  useEffect(() => {
    if (!suggestedUsers) getSuggestedUsers();
  }, []);

  useEffect(() => {
    if (category) itemRef.current[category].scrollIntoView();

    const index =
      category === 'followers'
        ? 0
        : category === 'following'
        ? 1
        : category === 'friends'
        ? 2
        : category === 'private'
        ? 3
        : 4;

    if (containerRef.current) {
      containerRef.current.scroll({
        left: index * containerRef.current.clientWidth,
        behavior: 'smooth',
      });
    }
  }, [category]);

  useEffect(() => {
    if (category === 'suggested') return;

    const categoryText = category as
      | 'private'
      | 'followers'
      | 'following'
      | 'friends';

    if (
      users[categoryText] === null &&
      usersData[categoryText].loading !== true
    ) {
      setUsersData((prev) => ({
        ...prev,
        [categoryText]: { ...prev[categoryText], loading: true },
      }));
    }
  }, [category]);

  useEffect(() => {
    if (category !== 'suggested') handleSearch();
  }, [searchData]);

  useEffect(() => {
    const container = categoryContainerRef.current[category!];

    const categoryText = category as
      | 'private'
      | 'followers'
      | 'following'
      | 'friends';

    if (
      searchQuery[categoryText].trim().length > 0 &&
      searchResult[categoryText].length > 0 &&
      container &&
      container.scrollHeight <= container.clientHeight &&
      searchData[categoryText].loading === false &&
      !searchData[categoryText].end
    ) {
      setSearchData((prev) => ({
        ...prev,
        [categoryText]: {
          ...prev[categoryText],
          loading: true,
          page: prev[categoryText].page + 1,
        },
      }));
    }
  }, [searchResult]);

  useEffect(() => {
    const categoryText = category as
      | 'private'
      | 'followers'
      | 'following'
      | 'friends';

    if (usersData[categoryText].loading === true) getUsers(categoryText);
  }, [usersData]);

  const addToRef =
    (
      ref:
        | React.MutableRefObject<{
            followers: HTMLLIElement;
            following: HTMLLIElement;
            friends: HTMLLIElement;
            private: HTMLLIElement;
            suggested: HTMLLIElement;
          }>
        | React.MutableRefObject<{
            followers: HTMLDivElement;
            following: HTMLDivElement;
            friends: HTMLDivElement;
            private: HTMLDivElement;
            suggested: HTMLDivElement;
          }>,
      prop: 'followers' | 'following' | 'friends' | 'private' | 'suggested'
    ) =>
    (el: any) => {
      if (el && !ref.current[prop]) {
        ref.current[prop] = el;
      }
    };

  const getSuggestedUsers = async () => {
    try {
      const { data } = await apiClient('v1/users/suggested');
      setSuggestedUsers(data.data.users);
    } catch {
      setSuggestedUsers([]);
    }
  };

  const getUsers = async (
    categoryText: 'private' | 'followers' | 'following' | 'friends'
  ) => {
    let url;

    switch (categoryText) {
      case 'private':
        url = `v1/users/private-audience?page=${usersData.private.page}`;
        break;

      case 'friends':
        url = `v1/friends?cursor=${usersData[categoryText].cursor}`;
        break;

      case 'followers':
        url = `v1/follow/followers?cursor=${usersData[categoryText].cursor}`;
        break;

      case 'following':
        url = `v1/follow/following?cursor=${usersData[categoryText].cursor}`;
        break;
    }

    try {
      const { data } = await apiClient(url!);

      setUsers((prev) => {
        const userArr = data.data.users.filter(
          (obj: any) =>
            !(prev[categoryText] || []).find(
              (data: any) => data._id === obj._id
            )
        );

        return {
          ...prev,
          [categoryText]: [...(prev[categoryText] || []), ...userArr],
        };
      });
      setFollowData((prev) => {
        const map = new Map(prev.list);
        const followArr = data.data.users
          .map((user: any) => (category === 'following' ? user : user.follow))
          .filter(Boolean);

        followArr.forEach((obj: any) => {
          if (!map.has(obj.following)) map.set(obj.following, obj._id);
        });

        return { ...prev, list: map };
      });
      setUsersData((prev) => ({
        ...prev,
        [categoryText]: {
          ...prev[categoryText],
          loading: false,
          end: data.data.users.length < 20,
        },
      }));
    } catch {
      setUsersData((prev) => ({
        ...prev,
        [categoryText]: { ...prev[categoryText], loading: 'error' },
      }));
      return toast.error(
        `Failed to load ${
          categoryText === 'private' ? 'private audience' : categoryText
        }.`
      );
    }
  };

  const handleFollow =
    (
      action: 'follow' | 'unfollow',
      user: any,
      id: string,
      storyData: { hasStory: boolean; hasUnviewedStory: boolean }
    ) =>
    async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();
      if (followData.queue.has(user._id)) return;

      setFollowData((prev) => ({
        ...prev,
        queue: new Set(prev.queue).add(user._id),
      }));

      try {
        if (action === 'follow') {
          const { data } = await apiClient.post(`v1/follow/${id}`);
          setFollowData((prev) => {
            const list = new Map(prev.list);
            list.set(user._id, data.data.follow._id);
            return { ...prev, list };
          });
          setProfileData((prev) => ({
            ...prev,
            following: prev.following + 1,
          }));
          setUsers((prev) => {
            const following = prev.following;
            if (!following) {
              return {
                ...prev,
                following,
              };
            }
            return {
              ...prev,
              following: [
                {
                  ...data.data.follow,
                  user,
                  ...storyData,
                },
                ...following,
              ],
            };
          });

          setSuggestedUsers((prev) => prev.filter((user) => user._id !== id));
        } else {
          await apiClient.delete(`v1/follow/${id}`);
          setFollowData((prev) => {
            const list = new Map(prev.list);
            list.delete(user._id);
            return { ...prev, list };
          });
          setProfileData((prev) => ({
            ...prev,
            following: prev.following - 1,
          }));
          setUsers((prev) => {
            const following = [...(prev.following || [])].filter(
              (obj) => obj.user._id !== user._id
            );

            return {
              ...prev,
              following: prev.following === null ? null! : following,
            };
          });
        }
      } catch (err: any) {
        const message = `Could not ${action} user. Please Try again.`;

        if (err.response) {
          return toast.error(err.response.data.message || message);
        } else {
          return toast.error(message);
        }
      } finally {
        setFollowData((prev) => {
          const queue = new Set(prev.queue);
          queue.delete(user._id);
          return { ...prev, queue };
        });
      }
    };

  const removeFollower =
    (id: string) =>
    async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();

      if (userQueue.followers.has(id)) return;

      setUserQueue((prev) => ({
        ...prev,
        followers: new Set(prev.followers).add(id),
      }));

      try {
        await apiClient.delete(`v1/follow/remove/${id}`);
        setUsers((prev) => {
          const followers = [...(prev.followers || [])].filter(
            (obj) => obj._id !== id
          );

          return {
            ...prev,
            followers,
          };
        });
        setProfileData((prev) => ({
          ...prev,
          followers: prev.followers - 1,
        }));
      } catch {
        return toast.error('Could not remove follower.');
      } finally {
        setUserQueue((prev) => {
          const set = new Set(prev.followers);
          set.delete(id);

          return { ...prev, followers: set };
        });
      }
    };

  const sendFriendRequest =
    (id: string) =>
    async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();

      if (userQueue.following.has(id)) return;

      setUserQueue((prev) => ({
        ...prev,
        following: new Set(prev.following).add(id),
      }));

      try {
        await apiClient.post(`v1/friends/request/${id}`);
        toast.success('Friend request sent successfully.');
      } catch (err: any) {
        const message = `Could not send friend request. Please Try again.`;
        if (err.response) {
          return toast.error(err.response.data.message || message);
        } else {
          return toast.error(message);
        }
      } finally {
        setUserQueue((prev) => {
          const set = new Set(prev.following);
          set.delete(id);
          return { ...prev, following: set };
        });
      }
    };

  const removeFriend =
    (id: string) =>
    async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();

      if (userQueue.friends.has(id)) return;

      setUserQueue((prev) => ({
        ...prev,
        friends: new Set(prev.friends).add(id),
      }));

      try {
        await apiClient.delete(`v1/friends/${id}`);
        setUsers((prev) => {
          const friends = [...(prev.friends || [])].filter(
            (obj) => obj._id !== id
          );

          return {
            ...prev,
            friends,
          };
        });
        setProfileData((prev) => ({
          ...prev,
          friends: prev.friends - 1,
        }));
      } catch (err: any) {
        const message = `Could not remove friend. Please Try again.`;
        if (err.response) {
          return toast.error(err.response.data.message || message);
        } else {
          return toast.error(message);
        }
      } finally {
        setUserQueue((prev) => {
          const set = new Set(prev.friends);
          set.delete(id);
          return { ...prev, friends: set };
        });
      }
    };

  const updatePrivateAudience =
    (action: 'add' | 'remove', user: any) =>
    async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();

      if (userQueue.private.has(user._id)) return;

      setUserQueue((prev) => ({
        ...prev,
        private: new Set(prev.private).add(user._id),
      }));

      try {
        const { data } = await apiClient.patch('v1/users/private-audience', {
          id: user._id,
          action,
        });
        setUser(data.data.user);
        setUsers((prev) => {
          let privateArr = [...prev.private];

          if (action === 'add') {
            privateArr.unshift(user);
          } else {
            privateArr = privateArr.filter((obj) => obj._id !== user._id);
          }
          return { ...prev, private: privateArr };
        });
      } catch (err: any) {
        const message =
          action === 'add'
            ? 'Could not add user. Please Try again.'
            : 'Could not remove user. Please Try again.';

        if (err.response) {
          return toast.error(err.response.data.message || message);
        } else {
          return toast.error(message);
        }
      } finally {
        setUserQueue((prev) => {
          const set = new Set(prev.private);
          set.delete(user._id);
          return { ...prev, private: set };
        });
      }
    };

  const removeSuggestedUser =
    (id: string) =>
    async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();

      if (userQueue.suggested.has(id)) return;

      setUserQueue((prev) => ({
        ...prev,
        suggested: new Set(prev.suggested).add(id),
      }));

      try {
        const { data } = await apiClient.patch(`v1/users/suggested/${id}`);
        setUser(data.data.user);
        setSuggestedUsers((prev) => prev.filter((user) => user._id !== id));
      } catch (err: any) {
        const message = 'Could not remove user. Please Try again.';

        if (err.response) {
          return toast.error(err.response.data.message || message);
        } else {
          return toast.error(message);
        }
      } finally {
        setUserQueue((prev) => {
          const set = new Set(prev.suggested);
          set.delete(id);
          return { ...prev, suggested: set };
        });
      }
    };

  const handleSearch = async () => {
    const categoryText = category as
      | 'private'
      | 'followers'
      | 'following'
      | 'friends';

    if (searchData[categoryText].loading === true) {
      const result: any = await debouncedQuery(
        searchQuery[categoryText],
        searchData[categoryText].page,
        categoryText
      );

      if (result === 'error') {
        setSearchData((prev) => ({
          ...prev,
          [categoryText]: { ...prev[categoryText], loading: 'error' },
        }));
      } else {
        const filteredResults = (result.result as []).filter(
          (obj: any) =>
            !searchResult[categoryText].find((data) => data._id === obj._id)
        );

        setSearchResult((prev) => ({
          ...prev,
          [categoryText]: [...prev[categoryText], ...filteredResults],
        }));
        setSearchData((prev) => ({
          ...prev,
          [categoryText]: {
            ...prev[categoryText],
            loading: false,
            end: result.resultLength < 30,
          },
        }));
      }
    }
  };

  const handleScroll =
    (categoryText: 'private' | 'followers' | 'following' | 'friends') =>
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      const isBottom =
        target.scrollTop + target.clientHeight >= target.scrollHeight - 50;

      if (isBottom) {
        if (searchQuery[categoryText].trim().length > 0) {
          if (
            !searchData[categoryText].end &&
            searchData[categoryText].loading === false
          ) {
            setSearchData((prev) => ({
              ...prev,
              [categoryText]: {
                ...prev[categoryText],
                loading: true,
                page:
                  prev[categoryText].loading === 'error'
                    ? prev[categoryText].page
                    : prev[categoryText].page + 1,
              },
            }));
          }
        } else {
          if (
            !usersData[categoryText].end &&
            usersData[categoryText].loading === false
          ) {
            if (categoryText === 'private') {
              setUsersData((prev) => ({
                ...prev,
                [categoryText]: {
                  ...prev[categoryText],
                  loading: true,
                  page:
                    prev[categoryText].loading === 'error'
                      ? prev[categoryText].page
                      : prev[categoryText].page + 1,
                },
              }));
            } else {
              setUsersData((prev) => {
                const arr = users[categoryText];
                const cursor =
                  arr.length > 0
                    ? arr[arr.length - 1].followedAt ||
                      arr[arr.length - 1].createdAt
                    : null;

                return {
                  ...prev,
                  [categoryText]: {
                    ...prev[categoryText],
                    loading: true,
                    cursor:
                      prev[categoryText].loading === 'error'
                        ? prev[categoryText].cursor
                        : cursor,
                  },
                };
              });
            }
          }
        }
      }
    };

  return ReactDOM.createPortal(
    <section
      className={styles.section}
      onClick={(e) => {
        if (e.target === e.currentTarget) setValue(null);
      }}
    >
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.head}>{authUser.username}</h1>

          <span
            className={styles['close-icon-box']}
            onClick={() => setValue(null)}
          >
            <IoClose className={styles['close-icon']} title="Close" />
          </span>
        </header>

        <ul className={styles['category-list']}>
          <li
            className={`${styles['category-item']} ${
              category === 'followers' ? styles['current-category'] : ''
            }`}
            onClick={() => setCategory('followers')}
            ref={addToRef(itemRef, 'followers')}
          >
            Followers{' '}
            <span className={styles['category-value']}>
              {' '}
              {getEngagementValue(profileData.followers)}
            </span>
          </li>
          <li
            className={`${styles['category-item']} ${
              category === 'following' ? styles['current-category'] : ''
            }`}
            onClick={() => setCategory('following')}
            ref={addToRef(itemRef, 'following')}
          >
            Following{' '}
            <span className={styles['category-value']}>
              {' '}
              {getEngagementValue(profileData.following)}
            </span>
          </li>
          <li
            className={`${styles['category-item']} ${
              category === 'friends' ? styles['current-category'] : ''
            }`}
            onClick={() => setCategory('friends')}
            ref={addToRef(itemRef, 'friends')}
          >
            Friends{' '}
            <span className={styles['category-value']}>
              {' '}
              {getEngagementValue(profileData.friends)}
            </span>
          </li>
          <li
            className={`${styles['category-item']} ${
              category === 'private' ? styles['current-category'] : ''
            }`}
            onClick={() => setCategory('private')}
            ref={addToRef(itemRef, 'private')}
          >
            Private audience
            <span className={styles['category-value']}>
              {authUser.settings.general.privacy.users.length}
            </span>
          </li>
          <li
            className={`${styles['category-item']} ${
              category === 'suggested' ? styles['current-category'] : ''
            }`}
            onClick={() => setCategory('suggested')}
            ref={addToRef(itemRef, 'suggested')}
          >
            Suggested
          </li>
        </ul>

        {category !== 'suggested' && (
          <div className={styles['search-box']}>
            <IoSearchSharp className={styles['search-icon']} />

            <input
              className={styles['search-value']}
              value={searchQuery[category!]}
              onChange={(e) => {
                setSearchQuery((prev) => ({
                  ...prev,
                  [category!]: e.target.value,
                }));
                setSearchData((prev) => ({
                  ...prev,
                  [category!]: {
                    loading: true,
                    page: 1,
                    end: false,
                  },
                }));
                setSearchResult((prev) => ({ ...prev, [category!]: [] }));
              }}
              ref={searchRef}
              placeholder="Search...."
            />

            {searchQuery[category!].length > 0 && (
              <IoClose
                className={styles['clear-search']}
                onClick={() => {
                  setSearchQuery((prev) => ({
                    ...prev,
                    [category!]: '',
                  }));
                  searchRef.current.focus();
                }}
              />
            )}
          </div>
        )}

        <div className={styles['users-section']} ref={containerRef}>
          {/* Followers */}
          <div
            className={styles['users-container']}
            ref={addToRef(categoryContainerRef, 'followers')}
            onScroll={handleScroll('followers')}
          >
            {searchQuery.followers.trim().length > 0 ? (
              searchData.followers.loading === true &&
              searchData.followers.page === 1 ? (
                <div className={styles['error-text']}>
                  <LoadingAnimation
                    style={{
                      width: '3rem',
                      height: '3rem',
                      transform: 'scale(2.5)',
                    }}
                  />
                </div>
              ) : searchData.followers.loading === 'error' &&
                searchData.followers.page === 1 ? (
                <div className={styles['error-text']}>
                  Couldn’t load users. Please try again.
                  <button
                    className={styles['error-button']}
                    onClick={() => {
                      setSearchData((prev) => ({
                        ...prev,
                        followers: { ...prev.followers, loading: true },
                      }));
                    }}
                  >
                    Try again
                  </button>
                </div>
              ) : searchResult.followers.length === 0 ? (
                <div className={styles['error-text']}>
                  No matching user found.
                </div>
              ) : (
                <>
                  {searchResult.followers.map((obj) => (
                    <article key={obj._id} className={styles.user}>
                      <Link to={`/@${obj.username}`}>
                        <div className={styles['user-details']}>
                          <span
                            className={`${styles['img-box']} ${
                              obj.hasStory && obj.hasUnviewedStory
                                ? styles['img-box3']
                                : obj.hasStory
                                ? styles['img-box2']
                                : ''
                            }`}
                          >
                            <img
                              className={styles['user-img']}
                              src={getUrl(obj.photo, 'users')}
                            />
                          </span>

                          <div className={styles['name-box']}>
                            <span className={styles['user-name']}>
                              {obj.name}
                            </span>
                            <span className={styles['user-handle']}>
                              {obj.username}
                            </span>
                          </div>
                        </div>

                        <div className={styles['btn-div']}>
                          {obj.followObj ? (
                            <button
                              className={`${styles['engage-btn']} ${
                                followData.queue.has(obj._id)
                                  ? styles['disable-btn']
                                  : ''
                              }`}
                              onClick={handleFollow(
                                'unfollow',
                                obj,
                                obj.followObj._id,
                                {
                                  hasStory: obj.hasStory,
                                  hasUnviewedStory: obj.hasUnviewedStory,
                                }
                              )}
                            >
                              Unfollow
                            </button>
                          ) : (
                            <button
                              className={`${styles['engage-btn']} ${
                                followData.queue.has(obj._id)
                                  ? styles['disable-btn']
                                  : ''
                              }`}
                              onClick={handleFollow('follow', obj, obj._id, {
                                hasStory: obj.hasStory,
                                hasUnviewedStory: obj.hasUnviewedStory,
                              })}
                            >
                              Follow
                            </button>
                          )}

                          <button
                            className={`${styles['engage-btn']} ${
                              styles['engage-btn2']
                            } ${
                              userQueue.followers.has(obj._id)
                                ? styles['disable-btn']
                                : ''
                            }`}
                            onClick={removeFollower(obj._id)}
                          >
                            Remove
                          </button>
                        </div>
                      </Link>
                    </article>
                  ))}

                  {searchData.followers.loading === true &&
                    searchData.followers.page > 1 && (
                      <div className={styles['loader-box']}>
                        <LoadingAnimation
                          style={{
                            width: '2rem',
                            height: '2rem',
                            transform: 'scale(2.5)',
                          }}
                        />
                      </div>
                    )}
                </>
              )
            ) : users.followers === null &&
              usersData.followers.loading === 'error' ? (
              <div className={styles['no-data-text']}>
                Unable to load users. Check your connection and try again.
                <div className={styles['error-btn']}>
                  <button onClick={() => getUsers('followers')}>
                    Try again
                  </button>
                </div>
              </div>
            ) : users.followers === null ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className={styles['suggested-skeleton-box']}>
                  <Skeleton circle height={48} width={48} />
                  <div className={styles['suggested-skeleton-box2']}>
                    <Skeleton height={14} width="60%" />
                    <Skeleton height={14} width="80%" />
                  </div>
                  <Skeleton height={30} width={60} />{' '}
                  <Skeleton height={30} width={60} />
                </div>
              ))
            ) : users.followers.length === 0 ? (
              <div className={styles['no-data-text']}>
                You don’t have any followers yet.
              </div>
            ) : (
              <>
                {users.followers.map((obj) => (
                  <article key={obj._id} className={styles.user}>
                    <Link to={`/@${obj.user.username}`}>
                      <div className={styles['user-details']}>
                        <span
                          className={`${styles['img-box']} ${
                            obj.hasStory && obj.hasUnviewedStory
                              ? styles['img-box3']
                              : obj.hasStory
                              ? styles['img-box2']
                              : ''
                          }`}
                        >
                          <img
                            className={styles['user-img']}
                            src={getUrl(obj.user.photo, 'users')}
                          />
                        </span>

                        <div className={styles['name-box']}>
                          <span className={styles['user-name']}>
                            {obj.user.name}
                          </span>
                          <span className={styles['user-handle']}>
                            {obj.user.username}
                          </span>
                        </div>
                      </div>

                      <div className={styles['btn-div']}>
                        {followData.list.has(obj.user._id) ? (
                          <button
                            className={`${styles['engage-btn']} ${
                              followData.queue.has(obj.user._id)
                                ? styles['disable-btn']
                                : ''
                            }`}
                            onClick={handleFollow(
                              'unfollow',
                              obj.user,
                              followData.list.get(obj.user._id)!,
                              {
                                hasStory: obj.hasStory,
                                hasUnviewedStory: obj.hasUnviewedStory,
                              }
                            )}
                          >
                            Unfollow
                          </button>
                        ) : (
                          <button
                            className={`${styles['engage-btn']} ${
                              followData.queue.has(obj.user._id)
                                ? styles['disable-btn']
                                : ''
                            }`}
                            onClick={handleFollow(
                              'follow',
                              obj.user,
                              obj.user._id,
                              {
                                hasStory: obj.hasStory,
                                hasUnviewedStory: obj.hasUnviewedStory,
                              }
                            )}
                          >
                            Follow
                          </button>
                        )}
                        <button
                          className={`${styles['engage-btn']} ${
                            styles['engage-btn2']
                          } ${
                            userQueue.followers.has(obj._id)
                              ? styles['disable-btn']
                              : ''
                          }`}
                          onClick={removeFollower(obj._id)}
                        >
                          Remove
                        </button>
                      </div>
                    </Link>
                  </article>
                ))}

                {usersData.followers.loading === true &&
                  usersData.followers.cursor !== null && (
                    <div className={styles['loader-box']}>
                      <LoadingAnimation
                        style={{
                          width: '2rem',
                          height: '2rem',
                          transform: 'scale(2.5)',
                        }}
                      />
                    </div>
                  )}
              </>
            )}
          </div>

          {/* Following */}
          <div
            className={styles['users-container']}
            ref={addToRef(categoryContainerRef, 'following')}
            onScroll={handleScroll('following')}
          >
            {searchQuery.following.trim().length > 0 ? (
              searchData.following.loading === true &&
              searchData.following.page === 1 ? (
                <div className={styles['error-text']}>
                  <LoadingAnimation
                    style={{
                      width: '3rem',
                      height: '3rem',
                      transform: 'scale(2.5)',
                    }}
                  />
                </div>
              ) : searchData.following.loading === 'error' &&
                searchData.following.page === 1 ? (
                <div className={styles['error-text']}>
                  Couldn’t load users. Please try again.
                  <button
                    className={styles['error-button']}
                    onClick={() => {
                      setSearchData((prev) => ({
                        ...prev,
                        following: { ...prev.following, loading: true },
                      }));
                    }}
                  >
                    Try again
                  </button>
                </div>
              ) : searchResult.following.length === 0 ? (
                <div className={styles['error-text']}>
                  No matching user found.
                </div>
              ) : (
                <>
                  {searchResult.following.map((obj) => (
                    <article key={obj._id} className={styles.user}>
                      <Link to={`/@${obj.username}`}>
                        <div className={styles['user-details']}>
                          <span
                            className={`${styles['img-box']} ${
                              obj.hasStory && obj.hasUnviewedStory
                                ? styles['img-box3']
                                : obj.hasStory
                                ? styles['img-box2']
                                : ''
                            }`}
                          >
                            <img
                              className={styles['user-img']}
                              src={getUrl(obj.photo, 'users')}
                            />
                          </span>

                          <div className={styles['name-box']}>
                            <span className={styles['user-name']}>
                              {obj.name}
                            </span>
                            <span className={styles['user-handle']}>
                              {obj.username}
                            </span>
                          </div>
                        </div>

                        <div className={styles['btn-div']}>
                          <button
                            className={`${styles['engage-btn']} ${
                              followData.queue.has(obj._id)
                                ? styles['disable-btn']
                                : ''
                            }`}
                            onClick={handleFollow(
                              'unfollow',
                              obj,
                              obj.followObj._id,
                              {
                                hasStory: obj.hasStory,
                                hasUnviewedStory: obj.hasUnviewedStory,
                              }
                            )}
                          >
                            Unfollow
                          </button>
                          <button
                            className={`${styles['engage-btn']} ${
                              styles['engage-btn2']
                            } ${
                              userQueue.following.has(obj._id)
                                ? styles['disable-btn']
                                : ''
                            }`}
                            onClick={sendFriendRequest(obj._id)}
                          >
                            Add Friend
                          </button>
                        </div>
                      </Link>
                    </article>
                  ))}

                  {searchData.following.loading === true &&
                    searchData.following.page > 1 && (
                      <div className={styles['loader-box']}>
                        <LoadingAnimation
                          style={{
                            width: '2rem',
                            height: '2rem',
                            transform: 'scale(2.5)',
                          }}
                        />
                      </div>
                    )}
                </>
              )
            ) : users.following === null &&
              usersData.following.loading === 'error' ? (
              <div className={styles['no-data-text']}>
                Unable to load users. Check your connection and try again.
                <div className={styles['error-btn']}>
                  <button onClick={() => getUsers('following')}>
                    Try again
                  </button>
                </div>
              </div>
            ) : users.following === null ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className={styles['suggested-skeleton-box']}>
                  <Skeleton circle height={48} width={48} />
                  <div className={styles['suggested-skeleton-box2']}>
                    <Skeleton height={14} width="60%" />
                    <Skeleton height={14} width="80%" />
                  </div>
                  <Skeleton height={30} width={60} />{' '}
                  <Skeleton height={30} width={60} />
                </div>
              ))
            ) : users.following.length === 0 ? (
              <div className={styles['no-data-text']}>
                You haven’t followed anyone yet.
              </div>
            ) : (
              <>
                {users.following.map((obj) => (
                  <article key={obj._id} className={styles.user}>
                    <Link to={`/@${obj.user.username}`}>
                      <div className={styles['user-details']}>
                        <span
                          className={`${styles['img-box']} ${
                            obj.hasStory && obj.hasUnviewedStory
                              ? styles['img-box3']
                              : obj.hasStory
                              ? styles['img-box2']
                              : ''
                          }`}
                        >
                          <img
                            className={styles['user-img']}
                            src={getUrl(obj.user.photo, 'users')}
                          />
                        </span>

                        <div className={styles['name-box']}>
                          <span className={styles['user-name']}>
                            {obj.user.name}
                          </span>
                          <span className={styles['user-handle']}>
                            {obj.user.username}
                          </span>
                        </div>
                      </div>

                      <div className={styles['btn-div']}>
                        <button
                          className={`${styles['engage-btn']} ${
                            followData.queue.has(obj.user._id)
                              ? styles['disable-btn']
                              : ''
                          }`}
                          onClick={handleFollow(
                            'unfollow',
                            obj.user,
                            followData.list.get(obj.user._id)!,
                            {
                              hasStory: obj.hasStory,
                              hasUnviewedStory: obj.hasUnviewedStory,
                            }
                          )}
                        >
                          Unfollow
                        </button>
                        <button
                          className={`${styles['engage-btn']} ${
                            styles['engage-btn2']
                          } ${
                            userQueue.following.has(obj.user._id)
                              ? styles['disable-btn']
                              : ''
                          }`}
                          onClick={sendFriendRequest(obj.user._id)}
                        >
                          Add Friend
                        </button>
                      </div>
                    </Link>
                  </article>
                ))}

                {usersData.following.loading === true &&
                  usersData.following.cursor !== null && (
                    <div className={styles['loader-box']}>
                      <LoadingAnimation
                        style={{
                          width: '2rem',
                          height: '2rem',
                          transform: 'scale(2.5)',
                        }}
                      />
                    </div>
                  )}
              </>
            )}
          </div>

          {/* Friends */}
          <div
            className={styles['users-container']}
            ref={addToRef(categoryContainerRef, 'friends')}
            onScroll={handleScroll('friends')}
          >
            {searchQuery.friends.trim().length > 0 ? (
              searchData.friends.loading === true &&
              searchData.friends.page === 1 ? (
                <div className={styles['error-text']}>
                  <LoadingAnimation
                    style={{
                      width: '3rem',
                      height: '3rem',
                      transform: 'scale(2.5)',
                    }}
                  />
                </div>
              ) : searchData.friends.loading === 'error' &&
                searchData.friends.page === 1 ? (
                <div className={styles['error-text']}>
                  Couldn’t load users. Please try again.
                  <button
                    className={styles['error-button']}
                    onClick={() => {
                      setSearchData((prev) => ({
                        ...prev,
                        friends: { ...prev.friends, loading: true },
                      }));
                    }}
                  >
                    Try again
                  </button>
                </div>
              ) : searchResult.friends.length === 0 ? (
                <div className={styles['error-text']}>
                  No matching user found.
                </div>
              ) : (
                <>
                  {searchResult.friends.map((obj) => (
                    <article key={obj._id} className={styles.user}>
                      <Link to={`/@${obj.username}`}>
                        <div className={styles['user-details']}>
                          <span
                            className={`${styles['img-box']} ${
                              obj.hasStory && obj.hasUnviewedStory
                                ? styles['img-box3']
                                : obj.hasStory
                                ? styles['img-box2']
                                : ''
                            }`}
                          >
                            <img
                              className={styles['user-img']}
                              src={getUrl(obj.photo, 'users')}
                            />
                          </span>

                          <div className={styles['name-box']}>
                            <span className={styles['user-name']}>
                              {obj.name}
                            </span>
                            <span className={styles['user-handle']}>
                              {obj.username}
                            </span>
                          </div>
                        </div>

                        <div className={styles['btn-div']}>
                          <button
                            className={styles['engage-btn']}
                            onClick={(e) => {
                              e.preventDefault();
                              navigate('/inbox');
                            }}
                          >
                            Message
                          </button>
                          {obj.friendObj ? (
                            <button
                              className={`${styles['engage-btn']} ${
                                styles['engage-btn2']
                              } ${
                                userQueue.friends.has(obj.friendObj._id)
                                  ? styles['disable-btn']
                                  : ''
                              }`}
                              onClick={removeFriend(obj.friendObj._id)}
                            >
                              Remove
                            </button>
                          ) : (
                            <button
                              className={`${styles['engage-btn']} ${
                                styles['engage-btn2']
                              } ${
                                userQueue.friends.has(obj._id)
                                  ? styles['disable-btn']
                                  : ''
                              }`}
                              onClick={sendFriendRequest(obj._id)}
                            >
                              Add Friend
                            </button>
                          )}
                        </div>
                      </Link>
                    </article>
                  ))}

                  {searchData.friends.loading === true &&
                    searchData.friends.page > 1 && (
                      <div className={styles['loader-box']}>
                        <LoadingAnimation
                          style={{
                            width: '2rem',
                            height: '2rem',
                            transform: 'scale(2.5)',
                          }}
                        />
                      </div>
                    )}
                </>
              )
            ) : users.friends === null &&
              usersData.friends.loading === 'error' ? (
              <div className={styles['no-data-text']}>
                Unable to load users. Check your connection and try again.
                <div className={styles['error-btn']}>
                  <button onClick={() => getUsers('friends')}>Try again</button>
                </div>
              </div>
            ) : users.friends === null ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className={styles['suggested-skeleton-box']}>
                  <Skeleton circle height={48} width={48} />
                  <div className={styles['suggested-skeleton-box2']}>
                    <Skeleton height={14} width="60%" />
                    <Skeleton height={14} width="80%" />
                  </div>
                  <Skeleton height={30} width={60} />{' '}
                  <Skeleton height={30} width={60} />
                </div>
              ))
            ) : users.friends.length === 0 ? (
              <div className={styles['no-data-text']}>
                No friends yet. Use the search bar above to find and add
                friends.
              </div>
            ) : (
              <>
                {users.friends.map((obj) => (
                  <article key={obj._id} className={styles.user}>
                    <Link to={`/@${obj.user.username}`}>
                      <div className={styles['user-details']}>
                        <span
                          className={`${styles['img-box']} ${
                            obj.hasStory && obj.hasUnviewedStory
                              ? styles['img-box3']
                              : obj.hasStory
                              ? styles['img-box2']
                              : ''
                          }`}
                        >
                          <img
                            className={styles['user-img']}
                            src={getUrl(obj.user.photo, 'users')}
                          />
                        </span>

                        <div className={styles['name-box']}>
                          <span className={styles['user-name']}>
                            {obj.user.name}
                          </span>
                          <span className={styles['user-handle']}>
                            {obj.user.username}
                          </span>
                        </div>
                      </div>

                      <div className={styles['btn-div']}>
                        <button
                          className={styles['engage-btn']}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate('/inbox');
                          }}
                        >
                          Message
                        </button>
                        <button
                          className={`${styles['engage-btn']} ${
                            styles['engage-btn2']
                          } ${
                            userQueue.friends.has(obj._id)
                              ? styles['disable-btn']
                              : ''
                          }`}
                          onClick={removeFriend(obj._id)}
                        >
                          Remove
                        </button>
                      </div>
                    </Link>
                  </article>
                ))}

                {usersData.friends.loading === true &&
                  usersData.friends.cursor !== null && (
                    <div className={styles['loader-box']}>
                      <LoadingAnimation
                        style={{
                          width: '2rem',
                          height: '2rem',
                          transform: 'scale(2.5)',
                        }}
                      />
                    </div>
                  )}
              </>
            )}
          </div>

          {/* Private Audience */}
          <div
            className={styles['users-container']}
            ref={addToRef(categoryContainerRef, 'private')}
            onScroll={handleScroll('private')}
          >
            {searchQuery.private.trim().length > 0 ? (
              searchData.private.loading === true &&
              searchData.private.page === 1 ? (
                <div className={styles['error-text']}>
                  <LoadingAnimation
                    style={{
                      width: '3rem',
                      height: '3rem',
                      transform: 'scale(2.5)',
                    }}
                  />
                </div>
              ) : searchData.private.loading === 'error' &&
                searchData.private.page === 1 ? (
                <div className={styles['error-text']}>
                  Couldn’t load users. Please try again.
                  <button
                    className={styles['error-button']}
                    onClick={() => {
                      setSearchData((prev) => ({
                        ...prev,
                        private: { ...prev.private, loading: true },
                      }));
                    }}
                  >
                    Try again
                  </button>
                </div>
              ) : searchResult.private.length === 0 ? (
                <div className={styles['error-text']}>
                  No matching user found.
                </div>
              ) : (
                <>
                  {searchResult.private.map((user) => (
                    <article key={user._id} className={styles.user}>
                      <Link to={`/@${user.username}`}>
                        <div className={styles['user-details']}>
                          <span
                            className={`${styles['img-box']} ${
                              user.hasStory && user.hasUnviewedStory
                                ? styles['img-box3']
                                : user.hasStory
                                ? styles['img-box2']
                                : ''
                            }`}
                          >
                            <img
                              className={styles['user-img']}
                              src={getUrl(user.photo, 'users')}
                            />
                          </span>

                          <div className={styles['name-box']}>
                            <span className={styles['user-name']}>
                              {user.name}
                            </span>
                            <span className={styles['user-handle']}>
                              {user.username}
                            </span>
                          </div>
                        </div>

                        <div className={styles['btn-div']}>
                          {user.followObj ? (
                            <button
                              className={`${styles['engage-btn']} ${
                                followData.queue.has(user._id)
                                  ? styles['disable-btn']
                                  : ''
                              }`}
                              onClick={handleFollow(
                                'unfollow',
                                user,
                                user.followObj._id,
                                {
                                  hasStory: user.hasStory,
                                  hasUnviewedStory: user.hasUnviewedStory,
                                }
                              )}
                            >
                              Unfollow
                            </button>
                          ) : (
                            <button
                              className={`${styles['engage-btn']} ${
                                followData.queue.has(user._id)
                                  ? styles['disable-btn']
                                  : ''
                              }`}
                              onClick={handleFollow('follow', user, user._id, {
                                hasStory: user.hasStory,
                                hasUnviewedStory: user.hasUnviewedStory,
                              })}
                            >
                              Follow
                            </button>
                          )}

                          {user.private ? (
                            <button
                              className={`${styles['engage-btn']} ${
                                styles['engage-btn2']
                              } ${
                                userQueue.private.has(user._id)
                                  ? styles['disable-btn']
                                  : ''
                              }`}
                              onClick={updatePrivateAudience('remove', user)}
                            >
                              Remove
                            </button>
                          ) : (
                            <button
                              className={`${styles['engage-btn']} ${
                                styles['engage-btn2']
                              } ${
                                userQueue.private.has(user._id)
                                  ? styles['disable-btn']
                                  : ''
                              }`}
                              onClick={updatePrivateAudience('add', user)}
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </Link>
                    </article>
                  ))}

                  {searchData.private.loading === true &&
                    searchData.private.page > 1 && (
                      <div className={styles['loader-box']}>
                        <LoadingAnimation
                          style={{
                            width: '2rem',
                            height: '2rem',
                            transform: 'scale(2.5)',
                          }}
                        />
                      </div>
                    )}
                </>
              )
            ) : users.private === null &&
              usersData.private.loading === 'error' ? (
              <div className={styles['no-data-text']}>
                Unable to load users. Check your connection and try again.
                <div className={styles['error-btn']}>
                  <button onClick={() => getUsers('private')}>Try again</button>
                </div>
              </div>
            ) : users.private === null ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className={styles['suggested-skeleton-box']}>
                  <Skeleton circle height={48} width={48} />
                  <div className={styles['suggested-skeleton-box2']}>
                    <Skeleton height={14} width="60%" />
                    <Skeleton height={14} width="80%" />
                  </div>
                  <Skeleton height={30} width={60} />{' '}
                  <Skeleton height={30} width={60} />
                </div>
              ))
            ) : users.private.length === 0 ? (
              <div className={styles['no-data-text']}>
                No users added yet. Use the search box above to find users.
              </div>
            ) : (
              <>
                {users.private.map((user) => (
                  <article key={user._id} className={styles.user}>
                    <Link to={`/@${user.username}`}>
                      <div className={styles['user-details']}>
                        <span
                          className={`${styles['img-box']} ${
                            user.hasStory && user.hasUnviewedStory
                              ? styles['img-box3']
                              : user.hasStory
                              ? styles['img-box2']
                              : ''
                          }`}
                        >
                          <img
                            className={styles['user-img']}
                            src={getUrl(user.photo, 'users')}
                          />
                        </span>

                        <div className={styles['name-box']}>
                          <span className={styles['user-name']}>
                            {user.name}
                          </span>
                          <span className={styles['user-handle']}>
                            {user.username}
                          </span>
                        </div>
                      </div>

                      <div className={styles['btn-div']}>
                        {followData.list.has(user._id) ? (
                          <button
                            className={`${styles['engage-btn']} ${
                              followData.queue.has(user._id)
                                ? styles['disable-btn']
                                : ''
                            }`}
                            onClick={handleFollow(
                              'unfollow',
                              user,
                              followData.list.get(user._id)!,
                              {
                                hasStory: user.hasStory,
                                hasUnviewedStory: user.hasUnviewedStory,
                              }
                            )}
                          >
                            Unfollow
                          </button>
                        ) : (
                          <button
                            className={`${styles['engage-btn']} ${
                              followData.queue.has(user._id)
                                ? styles['disable-btn']
                                : ''
                            }`}
                            onClick={handleFollow('follow', user, user._id, {
                              hasStory: user.hasStory,
                              hasUnviewedStory: user.hasUnviewedStory,
                            })}
                          >
                            Follow
                          </button>
                        )}

                        <button
                          className={`${styles['engage-btn']} ${
                            styles['engage-btn2']
                          } ${
                            userQueue.private.has(user._id)
                              ? styles['disable-btn']
                              : ''
                          }`}
                          onClick={updatePrivateAudience('remove', user)}
                        >
                          Remove
                        </button>
                      </div>
                    </Link>
                  </article>
                ))}

                {usersData.private.loading === true &&
                  usersData.private.page > 1 && (
                    <div className={styles['loader-box']}>
                      <LoadingAnimation
                        style={{
                          width: '2rem',
                          height: '2rem',
                          transform: 'scale(2.5)',
                        }}
                      />
                    </div>
                  )}
              </>
            )}
          </div>

          {/* Suggested users */}
          <div className={styles['users-container']}>
            {suggestedUsers === null ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className={styles['suggested-skeleton-box']}>
                  <Skeleton circle height={48} width={48} />
                  <div className={styles['suggested-skeleton-box2']}>
                    <Skeleton height={14} width="60%" />
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
              suggestedUsers.map((user) => (
                <article key={user._id} className={styles.user}>
                  <Link to={`/@${user.username}`}>
                    <div className={styles['user-details']}>
                      <span
                        className={`${styles['img-box']} ${
                          user.hasStory && user.hasUnviewedStory
                            ? styles['img-box3']
                            : user.hasStory
                            ? styles['img-box2']
                            : ''
                        }`}
                      >
                        <img
                          className={styles['user-img']}
                          src={getUrl(user.photo, 'users')}
                        />
                      </span>

                      <div className={styles['name-box']}>
                        <span className={styles['user-name']}>{user.name}</span>
                        <span className={styles['user-handle']}>
                          {user.username}
                        </span>
                      </div>
                    </div>

                    <div className={styles['btn-div']}>
                      <button
                        className={`${styles['engage-btn']} ${
                          followData.queue.has(user._id)
                            ? styles['disable-btn']
                            : ''
                        }`}
                        onClick={handleFollow('follow', user, user._id, {
                          hasStory: user.hasStory,
                          hasUnviewedStory: user.hasUnviewedStory,
                        })}
                      >
                        Follow
                      </button>
                      <button
                        className={`${styles['engage-btn']} ${
                          styles['engage-btn2']
                        } ${
                          userQueue.suggested.has(user._id)
                            ? styles['disable-btn']
                            : ''
                        }`}
                        onClick={removeSuggestedUser(user._id)}
                      >
                        Remove
                      </button>
                    </div>
                  </Link>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>,
    target
  );
};

export default Engagements;
