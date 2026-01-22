import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLogout } from '../hooks/useAuth';
import { UserRole } from '@resbar/shared';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const logout = useLogout();

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleLogout = async () => {
    if (confirm('Deseja sair?')) {
      await logout.mutateAsync();
      navigate('/login');
    }
  };

  // Filtra navegação baseado na role do usuário
  const getVisibleLinks = () => {
    if (!user) return [];

    const links = [
      {
        path: '/tables',
        label: 'Mesas',
        roles: [UserRole.WAITER, UserRole.ADMIN, UserRole.STANDARD],
      },
      {
        path: '/kitchen',
        label: 'Cozinha',
        roles: [UserRole.KITCHEN, UserRole.ADMIN],
      },
      {
        path: '/menu',
        label: 'Cardápio',
        roles: [UserRole.WAITER, UserRole.ADMIN],
      },
      {
        path: '/waiters',
        label: 'Garçons',
        roles: [UserRole.ADMIN],
      },
      {
        path: '/inventory',
        label: 'Estoque',
        roles: [UserRole.WAITER, UserRole.KITCHEN, UserRole.ADMIN],
      },
      {
        path: '/dashboard',
        label: 'Dashboard',
        roles: [UserRole.ADMIN],
      },
    ];

    return links.filter(link => link.roles.includes(user.role));
  };

  const visibleLinks = getVisibleLinks();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">Resbar</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {visibleLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`${
                      isActive(link.path)
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* User Menu */}
            {isAuthenticated && user && (
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-gray-500 text-xs">{user.role}</div>
                </div>
                {user.avatar && (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
