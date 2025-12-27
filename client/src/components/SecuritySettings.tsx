import styles from '../styles/SecuritySettings.module.css';
import { FaLaptop, FaTabletAlt, FaTv } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { MdSmartphone } from 'react-icons/md';
import { SettingsContext } from '../Contexts';
import { useContext, useEffect, useState } from 'react';
import { IoArrowBack } from 'react-icons/io5';
import { toast } from 'sonner';
import { apiClient, getTime, monthLabels } from '../Utilities';
import Skeleton from 'react-loading-skeleton';
import LoadingAnimation from './LoadingAnimation';
import { HiOutlineDeviceTablet } from 'react-icons/hi';

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

const SecurityAlerts = () => {
  const { setMainCategory, sectionRef } = useContext(SettingsContext);
  const [alertsData, setAlertsData] = useState<{
    loading: boolean | 'error';
    cursor: Date;
    end: boolean;
  }>({ loading: true, cursor: null!, end: false });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [deleteData, setDeleteData] = useState<{
    list: Set<string>;
    loading: boolean;
  }>({ list: new Set(), loading: false });

  useEffect(() => {
    const container = sectionRef.current;

    if (container) {
      container.removeEventListener('scroll', handleScroll);
      container.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [alerts, alertsData, sectionRef]);

  useEffect(() => {
    if (alertsData.loading === true) getSecurityAlerts();
  }, [alertsData]);

  const getSecurityAlerts = async () => {
    try {
      const { data } = await apiClient(
        `v1/notifications/security?cursor=${alertsData.cursor}`
      );

      setAlerts((prev) => {
        let newNotifications: any[] = data.data.notifications;

        if (newNotifications.length > 0)
          newNotifications = newNotifications.filter(
            (obj) => !prev.find((data) => obj._id === data._id)
          );

        return [...prev, ...newNotifications];
      });
      setAlertsData((prev) => ({
        ...prev,
        loading: false,
        end: data.data.notifications.length < 20,
      }));
    } catch {
      setAlertsData((prev) => ({ ...prev, loading: 'error' }));
      return toast.error('Could not get security alerts.');
    }
  };

  const updateDeleteList =
    (id: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
        setDeleteData((prev) => ({
          ...prev,
          list: new Set(prev.list).add(id),
        }));
      } else {
        setDeleteData((prev) => {
          const list = new Set(prev.list);
          list.delete(id);
          return { ...prev, list };
        });
      }
    };

  const getAlertText = (alert: any) => {
    const typeName = alert.type[1];
    const typeDetails = alert.type[2];

    if (typeName === 'login') {
      if (typeDetails === 'new') {
        return (
          <article key={alert._id} className={`${styles.alert} ${styles.info}`}>
            <span className={styles['alert-message']}>
              New login detected from {alert.data.deviceName} at{' '}
              {alert.data.city}, {alert.data.country}. If this wasn’t you,
              secure your account now.
            </span>

            <div className={styles['time-box']}>
              <time className={styles.time}>{getTime(alert.createdAt)}</time>

              <input
                className={`${
                  deleteData.list.size > 0 ? styles['show-checkbox'] : ''
                }`}
                type="checkbox"
                checked={deleteData.list.has(alert._id)}
                onChange={updateDeleteList(alert._id)}
              />
            </div>
          </article>
        );
      } else if (typeDetails === 'multiple') {
        return (
          <article key={alert._id} className={`${styles.alert} ${styles.info}`}>
            <span className={styles['alert-message']}>
              Your account is currently logged in on multiple{' '}
              <b>({alert.data.count})</b> devices. If this seems unusual, please
              review and manage your devices.
            </span>

            <div className={styles['time-box']}>
              <time className={styles.time}>{getTime(alert.createdAt)}</time>

              <input
                className={`${
                  deleteData.list.size > 0 ? styles['show-checkbox'] : ''
                }`}
                type="checkbox"
                checked={deleteData.list.has(alert._id)}
                onChange={updateDeleteList(alert._id)}
              />
            </div>
          </article>
        );
      } else if (typeDetails === 'failed') {
        return (
          <article
            key={alert._id}
            className={`${styles.alert} ${styles.warning}`}
          >
            <span className={styles['alert-message']}>
              We detected several failed login attempts from
              <b>{alert.data.deviceName}</b> in{' '}
              <b>
                {alert.data.city}, {alert.data.country}
              </b>
              . If this wasn’t you, please check your security and review your
              devices in Settings.
            </span>

            <div className={styles['time-box']}>
              <time className={styles.time}>{getTime(alert.createdAt)}</time>

              <input
                className={`${
                  deleteData.list.size > 0 ? styles['show-checkbox'] : ''
                }`}
                type="checkbox"
                checked={deleteData.list.has(alert._id)}
                onChange={updateDeleteList(alert._id)}
              />
            </div>
          </article>
        );
      }
    } else if (typeName === 'password') {
      return (
        <article
          key={alert._id}
          className={`${styles.alert} ${styles.critical}`}
        >
          <span className={styles['alert-message']}>
            Your password was recently changed. If this wasn’t you, secure your
            account immediately.
          </span>

          <div className={styles['time-box']}>
            <time className={styles.time}>{getTime(alert.createdAt)}</time>

            <input
              className={`${
                deleteData.list.size > 0 ? styles['show-checkbox'] : ''
              }`}
              type="checkbox"
              checked={deleteData.list.has(alert._id)}
              onChange={updateDeleteList(alert._id)}
            />
          </div>
        </article>
      );
    }
  };

  const handleScroll = () => {
    const target = sectionRef.current;
    const isBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 50;

    if (isBottom && !alertsData.end && alertsData.loading === false) {
      setAlertsData((prev) => {
        const cursor =
          alerts.length > 0 ? alerts[alerts.length - 1].createdAt : null;

        return {
          ...prev,
          loading: true,
          cursor: prev.loading === 'error' ? prev.cursor : cursor,
        };
      });
    }
  };

  const deleteNotifications = async () => {
    if (deleteData.loading) return;

    setDeleteData((prev) => ({ ...prev, loading: true }));

    try {
      await apiClient.delete('v1/notifications', {
        data: {
          notifications: [...deleteData.list],
        },
      });

      setAlerts((prev) => prev.filter((obj) => !deleteData.list.has(obj._id)));
      setDeleteData((prev) => ({ ...prev, list: new Set() }));

      toast.success(
        `Alert${deleteData.list.size > 1 ? 's' : ''} deleted successfully.`
      );
    } catch {
      toast.error(
        `Unable to delete alert${
          deleteData.list.size > 1 ? 's' : ''
        }. Please try again.`
      );
    } finally {
      setDeleteData((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className={styles.section} onScroll={handleScroll}>
      <h1 className={styles['section-head']}>
        <IoArrowBack
          className={styles['back-icon']}
          onClick={() => setMainCategory('')}
        />
        Security Alerts
      </h1>

      {deleteData.list.size > 0 && (
        <div className={styles['select-box']}>
          <span>
            Selected {deleteData.list.size}{' '}
            {deleteData.list.size === 1 ? 'item' : 'items'}
          </span>

          <div className={styles['select-btn-box']}>
            <button
              className={`${styles['cancel-btn']} ${
                deleteData.loading ? styles['disable-btn'] : ''
              }`}
              onClick={() =>
                setDeleteData((prev) => ({ ...prev, list: new Set() }))
              }
            >
              Cancel
            </button>
            <button
              className={`${styles['delete-btn']} ${
                deleteData.loading ? styles['disable-btn'] : ''
              }`}
              onClick={deleteNotifications}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <div className={styles['alerts-container']}>
        {alerts.length === 0 && alertsData.loading === true ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              height={80}
              style={{ marginBottom: '1rem' }}
            />
          ))
        ) : alerts.length === 0 && alertsData.loading === 'error' ? (
          <div className={styles['no-data-text']}>
            Unable to load security alerts. Check your connection and try again.
            <div className={styles['error-btn']}>
              <button
                onClick={() => {
                  setAlertsData((prev) => ({
                    ...prev,
                    loading: true,
                  }));
                }}
              >
                Try again
              </button>
            </div>
          </div>
        ) : alerts.length === 0 ? (
          <div className={styles['no-data-text']}>
            No security alerts available.
          </div>
        ) : (
          <>
            {alerts.map((alert) => getAlertText(alert))}

            {alertsData.loading === true && alertsData.cursor !== null && (
              <div className={styles['loader-box']}>
                <LoadingAnimation
                  style={{
                    width: '2rem',
                    height: '2rem',
                    transform: 'scale(2.5)',
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const ManageDevices = () => {
  const { setMainCategory } = useContext(SettingsContext);
  const [sessions, setSessions] = useState<{ active: any; others: any[] }>({
    active: null!,
    others: null!,
  });
  const [loading, setLoading] = useState<boolean | 'error'>(true);
  const [deleteList, setDeleteList] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (loading === true) getSessions();
  }, [loading]);

  const getSessions = async () => {
    try {
      const { data } = await apiClient('v1/auth/sessions');
      const result: any[] = data.data.sessions;

      setSessions({
        active: result.find((obj) => obj.active),
        others: result.filter((obj) => !obj.active),
      });
      setLoading(false);
    } catch {
      setLoading('error');
    }
  };

  const getDeviceIcon = (
    type:
      | 'mobile'
      | 'tablet'
      | 'console'
      | 'smarttv'
      | 'wearable'
      | 'xr'
      | 'embedded'
      | 'desktop'
      | 'api-client'
  ) => {
    if (type === 'mobile') {
      return <MdSmartphone className={styles['device-icon']} />;
    } else if (type === 'desktop') {
      return <FaLaptop className={styles['device-icon']} />;
    } else if (type === 'tablet') {
      return <FaTabletAlt className={styles['device-icon']} />;
    } else if (type === 'smarttv') {
      return <FaTv className={styles['device-icon']} />;
    } else {
      return <HiOutlineDeviceTablet className={styles['device-icon']} />;
    }
  };

  const getTime = (timeString: string) => {
    const time = new Date(timeString);
    const hour = time.getHours();
    const minute = time.getMinutes();
    const month = time.getMonth();
    const year = time.getFullYear();
    const day = time.getDate();

    const suffix = hour < 12 ? 'AM' : 'PM';
    const hourText =
      hour === 0
        ? '12'
        : hour > 12
        ? `${String(hour - 12).padStart(2, '0')}`
        : `${String(hour).padStart(2, '0')}`;

    return `${monthLabels[month]} ${day} ${year}, ${hourText}:${String(
      minute
    ).padStart(2, '0')} ${suffix}`;
  };

  const deleteSession = (id: string) => async () => {
    if (deleteList.has(id)) return;

    setDeleteList((prev) => new Set(prev).add(id));

    try {
      await apiClient.delete(`v1/auth/sessions/${id}`);
      setSessions((prev) => ({
        active: prev.active,
        others: prev.others.filter((obj) => obj._id !== id),
      }));
      return toast.success('Device removed successfully!');
    } catch (err: any) {
      const message = 'Could not remove device.';
      if (err.response) {
        return toast.error(err.response.data.message || message);
      } else {
        return toast.error(message);
      }
    } finally {
      setDeleteList((prev) => {
        const set = new Set(prev);
        set.delete(id);
        return set;
      });
    }
  };

  return (
    <div className={styles.section}>
      <h1 className={styles['section-head']}>
        <IoArrowBack
          className={styles['back-icon']}
          onClick={() => setMainCategory('')}
        />
        Manage Devices
      </h1>

      <div>
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
          <div
            className={`${styles['no-data-text']} ${styles['devices-error-text']}`}
          >
            Unable to load devices. Check your connection and try again.
            <div className={styles['error-btn']}>
              <button onClick={() => setLoading(true)}>Try again</button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles['current-device']}>
              <span className={styles['current-device-text']}>
                Current device
              </span>

              {sessions.active && (
                <div className={styles.device}>
                  {getDeviceIcon(sessions.active.platform)}

                  <div className={styles['device-details']}>
                    <span className={styles['device-name']}>
                      {sessions.active.deviceName}
                    </span>
                    <span className={styles['login-method']}>
                      Logged in with{' '}
                      {sessions.active.loginMethod === 'google'
                        ? 'google account'
                        : 'email address'}
                    </span>
                    <time className={styles['login-time']}>
                      {getTime(sessions.active.createdAt)}
                    </time>
                    <span className={styles['last-used-box']}>
                      <i>Last Used:</i>{' '}
                      <time>{getTime(sessions.active.lastUsedAt)}</time>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {sessions.others.length > 0 && (
              <div className={styles['other-devices']}>
                <span className={styles['current-device-text']}>
                  Other devices
                </span>

                <div className={styles['devices-container']}>
                  {sessions.others.map((device) => (
                    <article key={device._id} className={styles.device}>
                      {getDeviceIcon(device.platform)}

                      <div className={styles['device-details']}>
                        <span className={styles['device-name']}>
                          {device.deviceName}
                        </span>
                        <span className={styles['login-method']}>
                          Logged in with{' '}
                          {device.loginMethod === 'google'
                            ? 'google account'
                            : 'email address'}
                        </span>
                        <time className={styles['login-time']}>
                          {getTime(device.createdAt)}
                        </time>
                        <span className={styles['last-used-box']}>
                          <i>Last Used:</i>{' '}
                          <time>{getTime(device.lastUsedAt)}</time>
                        </span>
                      </div>

                      <MdDelete
                        className={`${styles['remove-icon']} ${
                          deleteList.has(device._id)
                            ? styles['disable-btn']
                            : ''
                        }`}
                        title="Remove"
                        onClick={deleteSession(device._id)}
                      />
                    </article>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SecuritySettings;
