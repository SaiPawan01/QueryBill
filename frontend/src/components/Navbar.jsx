 import React from 'react'
import { useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate();
    const [userName, setUserName] = React.useState(null);

    React.useEffect(() => {
      // lazy load user profile if token exists
      const token = localStorage.getItem('access_token');
      if (!token) return;
      import('../utils/api').then(({ authAPI }) => {
        authAPI.getMe().then((res) => {
          setUserName(res.data?.first_name ? `${res.data.first_name} ${res.data.last_name || ''}`.trim() : res.data?.email_id);
        }).catch(() => {});
      });
    }, []);

  const logout = () => {
    localStorage.removeItem('access_token');
    navigate('/', { replace: true });
  };

  return (
    <header className="top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="font-semibold text-gray-800 dark:text-gray-100">QueryBill</div>
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


