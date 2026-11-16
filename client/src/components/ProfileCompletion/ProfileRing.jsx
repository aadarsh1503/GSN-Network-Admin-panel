import { completionColor } from '../../utils/profileCompletion';

/**
 * Circular progress ring that hugs an avatar.
 * Usage: <ProfileRing percentage={72} size={44}><div className="avatar">A</div></ProfileRing>
 */
const ProfileRing = ({ percentage = 0, size = 44, stroke = 3, children, className = '' }) => {
  const safePercentage = Math.max(0, Math.min(100, Math.round(percentage)));
  const color = completionColor(safePercentage);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (safePercentage / 100) * circumference;
  const inset = stroke + 1;

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      title={`Profile ${safePercentage}% complete`}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color.ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 600ms ease, stroke 300ms ease' }}
        />
      </svg>

      <div
        className="absolute flex items-center justify-center rounded-full overflow-hidden"
        style={{ inset }}
      >
        {children}
      </div>
    </div>
  );
};

export default ProfileRing;
