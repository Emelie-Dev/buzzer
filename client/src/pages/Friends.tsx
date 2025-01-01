import NavBar from '../components/NavBar';
import styles from '../styles/Friends.module.css';
import { PiCheckFatFill } from 'react-icons/pi';
import { useEffect, useRef, useState } from 'react';
import { ContentContext } from '../Contexts';
import ContentBox from '../components/ContentBox';
import { Content } from '../components/CarouselItem';
import { DataItem } from './Following';
import useScrollHandler from '../hooks/useScrollHandler';
import AsideHeader from '../components/AsideHeader';

const data: Content[] = [
  {
    src: 'content16',
    type: 'image',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas sit amet pretium urna. Vivamus venenatis velit nec neque ultricies, eget elementum magna tristique.',
  },
  {
    src: 'content7',
    type: 'image',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  },
  {
    src: 'content9',
    type: 'image',
    description: '',
  },
];

const data2: Content[] = [
  {
    src: 'content14',
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
    src: 'content24',
    type: 'video',
    description: 'Messi lifting a trophy high.',
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
    media: 'content26',
    name: 'Coach of Mancheter City',
    username: '@pepguardiola',
    photo: 'profile3.jpeg',
    time: '5h',
    aspectRatio: 7 / 8,
    type: 'image',
    description: `We keep pushing harder everyday, to achieve greatness.`,
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
  {
    media: 'content27',
    name: 'Antonella',
    username: '@antonellarocuzzo',
    photo: 'profile4.jpeg',
    time: '2d',
    aspectRatio: 9 / 16,
    type: 'video',
    description: '',
  },
];

const Friends = () => {
  const [category, setCategory] = useState<'users' | 'contents'>('users');
  const containerRef = useRef<HTMLDivElement>(null!);

  const { activeVideo, setActiveVideo, contentRef, scrollHandler } =
    useScrollHandler();

  useEffect(() => {
    scrollHandler();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      if (category === 'contents') {
        containerRef.current.style.transform = `translateX(-100%)`;
        if (activeVideo) activeVideo.play();
      } else {
        containerRef.current.style.transform = `translateX(0%)`;
        if (activeVideo) activeVideo.pause();
      }
    }
  }, [category]);

  return (
    <>
      <NavBar page="friends" />

      <section className={styles.main}>
        <section className={styles['main-container']}>
          <div className={styles.header}>
            <ul className={styles['header-list']}>
              <li
                className={`${styles['header-item']} ${
                  category === 'users' ? styles['active-item'] : ''
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
          </div>

          <div className={styles['category-container']} ref={containerRef}>
            <div className={styles['users-container']}>
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
              <div
                className={styles['content-container']}
                onScroll={scrollHandler}
              >
                {dataList.map((data, index) => (
                  <ContentBox key={index} data={data} contentType="home" />
                ))}
              </div>
            </ContentContext.Provider>
          </div>
        </section>

        <section className={styles.aside}>
          <AsideHeader />

          <div className={styles['friends-request-container']}>
            <span className={styles['friends-request-text']}>
              Friend requests
            </span>

            <div className={styles['friend-requests']}>
              <article className={styles['friend-request']}>
                <span className={styles['friend-request-img-box']}>
                  <img
                    className={styles['friend-request-img']}
                    src="../../assets/images/users/user13.jpeg"
                  />

                  <span className={styles['friend-request-icon-box']}>
                    <PiCheckFatFill className={styles['friend-request-icon']} />
                  </span>
                </span>

                <div className={styles['friend-request-details']}>
                  <span className={styles['friend-request-username']}>
                    travis_scott
                  </span>

                  <div className={styles['friend-btn-box']}>
                    <button className={styles['friend-accept-btn']}>
                      Accept
                    </button>
                    <button className={styles['friend-decline-btn']}>
                      Decline
                    </button>
                  </div>
                </div>
              </article>

              <article className={styles['friend-request']}>
                <span className={styles['friend-request-img-box']}>
                  <img
                    className={styles['friend-request-img']}
                    src="../../assets/images/users/user10.jpeg"
                  />
                </span>

                <div className={styles['friend-request-details']}>
                  <span className={styles['friend-request-username']}>
                    travis_scott
                  </span>

                  <div className={styles['friend-btn-box']}>
                    <button className={styles['friend-accept-btn']}>
                      Accept
                    </button>
                    <button className={styles['friend-decline-btn']}>
                      Decline
                    </button>
                  </div>
                </div>
              </article>

              <article className={styles['friend-request']}>
                <span className={styles['friend-request-img-box']}>
                  <img
                    className={styles['friend-request-img']}
                    src="../../assets/images/users/user1.jpeg"
                  />

                  <span className={styles['friend-request-icon-box']}>
                    <PiCheckFatFill className={styles['friend-request-icon']} />
                  </span>
                </span>

                <div className={styles['friend-request-details']}>
                  <span className={styles['friend-request-username']}>
                    travis_scott
                  </span>

                  <div className={styles['friend-btn-box']}>
                    <button className={styles['friend-accept-btn']}>
                      Accept
                    </button>
                    <button className={styles['friend-decline-btn']}>
                      Decline
                    </button>
                  </div>
                </div>
              </article>

              <article className={styles['friend-request']}>
                <span className={styles['friend-request-img-box']}>
                  <img
                    className={styles['friend-request-img']}
                    src="../../assets/images/users/user4.jpeg"
                  />
                </span>

                <div className={styles['friend-request-details']}>
                  <span className={styles['friend-request-username']}>
                    travis_scott
                  </span>

                  <div className={styles['friend-btn-box']}>
                    <button className={styles['friend-accept-btn']}>
                      Accept
                    </button>
                    <button className={styles['friend-decline-btn']}>
                      Decline
                    </button>
                  </div>
                </div>
              </article>

              <article className={styles['friend-request']}>
                <span className={styles['friend-request-img-box']}>
                  <img
                    className={styles['friend-request-img']}
                    src="../../assets/images/users/user5.jpeg"
                  />
                </span>

                <div className={styles['friend-request-details']}>
                  <span className={styles['friend-request-username']}>
                    travis_scott
                  </span>

                  <div className={styles['friend-btn-box']}>
                    <button className={styles['friend-accept-btn']}>
                      Accept
                    </button>
                    <button className={styles['friend-decline-btn']}>
                      Decline
                    </button>
                  </div>
                </div>
              </article>
            </div>

            <span className={styles['friends-request-all']}>View all</span>
          </div>
        </section>
      </section>
    </>
  );
};

export default Friends;
