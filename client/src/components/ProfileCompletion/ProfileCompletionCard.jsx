import { useEffect, useState } from 'react';
import { FiCheck, FiAlertTriangle, FiArrowRight, FiCreditCard, FiUser, FiBriefcase, FiTrendingUp, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useProfileCompletionContext } from '../../contexts/ProfileCompletionContext';
import { completionColor } from '../../utils/profileCompletion';
import ProfileRing from './ProfileRing';

const STEP_ICONS = {
  personal: <FiUser />,
  business: <FiBriefcase />,
  profile: <FiUser />,
  bank: <FiCreditCard />,
};

// Closing the card hides it for 72 hours, then it comes back automatically.
const HIDE_DURATION_MS = 72 * 60 * 60 * 1000;
const hideKeyFor = (userId) => `profileCompletionCardHiddenUntil:${userId || 'anon'}`;

const readHiddenUntil = (key) => {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
};

const ProfileCompletionCard = ({ className = '', compact = false }) => {
  const navigate = useNavigate();
  const { role, userId, percentage, steps, missingRequired, isComplete, profile } = useProfileCompletionContext();
  const hideKey = hideKeyFor(userId);
  const [hiddenUntil, setHiddenUntil] = useState(() => readHiddenUntil(hideKey));

  // Bring the card back automatically once the 72 hours are over — even if the
  // page is left open, no reload needed.
  useEffect(() => {
    if (hiddenUntil <= Date.now()) return undefined;
    const id = setInterval(() => {
      if (Date.now() >= readHiddenUntil(hideKey)) setHiddenUntil(0);
    }, 60 * 1000);
    return () => clearInterval(id);
  }, [hiddenUntil, hideKey]);

  if (!role || !steps?.length) return null;
  if (hiddenUntil > Date.now()) return null;

  const handleClose = () => {
    const until = Date.now() + HIDE_DURATION_MS;
    try {
      localStorage.setItem(hideKey, String(until));
    } catch {
      // storage unavailable — still hide for this session
    }
    setHiddenUntil(until);
  };

  const color = completionColor(percentage);
  const displayName = profile?.name || 'there';

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/70 bg-white/60 backdrop-blur-xl shadow-[0_10px_40px_-12px_rgba(188,161,66,0.35)] ${className}`}
    >
      <button
        type="button"
        onClick={handleClose}
        aria-label="Hide profile completion"
        title="Hide for 72 hours"
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/70 text-gray-500 backdrop-blur-sm transition-colors hover:bg-white hover:text-gray-900"
      >
        <FiX size={16} />
      </button>

      {/* soft gold glow */}
      <div className="pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full bg-[#bca142]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-[#bca142]/10 blur-3xl" />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <ProfileRing percentage={percentage} size={68} stroke={5}>
            <div className="flex h-full w-full items-center justify-center rounded-full bg-white/80 backdrop-blur-sm">
              <span className={`text-sm font-extrabold ${color.text}`}>{percentage}%</span>
            </div>
          </ProfileRing>

          <div className="min-w-0 flex-1 pr-6">
            <h3 className="truncate text-lg font-bold text-gray-900">
              {isComplete ? 'Profile complete 🎉' : `Hi ${displayName}, finish your profile`}
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
              {isComplete
                ? 'Your profile is fully set up — you are visible to the whole network.'
                : role === 'company'
                  ? 'A complete profile gets you more quote requests and more customers.'
                  : 'A complete profile gets you faster, more accurate quote responses.'}
            </p>
          </div>
        </div>

        {/* progress bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-black/5">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${percentage}%`, background: `linear-gradient(90deg, ${color.ring}, #bca142)` }}
          />
        </div>

        {/* mandate warning */}
        {missingRequired.length > 0 && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200/70 bg-rose-50/70 p-3 backdrop-blur-sm">
            <FiAlertTriangle className="mt-0.5 flex-shrink-0 text-rose-500" />
            <p className="text-xs leading-relaxed text-rose-700">
              <span className="font-semibold">
                {missingRequired
                  .map((m) => (m.stepRequired ? m.label : m.pending.join(', ')))
                  .join(' & ')}{' '}
                required.
              </span>{' '}
              Without this you will not receive quotes. Please fill it in now.
            </p>
          </div>
        )}

        {!compact && (
          <div className="mt-4 space-y-2">
            {steps.map((step) => {
              const stepDone = step.ratio >= 1;
              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => step.link && navigate(step.link)}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-white/70 bg-white/50 p-3 text-left backdrop-blur-sm transition-all duration-300 hover:border-[#bca142]/40 hover:bg-white/80 hover:shadow-md"
                >
                  <span
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-sm ${
                      stepDone ? 'bg-green-500/15 text-green-600' : 'bg-[#bca142]/15 text-[#bca142]'
                    }`}
                  >
                    {stepDone ? <FiCheck /> : STEP_ICONS[step.key] || <FiUser />}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-gray-900">{step.label}</span>
                      {step.required && !stepDone && (
                        <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-600">
                          Required
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-gray-500">
                      {stepDone ? 'Completed' : step.hint}
                    </span>
                  </span>

                  <span className="flex-shrink-0 text-xs font-semibold text-gray-400">
                    {step.done}/{step.total}
                  </span>
                  <FiArrowRight className="flex-shrink-0 text-gray-300 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-[#bca142]" />
                </button>
              );
            })}
          </div>
        )}

        {role === 'company' && !isComplete && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#bca142]/25 bg-[#bca142]/10 p-3">
            <FiTrendingUp className="flex-shrink-0 text-[#bca142]" />
            <p className="text-[11px] font-medium leading-relaxed text-gray-700">
              Companies with 100% complete profiles get noticed far more in the member directory.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCompletionCard;
