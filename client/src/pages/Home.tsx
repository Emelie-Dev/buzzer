import { useContext, useEffect, useRef, useState } from 'react';
import NavBar from '../components/NavBar';
import styles from '../styles/Home.module.css';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import { Content } from '../components/CarouselItem';
import ContentBox from '../components/ContentBox';
import {
  ContentContext,
  GeneralContext,
  AuthContext,
  StoryContext,
} from '../Contexts';
import { DataItem } from './Following';
import useScrollHandler from '../hooks/useScrollHandler';
import AsideHeader from '../components/AsideHeader';
import { GoPlus } from 'react-icons/go';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MobileMenu from '../components/MobileMenu';
import Skeleton from 'react-loading-skeleton';
import { apiClient, getUrl } from '../Utilities';
import Engagements from '../components/Engagements';
import { toast } from 'sonner';
import LoadingAnimation from '../components/LoadingAnimation';

export interface User {
  name: string;
}

export interface Arrow {
  left: boolean;
  right: boolean;
}

// const users: User[] = [
//   { name: 'userOne' },
//   { name: 'coolGuy' },
//   { name: 'happy123' },
//   { name: 'sunshineGirl' },
//   { name: 'codeMaster' },
//   { name: 'skyWalker' },
//   { name: 'theArtist' },
//   { name: 'jungleKing' },
//   { name: 'dreamer_98' },
//   { name: 'techieDude' },
//   { name: 'cityExplorer' },
//   { name: 'natureLover' },
//   { name: 'mountainView' },
//   { name: 'coffeeAddict' },
//   { name: 'chefTom' },
//   { name: 'oceanWave' },
//   { name: 'bookworm101' },
//   { name: 'fastRunner' },
//   { name: 'digitalNomad' },
//   { name: 'starGazer' },
// ];

const data: Content[] = [
  {
    src: 'content23',
    type: 'image',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas sit amet pretium urna. Vivamus venenatis velit nec neque ultricies, eget elementum magna tristique.',
  },
  {
    src: 'content2',
    type: 'image',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  },
  {
    src: 'content3',
    type: 'image',
    description: '',
  },
  {
    src: 'content4',
    type: 'image',
    description: 'Lorem ipsum dolor sit amet.',
  },
  {
    src: 'content5',
    type: 'image',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas sit amet pretium urna. Vivamus venenatis velit nec neque ultricies, eget elementum magna tristique.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas sit amet pretium urna. Vivamus venenatis velit nec neque ultricies, eget elementum magna tristique.',
  },
  {
    src: 'content6',
    type: 'video',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas sit amet pretium urna. Vivamus venenatis velit nec neque ultricies, eget elementum magna tristique.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas sit amet pretium urna. Vivamus venenatis velit nec neque ultricies, eget elementum magna tristique.',
  },
];

const data2: Content[] = [
  {
    src: 'content22',
    type: 'image',
  },
  {
    src: 'content21',
    type: 'video',
    description: 'Messi celebrating a goal with fans.',
  },
  {
    src: 'content8',
    type: 'image',
    description: 'Focused during a free-kick.',
  },
  {
    src: 'content9',
    type: 'image',
    description: '',
  },
  {
    src: 'content10',
    type: 'image',
    description: 'In action on the field.',
  },
  {
    src: 'content11',
    type: 'image',
    description: 'Holding the World Cup trophy.',
  },
  {
    src: 'content12',
    type: 'image',
    description: '',
  },
  {
    src: 'content13',
    type: 'image',
    description: 'Messi dribbling past defenders.',
  },
  {
    src: 'content14',
    type: 'image',
    description: 'Close-up of his iconic jersey.',
  },
  {
    src: 'content15',
    type: 'image',
    description: '',
  },
  {
    src: 'content20',
    type: 'video',
    description: 'Messi looking up, determined.',
  },
  {
    src: 'content17',
    type: 'image',
    description: '',
  },
  {
    src: 'content18',
    type: 'image',
    description: 'Celebrating with his teammates.',
  },
  {
    src: 'content19',
    type: 'image',
    description: 'Messi lifting a trophy high.',
  },
  {
    src: 'content16',
    type: 'image',
    description: 'In training gear, focused and ready.',
  },
  {
    src: 'content7',
    type: 'image',
    description: '',
  },
];

const dataList: DataItem[] = [
  {
    media: data,
    name: 'Godfather 👑👑',
    username: '@dagodfather_100',
    photo: 'profile1.jpeg',
    time: '10m',
    aspectRatio: 1 / 1,
    type: 'carousel',
    description: `Big vibes only! 🌍 Had an amazing time with the fam last night. Nothing but love and energy! 💥✨ <span style="color:#a855f7;cursor: pointer;font-family: appFontMedium;">#001</span> <span style="color:#a855f7;cursor: pointer;font-family: appFontMedium;">#AfrobeatKing</span> <span style="color:#a855f7;cursor: pointer;font-family: appFontMedium;">#OBO👑</span>. Blessed to do what I love with these amazing people. 💯🖤

        
        Shoutout to my brothers <span style="color:#a855f7;cursor: pointer;font-family: appFontMedium;">@real_kiddominant</span> and <span style="color:#a855f7;cursor: pointer;font-family: appFontMedium;">@thechefchi</span> 🙌🔥 Let’s keep pushing the culture! 🎶✨
        
        <span style="color:#a855f7;cursor: pointer;font-family: appFontMedium;">#NaijaToTheWorld</span> <span style="color:#a855f7;cursor: pointer;font-family: appFontMedium;">#30BG</span> <span style="color:#a855f7;cursor: pointer;font-family: appFontMedium;">#Davido</span> <span style="color:#a855f7;cursor: pointer;font-family: appFontMedium;">#Afrobeats</span> <span style="color:#a855f7;cursor: pointer;font-family: appFontMedium;">#LagosVibes</span> <span style="color:#a855f7;cursor: pointer;font-family: appFontMedium;">#AfricanGiant</span> <span style="color:#a855f7;cursor: pointer;font-family: appFontMedium;">#NewMusicLoading 🎵</span>.`,
  },

  {
    media: data2,
    name: 'Lionel Messi 🐐🐐',
    username: '@absolute_messi',
    photo: 'profile2.jpeg',
    time: '3h',
    aspectRatio: 4 / 5,
    type: 'carousel',
    description: `Grateful for every step of this journey ⚽️. From Rosario to Barcelona, Paris, and now Miami, it’s always been about the love of the game and the incredible people I’ve met along the way ❤️💙.

Special memories with my family, teammates, and fans who’ve been there through it all. Thank you! 🙏

<span style="color:#a855f7;cursor: pointer;font-family: appFontMedium;">#SiempreMessi</span> <span style="color:#a855f7;cursor: pointer;font-family: appFontMedium;">#FromRosarioToTheWorld 🌍</span>

Clubs and moments: <span style="color:#a855f7;cursor: pointer;font-family: appFontMedium;">@fcbarcelona</span> – Dreams started here 💙❤️ <span style="color:#a855f7;cursor: pointer;font-family: appFontMedium;">@psg</span> – Another chapter, another challenge 🌟 <span style="color:#a855f7;cursor: pointer;font-family: appFontMedium;">@intermiamicf</span> – Writing new stories in the USA⚽️

<span style="color:#a855f7;cursor: pointer;font-family: appFontMedium;">#Argentina</span> – Always proud to wear these colors 💪 <span style="color:#a855f7;cursor: pointer;font-family: appFontMedium;">#VamosAlbiceleste</span> <span style="color:#a855f7;cursor: pointer;font-family: appFontMedium;">#LaPulga</span> <span style="color:#a855f7;cursor: pointer;font-family: appFontMedium;">#Goat</span> <span style="color:#a855f7;cursor: pointer;font-family: appFontMedium;">#NewGoalsAhead</span> <span style="color:#a855f7;cursor: pointer;font-family: appFontMedium;">#FootballFamily</span>`,
  },
];

const Home = () => {
  const [showArrow, setShowArrow] = useState<Arrow>({
    left: false,
    right: true,
  });
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);

  const { activeVideo, setActiveVideo, contentRef, scrollHandler } =
    useScrollHandler();
  const {
    setCreateCategory,
    setShowSearchPage,
    suggestedUsers,
    setSuggestedUsers,
  } = useContext(GeneralContext);
  const { user } = useContext(AuthContext);
  const { stories, userStory, setStoryIndex, setViewStory } =
    useContext(StoryContext);
  const [engagementModal, setEngagementModal] = useState<
    'followers' | 'following' | 'friends' | 'suggested' | 'private' | null
  >(null);
  const [followList, setFollowList] = useState<Set<string>>(new Set());

  const storyRef = useRef<HTMLDivElement>(null!);

  const navigate = useNavigate();

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

  const hasViewedAll = (stories: any[]) => {
    return stories.every((story) => story.hasViewed);
  };

  const followUser = async (id: string) => {
    const newList = new Set(followList);
    newList.add(id);
    setFollowList(newList);

    try {
      await apiClient.post(`api/v1/follow/${id}`);

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
                    className={styles.user}
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
                      navigate('/create');
                    }}
                  >
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
                  </article>
                )
              ) : (
                <>
                  {userStory.length > 0 ? (
                    <article
                      className={styles.user}
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
                        navigate('/create');
                      }}
                    >
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
                    </article>
                  )}

                  {stories.map(({ user }, index) => (
                    <article
                      key={index}
                      className={styles.user}
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
              {dataList.map((data, index) => (
                <ContentBox
                  key={index}
                  data={data}
                  contentType="home"
                  setShowMobileMenu={setShowMobileMenu}
                />
              ))}
            </div>
          </ContentContext.Provider>

          <Footer page={'home'} />
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
                  <article
                    key={user._id}
                    className={styles['suggested-user']}
                    onClick={() => navigate(`/@${user.username}`)}
                  >
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
                          followList.has(user._id) ? styles['disable-btn'] : ''
                        }`}
                        onClick={() => followUser(user._id)}
                      >
                        <span
                          className={`${
                            followList.has(user._id) ? styles['follow-txt'] : ''
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

export default Home;
