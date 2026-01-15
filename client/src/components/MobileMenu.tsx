import { useContext, useEffect, useRef } from 'react';
import styles from '../styles/MobileMenu.module.css';
import { LikeContext } from '../Contexts';

type MobileMenuProps = {
  showMobileMenu: boolean;
  setShowMobileMenu: React.Dispatch<React.SetStateAction<boolean>>;
  reels?: boolean;
  isFollowing: any;
  handleUserFollow: () => Promise<void>;
  collaboratorsList: {
    value: any[];
    loading: boolean;
    isCollaborator: boolean;
  };
  leaveCollaboration: () => Promise<void>;
  excludeContent: () => Promise<void>;
  reportAccount: () => void;
  clearDisplay: () => void;
  muteReel: () => void;
};

const MobileMenu = ({
  showMobileMenu,
  setShowMobileMenu,
  reels,
  isFollowing,
  handleUserFollow,
  collaboratorsList,
  leaveCollaboration,
  excludeContent,
  reportAccount,
  clearDisplay,
  muteReel,
}: MobileMenuProps) => {
  const { isReelPinned, handlePinnedReels, muted } = useContext(LikeContext);
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
        <li
          className={`${styles['menu-item']} ${styles['menu-red']} ${
            reels ? styles['reels-menu-item'] : ''
          }`}
          onClick={handleUserFollow}
        >
          {isFollowing ? 'Unfollow' : 'Follow'}
        </li>
        <li
          className={`${styles['menu-item']} ${styles['menu-red']} ${
            reels ? styles['reels-menu-item'] : ''
          }`}
          onClick={reportAccount}
        >
          Report
        </li>
        {collaboratorsList.isCollaborator && (
          <li
            className={`${styles['menu-item']} ${
              reels ? styles['reels-menu-item'] : ''
            }`}
            onClick={leaveCollaboration}
          >
            Leave Collaboration
          </li>
        )}
        {reels && (
          <>
            <li
              className={`${styles['menu-item']} ${styles['reels-menu-item']}`}
              onClick={muteReel}
            >
              {muted ? 'Unmute' : 'Mute'}
            </li>
            <li
              className={`${styles['menu-item']} ${styles['reels-menu-item']}`}
              onClick={() =>
                handlePinnedReels(isReelPinned() ? 'delete' : 'add')
              }
            >
              {isReelPinned() ? 'Unpin' : 'Pin'}
            </li>
          </>
        )}
        <li
          className={`${styles['menu-item']} ${
            reels ? styles['reels-menu-item'] : ''
          }`}
          onClick={excludeContent}
        >
          Not interested
        </li>
        <li
          className={`${styles['menu-item']} ${
            reels ? styles['reels-menu-item'] : ''
          }`}
          onClick={clearDisplay}
        >
          Clear display
        </li>
      </ul>
    </section>
  );
};

export default MobileMenu;
