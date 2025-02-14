import styles from '../styles/SwitchAccount.module.css';
import { IoClose } from 'react-icons/io5';
import { FaCheck } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';

type SwitchAccountProps = {
  setSwitchAccount: React.Dispatch<React.SetStateAction<boolean>>;
};

const SwitchAccount = ({ setSwitchAccount }: SwitchAccountProps) => {
  const navigate = useNavigate();

  return (
    <section
      className={styles.section}
      onClick={(e) => {
        if (e.target === e.currentTarget) setSwitchAccount(false);
      }}
    >
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.head}>Switch Account</h1>

          <span
            className={styles['close-icon-box']}
            onClick={() => setSwitchAccount(false)}
          >
            <IoClose className={styles['close-icon']} title="Close" />
          </span>
        </header>

        <div className={styles['accounts-container']}>
          <article className={styles.accounts}>
            <img
              className={styles['accounts-img']}
              src="../../assets/images/users/user14.jpeg"
            />
            <div className={styles['names-box']}>
              <span className={styles['user-name']}>The Godfather👑👑</span>
              <span className={styles['user-handle']}>josephlouis_100</span>
            </div>

            <FaCheck className={styles.check} />
          </article>

          <article className={styles.accounts}>
            <img
              className={styles['accounts-img']}
              src="../../assets/images/users/user5.jpeg"
            />
            <div className={styles['names-box']}>
              <span className={styles['user-name']}>Lionel Messi</span>
              <span className={styles['user-handle']}>absolutegoat</span>
            </div>
          </article>
        </div>

        <div className={styles['add-account-box']}>
          <span className={styles['add-icon-box']}>
            <FaPlus className={styles['add-icon']} />
          </span>

          <span
            className={styles['add-text']}
            onClick={() => navigate('/auth')}
          >
            Add account
          </span>
        </div>
      </div>
    </section>
  );
};

export default SwitchAccount;
