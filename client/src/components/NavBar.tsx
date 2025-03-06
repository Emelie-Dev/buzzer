import styles from '../styles/NavBar.module.css';
import { FaUserCheck } from 'react-icons/fa';
import { LuUserCheck } from 'react-icons/lu';
import {
  IoPeopleOutline,
  IoNotifications,
  IoPeopleSharp,
  IoSettingsOutline,
  IoClose,
  IoSearchSharp,
  IoArrowBack,
} from 'react-icons/io5';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { BiMenuAltLeft } from 'react-icons/bi';
import { MdOutlineHistory, MdOutlineLightMode } from 'react-icons/md';
import { FiLogOut } from 'react-icons/fi';
import { useContext, useEffect, useRef, useState } from 'react';
import { AiFillClockCircle } from 'react-icons/ai';
import { HiTrendingUp } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { BiMessageDetail } from 'react-icons/bi';
import { FaRegSquarePlus } from 'react-icons/fa6';
import { BsPlusSquareFill } from 'react-icons/bs';
import { IoNotificationsOutline } from 'react-icons/io5';
import { FaCircleUser } from 'react-icons/fa6';
import { FaRegCircleUser } from 'react-icons/fa6';
import { TbBrandGoogleAnalytics } from 'react-icons/tb';
import { GeneralContext } from '../Contexts';

type NavBarProps = {
  page: string;
  editStage?: boolean;
  overlaySearch?: boolean;
  setOverlaySearch?: React.Dispatch<React.SetStateAction<boolean>>;
};

const mediumSize = window.matchMedia('(max-width: 900px)').matches;

const NavBar = ({
  page,
  editStage,
  overlaySearch,
  setOverlaySearch,
}: NavBarProps) => {
  const [isMediumSize, setIsMediumSize] = useState<boolean>(mediumSize);

  const pageType =
    ['inbox', editStage ? 'create' : ''].includes(page) || isMediumSize
      ? 'small'
      : 'wide';

  const [showMore, setShowMore] = useState<boolean>(false);
  const [showMore2, setShowMore2] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [moreTrends, setMoreTrends] = useState<boolean>(false);
  const [mediaQueries, setMediaQueries] = useState<{
    first: boolean;
    second: boolean;
  }>({
    first: false,
    second: false,
  });

  const { showSearchPage, setShowSearchPage } = useContext(GeneralContext);

  const navigate = useNavigate();

  const boxRef = useRef<HTMLDivElement>(null!);
  const boxRef2 = useRef<HTMLDivElement>(null!);
  const searchSectionRef = useRef<HTMLDivElement>(null!);
  const searchRef = useRef<HTMLLIElement>(null!);
  const navRef = useRef<HTMLDivElement>(null!);
  const searchInputRef = useRef<HTMLInputElement>(null!);
  const searchContainerRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const resizeHandler = () => {
      const mediumSize = window.matchMedia('(max-width: 900px)').matches;
      setIsMediumSize(mediumSize);

      const firstSize =
        page === 'home' ||
        page === 'following' ||
        page === 'friends' ||
        page === 'reels'
          ? window.matchMedia('(max-width: 1200px)').matches
          : page === 'search'
          ? window.matchMedia('(max-width: 1100px)').matches
          : false;
      const secondSize = window.matchMedia('(max-width: 600px)').matches;

      setMediaQueries({
        ...mediaQueries,
        first: firstSize,
        second: secondSize,
      });
    };

    resizeHandler();

    window.addEventListener('resize', resizeHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  useEffect(() => {
    const clickHandler = (e: Event) => {
      if (e.target) {
        if (showMore && !boxRef.current.contains(e.target as Node)) {
          setShowMore(false);
        }
      }
    };

    window.addEventListener('click', clickHandler);

    return () => {
      window.removeEventListener('click', clickHandler);
    };
  }, [showMore]);

  useEffect(() => {
    const clickHandler = (e: Event) => {
      if (e.target) {
        if (showMore2 && !boxRef2.current.contains(e.target as Node)) {
          setShowMore2(false);
        }
      }
    };

    window.addEventListener('click', clickHandler);

    return () => {
      window.removeEventListener('click', clickHandler);
    };
  }, [showMore2]);

  useEffect(() => {
    const clickHandler = (e: Event) => {
      if (e.target) {
        if (
          showSearch &&
          e.target !== searchRef.current &&
          !searchSectionRef.current.contains(e.target as Node)
        ) {
          const animation = searchContainerRef.current.animate(
            {
              width: ['31vw', '0'],
              opacity: [1, 0],
            },
            {
              fill: 'both',
              duration: 300,
            }
          );

          animation.onfinish = () => {
            setShowSearch(false);
            setSearchText('');
            setShowSearchPage(false);
          };
        }
      }
    };

    window.addEventListener('click', clickHandler);

    return () => {
      window.removeEventListener('click', clickHandler);
    };
  }, [showSearch]);

  useEffect(() => {
    if (setOverlaySearch) setShowSearchPage(overlaySearch as boolean);
  }, [overlaySearch]);

  return (
    <>
      {pageType === 'wide' && (
        <section className={styles['nav-section']}>
          <nav
            className={`${styles.nav} ${showSearch ? styles['hide-nav'] : ''}`}
            ref={navRef}
          >
            <h1 className={styles.head}>
              <img
                src="../../assets/logo.png"
                alt="Buzzer Logo"
                className={styles.logo}
              />{' '}
              <span className={styles['logo-text']}>Buzzer</span>
            </h1>

            <ul className={styles['nav-list']}>
              <li
                className={`${styles['nav-item']} ${
                  page === 'home' ? styles['active-nav-item'] : ''
                }`}
                onClick={() => navigate('/home')}
              >
                {page === 'home' ? (
                  <svg
                    className={`${styles['nav-icon']} ${styles['active-nav-icon']}`}
                    x="0px"
                    y="0px"
                    width="100"
                    height="100"
                    viewBox="0 0 24 24"
                  >
                    <path d="M 12 2.0996094 L 1 12 L 4 12 L 4 21 L 10 21 L 10 14 L 14 14 L 14 21 L 20 21 L 20 12 L 23 12 L 12 2.0996094 z"></path>
                  </svg>
                ) : (
                  <svg
                    className={styles['nav-icon']}
                    x="0px"
                    y="0px"
                    width="100"
                    height="100"
                    viewBox="0 0 24 24"
                  >
                    <path d="M 12 2.0996094 L 1 12 L 4 12 L 4 21 L 11 21 L 11 15 L 13 15 L 13 21 L 20 21 L 20 12 L 23 12 L 12 2.0996094 z M 12 4.7910156 L 18 10.191406 L 18 11 L 18 19 L 15 19 L 15 13 L 9 13 L 9 19 L 6 19 L 6 10.191406 L 12 4.7910156 z"></path>
                  </svg>
                )}
                Home
              </li>

              <li
                className={`${styles['nav-item']} ${
                  page === 'search' ? styles['active-nav-item'] : ''
                }`}
                ref={searchRef}
                onClick={() => setShowSearch(true)}
              >
                {page === 'search' ? (
                  <svg
                    className={`${styles['nav-icon']} ${styles['active-nav-icon']}`}
                    x="0px"
                    y="0px"
                    width="100"
                    height="100"
                    viewBox="0 0 50 50"
                  >
                    <path d="M 21 3 C 11.601563 3 4 10.601563 4 20 C 4 29.398438 11.601563 37 21 37 C 24.355469 37 27.460938 36.015625 30.09375 34.34375 L 42.375 46.625 L 46.625 42.375 L 34.5 30.28125 C 36.679688 27.421875 38 23.878906 38 20 C 38 10.601563 30.398438 3 21 3 Z M 21 7 C 28.199219 7 34 12.800781 34 20 C 34 27.199219 28.199219 33 21 33 C 13.800781 33 8 27.199219 8 20 C 8 12.800781 13.800781 7 21 7 Z"></path>
                  </svg>
                ) : (
                  <svg
                    className={`${styles['nav-icon']}`}
                    x="0px"
                    y="0px"
                    width="100"
                    height="100"
                    viewBox="0 0 30 30"
                  >
                    <path d="M 13 3 C 7.4889971 3 3 7.4889971 3 13 C 3 18.511003 7.4889971 23 13 23 C 15.396508 23 17.597385 22.148986 19.322266 20.736328 L 25.292969 26.707031 A 1.0001 1.0001 0 1 0 26.707031 25.292969 L 20.736328 19.322266 C 22.148986 17.597385 23 15.396508 23 13 C 23 7.4889971 18.511003 3 13 3 z M 13 5 C 17.430123 5 21 8.5698774 21 13 C 21 17.430123 17.430123 21 13 21 C 8.5698774 21 5 17.430123 5 13 C 5 8.5698774 8.5698774 5 13 5 z"></path>
                  </svg>
                )}
                Search
              </li>

              <li
                className={`${styles['nav-item']} ${
                  page === 'following' ? styles['active-nav-item'] : ''
                }`}
                onClick={() => navigate('/following')}
              >
                {page === 'following' ? (
                  <FaUserCheck
                    className={`${styles['nav-icon']} ${styles['active-nav-icon']}`}
                  />
                ) : (
                  <LuUserCheck className={styles['nav-icon2']} />
                )}
                Following
              </li>

              <li
                className={`${styles['nav-item']} ${
                  page === 'friends' ? styles['active-nav-item'] : ''
                }`}
                onClick={() => navigate('/friends')}
              >
                {page === 'friends' ? (
                  <IoPeopleSharp
                    className={`${styles['nav-icon']} ${styles['active-nav-icon']}`}
                  />
                ) : (
                  <IoPeopleOutline className={styles['nav-icon']} />
                )}{' '}
                Friends
              </li>

              <li
                className={`${styles['nav-item']} ${
                  page === 'reels' ? styles['active-nav-item'] : ''
                }`}
                onClick={() => navigate('/reels')}
              >
                {page === 'reels' ? (
                  <svg
                    className={`${styles['nav-icon']} ${styles['active-nav-icon']}`}
                    x="0px"
                    y="0px"
                    width="100"
                    height="100"
                    viewBox="0 0 48 48"
                  >
                    <path
                      className={styles['active-nav-icon']}
                      d="M41.28,12.28c-0.4-0.43-4.476-0.606-5.28-1.28c-1.14-0.955-0.622-3.939-1.83-4.76	C37.42,6.96,40.07,9.25,41.28,12.28z"
                    ></path>
                    <path
                      className={styles['active-nav-icon']}
                      d="M41.28,15.64L42,17v1.26c-1.26-1.71-10.459-9.858-14.289-11.668L29.7,6H32	c0.75,0,1.47,0.08,2.17,0.24c2.06,1.4,4.03,2.99,5.88,4.79c0.42,0.41,0.83,0.82,1.23,1.25c0.225,0.55,0.399,1.126,0.52,1.72	C41.8,14,41.28,14.957,41.28,15.64z"
                    ></path>
                    <path
                      className={styles['active-nav-icon']}
                      d="M42,18.26v6.1C40.351,21.326,24.095,7.862,16.802,6.109c-0.183-0.044-0.285,0.03-0.456,0.001L16.7,6	h9.52l1.037,0.509c1.298,0.613,2.441,0.792,3.678,1.555c2.413,1.489,4.7,3.263,6.815,5.326C39.32,14.92,40.74,16.55,42,18.26z"
                    ></path>
                    <path
                      className={styles['active-nav-icon']}
                      d="M42,24.36c0,0-0.02,8.69-0.05,8.64C40.46,27.51,9.3,8.79,9.06,8.81	c1.204-1.164,2.695-2.029,4.359-2.473C13.419,6.337,15.107,7,16,7c0,0,0.589-0.945,0.749-0.916	c6.827,1.245,13.366,4.457,18.711,9.656C38.13,18.34,40.31,21.25,42,24.36z"
                    ></path>
                    <path
                      className={styles['active-nav-icon']}
                      d="M41.95,33c-0.2,2.06-1.03,3.93-2.3,5.43c-0.72-6.59-31.9-26.28-32.93-26.16	c0.53-1.32,1.33-2.5,2.34-3.46C9.3,8.79,9.54,8.78,9.78,8.78c8.41-0.11,16.87,2.98,23.38,9.32C37.53,22.35,40.46,27.51,41.95,33z"
                    ></path>
                    <path
                      className={styles['active-nav-icon']}
                      d="M39.65,38.43v0.01c-0.87,1.03-1.93,1.87-3.14,2.48c-0.17-6.6-27.828-25.531-29.107-25.321	C7.417,15.019,6.089,14.552,6.2,14c0.121-0.599,0.296-1.178,0.52-1.73c1.03-0.12,2.06-0.19,3.1-0.2c7.58-0.1,15.19,2.68,21.05,8.39	C36,25.45,38.93,31.84,39.65,38.43z"
                    ></path>
                    <path
                      className={styles['active-nav-icon']}
                      d="M33.24,41.92c0,0-25.95-23.12-27.24-22.88V17l0.876-1.319c1.28-0.21,1.704-0.301,2.994-0.321	c6.73-0.09,13.5,2.39,18.7,7.45c5.11,4.97,7.77,11.51,7.94,18.11C35.51,41.43,34.41,41.78,33.24,41.92z"
                    ></path>
                    <path
                      className={styles['active-nav-icon']}
                      d="M33.24,41.36v0.56C32.84,41.97,32.42,42,32,42h-2.06C29.95,41.8,7.3,22.11,6,22.39v-3.35	c1.29-0.24,2.6-0.37,3.91-0.39c5.89-0.08,11.81,2.09,16.37,6.52C30.84,29.61,33.16,35.47,33.24,41.36z"
                    ></path>
                    <path
                      className={styles['active-nav-icon']}
                      d="M29.95,41.4c0,0.2,0,0.4-0.01,0.6h-3.29c0.01-0.19-1.283-0.646-1.283-0.826	C25.317,36.964,11.4,24.34,6,25.77v-3.38c1.3-0.28,2.63-0.43,3.95-0.45c5.05-0.07,10.13,1.79,14.04,5.59	C27.89,31.33,29.89,36.35,29.95,41.4z"
                    ></path>
                    <path
                      className={styles['active-nav-icon']}
                      d="M26.66,41.45c0,0.18,0,0.36-0.01,0.55h-3.28c0.01-0.17-1.156-0.982-1.156-1.152	C22.164,37.488,10.53,27.68,6,29.2v-3.43c5.4-1.43,11.39-0.07,15.69,4.11C24.95,33.05,26.61,37.24,26.66,41.45z"
                    ></path>
                    <path
                      className={styles['active-nav-icon']}
                      d="M23.38,41.49c0,0.17,0,0.34-0.01,0.51h-3.29c0.09-2.68-10.44-10.96-14.05-9.26	C6.02,32.74,6,29.2,6,29.2c4.53-1.52,9.74-0.53,13.4,3.04C22,34.78,23.33,38.13,23.38,41.49z"
                    ></path>
                    <path
                      className={styles['active-nav-icon']}
                      d="M16.78,42c0.1-1.82-7.44-7.47-9.93-5.97c-0.45-1.02-0.74-2.12-0.82-3.29	c3.61-1.7,8.05-1.09,11.07,1.86c2.08,2.02,3.07,4.72,2.98,7.4H16.78z"
                    ></path>
                    <path
                      className={styles['active-nav-icon']}
                      d="M16.78,42H16c-0.86,0-1.69-0.11-2.49-0.32c0-0.86-3.62-3.57-4.85-2.9c-0.75-0.8-1.36-1.73-1.81-2.75	c2.49-1.5,5.78-1.2,7.96,0.93C16.22,38.33,16.88,40.18,16.78,42z"
                    ></path>
                    <path
                      className={styles['active-nav-icon']}
                      d="M13.51,41.68c-1.89-0.48-3.57-1.5-4.85-2.9c1.23-0.67,2.8-0.49,3.85,0.53	C13.18,39.96,13.51,40.82,13.51,41.68z"
                    ></path>
                    <path
                      fill="#fff"
                      d="M42,16v1H6v-1c0-0.69,0.07-1.36,0.2-2h11.69l-4.47-7.66C14.24,6.12,15.11,6,16,6h0.7l4.66,8h9.53	l-4.67-8h3.48l4.66,8h7.44C41.93,14.64,42,15.31,42,16z"
                    ></path>
                    <path
                      fill="#fff"
                      d="M18,33.114v-9.228c0-1.539,1.666-2.502,2.999-1.732l7.998,4.614c1.334,0.77,1.334,2.695,0,3.465	l-7.998,4.614C19.666,35.616,18,34.653,18,33.114z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className={styles['nav-icon']}
                    version="1.1"
                    viewBox="0 0 100 100"
                  >
                    <defs></defs>
                    <g
                      style={{
                        stroke: 'none',
                        strokeWidth: 0,
                        strokeDasharray: 'none',
                        strokeLinecap: 'butt',
                        strokeLinejoin: 'miter',
                        strokeMiterlimit: 10,
                        fill: 'none',
                        fillRule: 'nonzero',
                        opacity: 1,
                        transform:
                          'translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)}',
                      }}
                    >
                      <linearGradient
                        id="SVGID_44"
                        gradientUnits="userSpaceOnUse"
                        x1="20.9489"
                        y1="70.2584"
                        x2="72.2486"
                        y2="16.3831"
                      >
                        <stop offset="0%" className={styles.stopTag} />
                        <stop offset="50%" className={styles.stopTag} />
                        <stop offset="100%" className={styles.stopTag} />
                      </linearGradient>
                      <path
                        d="M 61.692 0.878 H 28.307 C 12.699 0.878 0 13.577 0 29.186 v 31.629 c 0 15.608 12.699 28.307 28.307 28.307 h 33.385 C 77.301 89.121 90 76.423 90 60.814 V 29.186 C 90 13.577 77.301 0.878 61.692 0.878 z M 81.6 25.186 H 67.854 L 58.78 8.878 h 2.912 C 71.52 8.878 79.737 15.898 81.6 25.186 z M 39.888 25.186 L 30.815 8.878 h 18.811 l 9.073 16.307 H 39.888 z M 22.186 9.825 l 8.546 15.36 H 8.4 C 9.859 17.913 15.213 12.035 22.186 9.825 z M 61.692 81.121 H 28.307 C 17.11 81.121 8 72.012 8 60.814 V 33.186 h 74 v 27.629 C 82 72.012 72.89 81.121 61.692 81.121 z"
                        style={{
                          stroke: 'none',
                          strokeWidth: 1,
                          strokeDasharray: 'none',
                          strokeLinecap: 'butt',
                          strokeLinejoin: 'miter',
                          strokeMiterlimit: 10,
                          fill: 'url(#SVGID_44)',
                          fillRule: 'nonzero',
                          opacity: 1,
                          transform: ' matrix(1 0 0 1 0 0) ',
                        }}
                        strokeLinecap="round"
                      />
                      <linearGradient
                        id="SVGID_45"
                        gradientUnits="userSpaceOnUse"
                        x1="24.1901"
                        y1="73.3447"
                        x2="75.4898"
                        y2="19.4693"
                      >
                        <stop offset="0%" className={styles.stopTag} />
                        <stop offset="50%" className={styles.stopTag} />
                        <stop offset="100%" className={styles.stopTag} />
                      </linearGradient>
                      <path
                        d="M 56.367 51.97 l -17.41 -9.305 c -2.366 -1.265 -5.227 0.45 -5.227 3.133 v 18.611 c 0 2.683 2.861 4.398 5.227 3.133 l 17.41 -9.305 C 58.871 56.898 58.871 53.309 56.367 51.97 z"
                        style={{
                          stroke: 'none',
                          strokeWidth: 1,
                          strokeDasharray: 'none',
                          strokeLinecap: 'butt',
                          strokeLinejoin: 'miter',
                          strokeMiterlimit: 10,
                          fill: 'url(#SVGID_44)',
                          fillRule: 'nonzero',
                          opacity: 1,
                          transform: ' matrix(1 0 0 1 0 0) ',
                        }}
                        strokeLinecap="round"
                      />
                    </g>
                  </svg>
                )}
                Reels
              </li>

              <li
                className={`${styles['nav-item']} ${
                  page === 'notifications' ? styles['active-nav-item'] : ''
                }`}
                onClick={() => navigate('/notifications')}
              >
                {page === 'notifications' ? (
                  <IoNotifications
                    className={`${styles['nav-icon']} ${styles['active-nav-icon']}`}
                  />
                ) : (
                  <IoNotificationsOutline className={styles['nav-icon']} />
                )}
                Notifications
              </li>

              {page === 'create' && (
                <li
                  className={`${styles['nav-item']} ${styles['active-nav-item']}`}
                  onClick={() => navigate('/create')}
                >
                  <BsPlusSquareFill
                    className={`${styles['nav-icon']} ${styles['active-nav-icon']}`}
                  />
                  Create
                </li>
              )}

              {page === 'analytics' && (
                <li
                  className={`${styles['nav-item']} ${styles['active-nav-item']}`}
                  onClick={() => navigate('/analytics')}
                >
                  <TbBrandGoogleAnalytics
                    className={`${styles['nav-icon']} ${styles['active-nav-icon']}`}
                  />
                  Analytics
                </li>
              )}

              {page === 'history' && (
                <li
                  className={`${styles['nav-item']} ${styles['active-nav-item']}`}
                  onClick={() => navigate('/analytics')}
                >
                  <MdOutlineHistory
                    className={`${styles['nav-icon']} ${styles['active-nav-icon']}`}
                  />
                  History
                </li>
              )}

              {(page === 'profile' ||
                page === 'settings' ||
                mediaQueries.first) && (
                <>
                  <li
                    className={`${styles['nav-item']}`}
                    onClick={() => navigate('/create')}
                  >
                    <FaRegSquarePlus className={`${styles['nav-icon']}`} />
                    Create
                  </li>

                  <li
                    className={`${styles['nav-item']}`}
                    onClick={() => navigate('/inbox')}
                  >
                    <BiMessageDetail className={`${styles['nav-icon']}`} />
                    Inbox
                  </li>

                  <li
                    className={`${styles['nav-item']} ${
                      page === 'profile' ? styles['active-nav-item'] : ''
                    }`}
                    onClick={() => navigate('/profile')}
                  >
                    {page === 'profile' ? (
                      <FaCircleUser
                        className={`${styles['nav-icon']} ${styles['active-nav-icon']}`}
                      />
                    ) : (
                      <FaRegCircleUser className={styles['nav-icon']} />
                    )}
                    Profile
                  </li>
                </>
              )}
            </ul>

            <div className={styles['more-div']} ref={boxRef}>
              {showMore && (
                <ul className={styles['more-list']}>
                  <li
                    className={styles['more-item']}
                    onClick={() => navigate('/settings')}
                  >
                    <IoSettingsOutline className={styles['more-item-icon']} />
                    Settings
                  </li>
                  <li
                    className={styles['more-item']}
                    onClick={() => navigate('/analytics')}
                  >
                    <TbBrandGoogleAnalytics
                      className={styles['more-item-icon']}
                    />
                    Analytics
                  </li>
                  <li
                    className={styles['more-item']}
                    onClick={() => navigate('/history')}
                  >
                    <MdOutlineHistory className={styles['more-item-icon']} />
                    History
                  </li>
                  <li
                    className={`${styles['more-item']} ${styles['apperance-item']}`}
                  >
                    <MdOutlineLightMode className={styles['more-item-icon']} />{' '}
                    Change appearance
                    <select className={styles['appearance-select']}>
                      <option>Light</option>
                      <option>Dark</option>
                      <option>Device default</option>
                    </select>
                  </li>
                  <hr className={styles['logout-line']} />
                  <li className={styles['more-item']}>
                    <FiLogOut className={styles['more-item-icon']} />
                    Log out
                  </li>
                </ul>
              )}

              <span
                className={`${styles['more-icon-box']} ${
                  showMore ? styles['active-menu'] : ''
                }`}
                onClick={() => setShowMore(!showMore)}
              >
                <BiMenuAltLeft
                  className={`${styles['more-icon']}  ${
                    showMore ? styles['active-icon'] : ''
                  }`}
                />
                More
              </span>
            </div>
          </nav>
        </section>
      )}

      {(pageType === 'small' || showSearch) && (
        <section
          className={`${styles['search-section']} ${
            showSearchPage ? styles['show-search-page'] : ''
          }`}
          ref={searchSectionRef}
        >
          {(!showSearchPage || !mediaQueries.second) && (
            <div className={styles['icons-container']}>
              <span
                className={`${styles['app-section-box']} ${
                  pageType === 'wide' ? styles['app-section-box2'] : ''
                }`}
              >
                {' '}
                <img
                  src="../../assets/logo.png"
                  alt="Buzzer Logo"
                  className={styles['app-logo']}
                />
              </span>

              <span
                className={`${styles['search-section-box']} ${
                  page === 'home' && !showSearch
                    ? styles['active-search-box']
                    : ''
                }`}
                onClick={() => navigate('/home')}
              >
                {page === 'home' && !showSearch ? (
                  <svg
                    className={`${styles['search-section-icon']} ${styles['active-search-icon']}`}
                    x="0px"
                    y="0px"
                    width="100"
                    height="100"
                    viewBox="0 0 24 24"
                  >
                    <path d="M 12 2.0996094 L 1 12 L 4 12 L 4 21 L 10 21 L 10 14 L 14 14 L 14 21 L 20 21 L 20 12 L 23 12 L 12 2.0996094 z"></path>
                  </svg>
                ) : (
                  <svg
                    className={styles['search-section-icon']}
                    x="0px"
                    y="0px"
                    width="100"
                    height="100"
                    viewBox="0 0 24 24"
                  >
                    <path d="M 12 2.0996094 L 1 12 L 4 12 L 4 21 L 11 21 L 11 15 L 13 15 L 13 21 L 20 21 L 20 12 L 23 12 L 12 2.0996094 z M 12 4.7910156 L 18 10.191406 L 18 11 L 18 19 L 15 19 L 15 13 L 9 13 L 9 19 L 6 19 L 6 10.191406 L 12 4.7910156 z"></path>
                  </svg>
                )}
              </span>

              <span
                className={`${styles['search-section-box']} ${
                  showSearch || page === 'search'
                    ? styles['active-search-box']
                    : ''
                }`}
                onClick={() => setShowSearch(true)}
              >
                <svg
                  className={`${styles['search-section-icon']} ${
                    showSearch || page === 'search'
                      ? styles['active-search-icon']
                      : ''
                  } `}
                  x="0px"
                  y="0px"
                  width="100"
                  height="100"
                  viewBox="0 0 50 50"
                >
                  <path d="M 21 3 C 11.601563 3 4 10.601563 4 20 C 4 29.398438 11.601563 37 21 37 C 24.355469 37 27.460938 36.015625 30.09375 34.34375 L 42.375 46.625 L 46.625 42.375 L 34.5 30.28125 C 36.679688 27.421875 38 23.878906 38 20 C 38 10.601563 30.398438 3 21 3 Z M 21 7 C 28.199219 7 34 12.800781 34 20 C 34 27.199219 28.199219 33 21 33 C 13.800781 33 8 27.199219 8 20 C 8 12.800781 13.800781 7 21 7 Z"></path>
                </svg>
              </span>

              <span
                className={`${styles['search-section-box']} ${
                  page === 'following' && !showSearch
                    ? styles['active-search-box']
                    : ''
                }`}
                onClick={() => navigate('/following')}
              >
                {page === 'following' && !showSearch ? (
                  <FaUserCheck
                    className={`${styles['search-section-icon']} ${styles['active-search-icon']}`}
                  />
                ) : (
                  <LuUserCheck className={styles['search-section-icon2']} />
                )}
              </span>

              <span
                className={`${styles['search-section-box']} ${
                  page === 'friends' && !showSearch
                    ? styles['active-search-box']
                    : ''
                }`}
                onClick={() => navigate('/friends')}
              >
                {page === 'friends' && !showSearch ? (
                  <IoPeopleSharp
                    className={`${styles['search-section-icon']} ${styles['active-search-icon']}`}
                  />
                ) : (
                  <IoPeopleOutline className={styles['search-section-icon']} />
                )}
              </span>

              <span
                className={`${styles['search-section-box']} ${
                  page === 'reels' && !showSearch
                    ? styles['active-search-box']
                    : ''
                }`}
                onClick={() => navigate('/reels')}
              >
                {page === 'reels' && !showSearch ? (
                  <svg
                    className={`${styles['search-section-icon']} ${styles['active-search-icon']}`}
                    x="0px"
                    y="0px"
                    width="100"
                    height="100"
                    viewBox="0 0 48 48"
                  >
                    <path
                      className={`${styles['search-section-icon']} ${styles['active-search-icon']}`}
                      d="M41.28,12.28c-0.4-0.43-4.476-0.606-5.28-1.28c-1.14-0.955-0.622-3.939-1.83-4.76	C37.42,6.96,40.07,9.25,41.28,12.28z"
                    ></path>
                    <path
                      className={`${styles['search-section-icon']} ${styles['active-search-icon']}`}
                      d="M41.28,15.64L42,17v1.26c-1.26-1.71-10.459-9.858-14.289-11.668L29.7,6H32	c0.75,0,1.47,0.08,2.17,0.24c2.06,1.4,4.03,2.99,5.88,4.79c0.42,0.41,0.83,0.82,1.23,1.25c0.225,0.55,0.399,1.126,0.52,1.72	C41.8,14,41.28,14.957,41.28,15.64z"
                    ></path>
                    <path
                      className={`${styles['search-section-icon']} ${styles['active-search-icon']}`}
                      d="M42,18.26v6.1C40.351,21.326,24.095,7.862,16.802,6.109c-0.183-0.044-0.285,0.03-0.456,0.001L16.7,6	h9.52l1.037,0.509c1.298,0.613,2.441,0.792,3.678,1.555c2.413,1.489,4.7,3.263,6.815,5.326C39.32,14.92,40.74,16.55,42,18.26z"
                    ></path>
                    <path
                      className={`${styles['search-section-icon']} ${styles['active-search-icon']}`}
                      d="M42,24.36c0,0-0.02,8.69-0.05,8.64C40.46,27.51,9.3,8.79,9.06,8.81	c1.204-1.164,2.695-2.029,4.359-2.473C13.419,6.337,15.107,7,16,7c0,0,0.589-0.945,0.749-0.916	c6.827,1.245,13.366,4.457,18.711,9.656C38.13,18.34,40.31,21.25,42,24.36z"
                    ></path>
                    <path
                      className={`${styles['search-section-icon']} ${styles['active-search-icon']}`}
                      d="M41.95,33c-0.2,2.06-1.03,3.93-2.3,5.43c-0.72-6.59-31.9-26.28-32.93-26.16	c0.53-1.32,1.33-2.5,2.34-3.46C9.3,8.79,9.54,8.78,9.78,8.78c8.41-0.11,16.87,2.98,23.38,9.32C37.53,22.35,40.46,27.51,41.95,33z"
                    ></path>
                    <path
                      className={`${styles['search-section-icon']} ${styles['active-search-icon']}`}
                      d="M39.65,38.43v0.01c-0.87,1.03-1.93,1.87-3.14,2.48c-0.17-6.6-27.828-25.531-29.107-25.321	C7.417,15.019,6.089,14.552,6.2,14c0.121-0.599,0.296-1.178,0.52-1.73c1.03-0.12,2.06-0.19,3.1-0.2c7.58-0.1,15.19,2.68,21.05,8.39	C36,25.45,38.93,31.84,39.65,38.43z"
                    ></path>
                    <path
                      className={`${styles['search-section-icon']} ${styles['active-search-icon']}`}
                      d="M33.24,41.92c0,0-25.95-23.12-27.24-22.88V17l0.876-1.319c1.28-0.21,1.704-0.301,2.994-0.321	c6.73-0.09,13.5,2.39,18.7,7.45c5.11,4.97,7.77,11.51,7.94,18.11C35.51,41.43,34.41,41.78,33.24,41.92z"
                    ></path>
                    <path
                      className={`${styles['search-section-icon']} ${styles['active-search-icon']}`}
                      d="M33.24,41.36v0.56C32.84,41.97,32.42,42,32,42h-2.06C29.95,41.8,7.3,22.11,6,22.39v-3.35	c1.29-0.24,2.6-0.37,3.91-0.39c5.89-0.08,11.81,2.09,16.37,6.52C30.84,29.61,33.16,35.47,33.24,41.36z"
                    ></path>
                    <path
                      className={`${styles['search-section-icon']} ${styles['active-search-icon']}`}
                      d="M29.95,41.4c0,0.2,0,0.4-0.01,0.6h-3.29c0.01-0.19-1.283-0.646-1.283-0.826	C25.317,36.964,11.4,24.34,6,25.77v-3.38c1.3-0.28,2.63-0.43,3.95-0.45c5.05-0.07,10.13,1.79,14.04,5.59	C27.89,31.33,29.89,36.35,29.95,41.4z"
                    ></path>
                    <path
                      className={`${styles['search-section-icon']} ${styles['active-search-icon']}`}
                      d="M26.66,41.45c0,0.18,0,0.36-0.01,0.55h-3.28c0.01-0.17-1.156-0.982-1.156-1.152	C22.164,37.488,10.53,27.68,6,29.2v-3.43c5.4-1.43,11.39-0.07,15.69,4.11C24.95,33.05,26.61,37.24,26.66,41.45z"
                    ></path>
                    <path
                      className={`${styles['search-section-icon']} ${styles['active-search-icon']}`}
                      d="M23.38,41.49c0,0.17,0,0.34-0.01,0.51h-3.29c0.09-2.68-10.44-10.96-14.05-9.26	C6.02,32.74,6,29.2,6,29.2c4.53-1.52,9.74-0.53,13.4,3.04C22,34.78,23.33,38.13,23.38,41.49z"
                    ></path>
                    <path
                      className={`${styles['search-section-icon']} ${styles['active-search-icon']}`}
                      d="M16.78,42c0.1-1.82-7.44-7.47-9.93-5.97c-0.45-1.02-0.74-2.12-0.82-3.29	c3.61-1.7,8.05-1.09,11.07,1.86c2.08,2.02,3.07,4.72,2.98,7.4H16.78z"
                    ></path>
                    <path
                      className={`${styles['search-section-icon']} ${styles['active-search-icon']}`}
                      d="M16.78,42H16c-0.86,0-1.69-0.11-2.49-0.32c0-0.86-3.62-3.57-4.85-2.9c-0.75-0.8-1.36-1.73-1.81-2.75	c2.49-1.5,5.78-1.2,7.96,0.93C16.22,38.33,16.88,40.18,16.78,42z"
                    ></path>
                    <path
                      className={`${styles['search-section-icon']} ${styles['active-search-icon']}`}
                      d="M13.51,41.68c-1.89-0.48-3.57-1.5-4.85-2.9c1.23-0.67,2.8-0.49,3.85,0.53	C13.18,39.96,13.51,40.82,13.51,41.68z"
                    ></path>
                    <path
                      fill="#fff"
                      d="M42,16v1H6v-1c0-0.69,0.07-1.36,0.2-2h11.69l-4.47-7.66C14.24,6.12,15.11,6,16,6h0.7l4.66,8h9.53	l-4.67-8h3.48l4.66,8h7.44C41.93,14.64,42,15.31,42,16z"
                    ></path>
                    <path
                      fill="#fff"
                      d="M18,33.114v-9.228c0-1.539,1.666-2.502,2.999-1.732l7.998,4.614c1.334,0.77,1.334,2.695,0,3.465	l-7.998,4.614C19.666,35.616,18,34.653,18,33.114z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className={styles['search-section-icon']}
                    version="1.1"
                    viewBox="0 0 100 100"
                  >
                    <defs></defs>
                    <g
                      style={{
                        stroke: 'none',
                        strokeWidth: 0,
                        strokeDasharray: 'none',
                        strokeLinecap: 'butt',
                        strokeLinejoin: 'miter',
                        strokeMiterlimit: 10,
                        fill: 'none',
                        fillRule: 'nonzero',
                        opacity: 1,
                        transform:
                          'translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)}',
                      }}
                    >
                      <linearGradient
                        id="SVGID_44"
                        gradientUnits="userSpaceOnUse"
                        x1="20.9489"
                        y1="70.2584"
                        x2="72.2486"
                        y2="16.3831"
                      >
                        <stop offset="0%" className={styles.stopTag} />
                        <stop offset="50%" className={styles.stopTag} />
                        <stop offset="100%" className={styles.stopTag} />
                      </linearGradient>
                      <path
                        d="M 61.692 0.878 H 28.307 C 12.699 0.878 0 13.577 0 29.186 v 31.629 c 0 15.608 12.699 28.307 28.307 28.307 h 33.385 C 77.301 89.121 90 76.423 90 60.814 V 29.186 C 90 13.577 77.301 0.878 61.692 0.878 z M 81.6 25.186 H 67.854 L 58.78 8.878 h 2.912 C 71.52 8.878 79.737 15.898 81.6 25.186 z M 39.888 25.186 L 30.815 8.878 h 18.811 l 9.073 16.307 H 39.888 z M 22.186 9.825 l 8.546 15.36 H 8.4 C 9.859 17.913 15.213 12.035 22.186 9.825 z M 61.692 81.121 H 28.307 C 17.11 81.121 8 72.012 8 60.814 V 33.186 h 74 v 27.629 C 82 72.012 72.89 81.121 61.692 81.121 z"
                        style={{
                          stroke: 'none',
                          strokeWidth: 1,
                          strokeDasharray: 'none',
                          strokeLinecap: 'butt',
                          strokeLinejoin: 'miter',
                          strokeMiterlimit: 10,
                          fillRule: 'nonzero',
                          opacity: 1,
                          transform: ' matrix(1 0 0 1 0 0) ',
                        }}
                        className={styles['reel-svg-path']}
                        strokeLinecap="round"
                      />
                      <linearGradient
                        id="SVGID_45"
                        gradientUnits="userSpaceOnUse"
                        x1="24.1901"
                        y1="73.3447"
                        x2="75.4898"
                        y2="19.4693"
                      >
                        <stop offset="0%" className={styles.stopTag} />
                        <stop offset="50%" className={styles.stopTag} />
                        <stop offset="100%" className={styles.stopTag} />
                      </linearGradient>
                      <path
                        d="M 56.367 51.97 l -17.41 -9.305 c -2.366 -1.265 -5.227 0.45 -5.227 3.133 v 18.611 c 0 2.683 2.861 4.398 5.227 3.133 l 17.41 -9.305 C 58.871 56.898 58.871 53.309 56.367 51.97 z"
                        style={{
                          stroke: 'none',
                          strokeWidth: 1,
                          strokeDasharray: 'none',
                          strokeLinecap: 'butt',
                          strokeLinejoin: 'miter',
                          strokeMiterlimit: 10,
                          fillRule: 'nonzero',
                          opacity: 1,
                          transform: ' matrix(1 0 0 1 0 0) ',
                        }}
                        className={styles['reel-svg-path']}
                        strokeLinecap="round"
                      />
                    </g>
                  </svg>
                )}
              </span>

              <span
                className={styles['search-section-box']}
                onClick={() => navigate('/notifications')}
              >
                <IoMdNotificationsOutline
                  className={styles['search-section-icon']}
                />{' '}
              </span>

              {!showSearch && page === 'create' && (
                <span
                  className={`${styles['search-section-box']} ${styles['active-search-box']}`}
                  onClick={() => navigate('/create')}
                >
                  <FaRegSquarePlus
                    className={`${styles['search-section-icon']} ${styles['active-search-icon']} `}
                  />
                </span>
              )}

              {(page === 'inbox' || mediaQueries.first) && (
                <>
                  <span
                    className={`${styles['search-section-box']} `}
                    onClick={() => navigate('/create')}
                  >
                    <FaRegSquarePlus
                      className={`${styles['search-section-icon']} `}
                    />
                  </span>

                  <span
                    className={`${styles['search-section-box']} ${
                      page === 'inbox' && !showSearch
                        ? styles['active-search-box']
                        : ''
                    }`}
                    onClick={() => navigate('/inbox')}
                  >
                    <BiMessageDetail
                      className={`${styles['search-section-icon']} ${
                        page === 'inbox' && !showSearch
                          ? styles['active-search-icon']
                          : ''
                      }`}
                    />
                  </span>

                  <span
                    className={`${styles['search-section-box']} `}
                    onClick={() => navigate('/profile')}
                  >
                    <FaRegCircleUser
                      className={`${styles['search-section-icon']} `}
                    />
                  </span>
                </>
              )}

              <div
                className={`${styles['more-div']} ${styles['search-more-div']}`}
                ref={boxRef2}
              >
                {showMore2 && (
                  <ul
                    className={`${styles['more-list']} ${styles['search-more-list']}`}
                  >
                    <li
                      className={styles['more-item']}
                      onClick={() => navigate('/settings')}
                    >
                      <IoSettingsOutline className={styles['more-item-icon']} />
                      Settings
                    </li>
                    <li
                      className={styles['more-item']}
                      onClick={() => navigate('/analytics')}
                    >
                      <TbBrandGoogleAnalytics
                        className={styles['more-item-icon']}
                      />
                      Analytics
                    </li>
                    <li
                      className={styles['more-item']}
                      onClick={() => navigate('/history')}
                    >
                      <MdOutlineHistory className={styles['more-item-icon']} />
                      History
                    </li>
                    <li
                      className={`${styles['more-item']}  ${styles['apperance-item']}`}
                    >
                      <MdOutlineLightMode
                        className={styles['more-item-icon']}
                      />{' '}
                      Change appearance
                      <select className={styles['appearance-select']}>
                        <option>Light</option>
                        <option>Dark</option>
                        <option>Device default</option>
                      </select>
                    </li>
                    <hr className={styles['logout-line']} />
                    <li className={styles['more-item']}>
                      <FiLogOut className={styles['more-item-icon']} />
                      Log out
                    </li>
                  </ul>
                )}

                <span
                  className={`${styles['search-more-box']} ${
                    showMore2 ? styles['active-menu'] : ''
                  }`}
                  onClick={() => setShowMore2(!showMore2)}
                >
                  <BiMenuAltLeft
                    className={`${styles['search-more-icon']}  ${
                      showMore2 ? styles['active-icon'] : ''
                    }`}
                  />
                </span>
              </div>
            </div>
          )}

          {(showSearch || showSearchPage) && (
            <div
              className={styles['search-container']}
              onAnimationEnd={() => searchInputRef.current.focus()}
              ref={searchContainerRef}
            >
              {(!showSearchPage || !mediaQueries.second) && (
                <span className={styles['search-head']}>Search</span>
              )}

              <div className={styles['show-search-div']}>
                {showSearchPage && (
                  <IoArrowBack
                    className={styles['back-icon']}
                    onClick={() => {
                      setShowSearch(false);
                      setSearchText('');
                      setShowSearchPage(false);
                      if (setOverlaySearch) setOverlaySearch(false);
                    }}
                  />
                )}
                <div className={styles['search-box']}>
                  <IoSearchSharp className={styles['search-icon']} />
                  <input
                    type="text"
                    className={styles['search-input']}
                    placeholder="Search...."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    ref={searchInputRef}
                  />

                  <IoClose
                    className={`${styles['close-search-icon']} ${
                      searchText.trim().length < 1 ? styles['hide-search'] : ''
                    }`}
                    title="Clear"
                    onClick={() => {
                      setSearchText('');
                      searchInputRef.current.focus();
                    }}
                  />
                </div>
              </div>

              {searchText.trim().length > 0 ? (
                <div className={styles['search-results-div']}>
                  <div className={styles['search-results-container']}>
                    <article
                      className={styles['search-result']}
                      onClick={() => {
                        setShowSearch(false);
                        setShowSearchPage(false);
                        if (setOverlaySearch) setOverlaySearch(false);
                        navigate('/search');
                      }}
                    >
                      <IoSearchSharp
                        className={styles['search-results-icon']}
                      />

                      <span className={styles['search-results-text']}>
                        man city vs feyenoord
                      </span>
                    </article>
                    <article
                      className={styles['search-result']}
                      onClick={() => {
                        setShowSearch(false);
                        setShowSearchPage(false);
                        if (setOverlaySearch) setOverlaySearch(false);
                        navigate('/search');
                      }}
                    >
                      <IoSearchSharp
                        className={styles['search-results-icon']}
                      />

                      <span className={styles['search-results-text']}>
                        man city vs feyenoord
                      </span>
                    </article>
                    <article
                      className={styles['search-result']}
                      onClick={() => {
                        setShowSearch(false);
                        setShowSearchPage(false);
                        if (setOverlaySearch) setOverlaySearch(false);
                        navigate('/search');
                      }}
                    >
                      <IoSearchSharp
                        className={styles['search-results-icon']}
                      />

                      <span className={styles['search-results-text']}>
                        davido
                      </span>
                    </article>
                    <article
                      className={styles['search-result']}
                      onClick={() => {
                        setShowSearch(false);
                        setShowSearchPage(false);
                        if (setOverlaySearch) setOverlaySearch(false);
                        navigate('/search');
                      }}
                    >
                      <IoSearchSharp
                        className={styles['search-results-icon']}
                      />

                      <span className={styles['search-results-text']}>
                        powepuff girls
                      </span>
                    </article>
                    <article
                      className={styles['search-result']}
                      onClick={() => {
                        setShowSearch(false);
                        setShowSearchPage(false);
                        if (setOverlaySearch) setOverlaySearch(false);
                        navigate('/search');
                      }}
                    >
                      <IoSearchSharp
                        className={styles['search-results-icon']}
                      />

                      <span className={styles['search-results-text']}>
                        grammy 2025 nominations
                      </span>
                    </article>
                    <article
                      className={styles['search-result']}
                      onClick={() => {
                        setShowSearch(false);
                        setShowSearchPage(false);
                        if (setOverlaySearch) setOverlaySearch(false);
                        navigate('/search');
                      }}
                    >
                      <IoSearchSharp
                        className={styles['search-results-icon']}
                      />

                      <span className={styles['search-results-text']}>
                        game of thrones
                      </span>
                    </article>
                  </div>

                  <div className={styles['search-accounts-container']}>
                    <span className={styles['search-accounts-head']}>
                      Users
                    </span>

                    <div className={styles['search-accounts-div']}>
                      <article
                        className={styles['search-accounts']}
                        onClick={() => {
                          setShowSearch(false);
                          setShowSearchPage(false);
                          if (setOverlaySearch) setOverlaySearch(false);
                          navigate('/search');
                        }}
                      >
                        <img
                          className={styles['search-accounts-img']}
                          src="../../assets/images/users/user10.jpeg"
                        />

                        <span className={styles['search-accounts-box']}>
                          <span className={styles['search-accounts-name']}>
                            Rey Mesterio
                          </span>
                          <span className={styles['search-accounts-username']}>
                            @reymesterio_100
                          </span>
                        </span>
                      </article>

                      <article
                        className={styles['search-accounts']}
                        onClick={() => {
                          setShowSearch(false);
                          setShowSearchPage(false);
                          if (setOverlaySearch) setOverlaySearch(false);
                          navigate('/search');
                        }}
                      >
                        <img
                          className={styles['search-accounts-img']}
                          src="../../assets/images/users/user8.jpeg"
                        />

                        <span className={styles['search-accounts-box']}>
                          <span className={styles['search-accounts-name']}>
                            The Godfather
                          </span>
                          <span className={styles['search-accounts-username']}>
                            @dagodfather1
                          </span>
                        </span>
                      </article>

                      <article
                        className={styles['search-accounts']}
                        onClick={() => {
                          setShowSearch(false);
                          setShowSearchPage(false);
                          if (setOverlaySearch) setOverlaySearch(false);
                          navigate('/search');
                        }}
                      >
                        <img
                          className={styles['search-accounts-img']}
                          src="../../assets/images/users/user4.jpeg"
                        />

                        <span className={styles['search-accounts-box']}>
                          <span className={styles['search-accounts-name']}>
                            Cynthia
                          </span>
                          <span className={styles['search-accounts-username']}>
                            @therealcynthia
                          </span>
                        </span>
                      </article>

                      <article
                        className={styles['search-accounts']}
                        onClick={() => {
                          setShowSearch(false);
                          setShowSearchPage(false);
                          if (setOverlaySearch) setOverlaySearch(false);
                          navigate('/search');
                        }}
                      >
                        <img
                          className={styles['search-accounts-img']}
                          src="../../assets/images/users/user6.jpeg"
                        />

                        <span className={styles['search-accounts-box']}>
                          <span className={styles['search-accounts-name']}>
                            Kamala Harris
                          </span>
                          <span className={styles['search-accounts-username']}>
                            @vicepresidentharris
                          </span>
                        </span>
                      </article>

                      <article
                        className={styles['search-accounts']}
                        onClick={() => {
                          setShowSearch(false);
                          setShowSearchPage(false);
                          if (setOverlaySearch) setOverlaySearch(false);
                          navigate('/search');
                        }}
                      >
                        <img
                          className={styles['search-accounts-img']}
                          src="../../assets/images/users/user19.jpeg"
                        />

                        <span className={styles['search-accounts-box']}>
                          <span className={styles['search-accounts-name']}>
                            Tech Wizard
                          </span>
                          <span className={styles['search-accounts-username']}>
                            @jonas_travis
                          </span>
                        </span>
                      </article>
                    </div>
                  </div>

                  <span
                    className={styles['show-results-txt']}
                    onClick={() => {
                      setShowSearch(false);
                      setShowSearchPage(false);
                      if (setOverlaySearch) setOverlaySearch(false);
                      navigate('/search');
                    }}
                  >
                    View all results
                  </span>
                </div>
              ) : (
                <>
                  <div className={styles['recent-search-container']}>
                    <span className={styles['recent-search-text']}>Recent</span>

                    <div className={styles['recent-search-div']}>
                      <div
                        className={styles['recent-search-box']}
                        onClick={() => {
                          setShowSearch(false);
                          setShowSearchPage(false);
                          if (setOverlaySearch) setOverlaySearch(false);
                          navigate('/search');
                        }}
                      >
                        <AiFillClockCircle
                          className={styles['recent-search-icon']}
                        />
                        <span className={styles['recent-search']}>davido</span>

                        <IoClose
                          className={styles['remove-recent-search']}
                          title="Remove"
                        />
                      </div>

                      <div
                        className={styles['recent-search-box']}
                        onClick={() => {
                          setShowSearch(false);
                          setShowSearchPage(false);
                          if (setOverlaySearch) setOverlaySearch(false);
                          navigate('/search');
                        }}
                      >
                        <AiFillClockCircle
                          className={styles['recent-search-icon']}
                        />
                        <span className={styles['recent-search']}>
                          mancheter city vs feyenoord highlights
                        </span>

                        <IoClose
                          className={styles['remove-recent-search']}
                          title="Remove"
                        />
                      </div>

                      <div
                        className={styles['recent-search-box']}
                        onClick={() => {
                          setShowSearch(false);
                          setShowSearchPage(false);
                          if (setOverlaySearch) setOverlaySearch(false);
                          navigate('/search');
                        }}
                      >
                        <AiFillClockCircle
                          className={styles['recent-search-icon']}
                        />
                        <span className={styles['recent-search']}>
                          vicoka upcoming artist
                        </span>

                        <IoClose
                          className={styles['remove-recent-search']}
                          title="Remove"
                        />
                      </div>

                      <div
                        className={styles['recent-search-box']}
                        onClick={() => {
                          setShowSearch(false);
                          setShowSearchPage(false);
                          if (setOverlaySearch) setOverlaySearch(false);
                          navigate('/search');
                        }}
                      >
                        <AiFillClockCircle
                          className={styles['recent-search-icon']}
                        />
                        <span className={styles['recent-search']}>
                          wizkid new album
                        </span>

                        <IoClose
                          className={styles['remove-recent-search']}
                          title="Remove"
                        />
                      </div>

                      <div
                        className={styles['recent-search-box']}
                        onClick={() => {
                          setShowSearch(false);
                          setShowSearchPage(false);
                          if (setOverlaySearch) setOverlaySearch(false);
                          navigate('/search');
                        }}
                      >
                        <AiFillClockCircle
                          className={styles['recent-search-icon']}
                        />
                        <span className={styles['recent-search']}>
                          speed darlington
                        </span>

                        <IoClose
                          className={styles['remove-recent-search']}
                          title="Remove"
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles['trending-search-container']}>
                    <span className={styles['recent-search-text']}>
                      Trending
                    </span>

                    <div className={styles['recent-search-div']}>
                      <div
                        className={styles['recent-search-box']}
                        onClick={() => {
                          setShowSearch(false);
                          setShowSearchPage(false);
                          if (setOverlaySearch) setOverlaySearch(false);
                          navigate('/search');
                        }}
                      >
                        <HiTrendingUp
                          className={styles['recent-search-icon']}
                        />
                        <span className={styles['recent-search']}>davido</span>
                      </div>

                      <div
                        className={styles['recent-search-box']}
                        onClick={() => {
                          setShowSearch(false);
                          setShowSearchPage(false);
                          if (setOverlaySearch) setOverlaySearch(false);
                          navigate('/search');
                        }}
                      >
                        <HiTrendingUp
                          className={styles['recent-search-icon']}
                        />
                        <span className={styles['recent-search']}>
                          mancheter city vs feyenoord highlights
                        </span>
                      </div>

                      <div
                        className={styles['recent-search-box']}
                        onClick={() => {
                          setShowSearch(false);
                          setShowSearchPage(false);
                          if (setOverlaySearch) setOverlaySearch(false);
                          navigate('/search');
                        }}
                      >
                        <HiTrendingUp
                          className={styles['recent-search-icon']}
                        />
                        <span className={styles['recent-search']}>
                          vicoka upcoming artist
                        </span>
                      </div>

                      <div
                        className={styles['recent-search-box']}
                        onClick={() => {
                          setShowSearch(false);
                          setShowSearchPage(false);
                          if (setOverlaySearch) setOverlaySearch(false);
                          navigate('/search');
                        }}
                      >
                        <HiTrendingUp
                          className={styles['recent-search-icon']}
                        />
                        <span className={styles['recent-search']}>
                          wizkid new album
                        </span>
                      </div>

                      <div
                        className={styles['recent-search-box']}
                        onClick={() => {
                          setShowSearch(false);
                          setShowSearchPage(false);
                          if (setOverlaySearch) setOverlaySearch(false);
                          navigate('/search');
                        }}
                      >
                        <HiTrendingUp
                          className={styles['recent-search-icon']}
                        />
                        <span className={styles['recent-search']}>
                          speed darlington
                        </span>
                      </div>

                      <span
                        className={`${styles['show-more-trends']} ${
                          moreTrends ? styles['hide-more-trends'] : ''
                        }`}
                        onClick={() => setMoreTrends(true)}
                      >
                        Show more
                      </span>

                      {moreTrends && (
                        <>
                          <div
                            className={styles['recent-search-box']}
                            onClick={() => {
                              setShowSearch(false);
                              setShowSearchPage(false);
                              if (setOverlaySearch) setOverlaySearch(false);
                              navigate('/search');
                            }}
                          >
                            <HiTrendingUp
                              className={styles['recent-search-icon']}
                            />
                            <span className={styles['recent-search']}>
                              davido
                            </span>
                          </div>

                          <div
                            className={styles['recent-search-box']}
                            onClick={() => {
                              setShowSearch(false);
                              setShowSearchPage(false);
                              if (setOverlaySearch) setOverlaySearch(false);
                              navigate('/search');
                            }}
                          >
                            <HiTrendingUp
                              className={styles['recent-search-icon']}
                            />
                            <span className={styles['recent-search']}>
                              mancheter city vs feyenoord highlights
                            </span>
                          </div>

                          <div
                            className={styles['recent-search-box']}
                            onClick={() => {
                              setShowSearch(false);
                              setShowSearchPage(false);
                              if (setOverlaySearch) setOverlaySearch(false);
                              navigate('/search');
                            }}
                          >
                            <HiTrendingUp
                              className={styles['recent-search-icon']}
                            />
                            <span className={styles['recent-search']}>
                              vicoka upcoming artist
                            </span>
                          </div>

                          <div
                            className={styles['recent-search-box']}
                            onClick={() => {
                              setShowSearch(false);
                              setShowSearchPage(false);
                              if (setOverlaySearch) setOverlaySearch(false);
                              navigate('/search');
                            }}
                          >
                            <HiTrendingUp
                              className={styles['recent-search-icon']}
                            />
                            <span className={styles['recent-search']}>
                              wizkid new album
                            </span>
                          </div>

                          <div
                            className={styles['recent-search-box']}
                            onClick={() => {
                              setShowSearch(false);
                              setShowSearchPage(false);
                              if (setOverlaySearch) setOverlaySearch(false);
                              navigate('/search');
                            }}
                          >
                            <HiTrendingUp
                              className={styles['recent-search-icon']}
                            />
                            <span className={styles['recent-search']}>
                              speed darlington
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      )}
    </>
  );
};

export default NavBar;
