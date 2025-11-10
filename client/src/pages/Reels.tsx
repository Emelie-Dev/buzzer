import NavBar from '../components/NavBar';
import styles from '../styles/Reels.module.css';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { ContentContext, GeneralContext } from '../Contexts';
import ContentBox from '../components/ContentBox';
import useScrollHandler from '../hooks/useScrollHandler';
import { TbMenuDeep } from 'react-icons/tb';
import { RiUnpinFill } from 'react-icons/ri';
import { IoIosArrowUp } from 'react-icons/io';
import { IoIosArrowDown } from 'react-icons/io';
import AsideHeader from '../components/AsideHeader';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MobileMenu from '../components/MobileMenu';
import PinnedReels from '../components/PinnedReels';
import Skeleton from 'react-loading-skeleton';
import LoadingAnimation from '../components/LoadingAnimation';
import { apiClient, getTime, getUrl } from '../Utilities';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const Reels = () => {
  const {
    activeVideo,
    setActiveVideo,
    contentRef,
    posts: contents,
    setPosts: setContents,
    postData,
    getPosts,
    setPostData,
  } = useScrollHandler(false, 'v1/reels');

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [scrollType, setScrollType] = useState<'up' | 'down' | null>(null);
  const [prevTop, setPrevTop] = useState<number>(0);
  const { setScrollingUp, setShowSearchPage } = useContext(GeneralContext);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [showPinnedVideos, setShowPinnedVideos] = useState<boolean>(false);
  const [pinnedReels, setPinnedReels] = useState<any[] | 'error'>(null!);
  const [reelOptions, setReelOptions] = useState<{
    autoScroll: boolean;
    playBackSpeed: 0.5 | 1 | 1.5 | 2;
  }>({ autoScroll: false, playBackSpeed: 1 });

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

    const resizeHandler = () => {
      if (reelsRef.current && reelOptionsRef.current) {
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
    getPinnedReels();

    window.addEventListener('resize', resizeHandler);

    return () => {
      setShowSearchPage(false);
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.forEach((video) => observer.observe(video));
    }
  }, [contents]);

  useEffect(() => {
    if (activeVideo) {
      if (showPinnedVideos) activeVideo.pause();
      else activeVideo.play();
    }
  }, [showPinnedVideos]);

  const getPinnedReels = async () => {
    setPinnedReels(null!);
    try {
      const pinnedReels =
        window.localStorage.getItem('pinnedReels') || JSON.stringify([]);

      let reels: any[] = JSON.parse(pinnedReels);

      if (!(reels instanceof Array) || reels.length > 5) reels = [];

      if (reels.length > 0) {
        const { data } = await apiClient.post('v1/reels/pinned', {
          reels: reels.map((reel) => reel._id),
        });

        const reelsData: any[] = data.data.reels;

        const reelsObj = reelsData.map((data) => {
          const match = reels.find((obj) => obj._id === data._id);
          if (match) data.time = match.time;
          return data;
        });

        setPinnedReels(reelsObj);
      } else {
        setPinnedReels([]);
      }
    } catch {
      setPinnedReels('error');
      toast.error('Could not load pinned reels.');
    }
  };

  const scrollHandler = (e: React.UIEvent<HTMLElement, UIEvent>) => {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      const scrollPosition = mainRef.current.scrollTop;
      setActiveIndex(Math.round(scrollPosition / window.innerHeight));
    }, 100);

    const target = e.target as HTMLDivElement;

    if (target) {
      const isBottom =
        target.scrollTop + target.clientHeight >= target.scrollHeight - 200;

      if (isBottom && !postData.end) {
        setPostData((prev) => ({ ...prev, loading: true }));
        getPosts();
      }
    }

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

  const unPinReel = async (
    e: React.MouseEvent<SVGElement, MouseEvent>,
    id: string
  ) => {
    e.preventDefault();

    const storedReels =
      window.localStorage.getItem('pinnedReels') || JSON.stringify([]);

    let reels;
    try {
      reels = JSON.parse(storedReels);
    } catch {
      reels = [];
    }

    if (!(reels instanceof Array)) reels = [];

    if (reels.length > 0) reels = reels.filter((obj) => obj._id !== id);

    setPinnedReels((prev) => (prev as any[]).filter((obj) => obj._id !== id));

    localStorage.setItem('pinnedReels', JSON.stringify(reels));

    toast.success('Video removed from pinned reels.');
  };

  const requestPictureMode = async () => {
    if (activeVideo) {
      try {
        await activeVideo.requestPictureInPicture();
      } catch {
        toast.error('Picture-in-Picture request failed.');
      }
    }
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
              value={{
                contentRef,
                activeVideo,
                setActiveVideo,
                reelOptions,
                mainRef,
              }}
            >
              <div className={styles['content-container']} ref={reelsRef}>
                {contents === null ? (
                  <div className={styles['reel-skeleton-container']}>
                    {Array.from({ length: 2 }).map((_, index) => (
                      <div key={index} className={styles['reel-skeleton-box']}>
                        <Skeleton className={styles['reel-skeleton-item']} />

                        <div className={styles['engagement-content-skeleton']}>
                          <Skeleton circle width={50} height={50} />
                          <br />
                          <span className={styles['engagement-skeleton-box']}>
                            <Skeleton circle width={40} height={40} />
                            <Skeleton width={30} height={12} />
                          </span>
                          <span className={styles['engagement-skeleton-box']}>
                            <Skeleton circle width={40} height={40} />
                            <Skeleton width={30} height={12} />
                          </span>
                          <span className={styles['engagement-skeleton-box']}>
                            <Skeleton circle width={40} height={40} />
                            <Skeleton width={30} height={12} />
                          </span>
                          <span className={styles['engagement-skeleton-box']}>
                            <Skeleton circle width={40} height={40} />
                            <Skeleton width={30} height={12} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : contents.length === 0 ? (
                  <div className={styles['no-data-text']}>
                    <br /> <br />
                    Something went wrong while loading reels. Please refresh the
                    page or check your connection.
                  </div>
                ) : (
                  contents.map((data) => (
                    <ContentBox
                      key={data._id}
                      data={data}
                      contentType="reels"
                      setContents={setContents}
                      setShowMobileMenu={setShowMobileMenu}
                      pinnedReels={pinnedReels}
                      setPinnedReels={setPinnedReels}
                    />
                  ))
                )}

                {postData.loading && (
                  <div className={styles['animation-box']}>
                    <LoadingAnimation
                      style={{
                        width: '3rem',
                        height: '3rem',
                        transform: 'scale(2.5)',
                      }}
                    />
                  </div>
                )}
              </div>
            </ContentContext.Provider>

            {contents !== null && contents.length > 0 && (
              <>
                <div className={styles['medium-menu-container']}>
                  <div className={styles['arrow-div2']}>
                    {activeIndex > 0 && (
                      <span
                        className={styles['arrow-box']}
                        onClick={() => {
                          mainRef.current.scrollTop -=
                            mainRef.current.clientHeight;
                        }}
                      >
                        <IoIosArrowUp
                          className={`${styles.arrow}  ${
                            scrollType === 'up' ? styles['active-arrow'] : ''
                          }`}
                        />
                      </span>
                    )}

                    {activeIndex !== contents.length - 1 && (
                      <span
                        className={styles['arrow-box']}
                        onClick={() => {
                          mainRef.current.scrollTop +=
                            mainRef.current.clientHeight;
                        }}
                      >
                        <IoIosArrowDown
                          className={`${styles.arrow}  ${
                            scrollType === 'down' ? styles['active-arrow'] : ''
                          }`}
                        />
                      </span>
                    )}
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
                          checked={reelOptions.autoScroll}
                          onChange={(e) =>
                            setReelOptions((prev) => ({
                              ...prev,
                              autoScroll: e.target.checked,
                            }))
                          }
                        />
                      </li>
                      <li className={styles['reel-options-item2']}>
                        Playback speed
                        <select
                          className={styles['speed-select']}
                          value={reelOptions.playBackSpeed}
                          onChange={(e) =>
                            setReelOptions((prev) => ({
                              ...prev,
                              playBackSpeed: Number(e.target.value) as
                                | 1
                                | 2
                                | 1.5
                                | 0.5,
                            }))
                          }
                        >
                          <option className={styles['speed-value']} value={2}>
                            2x
                          </option>
                          <option className={styles['speed-value']} value={1.5}>
                            1.5x
                          </option>
                          <option className={styles['speed-value']} value={1}>
                            1x
                          </option>
                          <option className={styles['speed-value']} value={0.5}>
                            0.5x
                          </option>
                        </select>
                      </li>
                      <li
                        className={styles['reel-options-item2']}
                        onClick={requestPictureMode}
                      >
                        Picture-in-picture
                      </li>
                      <li
                        className={`${styles['reel-options-item']} ${styles['pinned-videos-item']}`}
                        onClick={() => setShowPinnedVideos(true)}
                      >
                        View pinned reels
                      </li>
                    </ul>
                  </div>
                </div>

                <div
                  className={styles['reel-options-box']}
                  ref={reelOptionsRef}
                >
                  <span className={styles['reel-options-icon-box']}>
                    <TbMenuDeep className={styles['reel-options-icon']} />
                  </span>

                  <ul className={styles['reel-options-list']}>
                    <li className={styles['reel-options-item']}>
                      Auto scroll{' '}
                      <input
                        type="checkbox"
                        className={styles['autoscroll-checkbox']}
                        checked={reelOptions.autoScroll}
                        onChange={(e) =>
                          setReelOptions((prev) => ({
                            ...prev,
                            autoScroll: e.target.checked,
                          }))
                        }
                      />
                    </li>
                    <li className={styles['reel-options-item']}>
                      Playback speed
                      <select
                        className={styles['speed-select']}
                        value={reelOptions.playBackSpeed}
                        onChange={(e) =>
                          setReelOptions((prev) => ({
                            ...prev,
                            playBackSpeed: Number(e.target.value) as
                              | 1
                              | 2
                              | 1.5
                              | 0.5,
                          }))
                        }
                      >
                        <option className={styles['speed-value']} value={2}>
                          2x
                        </option>
                        <option className={styles['speed-value']} value={1.5}>
                          1.5x
                        </option>
                        <option className={styles['speed-value']} value={1}>
                          1x
                        </option>
                        <option className={styles['speed-value']} value={0.5}>
                          0.5x
                        </option>
                      </select>
                    </li>
                    <li
                      className={styles['reel-options-item']}
                      onClick={requestPictureMode}
                    >
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
              </>
            )}
          </div>

          {contents !== null && contents.length > 0 && (
            <div className={styles['arrow-div']}>
              {activeIndex > 0 && (
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
              )}

              {activeIndex !== contents.length - 1 && (
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
              )}
            </div>
          )}

          <Footer page={'reels'} />
        </section>

        <section className={styles.aside}>
          <AsideHeader activeVideo={activeVideo} />

          <div className={styles['pinned-videos-container']}>
            <span className={styles['pinned-videos-text']}>Pinned reels</span>

            <div className={styles['pinned-videos-div']}>
              {pinnedReels === null ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton
                    key={index}
                    className={styles['pinned-reels-skeleton']}
                  />
                ))
              ) : pinnedReels === 'error' ? (
                <div className={styles['error-div']}>
                  <span>Could not load pinned reels.</span>
                  <button
                    className={styles['error-btn']}
                    onClick={getPinnedReels}
                  >
                    Try Again
                  </button>
                </div>
              ) : pinnedReels.length === 0 ? (
                <div className={styles['error-div']}>
                  <span>You don't have any pinned reels.</span>
                </div>
              ) : (
                pinnedReels.map((reel, index) => (
                  <article key={index} className={styles['pinned-video-box']}>
                    <Link to={'/'}>
                      <video className={styles['pinned-video']}>
                        <source
                          src={getUrl(reel.src, 'reels')}
                          type="video/mp4"
                        />
                        Your browser does not support playing video.
                      </video>

                      <div className={styles['pinned-video-details']}>
                        <RiUnpinFill
                          className={styles['unpin-icon']}
                          title="Unpin"
                          onClick={(e) => unPinReel(e, reel._id)}
                        />

                        <div className={styles['pinned-video-data']}>
                          <span
                            className={`${styles['profile-img-span']} ${
                              reel.hasStory && reel.hasUnviewedStory
                                ? styles['profile-img-span3']
                                : reel.hasStory
                                ? styles['profile-img-span2']
                                : ''
                            }`}
                          >
                            <img
                              className={`${styles['profile-img2']} ${
                                !reel.hasStory ? styles['no-story-img'] : ''
                              }`}
                              src={getUrl(reel.photo, 'users')}
                            />
                          </span>

                          <span className={styles['pinned-video-username']}>
                            {reel.username}
                          </span>
                        </div>

                        <span className={styles['pinned-video-duration']}>
                          {getTime(reel.time)}
                        </span>
                      </div>
                    </Link>
                  </article>
                ))
              )}
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
        <PinnedReels
          pinnedReels={pinnedReels}
          getPinnedReels={getPinnedReels}
          unPinReel={unPinReel}
          setShowPinnedVideos={setShowPinnedVideos}
        />
      )}
    </>
  );
};

// const MemoizedTime = React.memo(({ time }: { time: string }) => {
//   return (
//     <span className={styles['pinned-video-duration']}>{getTime(time)}</span>
//   );
// });

export default Reels;
