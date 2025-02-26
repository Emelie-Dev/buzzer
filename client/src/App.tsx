import 'react-toastify/dist/ReactToastify.css';
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
import { GeneralContext } from './Contexts';
import { useState } from 'react';

const App = () => {
  const [settingsCategory, setSettingsCategory] = useState('');

  return (
    <>
      <GeneralContext.Provider
        value={{ settingsCategory, setSettingsCategory }}
      >
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/home" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/following" element={<Following />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/create" element={<Create />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </GeneralContext.Provider>
    </>
  );
};

export default App;
