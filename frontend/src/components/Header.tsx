import * as React from 'react';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Icon } from '@iconify/react';

type ActiveTab = 'generate' | 'verify' | 'history' | 'marketplace' | 'analytics' | 'governance' | 'docs';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white shadow-lg border-b border-gray-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 items-center h-16">
          {/* Logo and Brand */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-3 justify-self-start"
          >
            <div className="bg-gradient-to-r from-primary-600 to-purple-600 p-2 rounded-xl">
              <Icon
                icon="mdi:database-check"
                className="w-6 h-6 text-white"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">
                VeriSynth
              </h1>
              <p className="text-xs text-gray-500 -mt-1">
                Verifiable Synthetic Data
              </p>
            </div>
          </motion.div>

          {/* Navigation (center) */}
          <nav className="hidden md:flex items-center justify-center space-x-4 justify-self-center overflow-x-auto">
            {[
              { id: 'generate' as const, label: 'Generate', icon: 'ph:plus-circle-bold' },
              { id: 'verify' as const, label: 'Verify', icon: 'ph:shield-check-bold' },
              { id: 'history' as const, label: 'History', icon: 'ph:clock-clockwise-bold' },
              { id: 'marketplace' as const, label: 'Marketplace', icon: 'ph:storefront' },
              { id: 'analytics' as const, label: 'Analytics', icon: 'ph:chart-bar' },
              { id: 'governance' as const, label: 'Governance', icon: 'ph:hand-waving' },
              { id: 'docs' as const, label: 'Docs', icon: 'ph:book-open-bold' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-primary-100 text-primary-700 font-medium'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
                }`}
              >
                <Icon icon={item.icon} className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Wallet Connection (right) */}
          <div className="flex items-center space-x-4 justify-self-end">
            <ConnectButton
              chainStatus="icon"
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
              showBalance={{
                smallScreen: false,
                largeScreen: true,
              }}
            />
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;