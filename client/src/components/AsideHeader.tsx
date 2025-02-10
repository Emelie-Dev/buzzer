import styles from '../styles/AsideHeader.module.css';
import { HiPlusSm } from 'react-icons/hi';
import { BiMessageDetail } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';

const AsideHeader = () => {
  const navigate = useNavigate();

  return (
    <header className={styles['aside-header']}>
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
          <li
            className={styles['view-item']}
            onClick={() => navigate('/profile')}
          >
            View profile
          </li>
          <li className={styles['view-item']}>View story</li>
          <li className={styles['view-item']}>Switch account</li>
        </ul>
      </div>
    </header>
  );
};

export default AsideHeader;
