import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

/**
 * Extension-safe confirmation dialog.
 * Replaces window.confirm() which is silently blocked in Chrome extension side panels.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = true,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: 'spring', damping: 22, stiffness: 380 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="glass-card-static p-6 w-full max-w-sm relative"
              style={{ pointerEvents: 'auto' }}
            >
              {/* Close button */}
              <button
                onClick={onCancel}
                className="btn-icon absolute top-3 right-3"
                aria-label="Close"
              >
                <X size={16} />
              </button>

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: danger
                    ? 'rgba(234,67,53,0.12)'
                    : 'rgba(66,133,244,0.12)',
                }}
              >
                <AlertTriangle
                  size={22}
                  style={{ color: danger ? '#EA4335' : '#4285F4' }}
                />
              </div>

              {/* Text */}
              <h3
                className="font-bold text-base mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {title}
              </h3>
              <p
                className="text-sm leading-relaxed mb-5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {message}
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  className="btn-secondary flex-1 text-sm"
                  onClick={onCancel}
                >
                  {cancelLabel}
                </button>
                <button
                  className="btn-primary flex-1 text-sm"
                  style={
                    danger
                      ? {
                          background: 'linear-gradient(135deg, #EA4335, #C62828)',
                          boxShadow: '0 0 20px rgba(234,67,53,0.25)',
                        }
                      : undefined
                  }
                  onClick={onConfirm}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
