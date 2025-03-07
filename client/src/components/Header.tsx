import styles from '../styles/Header.module.css';
import { IoIosArrowDown } from 'react-icons/io';
import { IoPeopleOutline, IoArrowBack } from 'react-icons/io5';
import { LiaPeopleCarrySolid } from 'react-icons/lia';
import { BiMessageDetail } from 'react-icons/bi';
import { useContext, useEffect, useRef } from 'react';
import { GeneralContext } from '../Contexts';
import { useNavigate } from 'react-router-dom';
import { IoPeopleSharp } from 'react-icons/io5';

type HeaderProps = {
  friends?: boolean;
  friendsCategory?: 'users' | 'contents' | null;
  reels?: boolean;
  setFriendsCategory?: React.Dispatch<
    React.SetStateAction<'users' | 'contents' | null>
  >;
  setShowFriendRequests?: React.Dispatch<React.SetStateAction<boolean>>;
};

const Header = ({
  friends,
  friendsCategory,
  setFriendsCategory,
  setShowFriendRequests,
  reels,
}: HeaderProps) => {
  const { setScrollingUp, setShowSearchPage, scrollingUp } =
    useContext(GeneralContext);

  const headerRef = useRef<HTMLDivElement>(null!);

  const navigate = useNavigate();

  useEffect(() => {
    setScrollingUp(null);
  }, []);

  useEffect(() => {
    if (scrollingUp) {
      headerRef.current.style.position = 'sticky';
      headerRef.current.animate(
        {
          transform: ['translateY(-15px)', 'translateY(0)'],
        },
        {
          fill: 'both',
          duration: 150,
        }
      );
    } else if (scrollingUp === null) {
      headerRef.current.style.position = 'static';
      headerRef.current.animate(
        {
          transform: ['translateY(-15px)', 'translateY(0)'],
        },
        {
          fill: 'both',
          duration: 0,
        }
      );
    } else {
      const animation = headerRef.current.animate(
        {
          transform: ['translateY(0)', 'translateY(-75px)'],
        },
        {
          fill: 'both',
          duration: 150,
        }
      );

      animation.onfinish = () => (headerRef.current.style.position = 'static');
    }
  }, [scrollingUp]);

  return (
    <header
      className={`${styles.header} ${
        friends ? styles['friends-header'] : ''
      }  ${reels ? styles['reels-header'] : ''}`}
      ref={headerRef}
    >
      <div className={styles['header-top']}>
        <div className={styles['left-box']}>
          <div className={styles['name-box']}>
            {friends ? (
              <IoArrowBack
                className={styles['back-icon']}
                onClick={() => navigate(-1)}
              />
            ) : (
              <img
                src="../../assets/logo.png"
                alt="Buzzer Logo"
                className={styles.logo}
              />
            )}

            <span
              className={`${styles.name} ${
                friends ? styles['friends-text'] : ''
              }`}
            >
              {friends ? 'Friends' : 'Buzzer'}
            </span>
          </div>

          {!friends && (
            <div className={styles['options-div']}>
              <IoIosArrowDown className={styles['options-arrow']} />

              <ul className={styles['options-list']}>
                <li
                  className={styles['options-item']}
                  onClick={() => navigate('/friends')}
                >
                  <IoPeopleOutline className={styles['options-icon']} /> Friends
                </li>
                <li className={styles['options-item']}>
                  <LiaPeopleCarrySolid className={styles['options-icon']} />
                  Suggested
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className={styles['right-box']}>
          {friends ? (
            <span
              className={styles['request-details']}
              onClick={() =>
                setShowFriendRequests && setShowFriendRequests(true)
              }
            >
              <IoPeopleSharp className={styles['friends-icon']} />
              <span className={styles['request-length']}>10</span>
            </span>
          ) : (
            <span className={styles['inbox-box']}>
              <BiMessageDetail className={styles['inbox-icon']} />
              <span className={styles['inbox-length']}>5</span>
            </span>
          )}

          <svg
            className={`${styles['search-icon']}`}
            x="0px"
            y="0px"
            width="100"
            height="100"
            viewBox="0 0 30 30"
            onClick={() => setShowSearchPage(true)}
          >
            <path d="M 13 3 C 7.4889971 3 3 7.4889971 3 13 C 3 18.511003 7.4889971 23 13 23 C 15.396508 23 17.597385 22.148986 19.322266 20.736328 L 25.292969 26.707031 A 1.0001 1.0001 0 1 0 26.707031 25.292969 L 20.736328 19.322266 C 22.148986 17.597385 23 15.396508 23 13 C 23 7.4889971 18.511003 3 13 3 z M 13 5 C 17.430123 5 21 8.5698774 21 13 C 21 17.430123 17.430123 21 13 21 C 8.5698774 21 5 17.430123 5 13 C 5 8.5698774 8.5698774 5 13 5 z"></path>
          </svg>
        </div>
      </div>

      <div className={styles['header-bottom']}>
        {friends && (
          <ul className={styles['friends-header-list']}>
            <li
              className={`${styles['friends-header-item']} ${
                friendsCategory === 'users' || friendsCategory === null
                  ? styles['friends-active-item']
                  : ''
              }`}
              onClick={() => setFriendsCategory && setFriendsCategory('users')}
            >
              Users
            </li>
            <li
              className={`${styles['friends-header-item']} ${
                friendsCategory === 'contents'
                  ? styles['friends-active-item']
                  : ''
              }`}
              onClick={() =>
                setFriendsCategory && setFriendsCategory('contents')
              }
            >
              Contents
            </li>
          </ul>
        )}
      </div>
    </header>
  );
};

export default Header;
