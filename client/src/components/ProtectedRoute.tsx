import React, { useContext, useEffect, useState } from 'react';
import { apiClient } from '../Utilities';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../Contexts';
import LoadingAnimation from './LoadingAnimation';
import styles from '../styles/ProtectedRoute.module.css';

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
  const { setUser } = useContext(AuthContext);

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

  return (
    <>
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
