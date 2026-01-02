import { useContext, useEffect, useState } from 'react';
import styles from '../styles/GeneralSettings.module.css';
import Engagements from './Engagements';
import Switch from './Switch';
import { IoArrowBack } from 'react-icons/io5';
import { AuthContext, GeneralContext, SettingsContext } from '../Contexts';
import { toast } from 'sonner';
import { apiClient } from '../Utilities';

const GeneralSettings = () => {
  const { user, setUser } = useContext(AuthContext);
  const { setMainCategory } = useContext(SettingsContext);
  const { display: category, setDisplay: setCategory } =
    useContext(GeneralContext);
  const [engagementModal, setEngagementModal] = useState<
    'followers' | 'following' | 'friends' | 'suggested' | 'private' | null
  >(null);
  const [privateAccount, setPrivateAccount] = useState<boolean>(
    user.settings.general.privacy.value
  );
  const [inbox, setInbox] = useState(user.settings.general.inbox);
  const [loading, setLoading] = useState({
    display: false,
    inbox: false,
    private: false,
  });

  useEffect(() => {
    if (category !== user.settings.general.display)
      updateGeneralSettings('display');
  }, [category, user]);

  useEffect(() => {
    if (inbox !== user.settings.general.inbox) updateGeneralSettings('inbox');
  }, [inbox, user]);

  useEffect(() => {
    if (privateAccount !== user.settings.general.privacy.value)
      updateGeneralSettings('private');
  }, [privateAccount, user]);

  const updateGeneralSettings = async (
    type: 'display' | 'inbox' | 'private'
  ) => {
    if (loading[type]) return;

    setLoading((prev) => ({ ...prev, [type]: true }));
    const payload = { display: category, inbox, privacy: privateAccount };

    try {
      const { data } = await apiClient.patch(
        'v1/users/settings/general',
        payload
      );
      setUser(data.data.user);
    } catch {
      if (type === 'display') setCategory(user.settings.general.display);
      else if (type === 'inbox') setInbox(user.settings.general.inbox);
      else setPrivateAccount(user.settings.general.privacy.value);

      return toast.error(
        `Could not update ${type === 'private' ? 'privacy' : type} settings.`
      );
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  return (
    <>
      <section className={styles.section}>
        <h1 className={styles['section-head']}>
          <IoArrowBack
            className={styles['back-icon']}
            onClick={() => setMainCategory('')}
          />
          General Settings
        </h1>

        <div className={styles.category}>
          <span className={styles['category-head']}>Display</span>

          <div
            className={`${styles['display-box']} ${
              loading.display ? styles['disable-category'] : ''
            }`}
          >
            <span className={styles['mode-box']}>
              <span
                className={`${styles['img-box']} ${
                  category === 'light' ? styles['current-category'] : ''
                }`}
                onClick={() => setCategory('light')}
              >
                <img
                  className={styles['mode-img']}
                  src="../../assets/images/others/light-mode.png"
                />
                <input
                  className={styles['mode-input']}
                  type="radio"
                  checked={category === 'light'}
                  readOnly
                />
              </span>
              <span className={styles['mode-name']}>Light</span>
            </span>

            <span className={styles['mode-box']}>
              <span
                className={`${styles['img-box']} ${
                  category === 'dark' ? styles['current-category'] : ''
                }`}
                onClick={() => setCategory('dark')}
              >
                <img
                  className={styles['mode-img']}
                  src="../../assets/images/others/dark-mode.png"
                />
                <input
                  className={styles['mode-input']}
                  type="radio"
                  checked={category === 'dark'}
                  readOnly
                />
              </span>
              <span className={styles['mode-name']}>Dark</span>
            </span>

            <span className={styles['mode-box']}>
              <span
                className={`${styles['img-box']} ${
                  category === 'system' ? styles['current-category'] : ''
                }`}
                onClick={() => setCategory('system')}
              >
                <img
                  className={styles['mode-img']}
                  src="../../assets/images/others/default.jpg"
                />
                <input
                  className={styles['mode-input']}
                  type="radio"
                  checked={category === 'system'}
                  readOnly
                />
              </span>
              <span className={styles['mode-name']}>System</span>
            </span>
          </div>
        </div>

        <div className={styles.category}>
          <span className={styles['category-head']}>Inbox</span>

          <div className={styles['inbox-div']}>
            <span className={styles['inbox-text']}>Who can message you.</span>
            {/* Everyone, friends, followers, no one */}
            <div
              className={`${styles['inbox-list']} ${
                loading.inbox ? styles['disable-category'] : ''
              }`}
            >
              <span className={styles['inbox-box']}>
                <input
                  className={styles['inbox-input']}
                  type="radio"
                  id="inbox-everyone"
                  name="inbox-value"
                  checked={inbox === 0}
                  onChange={() => setInbox(0)}
                />
                <label
                  className={styles['inbox-label']}
                  htmlFor="inbox-everyone"
                >
                  Everyone
                </label>
              </span>
              <span className={styles['inbox-box']}>
                <input
                  className={styles['inbox-input']}
                  type="radio"
                  id="inbox-friends"
                  name="inbox-value"
                  checked={inbox === 1}
                  onChange={() => setInbox(1)}
                />
                <label
                  className={styles['inbox-label']}
                  htmlFor="inbox-friends"
                >
                  Friends
                </label>
              </span>
              <span className={styles['inbox-box']}>
                <input
                  className={styles['inbox-input']}
                  type="radio"
                  id="inbox-followers"
                  name="inbox-value"
                  checked={inbox === 2}
                  onChange={() => setInbox(2)}
                />
                <label
                  className={styles['inbox-label']}
                  htmlFor="inbox-followers"
                >
                  Followers
                </label>
              </span>
              <span className={styles['inbox-box']}>
                <input
                  className={styles['inbox-input']}
                  type="radio"
                  id="inbox-no-one"
                  name="inbox-value"
                  checked={inbox === 3}
                  onChange={() => setInbox(3)}
                />
                <label className={styles['inbox-label']} htmlFor="inbox-no-one">
                  No one
                </label>
              </span>
            </div>
          </div>
        </div>

        <div className={styles.category}>
          <span className={styles['category-head']}>Private Account</span>

          <div
            className={`${styles['privacy-div']} ${
              loading.private ? styles['disable-category'] : ''
            }`}
          >
            <span className={styles['privacy-box']}>
              <span className={styles['privacy-text']}>
                Private accounts limit post and story visibility to approved
                users only. Followers who aren’t approved won’t see your
                content.
              </span>

              <Switch value={privateAccount} setter={setPrivateAccount} />
            </span>

            <button
              className={`${styles['privacy-btn']} ${
                !privateAccount || loading.private ? styles['disable-btn'] : ''
              }`}
              onClick={
                privateAccount ? () => setEngagementModal('private') : undefined
              }
            >
              Edit approved users
            </button>
          </div>
        </div>
      </section>

      {engagementModal === 'private' && (
        <Engagements value={engagementModal} setValue={setEngagementModal} />
      )}
    </>
  );
};

export default GeneralSettings;
