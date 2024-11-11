import { useRef, useState } from 'react';
import NavBar from '../components/NavBar';
import styles from '../styles/Home.module.css';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import { Content } from '../components/CarouselItem';
import ContentBox from '../components/ContentBox';
import { ContentContext } from '../Contexts';

interface User {
  name: string;
}

interface Arrow {
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

const dataList = [
  {
    media: data,
    name: 'Godfather 👑👑',
    username: '@dagodfather_100',
    photo: 'profile1.jpeg',
    time: '10m',
    aspectRatio: 1 / 1,
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

  const storyRef = useRef<HTMLDivElement>(null!);
  const contentRef = useRef<HTMLDivElement[]>([]);

  const scrollHandler = () => {
    const videos = contentRef.current;
    const deviceHeight = window.innerHeight;

    const activeVideos = videos.filter((video) => {
      const top = video.getBoundingClientRect().top;
      const bottom = video.getBoundingClientRect().bottom;
      const active = video.getAttribute('data-active');

      let condition;

      if (active === 'true') {
        if (
          (top > 0 && top < deviceHeight * 0.6) ||
          (bottom < deviceHeight && bottom > deviceHeight * 0.4)
        ) {
          condition = true;
        } else {
          condition = false;
        }
      } else condition = false;

      if (!condition) video.querySelector('video')?.pause();

      return condition;
    });

    activeVideos.forEach((video, index) => {
      if (index === 0) video.querySelector('video')?.play();
      else video.querySelector('video')?.pause();
    });
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

  return (
    <>
      <NavBar page="home" />

      <section className={styles.main}>
        <section className={styles['main-container']} onScroll={scrollHandler}>
          <div
            className={styles['stories-container']}
            ref={storyRef}
            onScroll={handleScroll}
          >
            {showArrow.left && (
              <span
                className={styles['left-arrow-box']}
                onClick={() => (storyRef.current.scrollLeft -= 300)}
              >
                <MdKeyboardArrowLeft className={styles['left-arrow']} />
              </span>
            )}

            {users.map(({ name }, index) => (
              <article key={index} className={styles.user}>
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

            {showArrow.right && (
              <span
                className={styles['right-arrow-box']}
                onClick={() => (storyRef.current.scrollLeft += 300)}
              >
                <MdKeyboardArrowRight className={styles['right-arrow']} />
              </span>
            )}
          </div>

          <ContentContext.Provider value={contentRef}>
            <div className={styles['content-container']}>
              {dataList.map((data, index) => (
                <ContentBox key={index} data={data} />
              ))}
            </div>
          </ContentContext.Provider>
        </section>

        <section></section>
      </section>
    </>
  );
};

export default Home;
