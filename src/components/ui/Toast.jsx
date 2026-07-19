import React, { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

// Floating, self-dismissing toast — fixed position, doesn't affect page
// layout. Pass `show` to trigger it; it calls onDismiss automatically
// after `duration` ms, with a brief fade-out first.
export default function Toast({ show, message, onDismiss, duration = 3000 }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!show) {
      setLeaving(false);
      return;
    }
    setLeaving(false);
    const leaveTimer = setTimeout(() => setLeaving(true), duration - 250);
    const dismissTimer = setTimeout(() => onDismiss?.(), duration);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(dismissTimer);
    };
  }, [show, duration, onDismiss]);

  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className={`saved-message flex items-center gap-2 ${leaving ? "toast-leaving" : ""}`}>
        <CheckCircle2 size={20} />
        {message}
      </div>
    </div>
  );
}
