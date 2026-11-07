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
import { TrendingUp, TrendingDown, Minus, Users, DollarSign, Building2, Activity } from "lucide-react";

const COLORS = {
  primary: "#6366f1",
  secondary: "#06b6d4",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#a855f7",
  pink: "#ec4899",
};

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
      className="relative rounded-2xl p-6 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50 shadow-xs transition-all duration-300 hover:border-indigo-500/30"
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-xs", iconColor)}>
              <Icon className="h-4 w-4" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          </div>
          {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {trend && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                trend.value >= 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              )}
            >
              {trend.value >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{trend.value >= 0 ? "+" : ""}{trend.value}%</span>
              <span className="text-slate-500">{trend.label}</span>
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
            <div className="flex flex-col items-center gap-4 text-slate-500">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
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
  colors: string[];
  labels: Record<string, string>;
  height?: number;
  showGrid?: boolean;
}

export function MultiAreaChart({ data, keys, colors, labels, height = 300, showGrid = true }: MultiAreaChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-lg p-3 shadow-xl"
        >
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <motion.div
              key={entry.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-2 text-sm"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-600 dark:text-slate-300">{labels[entry.name] || entry.name}: </span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">{entry.value.toLocaleString()}</span>
            </motion.div>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          {keys.map((key, index) => (
            <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[index]} stopOpacity={0.3} />
              <stop offset="95%" stopColor={colors[index]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#64748b" strokeOpacity={0.15} vertical={false} />}
        <XAxis
          dataKey="name"
          stroke="#94a3b8"
          strokeOpacity={0.4}
          fontSize={11}
          tick={{ fill: "#64748b" }}
          axisLine={{ stroke: "#94a3b8", strokeOpacity: 0.3 }}
          tickLine={{ stroke: "#94a3b8", strokeOpacity: 0.3 }}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="#94a3b8"
          strokeOpacity={0.4}
          fontSize={11}
          tick={{ fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: 10 }}
          iconType="circle"
          layout="horizontal"
          align="center"
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
  colors: string[];
  labels: Record<string, string>;
  height?: number;
  stacked?: boolean;
}

export function GroupedBarChart({ data, keys, colors, labels, height = 300, stacked = false }: GroupedBarChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-lg p-3 shadow-xl"
        >
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <motion.div
              key={entry.dataKey}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-2 text-sm"
            >
              <span className="h-2 w-2 rounded" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-600 dark:text-slate-300">{labels[entry.dataKey] || entry.dataKey}: </span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">{entry.value.toLocaleString()}</span>
            </motion.div>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} layout={stacked ? "vertical" : "horizontal"}>
        <CartesianGrid strokeDasharray="3 3" stroke="#64748b" strokeOpacity={0.15} vertical={false} />
        <XAxis
          dataKey="name"
          stroke="#94a3b8"
          strokeOpacity={0.4}
          fontSize={11}
          tick={{ fill: "#64748b" }}
          axisLine={{ stroke: "#94a3b8", strokeOpacity: 0.3 }}
          tickLine={{ stroke: "#94a3b8", strokeOpacity: 0.3 }}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="#94a3b8"
          strokeOpacity={0.4}
          fontSize={11}
          tick={{ fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: 10 }} iconType="circle" layout="horizontal" align="center" />
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
          className="bg-white dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-lg p-3 shadow-xl"
        >
          <div className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600 dark:text-slate-300">{entry.name}: </span>
            <span className="font-mono font-semibold text-slate-900 dark:text-white">{entry.value.toLocaleString()}</span>
            <span className="text-slate-500">({((entry.value / data.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%)</span>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  const COLORS = data.map((d, i) => d.color || `hsl(${i * 45}, 70%, 55%)`);

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
              stroke={entry.color || `hsl(${index * 45}, 70%, 55%)`}
              strokeWidth="12"
              strokeLinecap="round"
            />
          ))}
        </RadialBar>
      </RadialBarChart>
    </ResponsiveContainer>
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
          className="bg-white dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-lg p-3 shadow-xl"
        >
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <motion.div
              key={entry.dataKey}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-2 text-sm"
            >
              <span className="h-2 w-2 rounded" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-600 dark:text-slate-300">{entry.name}: </span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">{entry.value.toLocaleString()}</span>
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
        <CartesianGrid strokeDasharray="3 3" stroke="#64748b" strokeOpacity={0.15} vertical={false} />
        <XAxis
          dataKey="name"
          stroke="#94a3b8"
          strokeOpacity={0.4}
          fontSize={11}
          tick={{ fill: "#64748b" }}
          axisLine={{ stroke: "#94a3b8", strokeOpacity: 0.3 }}
          tickLine={{ stroke: "#94a3b8", strokeOpacity: 0.3 }}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="#94a3b8"
          strokeOpacity={0.4}
          fontSize={11}
          tick={{ fill: "#64748b" }}
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