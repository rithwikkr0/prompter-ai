import { motion } from 'framer-motion';
import { scoreToColor, scoreToLabel } from '../utils/nanoid';

interface CircularScoreProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  animate?: boolean;
}

export function CircularScore({ score, size = 120, strokeWidth = 10, animate = true }: CircularScoreProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreToColor(score);
  const label = scoreToLabel(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Track */}
        <svg width={size} height={size} className="absolute inset-0">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--bg-muted)"
            strokeWidth={strokeWidth}
          />
        </svg>
        {/* Progress */}
        <svg width={size} height={size} className="absolute inset-0 -rotate-90">
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: animate ? offset : offset }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
            style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-2xl font-bold"
            style={{ color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4, type: 'spring' }}
          >
            {score}
          </motion.span>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>/ 100</span>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="badge"
        style={{ background: `${color}20`, color }}
      >
        {label}
      </motion.div>
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────────────────── */
export function ScoreSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="skeleton w-28 h-28 rounded-full" />
      <div className="skeleton w-16 h-5" />
    </div>
  );
}
