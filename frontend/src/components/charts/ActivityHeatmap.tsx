import { useMemo } from "react";
import { motion } from "framer-motion";

export function ActivityHeatmap({
  data,
  cells = 7 * 12,
}: {
  data?: number[];
  cells?: number;
}) {
  const values = useMemo(() => {
    if (data && data.length === cells) return data;
    return Array.from({ length: cells }, () => 0);
  }, [data, cells]);

  return (
    <div className="grid grid-cols-12 gap-1.5">
      {values.map((value, index) => {
        const intensity = Math.min(1, Math.max(0, value));
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.005, duration: 0.18 }}
            className="aspect-square rounded-md"
            style={{
              background:
                intensity < 0.05
                  ? "rgb(var(--surface-elevated))"
                  : `rgba(${99 + intensity * 70}, ${102 + intensity * 50}, ${241 - intensity * 40}, ${
                      0.18 + intensity * 0.7
                    })`,
              boxShadow: intensity > 0.7 ? "0 0 0 1px rgba(168,85,247,0.45)" : undefined,
            }}
            title={`${Math.round(intensity * 100)}% activity`}
          />
        );
      })}
    </div>
  );
}
