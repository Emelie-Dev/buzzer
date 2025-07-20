import React, { useContext, useEffect, useState } from 'react';
import { apiClient } from '../Utilities';
import { Navigate } from 'react-router-dom';
import { AuthContext, StoryContext } from '../Contexts';
import LoadingAnimation from './LoadingAnimation';
import styles from '../styles/ProtectedRoute.module.css';
import StoryModal from '../components/StoryModal';

type ProtectedRouteProps = {
  element: React.ComponentType;
};

const ProtectedRoute = ({
  element: Component,
  ...props
}: ProtectedRouteProps) => {
  const [authCheck, setAuthCheck] = useState<'fail' | 'success' | 'loading'>(
    'loading'
  );
  const {
    userStory,
    setUserStory,
    stories,
    setStories,
    viewStory,
    storyIndex,
  } = useContext(StoryContext);

  const { user, setUser } = useContext(AuthContext);

  useEffect(() => {
    document.title = 'Buzzer';

    const checkUserAuth = async () => {
      try {
        const response = await apiClient('api/v1/auth/auth-check');
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
          const { data } = await apiClient('api/v1/stories');

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

  return (
    <>
      {viewStory && (
        <StoryModal
          stories={getFullStories()}
          storiesSet={handleStoryItems(storyIndex)}
        />
      )}

      {authCheck === 'loading' ? (
        <div className={styles['loader-box']}>
          <LoadingAnimation
            style={{ width: '7.5rem', height: '7.5rem', transform: 'scale(2)' }}
          />
          <span className={styles['app-name']}>Buzzer</span>
        </div>
      ) : authCheck === 'success' ? (
        <Component {...props} />
      ) : (
        <Navigate to={'/auth'} />
      )}
    </>
  );
};

export default ProtectedRoute;
