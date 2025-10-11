import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  type?: 'success' | 'error' | 'info' | 'warning';
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  type = 'info',
  showCloseButton = true,
}) => {
  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'ph:check-circle-bold',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
        };
      case 'error':
        return {
          icon: 'ph:x-circle-bold',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
        };
      case 'warning':
        return {
          icon: 'ph:warning-circle-bold',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
        };
      default:
        return {
          icon: 'ph:info-bold',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
        };
    }
  };

  const { icon, color, bgColor } = getIconAndColor();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${bgColor}`}>
                    <Icon icon={icon} className={`w-6 h-6 ${color}`} />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {title}
                  </h2>
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Icon icon="ph:x" className="w-5 h-5 text-gray-500" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;