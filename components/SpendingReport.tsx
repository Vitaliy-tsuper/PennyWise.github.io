"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { Transaction } from '@/lib/types'; // Use local type

interface SpendingReportProps {
  transactions: Transaction[]; // Expecting only expense transactions here
}

// Define a more diverse color palette
const COLORS = [
  "#0088FE", // Blue
  "#00C49F", // Green
  "#FFBB28", // Yellow
  "#FF8042", // Orange
  "#8884d8", // Purple
  "#82ca9d", // Light Green
  "#FF6384", // Pink
  "#36A2EB", // Light Blue
  "#FFCE56", // Light Yellow
  "#4BC0C0", // Teal
  "#9966FF", // Lavender
  "#FF9F40"  // Light Orange
];

const SpendingReport = ({ transactions }: SpendingReportProps) => {
  const [data, setData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    // Aggregate spending by category from the provided (expense) transactions
    const spendingByCategory = transactions.reduce((acc, transaction) => {
        // Ensure amount is positive for aggregation
        const amount = Math.abs(transaction.amount); // amount is already a number
        acc[transaction.category] = (acc[transaction.category] || 0) + amount;

      return acc;
    }, {} as { [key: string]: number }); // Type assertion for accumulator

    // Convert aggregated data into an array suitable for recharts
    const chartData = Object.entries(spendingByCategory) // Use Object.entries for cleaner mapping
      .map(([category, value]) => ({
        name: category,
        value: value,
      }))
      .sort((a, b) => b.value - a.value); // Optional: sort by value descending

    setData(chartData);
  }, [transactions]); // Dependency array includes transactions

  // Custom Tooltip Formatter
  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border p-2 rounded shadow-md text-sm">
          <p className="font-semibold">{`${data.name}: ₴${data.value.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
  };

  // Custom Label Renderer for better readability
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        // Only show label if percent is large enough to avoid clutter
        if (percent * 100 < 5) return null;

        return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
        );
    };


  if (data.length === 0) {
    return <p className="text-center text-muted-foreground">Немає даних про витрати для відображення.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false} // Disable label lines
          label={renderCustomizedLabel} // Use custom label
          outerRadius={150} // Adjusted radius
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          isAnimationActive={true} // Enable animation
        >
          {
            data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))
          }
        </Pie>
         {/* Add Tooltip */}
        <Tooltip content={renderCustomTooltip} />
        <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            iconType="circle" // Use circles for legend icons
            formatter={(value, entry) => <span className="text-foreground">{value}</span>} // Style legend text
          />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default SpendingReport;
