import React from 'react';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Icon } from '@iconify/react';

type ActiveTab = 'generate' | 'verify' | 'docs';

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
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-3"
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

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#generate"
              className="text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200"
            >
              Generate
            </a>
            <a
              href="#verify"
              className="text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200"
            >
              Verify
            </a>
            <a
              href="#docs"
              className="text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200"
            >
              Docs
            </a>
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
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