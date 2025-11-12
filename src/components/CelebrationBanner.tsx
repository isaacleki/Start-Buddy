'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface CelebrationBannerProps {
  show: boolean;
  message: string;
  isComplete?: boolean;
}

export function CelebrationBanner({ show, message, isComplete = false }: CelebrationBannerProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
          className="fixed top-24 left-1/2 z-50 max-w-md px-4"
        >
          <motion.div
            className="relative rounded-2xl bg-gradient-to-br from-teal-500/95 to-cyan-500/95 dark:from-teal-600/95 dark:to-cyan-600/95 border border-white/20 dark:border-white/10 shadow-xl shadow-teal-500/20 dark:shadow-teal-900/30 backdrop-blur-xl px-6 py-4 mx-auto"
          >
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 15,
                  delay: 0.1,
                }}
              >
                <CheckCircle2 className="h-6 w-6 text-white flex-shrink-0" strokeWidth={2.5} />
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-lg font-semibold text-white"
              >
                {message}
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

