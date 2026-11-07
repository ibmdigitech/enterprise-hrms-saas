"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Users, DollarSign, Building2, Activity, ChevronDown } from "lucide-react";

// Chart colors that adapt to light/dark mode via CSS variables
export const CHART_COLORS = [
  "var(--color-chart-1)",  // Primary teal
  "var(--color-chart-2)",  // Sky blue
  "var(--color-chart-3)",  // Gold
  "var(--color-chart-4)",  // Success green
  "var(--color-chart-5)",  // Purple
  "var(--color-chart-6)",  // Danger red
];

const GRADIENT_IDS = {
  primary: "gradient-primary",
  secondary: "gradient-secondary",
  success: "gradient-success",
  warning: "gradient-warning",
};

interface ChartCardProps {
  title: string;
  description?: string;
  icon: React.ElementType;
  iconColor: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  loading?: boolean;
  trend?: { value: number; label: string };
}

export function ChartCard({
  title,
  description,
  icon: Icon,
  iconColor,
  children,
  action,
  loading = false,
  trend,
}: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative rounded-2xl p-6 bg-card border-border shadow-xs transition-all duration-300 hover:border-ring/30"
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg shadow-xs", iconColor)}>
              <Icon className="h-4 w-4" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          </div>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {trend && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                trend.value >= 0
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
              )}
            >
              {trend.value >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{trend.value >= 0 ? "+" : ""}{trend.value}%</span>
              <span className="text-muted-foreground">{trend.label}</span>
            </motion.div>
          )}
          {action}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-64 flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm">Loading chart data...</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface AreaChartData {
  name: string;
  value?: number;
  [key: string]: string | number | undefined;
}

interface MultiAreaChartProps {
  data: AreaChartData[];
  keys: string[];
  colors?: string[];
  labels: Record<string, string>;
  height?: number;
  showGrid?: boolean;
}

export function MultiAreaChart({ data, keys, colors = CHART_COLORS, labels, height = 300, showGrid = true }: MultiAreaChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-popover border-border rounded-lg p-3 shadow-xl"
        >
          <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <motion.div
              key={entry.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-2 text-sm"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{labels[entry.name] || entry.name}: </span>
              <span className="font-mono font-semibold text-foreground">{entry.value.toLocaleString()}</span>
            </motion.div>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 18 }}>
        <defs>
          {keys.map((key, index) => (
            <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[index]} stopOpacity={0.3} />
              <stop offset="95%" stopColor={colors[index]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.15} vertical={false} />}
        <XAxis
          dataKey="name"
          stroke="var(--color-muted-foreground)"
          strokeOpacity={0.4}
          fontSize={11}
          tick={{ fill: "var(--color-muted-foreground)" }}
          axisLine={{ stroke: "var(--color-border)", strokeOpacity: 0.3 }}
          tickLine={{ stroke: "var(--color-border)", strokeOpacity: 0.3 }}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="var(--color-muted-foreground)"
          strokeOpacity={0.4}
          fontSize={11}
          tick={{ fill: "var(--color-muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: 10, paddingBottom: 4, fontSize: 10 }}
          iconType="circle"
          layout="horizontal"
          align="center"
          iconSize={8}
        />
        {keys.map((key, index) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            name={labels[key] || key}
            stroke={colors[index]}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#gradient-${key})`}
            activeDot={{ r: 6, strokeWidth: 2, stroke: colors[index] }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface BarChartData {
  name: string;
  [key: string]: string | number;
}

interface GroupedBarChartProps {
  data: BarChartData[];
  keys: string[];
  colors?: string[];
  labels: Record<string, string>;
  height?: number;
  stacked?: boolean;
}

export function GroupedBarChart({ data, keys, colors = CHART_COLORS, labels, height = 300, stacked = false }: GroupedBarChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-popover border-border rounded-lg p-3 shadow-xl"
        >
          <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <motion.div
              key={entry.dataKey}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-2 text-sm"
            >
              <span className="h-2 w-2 rounded" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{labels[entry.dataKey] || entry.dataKey}: </span>
              <span className="font-mono font-semibold text-foreground">{entry.value.toLocaleString()}</span>
            </motion.div>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 18 }} layout={stacked ? "vertical" : "horizontal"}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.15} vertical={false} />
        <XAxis
          dataKey="name"
          stroke="var(--color-muted-foreground)"
          strokeOpacity={0.4}
          fontSize={11}
          tick={{ fill: "var(--color-muted-foreground)" }}
          axisLine={{ stroke: "var(--color-border)", strokeOpacity: 0.3 }}
          tickLine={{ stroke: "var(--color-border)", strokeOpacity: 0.3 }}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="var(--color-muted-foreground)"
          strokeOpacity={0.4}
          fontSize={11}
          tick={{ fill: "var(--color-muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: 10, paddingBottom: 4, fontSize: 10 }} iconType="circle" layout="horizontal" align="center" iconSize={8} />
        {keys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            name={labels[key] || key}
            fill={colors[index]}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
            stackId={stacked ? "a" : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  data: PieChartData[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
}

export function DonutChart({ data, height = 300, innerRadius = 60, outerRadius = 100, showLabels = true }: DonutChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-popover border-border rounded-lg p-3 shadow-xl"
        >
          <div className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}: </span>
            <span className="font-mono font-semibold text-foreground">{entry.value.toLocaleString()}</span>
            <span className="text-muted-foreground">({((entry.value / data.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%)</span>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  const COLORS = data.map((d, i) => d.color || CHART_COLORS[i % CHART_COLORS.length]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Tooltip content={<CustomTooltip />} />
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          label={showLabels ? ({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%` : false}
          labelLine={showLabels}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

interface RadialBarData {
  name: string;
  value: number;
  color?: string;
}

interface RadialBarChartProps {
  data: RadialBarData[];
  height?: number;
  size?: number;
}

export function RadialProgressChart({ data, height = 200, size = 120 }: RadialBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadialBarChart startAngle={-90} endAngle={90}>
        <RadialBar
          dataKey="value"
        >
          {data.map((entry, index) => (
            <motion.path
              key={entry.name}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: index * 0.1, duration: 1, ease: "easeOut" }}
              fill="none"
              stroke={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth="12"
              strokeLinecap="round"
            />
          ))}
        </RadialBar>
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

// ─── Gauge / Speedometer Chart for Organizational Health Index ───
interface GaugeChartProps {
  value: number; // 0-100
  label?: string;
  size?: number;
  thresholds?: { max: number; color: string }[];
  showLabel?: boolean;
}

export function GaugeChart({ 
  value, 
  label = "Organizational Health Index", 
  size = 280,
  thresholds = [
    { max: 50, color: "var(--color-chart-6)" },      // Danger red
    { max: 75, color: "var(--color-chart-3)" },      // Gold/amber
    { max: 100, color: "var(--color-chart-4)" },     // Success green
  ],
  showLabel = true,
}: GaugeChartProps) {
  // Determine color based on value
  const getColor = (val: number) => {
    for (const threshold of thresholds) {
      if (val <= threshold.max) return threshold.color;
    }
    return thresholds[thresholds.length - 1].color;
  };

  const gaugeColor = getColor(value);
  const radius = size * 0.3;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  // Add padding for shadow to prevent clipping
  const shadowPadding = 18;
  const containerSize = size + shadowPadding * 2;

  return (
    <div className="relative flex items-center justify-center" style={{ width: containerSize, height: containerSize }}>
      <svg width={containerSize} height={containerSize} viewBox={`0 0 ${containerSize} ${containerSize}`} style={{ overflow: "visible" }}>
        <defs>
          <filter id="gauge-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={gaugeColor} floodOpacity="0.4" />
          </filter>
          <radialGradient id="gauge-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={gaugeColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={gaugeColor} stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* Background track */}
        <circle
          cx={center + shadowPadding}
          cy={center + shadowPadding}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={Math.max(10, size * 0.045)}
          strokeOpacity={0.25}
        />
        {/* Progress arc */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          d={`M ${center + shadowPadding - radius} ${center + shadowPadding} A ${radius} ${radius} 0 0 1 ${center + shadowPadding + radius} ${center + shadowPadding}`}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={Math.max(10, size * 0.045)}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          filter="url(#gauge-shadow)"
        />
        {/* Center glow */}
        <circle
          cx={center + shadowPadding}
          cy={center + shadowPadding}
          r={radius * 0.68}
          fill="url(#gauge-glow)"
        />
      </svg>
      
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.5, ease: [0.17, 0.67, 0.83, 0.67] }}
          className="text-[28px] font-black leading-none tracking-[-0.06em] text-foreground drop-shadow-lg sm:text-[32px]"
        >
          {value}%
        </motion.div>
        {showLabel && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.3 }}
            className="mt-1 text-center text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"
          >
            {label}
          </motion.p>
        )}
      </div>
    </div>
  );
}

interface LineChartData {
  name: string;
  [key: string]: string | number;
}

interface MultiLineChartProps {
  data: LineChartData[];
  lines: { key: string; name: string; color: string }[];
  height?: number;
}

export function MultiLineChart({ data, lines, height = 300 }: MultiLineChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-popover border-border rounded-lg p-3 shadow-xl"
        >
          <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <motion.div
              key={entry.dataKey}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-2 text-sm"
            >
              <span className="h-2 w-2 rounded" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}: </span>
              <span className="font-mono font-semibold text-foreground">{entry.value.toLocaleString()}</span>
            </motion.div>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.15} vertical={false} />
        <XAxis
          dataKey="name"
          stroke="var(--color-muted-foreground)"
          strokeOpacity={0.4}
          fontSize={11}
          tick={{ fill: "var(--color-muted-foreground)" }}
          axisLine={{ stroke: "var(--color-border)", strokeOpacity: 0.3 }}
          tickLine={{ stroke: "var(--color-border)", strokeOpacity: 0.3 }}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="var(--color-muted-foreground)"
          strokeOpacity={0.4}
          fontSize={11}
          tick={{ fill: "var(--color-muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: 10 }} layout="horizontal" align="center" />
        {lines.map((line, index) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2, stroke: line.color }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: line.color }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}