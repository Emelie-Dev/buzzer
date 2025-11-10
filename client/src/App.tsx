import 'react-loading-skeleton/dist/skeleton.css';
import { Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Search from './pages/Search';
import Following from './pages/Following';
import Friends from './pages/Friends';
import Reels from './pages/Reels';
import Notifications from './pages/Notifications';
import Inbox from './pages/Inbox';
import Create from './pages/Create';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import History from './pages/History';
import { AuthContext, GeneralContext, StoryContext } from './Contexts';
import { useEffect, useState } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'sonner';
import { apiClient } from './Utilities';

const App = () => {
  const [settingsCategory, setSettingsCategory] = useState('');
  const [createCategory, setCreateCategory] = useState<
    'reel' | 'content' | 'story'
  >('content');
  const [scrollingUp, setScrollingUp] = useState<boolean | null>(null);
  const [showSearchPage, setShowSearchPage] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null!);
  const [stories, setStories] = useState<any[]>(null!);
  const [userStory, setUserStory] = useState<any[]>(null!);
  const [viewStory, setViewStory] = useState<boolean>(false);
  const [storyIndex, setStoryIndex] = useState<number>(0);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>(null!);
  const [showFriendRequests, setShowFriendRequests] = useState<boolean>(false);
  const [showCollaborationRequests, setShowCollaborationRequests] =
    useState<boolean>(false);

  useEffect(() => {
    const deviceId = crypto.randomUUID();
    const id = localStorage.getItem('deviceId');
    if (!id) localStorage.setItem('deviceId', deviceId);

    const getSuggestedUsers = async () => {
      try {
        const { data } = await apiClient('v1/users/suggested');
        setSuggestedUsers(data.data.users);
      } catch {
        setSuggestedUsers([]);
      }
    };

    getSuggestedUsers();
  }, []);

  return (
    <>
      <Toaster
        expand
        visibleToasts={1}
        position="top-right"
        toastOptions={{}}
      />

      <AuthContext.Provider value={{ user, setUser }}>
        <GeneralContext.Provider
          value={{
            settingsCategory,
            setSettingsCategory,
            createCategory,
            setCreateCategory,
            scrollingUp,
            setScrollingUp,
            showSearchPage,
            setShowSearchPage,
            suggestedUsers,
            setSuggestedUsers,
            showFriendRequests,
            setShowFriendRequests,
            showCollaborationRequests,
            setShowCollaborationRequests,
          }}
        >
          <StoryContext.Provider
            value={{
              viewStory,
              setViewStory,
              storyIndex,
              setStoryIndex,
              stories,
              userStory,
              setUserStory,
              setStories,
            }}
          >
            <Routes>
              <Route path="/" element={<Auth />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/forgot-password"
                element={<Auth leftStatus="forgot" />}
              />
              <Route
                path="/reset-password"
                element={<Auth leftStatus="reset" />}
              />
              <Route path="/home" element={<ProtectedRoute element={Home} />} />
              <Route
                path="/search"
                element={<ProtectedRoute element={Search} />}
              />
              <Route
                path="/following"
                element={<ProtectedRoute element={Following} />}
              />
              <Route
                path="/friends"
                element={<ProtectedRoute element={Friends} />}
              />
              <Route
                path="/reels"
                element={<ProtectedRoute element={Reels} />}
              />
              <Route
                path="/notifications"
                element={<ProtectedRoute element={Notifications} />}
              />
              <Route
                path="/inbox"
                element={<ProtectedRoute element={Inbox} />}
              />
              <Route
                path="/create"
                element={<ProtectedRoute element={Create} />}
              />
              <Route
                path="/profile"
                element={<ProtectedRoute element={Profile} />}
              />
              <Route
                path="/settings"
                element={<ProtectedRoute element={Settings} />}
              />
              <Route
                path="/analytics"
                element={<ProtectedRoute element={Analytics} />}
              />
              <Route
                path="/history"
                element={<ProtectedRoute element={History} />}
              />
            </Routes>
          </StoryContext.Provider>
        </GeneralContext.Provider>
      </AuthContext.Provider>
    </>
  );
};

export default App;
