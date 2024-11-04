import 'react-toastify/dist/ReactToastify.css';
import { Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import Home from './pages/Home';

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </>
  );
};

export default App;
