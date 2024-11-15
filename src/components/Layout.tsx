import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Desktop Navigation */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <button onClick={() => navigate('/')} className="flex items-center">
                  <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  <span className="ml-2 text-xl font-bold text-gray-900">GiftSwitch</span>
                </button>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <button 
                  onClick={() => navigate('/')}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${
                    location.pathname === '/' 
                      ? 'text-gray-900 border-primary'
                      : 'text-gray-500 border-transparent hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/groups')}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${
                    location.pathname === '/groups'
                      ? 'text-gray-900 border-primary'
                      : 'text-gray-500 border-transparent hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  My Groups
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <span className="sr-only">Open main menu</span>
                {!showMobileMenu ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>

            {/* Desktop Right Navigation */}
            <div className="hidden md:flex md:items-center">
              <button
                onClick={() => navigate('/notifications')}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <span className="sr-only">View notifications</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>

              <div className="ml-3 relative">
                <div>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                      {user?.user_metadata?.full_name
                        ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                        : user?.email?.[0].toUpperCase() || '?'}
                    </span>
                  </button>
                </div>

                {showUserMenu && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-2 text-xs text-gray-500">
                      Signed in as<br />
                      <span className="font-medium text-gray-900">{user?.email}</span>
                    </div>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowUserMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Your Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setShowUserMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </button>
                    <button
                      onClick={async () => {
                        await signOut();
                        setShowUserMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <button
                onClick={() => {
                  navigate('/');
                  setShowMobileMenu(false);
                }}
                className={`block w-full text-left px-3 py-2 text-base font-medium ${
                  location.pathname === '/'
                    ? 'text-primary border-l-4 border-primary bg-primary bg-opacity-10'
                    : 'text-gray-600 hover:bg-gray-50 hover:border-gray-300 border-l-4 border-transparent'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  navigate('/groups');
                  setShowMobileMenu(false);
                }}
                className={`block w-full text-left px-3 py-2 text-base font-medium ${
                  location.pathname === '/groups'
                    ? 'text-primary border-l-4 border-primary bg-primary bg-opacity-10'
                    : 'text-gray-600 hover:bg-gray-50 hover:border-gray-300 border-l-4 border-transparent'
                }`}
              >
                My Groups
              </button>
            </div>
            
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                    <span className="text-lg font-medium leading-none text-white">
                      {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || '?'}
                    </span>
                  </span>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {user?.user_metadata?.full_name || 'User'}
                  </div>
                  <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={() => {
                    navigate('/profile');
                    setShowMobileMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  Your Profile
                </button>
                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowMobileMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  Settings
                </button>
                <button
                  onClick={async () => {
                    await signOut();
                    setShowMobileMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pb-6">
        {children}
      </main>

      {/* Mobile-friendly Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between items-center">
            <div className="text-gray-500 text-sm text-center md:text-left mb-4 md:mb-0">
              © 2024 GiftSwitch. All rights reserved.
            </div>
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6">
              <a href="/privacy" className="text-gray-500 hover:text-gray-900 text-sm text-center">
                Privacy Policy
              </a>
              <a href="/terms" className="text-gray-500 hover:text-gray-900 text-sm text-center">
                Terms of Service
              </a>
              <a href="/contact" className="text-gray-500 hover:text-gray-900 text-sm text-center">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 