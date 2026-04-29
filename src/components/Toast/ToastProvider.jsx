import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./Toast.css";
import { ToastContext } from "./ToastContext";

function getToastId() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function Icon({ type }) {
  if (type === "success") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
        <path
          d="M20 6 9 17l-5-5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (type === "warning") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
        <path
          d="M12 3 1.8 21h20.4L12 3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M12 9v5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M12 17.5h.01"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (type === "error") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
        <path
          d="M18 6 6 18"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M6 6l12 12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path
        d="M12 10.5v6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M12 7.25h.01"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path
        d="M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ToastViewport({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type}`}
          role={toast.type === "error" ? "alert" : "status"}
        >
          <div className="toast__icon" aria-hidden="true">
            <Icon type={toast.type} />
          </div>
          <div className="toast__message">{toast.message}</div>
          <button
            type="button"
            className="toast__close"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            <CloseIcon />
          </button>
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({
  children,
  maxToasts = 4,
  defaultDuration = 4500,
}) {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef(new Map());

  const dismiss = useCallback((toastId) => {
    const timeoutId = timeoutsRef.current.get(toastId);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutsRef.current.delete(toastId);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  }, []);

  const clear = useCallback(() => {
    timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutsRef.current.clear();
    setToasts([]);
  }, []);

  useEffect(() => () => clear(), [clear]);

  const show = useCallback(
    (message, options = {}) => {
      const type = options.type || "info";
      const duration =
        typeof options.duration === "number"
          ? options.duration
          : defaultDuration;
      const toastId = getToastId();
      const toast = { id: toastId, type, message };

      setToasts((prev) => {
        let next = [...prev, toast];
        if (next.length > maxToasts) {
          const overflow = next.slice(0, next.length - maxToasts);
          overflow.forEach((item) => {
            const timeoutId = timeoutsRef.current.get(item.id);
            if (timeoutId) {
              window.clearTimeout(timeoutId);
              timeoutsRef.current.delete(item.id);
            }
          });
          next = next.slice(-maxToasts);
        }
        return next;
      });

      if (duration > 0) {
        const timeoutId = window.setTimeout(() => dismiss(toastId), duration);
        timeoutsRef.current.set(toastId, timeoutId);
      }

      return toastId;
    },
    [defaultDuration, dismiss, maxToasts],
  );

  const api = useMemo(
    () => ({
      show,
      success: (message, options) => show(message, { ...options, type: "success" }),
      warning: (message, options) => show(message, { ...options, type: "warning" }),
      info: (message, options) => show(message, { ...options, type: "info" }),
      error: (message, options) => show(message, { ...options, type: "error" }),
      dismiss,
      clear,
    }),
    [clear, dismiss, show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
