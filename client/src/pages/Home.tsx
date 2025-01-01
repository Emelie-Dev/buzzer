import { useEffect, useRef, useState } from 'react';
import NavBar from '../components/NavBar';
import styles from '../styles/Home.module.css';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import { Content } from '../components/CarouselItem';
import ContentBox from '../components/ContentBox';
import { ContentContext } from '../Contexts';
import StoryModal from '../components/StoryModal';
import { DataItem } from './Following';
import useScrollHandler from '../hooks/useScrollHandler';
import AsideHeader from '../components/AsideHeader';

export interface User {
  name: string;
}

export interface Arrow {
  left: boolean;
  right: boolean;
}

const users: User[] = [
  { name: 'userOne' },
  { name: 'coolGuy' },
  { name: 'happy123' },
  { name: 'sunshineGirl' },
  { name: 'codeMaster' },
  { name: 'skyWalker' },
  { name: 'theArtist' },
  { name: 'jungleKing' },
  { name: 'dreamer_98' },
  { name: 'techieDude' },
  { name: 'cityExplorer' },
  { name: 'natureLover' },
  { name: 'mountainView' },
  { name: 'coffeeAddict' },
  { name: 'chefTom' },
  { name: 'oceanWave' },
  { name: 'bookworm101' },
  { name: 'fastRunner' },
  { name: 'digitalNomad' },
  { name: 'starGazer' },
];

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
  const [viewStory, setViewStory] = useState<boolean>(false);
  const [storyIndex, setStoryIndex] = useState<number>(0);

  const { activeVideo, setActiveVideo, contentRef, scrollHandler } =
    useScrollHandler();

  const storyRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    scrollHandler();
  }, []);

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

  return (
    <>
      <NavBar page="home" />

      {viewStory && (
        <StoryModal setViewStory={setViewStory} itemIndex={storyIndex} />
      )}

      <section className={styles.main}>
        <section className={styles['main-container']} onScroll={scrollHandler}>
          <div
            className={styles['stories-container']}
            ref={storyRef}
            onScroll={handleScroll}
          >
            <span
              className={`${styles['left-arrow-box']} ${
                !showArrow.left ? styles['hide-icon'] : ''
              }`}
              onClick={() => (storyRef.current.scrollLeft -= 300)}
            >
              <MdKeyboardArrowLeft className={styles['left-arrow']} />
            </span>

            {users.map(({ name }, index) => (
              <article
                key={index}
                className={styles.user}
                onClick={() => {
                  setStoryIndex(index);
                  setViewStory(true);
                }}
              >
                <span className={styles['user-pics-box']}>
                  <img
                    src={`../../assets/images/users/user${index + 1}.jpeg`}
                    alt={name}
                    className={styles['user-pics']}
                  />
                </span>

                <span className={styles['user-name']}>{name}</span>
              </article>
            ))}

            <span
              className={`${styles['right-arrow-box']} ${
                !showArrow.right ? styles['hide-icon'] : ''
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
                <ContentBox key={index} data={data} contentType="home" />
              ))}
            </div>
          </ContentContext.Provider>
        </section>

        <section className={styles.aside}>
          <AsideHeader />

          <div className={styles['suggested-container']}>
            <span className={styles['suggested-text']}>Suggested for you</span>

            <div className={styles['suggested-users']}>
              <article className={styles['suggested-user']}>
                <img
                  src="../../assets/images/users/user6.jpeg"
                  className={styles['suggested-user-img']}
                />

                <span className={styles['suggested-user-names']}>
                  <span className={styles['suggested-user-username']}>
                    Arya Stark
                  </span>
                  <span className={styles['suggested-user-handle']}>
                    @aryaofhousestark
                  </span>
                </span>

                <button className={styles['follow-btn']}>Follow</button>
              </article>
              <article className={styles['suggested-user']}>
                <img
                  src="../../assets/images/users/user6.jpeg"
                  className={styles['suggested-user-img']}
                />

                <span className={styles['suggested-user-names']}>
                  <span className={styles['suggested-user-username']}>
                    Arya Stark
                  </span>
                  <span className={styles['suggested-user-handle']}>
                    @aryaofhousestark
                  </span>
                </span>

                <button className={styles['follow-btn']}>Follow</button>
              </article>

              <article className={styles['suggested-user']}>
                <img
                  src="../../assets/images/users/user6.jpeg"
                  className={styles['suggested-user-img']}
                />

                <span className={styles['suggested-user-names']}>
                  <span className={styles['suggested-user-username']}>
                    Arya Stark
                  </span>
                  <span className={styles['suggested-user-handle']}>
                    @aryaofhousestark
                  </span>
                </span>

                <button className={styles['follow-btn']}>Follow</button>
              </article>
              <article className={styles['suggested-user']}>
                <img
                  src="../../assets/images/users/user6.jpeg"
                  className={styles['suggested-user-img']}
                />

                <span className={styles['suggested-user-names']}>
                  <span className={styles['suggested-user-username']}>
                    Arya Stark
                  </span>
                  <span className={styles['suggested-user-handle']}>
                    @aryaofhousestark
                  </span>
                </span>

                <button className={styles['follow-btn']}>Follow</button>
              </article>
              <article className={styles['suggested-user']}>
                <img
                  src="../../assets/images/users/user6.jpeg"
                  className={styles['suggested-user-img']}
                />

                <span className={styles['suggested-user-names']}>
                  <span className={styles['suggested-user-username']}>
                    Arya Stark
                  </span>
                  <span className={styles['suggested-user-handle']}>
                    @aryaofhousestark
                  </span>
                </span>

                <button className={styles['follow-btn']}>Follow</button>
              </article>
              <article className={styles['suggested-user']}>
                <img
                  src="../../assets/images/users/user6.jpeg"
                  className={styles['suggested-user-img']}
                />

                <span className={styles['suggested-user-names']}>
                  <span className={styles['suggested-user-username']}>
                    Arya Stark
                  </span>
                  <span className={styles['suggested-user-handle']}>
                    @aryaofhousestark
                  </span>
                </span>

                <button className={styles['follow-btn']}>Follow</button>
              </article>
              <article className={styles['suggested-user']}>
                <img
                  src="../../assets/images/users/user6.jpeg"
                  className={styles['suggested-user-img']}
                />

                <span className={styles['suggested-user-names']}>
                  <span className={styles['suggested-user-username']}>
                    Arya Stark
                  </span>
                  <span className={styles['suggested-user-handle']}>
                    @aryaofhousestark
                  </span>
                </span>

                <button className={styles['follow-btn']}>Follow</button>
              </article>
              <article className={styles['suggested-user']}>
                <img
                  src="../../assets/images/users/user6.jpeg"
                  className={styles['suggested-user-img']}
                />

                <span className={styles['suggested-user-names']}>
                  <span className={styles['suggested-user-username']}>
                    Arya Stark
                  </span>
                  <span className={styles['suggested-user-handle']}>
                    @aryaofhousestark
                  </span>
                </span>

                <button className={styles['follow-btn']}>Follow</button>
              </article>
            </div>
          </div>
        </section>
      </section>
    </>
  );
};

export default Home;
