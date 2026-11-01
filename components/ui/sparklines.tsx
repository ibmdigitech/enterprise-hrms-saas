"use client";

import { motion } from "framer-motion";
import { useId, useEffect, useState } from "react";
import { cn as cnUtil } from "@/lib/utils";

interface SparklinesProps {
  data: number[];
  color?: string;
  width?: number | string;
  height?: number;
  strokeWidth?: number;
  fillOpacity?: number;
  showArea?: boolean;
  className?: string;
  animate?: boolean;
}

export function Sparklines({
  data,
  color = "#6366f1",
  width = "100%",
  height = 32,
  strokeWidth = 2,
  fillOpacity = 0.15,
  showArea = false,
  className = "",
  animate = true,
}: SparklinesProps) {
  const [mounted, setMounted] = useState(false);
  const gradientId = useId();
  const strokeGradientId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <svg
        width={typeof width === "number" ? width : undefined}
        height={height}
        className={cnUtil("w-full h-full", className)}
        aria-hidden="true"
      >
        <line
          x1="0"
          y1={height / 2}
          x2={typeof width === "number" ? width : "100%"}
          y2={height / 2}
          stroke="#ffffff15"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      </svg>
    );
  }

  if (!data || data.length < 2) {
    return (
      <svg
        width={typeof width === "number" ? width : undefined}
        height={height}
        className={cnUtil("w-full h-full", className)}
        aria-hidden="true"
      >
        <line
          x1="0"
          y1={height / 2}
          x2={typeof width === "number" ? width : "100%"}
          y2={height / 2}
          stroke="#ffffff15"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * (typeof width === "number" ? width : 100);
    const y = height - ((value - min) / range) * (height - 8) - 4;
    return `${x}% ${y}`;
  }).join(" ");

  const areaPoints = [
    "0% " + height,
    ...points.split(" "),
    (typeof width === "number" ? "100%" : "100%") + " " + height,
  ].join(" ");

  return (
    <svg
      width={typeof width === "number" ? width : undefined}
      height={height}
      viewBox={`0 0 ${typeof width === "number" ? width : 100} ${height}`}
      preserveAspectRatio="none"
      className={cnUtil("w-full h-full", className)}
      aria-hidden="true"
      style={{ width: typeof width === "string" ? width : undefined }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={strokeGradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity={0.6} />
          <stop offset="100%" stopColor={color} stopOpacity={1} />
        </linearGradient>
      </defs>

      {showArea && (
        <motion.path
          d={`M ${areaPoints}`}
          fill={`url(#${gradientId})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
        />
      )}

      <motion.path
        d={`M ${points}`}
        stroke={`url(#${strokeGradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: animate ? 1 : 0, ease: "easeOut", delay: 0.1 }}
        style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
      />

      <motion.circle
        cx={points.split(" ").pop()?.split(",")[0] || "0"}
        cy={points.split(" ").pop()?.split(",")[1] || "0"}
        r={strokeWidth * 1.5}
        fill={color}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.3, ease: "easeOut" }}
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  );
}