import NavBar from '../components/NavBar';
import styles from '../styles/Reels.module.css';
import { useEffect, useRef } from 'react';
import { ContentContext } from '../Contexts';
import ContentBox from '../components/ContentBox';
import useScrollHandler from '../hooks/useScrollHandler';
import { DataItem } from './Following';
import { HiPlusSm } from 'react-icons/hi';
import { BiMessageDetail } from 'react-icons/bi';
import { TbMenuDeep } from 'react-icons/tb';

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
                pull a "floor is lava" challenge 😩😂.#WhyMe #Relatable
                #FunnyMoments #TikTokHumor #BathroomStruggles #FYP #ForYou
                #DailyLife`,
  },
];

const Reels = () => {
  const { activeVideo, setActiveVideo, contentRef } = useScrollHandler();

  const mainRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    // scrollHandler();
  }, []);

  return (
    <>
      <NavBar page="reels" />

      <section className={styles.main}>
        <section className={styles['main-container']} ref={mainRef}>
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
        </section>
      </section>
    </>
  );
};

export default Reels;
