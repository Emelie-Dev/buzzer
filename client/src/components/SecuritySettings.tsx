import styles from '../styles/SecuritySettings.module.css';
import { FaLaptop } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { MdSmartphone } from 'react-icons/md';
import { SettingsContext } from '../Contexts';
import { useContext } from 'react';
import { IoArrowBack } from 'react-icons/io5';

type SecuritySettingsProps = {
  category: string;
};

const SecuritySettings = ({ category }: SecuritySettingsProps) => {
  return (
    <>
      {category === 'alerts' ? (
        <SecurityAlerts />
      ) : category === 'devices' ? (
        <ManageDevices />
      ) : (
        ''
      )}
    </>
  );
};

// Classification of Security Alerts
// ✅ Info (General Notifications & Low-Risk Alerts)
// New login detected from Chrome on Windows.
// Successful login from a new device.
// Email address updated successfully.
// ⚠️ Warning (Suspicious Activities & Medium-Risk Alerts)
// Suspicious login attempt detected.
// Multiple failed login attempts.
// Unusual activity detected in your account.
// ❌ Critical (High-Risk Alerts & Immediate Action Required)
// Your account password was changed!
// Unauthorized access detected—account temporarily locked.
// Your account has been reported for violating community guidelines.

const SecurityAlerts = () => {
  const { setMainCategory } = useContext(SettingsContext);

  return (
    <div className={styles.section}>
      <h1 className={styles['section-head']}>
        <IoArrowBack
          className={styles['back-icon']}
          onClick={() => setMainCategory('')}
        />
        Security Alerts
      </h1>

      <div className={styles['alerts-container']}>
        <article className={`${styles.alert} ${styles.info}`}>
          <span className={styles['alert-message']}>
            New login detected from Redmi 10C at Lagos, Nigeria. If this wasn’t
            you, secure your account now.
          </span>

          <time className={styles.time}>12:23</time>
        </article>

        <article className={`${styles.alert} ${styles.warning}`}>
          <span className={styles['alert-message']}>
            Multiple failed login attempts detected. Please verify your account
            for any unusual activity.
          </span>

          <time className={styles.time}>02:11</time>
        </article>

        <article className={`${styles.alert} ${styles.critical}`}>
          <span className={styles['alert-message']}>
            Your account password has been successfully changed. If you didn’t
            initiate this change, please reset your password immediately.
          </span>

          <time className={styles.time}>2d</time>
        </article>
      </div>
    </div>
  );
};

const ManageDevices = () => {
  const { setMainCategory } = useContext(SettingsContext);
  return (
    <div className={styles.section}>
      <h1 className={styles['section-head']}>
        <IoArrowBack
          className={styles['back-icon']}
          onClick={() => setMainCategory('')}
        />
        Manage Devices
      </h1>

      <div className={styles['current-device']}>
        <span className={styles['current-device-text']}>Current device</span>

        <div className={styles.device}>
          <FaLaptop className={styles['device-icon']} />

          <div className={styles['device-details']}>
            <span className={styles['device-name']}>Dell Latitude</span>
            <span className={styles['login-method']}>
              Logged in with email address
            </span>
            <time className={styles['login-time']}>Jan 10 2025, 10:40 PM</time>
          </div>
        </div>
      </div>

      <div className={styles['other-devices']}>
        <span className={styles['current-device-text']}>Other devices</span>

        <div className={styles['devices-container']}>
          <article className={styles.device}>
            <FaLaptop className={styles['device-icon']} />

            <div className={styles['device-details']}>
              <span className={styles['device-name']}>Dell Latitude</span>
              <span className={styles['login-method']}>
                Logged in with email address
              </span>
              <time className={styles['login-time']}>
                Jan 10 2025, 10:40 PM
              </time>
            </div>

            <MdDelete className={styles['remove-icon']} title="Remove" />
          </article>

          <article className={styles.device}>
            <MdSmartphone className={styles['device-icon']} />

            <div className={styles['device-details']}>
              <span className={styles['device-name']}>Samsung A06</span>
              <span className={styles['login-method']}>
                Logged in with email address
              </span>
              <time className={styles['login-time']}>
                Jan 10 2025, 10:40 PM
              </time>
            </div>

            <MdDelete className={styles['remove-icon']} title="Remove" />
          </article>

          <article className={styles.device}>
            <FaLaptop className={styles['device-icon']} />

            <div className={styles['device-details']}>
              <span className={styles['device-name']}>Mackbook Pro</span>
              <span className={styles['login-method']}>
                Logged in with email address
              </span>
              <time className={styles['login-time']}>
                Jan 10 2025, 10:40 PM
              </time>
            </div>

            <MdDelete className={styles['remove-icon']} title="Remove" />
          </article>

          <article className={styles.device}>
            <MdSmartphone className={styles['device-icon']} />

            <div className={styles['device-details']}>
              <span className={styles['device-name']}>Redmi 10C</span>
              <span className={styles['login-method']}>
                Logged in with google account
              </span>
              <time className={styles['login-time']}>
                Jan 10 2025, 10:40 PM
              </time>
            </div>

            <MdDelete className={styles['remove-icon']} title="Remove" />
          </article>

          <article className={styles.device}>
            <FaLaptop className={styles['device-icon']} />

            <div className={styles['device-details']}>
              <span className={styles['device-name']}>Hp Elite</span>
              <span className={styles['login-method']}>
                Logged in with email address
              </span>
              <time className={styles['login-time']}>
                Jan 10 2025, 10:40 PM
              </time>
            </div>

            <MdDelete className={styles['remove-icon']} title="Remove" />
          </article>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
