import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertTriangle, FiX, FiArrowRight, FiCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useProfileCompletionContext } from '../../contexts/ProfileCompletionContext';

const ProfileMandateModal = ({ isOpen, onClose, actionLabel = 'continue' }) => {
  const navigate = useNavigate();
  const { missingRequired } = useProfileCompletionContext();

  if (!isOpen) return null;

  const goTo = (link) => {
    onClose?.();
    if (link) navigate(link);
  };

  const content = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/70 p-6 shadow-[0_25px_70px_-20px_rgba(188,161,66,0.55)] backdrop-blur-2xl"
        >
          <div className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full bg-[#bca142]/25 blur-3xl" />

          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-white/70 hover:text-gray-900"
          >
            <FiX size={16} />
          </button>

          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
              <FiAlertTriangle size={22} />
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-900">Complete your profile first</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
              You must complete <span className="font-semibold text-gray-900">bank details</span> and{' '}
              <span className="font-semibold text-gray-900">personal information</span> before you can {actionLabel}.
              Without them you will not receive quotes.
            </p>

            <div className="mt-4 space-y-2">
              {missingRequired.map((step) => (
                <div
                  key={step.key}
                  className="rounded-2xl border border-white/70 bg-white/60 p-3 backdrop-blur-sm"
                >
                  <p className="text-sm font-semibold text-gray-900">{step.label}</p>
                  <ul className="mt-1.5 space-y-1">
                    {step.pending.slice(0, 4).map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#bca142]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {missingRequired.length === 0 && (
                <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50/70 p-3 text-xs text-green-700">
                  <FiCheck /> Everything required is already completed.
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-2">
              {missingRequired.map((step) => (
                <motion.button
                  key={step.key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => goTo(step.link)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#bca142] to-[#a98f34] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#bca142]/30 transition-all hover:from-[#a98f34] hover:to-[#8f7826]"
                >
                  Complete {step.label} <FiArrowRight size={14} />
                </motion.button>
              ))}
              <button
                onClick={onClose}
                className="w-full rounded-xl border border-white/70 bg-white/60 px-4 py-2.5 text-sm font-medium text-gray-600 backdrop-blur-sm transition-colors hover:bg-white/90 hover:text-gray-900"
              >
                Not now
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(content, document.body);
};

export default ProfileMandateModal;
