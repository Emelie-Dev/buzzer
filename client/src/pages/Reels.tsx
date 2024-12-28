import NavBar from '../components/NavBar';
import styles from '../styles/Reels.module.css';
import { useEffect, useRef, useState } from 'react';
import { ContentContext } from '../Contexts';
import ContentBox from '../components/ContentBox';
import useScrollHandler from '../hooks/useScrollHandler';
import { DataItem } from './Following';
import { HiPlusSm } from 'react-icons/hi';
import { BiMessageDetail } from 'react-icons/bi';
import { TbMenuDeep } from 'react-icons/tb';
import { RiUnpinFill } from 'react-icons/ri';
import { IoIosArrowUp } from 'react-icons/io';
import { IoIosArrowDown } from 'react-icons/io';

const dataList: DataItem[] = [
  {
    media: 'content30',
    name: '',
    username: '',
    photo: 'profile1.jpeg',
    time: '',
    aspectRatio: 1,
    type: 'video',
    description: `When you're just trying to shower but your underwear decides to
                pull a "floor is lava" challenge 😩😂.#WhyMe`,
  },
  {
    media: 'content29',
    name: '',
    username: '',
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
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [scrollType, setScrollType] = useState<'up' | 'down' | null>(null);

  const mainRef = useRef<HTMLDivElement>(null!);
  const timeout = useRef<number>();

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
    if (contentRef.current) {
      contentRef.current.forEach((video) => observer.observe(video));
    }
  }, []);

  const scrollHandler = () => {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      const scrollPosition = mainRef.current.scrollTop;

      setActiveIndex(Math.round(scrollPosition / window.innerHeight));
    }, 100);
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

  console.log(activeIndex);

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
          <div className={styles['reels-container']}>
            <ContentContext.Provider
              value={{ contentRef, activeVideo, setActiveVideo }}
            >
              <div className={styles['content-container']}>
                {dataList.map((data, index) => (
                  <ContentBox key={index} data={data} contentType="reels" />
                ))}
              </div>
            </ContentContext.Provider>

            <div className={styles['reel-options-box']}>
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
        </section>

        <section className={styles.aside}>
          <header className={styles['aside-header']}>
            <button className={styles['create-btn']}>
              Create <HiPlusSm className={styles['create-icon']} />
            </button>

            <span className={styles['inbox-box']} title="Inbox">
              <BiMessageDetail className={styles['inbox-icon']} />
              <span className={styles['inbox-number']}>
                {' '}
                <span className={styles['inbox-length']}>9</span>
              </span>
            </span>

            <div className={styles['profile-box']}>
              <span className={styles['profile-img-box']}>
                {' '}
                <img
                  className={styles['profile-img']}
                  src="../../assets/images/users/user14.jpeg"
                />
              </span>

              <ul className={styles['view-list']}>
                <li className={styles['view-item']}>View profile</li>
                <li className={styles['view-item']}>View story</li>
                <li className={styles['view-item']}>Switch account</li>
              </ul>
            </div>
          </header>

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
    </>
  );
};

export default Reels;
