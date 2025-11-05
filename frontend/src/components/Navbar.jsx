import React from 'react'
import { useNavigate } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'

function Navbar() {
  const navigate = useNavigate();
    const [userName, setUserName] = React.useState(null);

    React.useEffect(() => {
      // try to use cached user first
      const cached = localStorage.getItem('user');
      if (cached) {
        try {
          const u = JSON.parse(cached);
          setUserName(u?.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u?.email_id);
          return;
        } catch (e) { /* fall through to fetch */ }
      }

      // lazy load user profile if token exists
      const token = localStorage.getItem('access_token');
      if (!token) return;
      import('../utils/api').then(({ authAPI }) => {
        authAPI.getMe().then((res) => {
          setUserName(res.data?.first_name ? `${res.data.first_name} ${res.data.last_name || ''}`.trim() : res.data?.email_id);
          try { localStorage.setItem('user', JSON.stringify(res.data)); } catch (e) {}
        }).catch(() => {});
      });
    }, []);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('token_expires_at');
    navigate('/', { replace: true });
  };

  return (
    <header className="fixed top-0 w-full z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl sm:text-3xl font-extrabold bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">QueryBill</div>
          {/* <div className="hidden sm:block text-xs text-gray-500">Smart extraction & Q&A</div> */}
        </div>
        <div className="flex items-center gap-3">
          {userName && (
            <div className="text-sm text-gray-700 dark:text-gray-200 mr-2">{userName}</div>
          )}
          <button
            onClick={logout}
            className="px-3 py-1.5 text-sm rounded-md bg-red-50 hover:bg-red-100 text-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar


