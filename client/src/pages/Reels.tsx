import NavBar from '../components/NavBar';
import styles from '../styles/Reels.module.css';
import { useContext, useEffect, useRef, useState } from 'react';
import { ContentContext, GeneralContext } from '../Contexts';
import ContentBox from '../components/ContentBox';
import useScrollHandler from '../hooks/useScrollHandler';
import { DataItem } from './Following';
import { TbMenuDeep } from 'react-icons/tb';
import { RiUnpinFill } from 'react-icons/ri';
import { IoIosArrowUp } from 'react-icons/io';
import { IoIosArrowDown } from 'react-icons/io';
import AsideHeader from '../components/AsideHeader';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MobileMenu from '../components/MobileMenu';
import PinnedReels from '../components/PinnedReels';

const dataList: DataItem[] = [
  {
    media: 'content30',
    name: 'Mr Hilarious👑',
    username: 'kingofreaction',
    photo: 'profile1.jpeg',
    time: '',
    aspectRatio: 1,
    type: 'video',
    description: `When you're just trying to shower but your underwear decides to
                pull a "floor is lava" challenge 😩😂.#WhyMe`,
  },
  {
    media: 'content29',
    name: 'MCFC Lad',
    username: 'mancity_fan',
    photo: 'profile1.jpeg',
    time: '',
    aspectRatio: 1,
    type: 'video',
    description: `When you're just trying to shower but your underwear decides to
                pull a "floor is lava" challenge 😩😂.#WhyMe`,
  },
];

const Reels = () => {
  const { activeVideo, setActiveVideo, contentRef } = useScrollHandler();
  const setActiveIndex = useState<number>(0)[1];
  const [scrollType, setScrollType] = useState<'up' | 'down' | null>(null);
  const [prevTop, setPrevTop] = useState<number>(0);
  const { setScrollingUp, setShowSearchPage } = useContext(GeneralContext);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [showPinnedVideos, setShowPinnedVideos] = useState<boolean>(false);

  const mainRef = useRef<HTMLDivElement>(null!);
  const timeout = useRef<number | NodeJS.Timeout>();
  const reelsRef = useRef<HTMLDivElement>(null!);
  const reelOptionsRef = useRef<HTMLDivElement>(null!);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target.querySelector('video') as HTMLVideoElement;
        if (entry.isIntersecting) {
          video.play();
          setActiveVideo(video);
        } else {
          video.pause();
          video.currentTime = 0;
        }
      });
    },
    { threshold: 0.7 }
  );

  useEffect(() => {
    document.title = 'Buzzer - Reels';

    if (contentRef.current) {
      contentRef.current.forEach((video) => observer.observe(video));
    }

    const resizeHandler = () => {
      if (reelsRef.current) {
        const smallDevice = window.matchMedia('(max-width: 600px)').matches;
        const smallDevice2 = window.matchMedia('(max-width: 500px)').matches;

        const offsetLeft = reelsRef.current.offsetLeft;

        const videoWidth =
          (reelsRef.current.children[0] as HTMLDivElement).querySelector(
            'video'
          )?.offsetWidth || 0;

        if (smallDevice)
          reelOptionsRef.current.style.left = `${
            offsetLeft + videoWidth - 43 - (smallDevice2 ? 16 : 0)
          }px`;
        else reelOptionsRef.current.style.left = 'auto';
      }
    };

    resizeHandler();

    window.addEventListener('resize', resizeHandler);

    return () => {
      setShowSearchPage(false);
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  const scrollHandler = (e: React.UIEvent<HTMLElement, UIEvent>) => {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      const scrollPosition = mainRef.current.scrollTop;

      setActiveIndex(Math.round(scrollPosition / window.innerHeight));
    }, 100);

    const target = e.target as HTMLDivElement;

    setScrollingUp(
      target.scrollTop - prevTop < 0
        ? true
        : target.scrollTop < 208
        ? null
        : false
    );
    setPrevTop(target.scrollTop);
  };

  const handleKeyPress =
    (type: 'up' | 'down') => (e: React.KeyboardEvent<HTMLElement>) => {
      const key = e.key.toLowerCase();

      if (type === 'down') {
        if (key === 'arrowup') {
          setScrollType('up');
        } else if (key === 'arrowdown') {
          setScrollType('down');
        }
      } else setScrollType(null);
    };

  return (
    <>
      <NavBar page="reels" />

      <section className={styles.main}>
        <section
          className={styles['main-container']}
          ref={mainRef}
          tabIndex={0}
          onScroll={scrollHandler}
          onKeyDown={handleKeyPress('down')}
          onKeyUp={handleKeyPress('up')}
        >
          <Header />

          <div className={styles['reels-container']}>
            <ContentContext.Provider
              value={{ contentRef, activeVideo, setActiveVideo }}
            >
              <div className={styles['content-container']} ref={reelsRef}>
                {dataList.map((data, index) => (
                  <ContentBox
                    key={index}
                    data={data}
                    contentType="reels"
                    setShowMobileMenu={setShowMobileMenu}
                  />
                ))}
              </div>
            </ContentContext.Provider>

            <div className={styles['medium-menu-container']}>
              <div className={styles['arrow-div2']}>
                <span
                  className={styles['arrow-box']}
                  onClick={() => {
                    mainRef.current.scrollTop -= mainRef.current.clientHeight;
                  }}
                >
                  <IoIosArrowUp
                    className={`${styles.arrow}  ${
                      scrollType === 'up' ? styles['active-arrow'] : ''
                    }`}
                  />
                </span>

                <span
                  className={styles['arrow-box']}
                  onClick={() => {
                    mainRef.current.scrollTop += mainRef.current.clientHeight;
                  }}
                >
                  <IoIosArrowDown
                    className={`${styles.arrow}  ${
                      scrollType === 'down' ? styles['active-arrow'] : ''
                    }`}
                  />
                </span>
              </div>

              <div className={styles['reel-options-box2']}>
                <span className={styles['reel-options-icon-box2']}>
                  <TbMenuDeep className={styles['reel-options-icon']} />
                </span>

                <ul className={styles['reel-options-list2']}>
                  <li className={styles['reel-options-item2']}>
                    Auto scroll
                    <input
                      type="checkbox"
                      className={styles['autoscroll-checkbox']}
                    />
                  </li>
                  <li className={styles['reel-options-item2']}>
                    Playback speed
                    <select className={styles['speed-select']}>
                      <option className={styles['speed-value']}>2x</option>
                      <option className={styles['speed-value']}>1.5x</option>
                      <option className={styles['speed-value']}>1x</option>
                      <option className={styles['speed-value']}>0.5x</option>
                    </select>
                  </li>
                  <li className={styles['reel-options-item2']}>
                    Picture-in-picture
                  </li>
                  <li
                    className={`${styles['reel-options-item']} ${styles['pinned-videos-item']}`}
                    onClick={() => setShowPinnedVideos(true)}
                  >
                    View pinned videos
                  </li>
                </ul>
              </div>
            </div>

            <div className={styles['reel-options-box']} ref={reelOptionsRef}>
              <span className={styles['reel-options-icon-box']}>
                <TbMenuDeep className={styles['reel-options-icon']} />
              </span>

              <ul className={styles['reel-options-list']}>
                <li className={styles['reel-options-item']}>
                  Auto scroll{' '}
                  <input
                    type="checkbox"
                    className={styles['autoscroll-checkbox']}
                  />
                </li>
                <li className={styles['reel-options-item']}>
                  Playback speed
                  <select className={styles['speed-select']}>
                    <option className={styles['speed-value']}>2x</option>
                    <option className={styles['speed-value']}>1.5x</option>
                    <option className={styles['speed-value']}>1x</option>
                    <option className={styles['speed-value']}>0.5x</option>
                  </select>
                </li>
                <li className={styles['reel-options-item']}>
                  Picture-in-picture
                </li>
                <li
                  className={`${styles['reel-options-item']} ${styles['pinned-videos-item']}`}
                  onClick={() => setShowPinnedVideos(true)}
                >
                  View pinned videos
                </li>
              </ul>
            </div>
          </div>

          <div className={styles['arrow-div']}>
            <span
              className={styles['arrow-box']}
              onClick={() => {
                mainRef.current.scrollTop -= mainRef.current.clientHeight;
              }}
            >
              <IoIosArrowUp
                className={`${styles.arrow}  ${
                  scrollType === 'up' ? styles['active-arrow'] : ''
                }`}
              />
            </span>

            <span
              className={styles['arrow-box']}
              onClick={() => {
                mainRef.current.scrollTop += mainRef.current.clientHeight;
              }}
            >
              <IoIosArrowDown
                className={`${styles.arrow}  ${
                  scrollType === 'down' ? styles['active-arrow'] : ''
                }`}
              />
            </span>
          </div>

          <Footer page={'reels'} />
        </section>

        <section className={styles.aside}>
          <AsideHeader activeVideo={activeVideo} />

          <div className={styles['pinned-videos-container']}>
            <span className={styles['pinned-videos-text']}>Pinned reels</span>

            <div className={styles['pinned-videos-div']}>
              <article className={styles['pinned-video-box']}>
                <video className={styles['pinned-video']}>
                  <source
                    src={`../../assets/images/content/content21.mp4`}
                    type="video/mp4"
                  />
                  Your browser does not support playing video.
                </video>

                <div className={styles['pinned-video-details']}>
                  <RiUnpinFill className={styles['unpin-icon']} title="Unpin" />

                  <div className={styles['pinned-video-data']}>
                    <span className={styles['profile-img-span']}>
                      <img
                        src={`../../assets/images/users/user8.jpeg`}
                        className={styles['profile-img2']}
                      />
                    </span>

                    <span className={styles['pinned-video-username']}>
                      Jon Snow🦅
                    </span>
                  </div>

                  <span className={styles['pinned-video-duration']}>02:30</span>
                </div>
              </article>

              <article className={styles['pinned-video-box']}>
                <video className={styles['pinned-video']}>
                  <source
                    src={`../../assets/images/content/content24.mp4`}
                    type="video/mp4"
                  />
                  Your browser does not support playing video.
                </video>

                <div className={styles['pinned-video-details']}>
                  <RiUnpinFill className={styles['unpin-icon']} title="Unpin" />

                  <div className={styles['pinned-video-data']}>
                    <span className={styles['profile-img-span']}>
                      <img
                        src={`../../assets/images/users/user8.jpeg`}
                        className={styles['profile-img2']}
                      />
                    </span>

                    <span className={styles['pinned-video-username']}>
                      aryastark
                    </span>
                  </div>

                  <span className={styles['pinned-video-duration']}>00:47</span>
                </div>
              </article>

              <article className={styles['pinned-video-box']}>
                <video className={styles['pinned-video']}>
                  <source
                    src={`../../assets/images/content/content25.mp4`}
                    type="video/mp4"
                  />
                  Your browser does not support playing video.
                </video>

                <div className={styles['pinned-video-details']}>
                  <RiUnpinFill className={styles['unpin-icon']} title="Unpin" />

                  <div className={styles['pinned-video-data']}>
                    <span className={styles['profile-img-span']}>
                      <img
                        src={`../../assets/images/users/user8.jpeg`}
                        className={styles['profile-img2']}
                      />
                    </span>

                    <span className={styles['pinned-video-username']}>
                      missandei
                    </span>
                  </div>

                  <span className={styles['pinned-video-duration']}>01:08</span>
                </div>
              </article>

              <article className={styles['pinned-video-box']}>
                <video className={styles['pinned-video']}>
                  <source
                    src={`../../assets/images/content/content27.mp4`}
                    type="video/mp4"
                  />
                  Your browser does not support playing video.
                </video>

                <div className={styles['pinned-video-details']}>
                  <RiUnpinFill className={styles['unpin-icon']} title="Unpin" />

                  <div className={styles['pinned-video-data']}>
                    <span className={styles['profile-img-span']}>
                      <img
                        src={`../../assets/images/users/user8.jpeg`}
                        className={styles['profile-img2']}
                      />
                    </span>

                    <span className={styles['pinned-video-username']}>
                      antonella_roccuzzo
                    </span>
                  </div>

                  <span className={styles['pinned-video-duration']}>12:35</span>
                </div>
              </article>

              <article className={styles['pinned-video-box']}>
                <video className={styles['pinned-video']}>
                  <source
                    src={`../../assets/images/content/content29.mp4`}
                    type="video/mp4"
                  />
                  Your browser does not support playing video.
                </video>

                <div className={styles['pinned-video-details']}>
                  <RiUnpinFill className={styles['unpin-icon']} title="Unpin" />

                  <div className={styles['pinned-video-data']}>
                    <span className={styles['profile-img-span']}>
                      <img
                        src={`../../assets/images/users/user8.jpeg`}
                        className={styles['profile-img2']}
                      />
                    </span>

                    <span className={styles['pinned-video-username']}>
                      antonella_roccuzzo
                    </span>
                  </div>

                  <span className={styles['pinned-video-duration']}>09:16</span>
                </div>
              </article>
            </div>
          </div>
        </section>
      </section>

      {showMobileMenu && (
        <MobileMenu
          showMobileMenu={showMobileMenu}
          setShowMobileMenu={setShowMobileMenu}
          reels
        />
      )}

      {showPinnedVideos && (
        <PinnedReels setShowPinnedVideos={setShowPinnedVideos} />
      )}
    </>
  );
};

export default Reels;
