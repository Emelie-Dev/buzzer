import styles from '../styles/SwitchAccount.module.css';
import { IoClose } from 'react-icons/io5';
import { FaCheck } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { apiClient, getUrl } from '../Utilities';
import LoadingAnimation from './LoadingAnimation';
import { toast } from 'sonner';
import { AuthContext } from '../Contexts';

type SwitchAccountProps = {
  setSwitchAccount: React.Dispatch<React.SetStateAction<boolean>>;
};

const SwitchAccount = ({ setSwitchAccount }: SwitchAccountProps) => {
  const { setUser } = useContext(AuthContext);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean | 'error'>(true);
  const [switching, setSwitching] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (loading === true) getSessions();
  }, [loading]);

  const getSessions = async () => {
    try {
      const { data } = await apiClient('v1/auth/accounts');

      setAccounts(data.data.sessions);
      setLoading(false);
    } catch {
      setLoading('error');
    }
  };

  const switchSession = (id: string) => async () => {
    if (switching) return;
    setSwitching(true);

    try {
      const { data } = await apiClient.post(`v1/auth/switch-account/${id}`);
      setUser(data.data.user);
      toast.success('Account switched successfully!');
      setTimeout(() => {
        window.location.href = '/home';
      }, 500);
    } catch (err: any) {
      const message = 'Could not switch account.';

      if (err.response) {
        if (err.response.status === 400) {
          navigate('/auth?add=true');
        } else {
          setSwitching(false);
        }
        return toast.error(err.response.data.message || message);
      } else {
        return toast.error(message);
      }
    }
  };

  console.log(accounts);

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
          {loading === true ? (
            <div className={styles['device-loader']}>
              <LoadingAnimation
                style={{
                  width: '4rem',
                  height: '4rem',
                  transform: 'scale(2.5)',
                }}
              />
            </div>
          ) : loading === 'error' ? (
            <div className={`${styles['no-data-text']}`}>
              Unable to load accounts. Check your connection and try again.
              <div className={styles['error-btn']}>
                <button onClick={() => setLoading(true)}>Try again</button>
              </div>
            </div>
          ) : (
            accounts.map((account) => (
              <article
                key={account._id}
                className={`${styles.accounts} ${
                  account.active ? styles['active-account'] : ''
                } ${switching ? styles['disable-switching'] : ''}`}
                onClick={
                  account.active ? undefined : switchSession(account._id)
                }
              >
                <img
                  className={styles['accounts-img']}
                  src={getUrl(account.user.photo, 'users')}
                />
                <div className={styles['names-box']}>
                  <span className={styles['user-name']}>
                    {account.user.name}
                  </span>
                  <span className={styles['user-handle']}>
                    {account.user.username}
                  </span>
                </div>

                {account.active && <FaCheck className={styles.check} />}
              </article>
            ))
          )}
        </div>

        {loading === false && (
          <div
            className={`${styles['add-account-box']} ${
              switching ? styles['disable-switching'] : ''
            }`}
          >
            <span className={styles['add-icon-box']}>
              <FaPlus className={styles['add-icon']} />
            </span>

            <span
              className={styles['add-text']}
              onClick={() => navigate('/auth?add=true')}
            >
              Add account
            </span>
          </div>
        )}
      </div>
    </section>
  );
};

export default SwitchAccount;
