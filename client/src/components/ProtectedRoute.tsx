import React, { useContext, useEffect, useRef, useState } from 'react';
import { apiClient } from '../Utilities';
import { Navigate } from 'react-router-dom';
import { AuthContext, StoryContext, TimeManagementContext } from '../Contexts';
import LoadingAnimation from './LoadingAnimation';
import styles from '../styles/ProtectedRoute.module.css';
import StoryModal from '../components/StoryModal';
import ConfirmModal from './ConfirmModal';

type ProtectedRouteProps<T = any> = {
  element: React.ComponentType;
} & T;

const ProtectedRoute = ({
  element: Component,
  ...props
}: ProtectedRouteProps) => {
  const scrollBreakValue = parseInt(
    window.sessionStorage.getItem('scrollBreak')! || '0',
  );
  const [authCheck, setAuthCheck] = useState<'fail' | 'success' | 'loading'>(
    'loading',
  );
  const {
    userStory,
    setUserStory,
    stories,
    setStories,
    viewStory,
    storyIndex,
  } = useContext(StoryContext);
  const [notify, setNotify] = useState<string>(null!);
  const [confirmModal, setConfirmModal] = useState<boolean>(false);

  const { user, setUser } = useContext(AuthContext);
  const { screenTime } = useContext(TimeManagementContext);

  const screenTimeTimer = useRef<number>(null!);
  const summaryTimer = useRef<number>(null!);
  const loading = useRef<boolean>(false);
  const scrollBreak = useRef<number>(scrollBreakValue);

  useEffect(() => {
    document.title = 'Buzzer';

    const checkUserAuth = async () => {
      try {
        const response = await apiClient('v1/auth/auth-check');
        setUser(response.data.data.user);
        setAuthCheck('success');
      } catch {
        setAuthCheck('fail');
      }
    };

    checkUserAuth();
  }, []);

  useEffect(() => {
    if (authCheck === 'success') {
      const getStories = async () => {
        try {
          const { data } = await apiClient('v1/stories');

          setUser(data.data.user);
          setStories(data.data.users);
          setUserStory(data.data.userStories);
        } catch {
          setStories(stories === null ? [] : stories);
          setUserStory(userStory === null ? [] : userStory);
        }
      };

      getStories();
    }
  }, [authCheck]);

  useEffect(() => {
    let screenTimeInterval = screenTimeTimer.current;
    let summaryTimerInterval = summaryTimer.current;

    const handleScreenTime = async () => {
      if (document.visibilityState === 'hidden') {
        clearInterval(screenTimeInterval);
        clearInterval(summaryTimerInterval);
      }

      const startTime = new Date();
      startTime.setHours(
        user.settings.content.timeManagement.sleepReminders.value.startTime,
        0,
        0,
        0,
      );

      if (!user.settings.content.timeManagement.scrollBreak.enabled) {
        window.sessionStorage.setItem('scrollBreak', String(0));
      }

      if (
        !user.settings.content.timeManagement.sleepReminders.enabled ||
        new Date() < startTime
      ) {
        window.sessionStorage.setItem('sleepReminders', '');
      }

      if (document.visibilityState === 'visible') {
        screenTimeInterval = setInterval(() => {
          screenTime.current += 1;
          if (user.settings.content.timeManagement.scrollBreak.enabled)
            scrollBreak.current += 1;
        }, 1000);

        summaryTimerInterval = setInterval(() => {
          if (user.settings.content.timeManagement.scrollBreak.enabled)
            handleScrollBreak();
          if (user.settings.content.timeManagement.sleepReminders.enabled)
            handleSleepReminders();
          updateScreenTime();
        }, 60 * 1000);
      }
    };

    if (user && authCheck === 'success') {
      handleScreenTime();
      notifyDailyLimit(user);
      document.addEventListener('visibilitychange', handleScreenTime);
    } else {
      document.removeEventListener('visibilitychange', handleScreenTime);
    }

    return () => {
      clearInterval(screenTimeInterval);
      clearInterval(summaryTimerInterval);
      document.removeEventListener('visibilitychange', handleScreenTime);
    };
  }, [authCheck, user]);

  const getFullStories = () => {
    const userObj = {
      user: {
        name: user.name,
        username: user.username,
        photo: user.photo,
        _id: user._id,
      },
      stories: userStory,
    };

    const fullStories = userStory.length > 0 ? [userObj, ...stories] : stories;

    return fullStories;
  };

  const handleStoryItems = (itemIndex: number) => {
    let start;
    const end = itemIndex + 2;

    if (itemIndex == 0) start = 0;
    else start = itemIndex - 1;

    const fullStories = getFullStories();

    return fullStories.map((item, index) => {
      if (index >= start && index < end) return item;
      else return null;
    });
  };

  const updateScreenTime = async () => {
    if (loading.current) return;
    loading.current = true;

    try {
      const value = screenTime.current;

      const { data } = await apiClient.patch('v1/users/screen-time', {
        value,
      });
      screenTime.current = screenTime.current - value;

      const userData = data.data.user;
      await notifyDailyLimit(userData);

      // eslint-disable-next-line no-empty
    } catch {
    } finally {
      loading.current = false;
    }
  };

  const notifyDailyLimit = async (userData: any) => {
    if (userData.settings.content.timeManagement.dailyLimit.enabled) {
      if (!userData.settings.content.timeManagement.dailyLimit.notified) {
        const summary = userData.settings.content.timeManagement.summary;
        const value = userData.settings.content.timeManagement.dailyLimit.value;

        const day = new Date().toISOString().split('T')[0];
        const data = summary[day] || 0;

        if (data >= value * 60) {
          setNotify('daily-limit');
          setConfirmModal(true);

          const { data: result } = await apiClient.patch(
            'v1/users/daily-limit',
          );
          setUser(result.data.user);
        }
      }
    }
  };

  const handleScrollBreak = () => {
    const currentValue = parseInt(
      window.sessionStorage.getItem('scrollBreak')! || '0',
    );
    const newValue = currentValue + scrollBreak.current;
    window.sessionStorage.setItem('scrollBreak', String(newValue));
    scrollBreak.current = 0;

    const breakValue =
      user.settings.content.timeManagement.scrollBreak.value * 60;

    if (newValue >= breakValue) {
      setNotify('scroll-break');
      setConfirmModal(true);
      window.sessionStorage.setItem('scrollBreak', String(0));
    }
  };

  const handleSleepReminders = async () => {
    const sleepReminders = window.sessionStorage.getItem('sleepReminders');

    if (sleepReminders !== 'notified') {
      const startTime = new Date();
      startTime.setHours(
        user.settings.content.timeManagement.sleepReminders.value.startTime,
        0,
        0,
        0,
      );
      const endTime = new Date();
      endTime.setDate(new Date().getDate() + 1);
      endTime.setHours(
        user.settings.content.timeManagement.sleepReminders.value.endTime,
        0,
        0,
        0,
      );

      const day = new Date().getDay();
      const days =
        user.settings.content.timeManagement.sleepReminders.value.days;

      if (
        days.includes(day) &&
        new Date() >= startTime &&
        new Date() < endTime
      ) {
        setNotify('sleep-reminders');
        setConfirmModal(true);
        window.sessionStorage.setItem('sleepReminders', 'notified');
      }
    }
  };

  return (
    <>
      {viewStory && (
        <StoryModal
          stories={getFullStories()}
          storiesSet={handleStoryItems(storyIndex)}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          setConfirmModal={setConfirmModal}
          functionArray={[{ caller: setNotify, value: [null], type: 'both' }]}
          limitType={notify}
        />
      )}

      {authCheck === 'loading' ? (
        <div className={styles['loader-box']}>
          <LoadingAnimation
            style={{
              width: '11rem',
              height: '11rem',
              transform: 'scale(2)',
            }}
          />
        </div>
      ) : authCheck === 'success' ? (
        'componentKey' in props ? (
          <Component key={props.componentKey} {...props} />
        ) : (
          <Component {...props} />
        )
      ) : (
        <Navigate to={'/auth'} />
      )}
    </>
  );
};

export default ProtectedRoute;
