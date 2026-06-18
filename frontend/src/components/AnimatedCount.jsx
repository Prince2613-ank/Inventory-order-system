import { useEffect, useRef, useState } from "react";

export default function AnimatedCount({ value, format = "integer" }) {
  const [progress, setProgress] = useState(0);
  const frameRef = useRef(null);
  const DURATION = 900;

  useEffect(() => {
    const start = performance.now();
    cancelAnimationFrame(frameRef.current);
    function tick(now) {
      const t = Math.min((now - start) / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setProgress(eased);
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  const current = Number(value) * progress;

  if (format === "currency") {
    return <>${current.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>;
  }
  return <>{Math.round(current).toLocaleString()}</>;
}
