import styles from '../styles/Header.module.css';
import { IoIosArrowDown } from 'react-icons/io';
import { IoPeopleOutline } from 'react-icons/io5';
import { LiaPeopleCarrySolid } from 'react-icons/lia';
import { BiMessageDetail } from 'react-icons/bi';
import { useContext, useEffect, useRef } from 'react';
import { GeneralContext } from '../Contexts';

const Header = () => {
  const { scrollingUp, setScrollingUp, setShowSearchPage } =
    useContext(GeneralContext);

  const headerRef = useRef<HTMLDivElement>(null!);

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
    <header className={styles.header} ref={headerRef}>
      <div className={styles['left-box']}>
        <div className={styles['name-box']}>
          <img
            src="../../assets/logo.png"
            alt="Buzzer Logo"
            className={styles.logo}
          />

          <span className={styles.name}>Buzzer</span>
        </div>

        <div className={styles['options-div']}>
          <IoIosArrowDown className={styles['options-arrow']} />

          <ul className={styles['options-list']}>
            <li className={styles['options-item']}>
              <IoPeopleOutline className={styles['options-icon']} /> Friends
            </li>
            <li className={styles['options-item']}>
              <LiaPeopleCarrySolid className={styles['options-icon']} />
              Suggested
            </li>
          </ul>
        </div>
      </div>

      <div className={styles['right-box']}>
        <span className={styles['inbox-box']}>
          <BiMessageDetail className={styles['inbox-icon']} />
          <span className={styles['inbox-length']}>5</span>
        </span>

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
    </header>
  );
};

export default Header;
