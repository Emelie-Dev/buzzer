import styles from '../styles/AsideHeader.module.css';
import { HiPlusSm } from 'react-icons/hi';
import { BiMessageDetail } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import SwitchAccount from './SwitchAccount';
import { AuthContext, StoryContext } from '../Contexts';
import { getUrl } from '../Utilities';
import { toast } from 'sonner';

type AsideHeaderProps = {
  activeVideo?: HTMLVideoElement | null;
  second?: boolean;
};

const AsideHeader = ({ activeVideo, second }: AsideHeaderProps) => {
  const { user } = useContext(AuthContext);
  const { viewStory, setViewStory, userStory } = useContext(StoryContext);
  const [switchAccount, setSwitchAccount] = useState<boolean>(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (activeVideo) {
      if (viewStory) activeVideo.pause();
      else activeVideo.play();
    }
  }, [viewStory]);

  const showStory = () => {
    if (userStory.length === 0) {
      return toast.error('No stories available.');
    }

    setViewStory(true);
  };

  return (
    <>
      {second ? (
        <header className={styles['aside-header2']}>
          <button
            className={`${styles['create-btn']} ${styles['create-btn2']}`}
            onClick={() => navigate('/create')}
          >
            Create{' '}
            <HiPlusSm
              className={`${styles['create-icon']} ${styles['create-icon2']}`}
            />
          </button>

          <span
            className={styles['inbox-box']}
            title="Inbox"
            onClick={() => navigate('/inbox')}
          >
            <BiMessageDetail
              className={`${styles['inbox-icon']} ${styles['inbox-icon2 ']}`}
            />
            <span
              className={`${styles['inbox-number']} ${styles['inbox-number2 ']}`}
            >
              {' '}
              <span
                className={`${styles['inbox-length']} ${styles['inbox-length2 ']}`}
              >
                9
              </span>
            </span>
          </span>

          <div className={styles['profile-box2']}>
            <span
              className={`${styles['profile-img-box']} ${
                userStory.length > 0 ? styles['profile-img-box2'] : ''
              }`}
            >
              <img
                className={`${styles['profile-img']} ${styles['profile-img2']}`}
                src={getUrl(user.photo, 'users')}
              />
            </span>

            <ul className={styles['view-list']}>
              <li
                className={styles['view-item']}
                onClick={() => navigate('/profile')}
              >
                View profile
              </li>
              <li className={styles['view-item']} onClick={showStory}>
                View story
              </li>
              <li
                className={styles['view-item']}
                onClick={() => setSwitchAccount(true)}
              >
                Switch account
              </li>
            </ul>
          </div>
        </header>
      ) : (
        <div className={styles['aside-header']}>
          <button
            className={styles['create-btn']}
            onClick={() => navigate('/create')}
          >
            Create <HiPlusSm className={styles['create-icon']} />
          </button>

          <span
            className={styles['inbox-box']}
            title="Inbox"
            onClick={() => navigate('/inbox')}
          >
            <BiMessageDetail className={styles['inbox-icon']} />
            <span className={styles['inbox-number']}>
              <span className={styles['inbox-length']}>9</span>
            </span>
          </span>

          <div className={styles['profile-box']}>
            <span
              className={`${styles['profile-img-box']} ${
                userStory.length > 0 ? styles['profile-img-box2'] : ''
              }`}
            >
              <img
                className={styles['profile-img']}
                src={getUrl(user.photo, 'users')}
              />
            </span>

            <ul className={styles['view-list']}>
              <li
                className={styles['view-item']}
                onClick={() => navigate('/profile')}
              >
                View profile
              </li>
              <li className={styles['view-item']} onClick={showStory}>
                View story
              </li>
              <li
                className={styles['view-item']}
                onClick={() => setSwitchAccount(true)}
              >
                Switch account
              </li>
            </ul>
          </div>
        </div>
      )}

      {switchAccount && <SwitchAccount setSwitchAccount={setSwitchAccount} />}
    </>
  );
};

export default AsideHeader;
