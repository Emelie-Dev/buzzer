import { useLocation } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import User from '../pages/User';
import ErrorPage from '../pages/Error';

const UserResolver = () => {
  const { pathname } = useLocation();
  const username = pathname.startsWith('/@') ? pathname.slice(2).trim() : '';

  return username ? (
    <ProtectedRoute
      element={User}
      username={username}
      componentKey={username}
    />
  ) : (
    <ErrorPage code={404} />
  );
};

export default UserResolver;
