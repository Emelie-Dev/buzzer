import { useEffect, useRef } from 'react';
import styles from '../styles/MobileMenu.module.css';

type MobileMenuProps = {
  showMobileMenu: boolean;
  setShowMobileMenu: React.Dispatch<React.SetStateAction<boolean>>;
};

const MobileMenu = ({ showMobileMenu, setShowMobileMenu }: MobileMenuProps) => {
  const listRef = useRef<HTMLUListElement>(null!);

  useEffect(() => {
    if (showMobileMenu) {
      listRef.current.animate(
        {
          height: ['0px', `${listRef.current.scrollHeight}px`],
        },
        {
          fill: 'both',
          duration: 150,
        }
      );
    }
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (e.target === e.currentTarget) {
      const animation = listRef.current.animate(
        {
          height: [`${listRef.current.scrollHeight}px`, '0px'],
        },
        {
          fill: 'both',
          duration: 150,
        }
      );

      animation.onfinish = () => setShowMobileMenu(false);
    }
  };

  return (
    <section className={styles.section} onClick={handleClick}>
      <ul className={styles['menu-list']} ref={listRef}>
        <li className={`${styles['menu-item']} ${styles['menu-red']}`}>
          Follow
        </li>
        <li className={`${styles['menu-item']} ${styles['menu-red']}`}>
          Report
        </li>
        <li className={styles['menu-item']}>Not interested</li>
        <li className={styles['menu-item']}>Add to story</li>
        <li className={styles['menu-item']}>Go to post</li>
        <li className={styles['menu-item']}>Clear display</li>
      </ul>
    </section>
  );
};

export default MobileMenu;
