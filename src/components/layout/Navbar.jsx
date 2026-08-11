import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMenu, FiX, FiMoon, FiSun } from 'react-icons/fi';
import { useTheme } from '../../hooks/useTheme';
import ConnectWalletButton from '../wallet/ConnectWalletButton';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Properties', href: '/properties' },
    { name: 'About', href: '/about' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Blog', href: '/blog' },
  ];

  return (
    <nav className="bg-white shadow-sm dark:bg-secondary-900 dark:border-b dark:border-secondary-800 sticky top-0 z-40 transition-colors duration-200">
      <div className="container">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <svg width="30" height="35" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <circle cx="15" cy="20" r="10" stroke="#0682ff"/>
                  <circle cx="15" cy="20" r="6" stroke="#0682ff" strokeWidth="3"/>
              </svg>  
              <span className="text-2xl font-bold text-primary-600 mt-1.5">RentVerse</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-secondary-600 hover:text-primary-600 dark:text-secondary-300 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
            <ConnectWalletButton />
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
            <button
              type="button"
              className="text-secondary-600 hover:text-primary-600 dark:text-secondary-300 dark:hover:text-primary-400 p-2"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-secondary-100 dark:border-secondary-800">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block px-3 py-2 text-base font-medium text-secondary-600 hover:text-primary-600 hover:bg-primary-50 dark:text-secondary-300 dark:hover:text-primary-400 dark:hover:bg-secondary-800"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <ConnectWalletButton
                variant="mobile"
                onAfterConnect={() => setIsOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
