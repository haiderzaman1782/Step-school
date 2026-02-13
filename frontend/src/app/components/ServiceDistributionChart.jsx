import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.jsx";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useIsMobile } from "./ui/use-mobile.js";

export function ServiceDistributionChart({ data }) {
  const isMobile = useIsMobile();
  const [containerHeight, setContainerHeight] = useState(300);

  useEffect(() => {
    // Adjust height based on screen size (chart only, labels are separate)
    const updateHeight = () => {
      if (window.innerWidth < 640) {
        setContainerHeight(200); // Small screens - pie chart only
      } else if (window.innerWidth < 1024) {
        setContainerHeight(240); // Medium screens
      } else {
        setContainerHeight(280); // Large screens
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Adjust pie chart size based on screen size
  const outerRadius = isMobile ? 60 : 100;

  return (
    <Card className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 sm:p-4 rounded-xl shadow-md dark:shadow-none">
      <CardHeader>
        <CardTitle className="dark:text-white text-lg sm:text-xl">Service Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        {/* Pie Chart - Positioned at top */}
        <div className="w-full " style={{ minHeight: containerHeight }}>
          <ResponsiveContainer width="100%" height={containerHeight}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={outerRadius}
                label={false}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const isDark = document.documentElement.classList.contains('dark');
                    const entry = payload[0];
                    const total = data.reduce((sum, item) => sum + item.value, 0);
                    const percent = ((entry.value / total) * 100).toFixed(0);
                    return (
                      <div 
                        className="rounded-lg border p-3 shadow-md"
                        style={{
                          backgroundColor: isDark ? 'rgb(31, 41, 55)' : 'rgba(255, 255, 255, 0.95)',
                          borderColor: isDark ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)',
                          color: isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)',
                          fontSize: isMobile ? '12px' : '14px'
                        }}
                      >
                        <p className="font-medium mb-1" style={{ color: entry.payload.fill }}>
                          {entry.name}
                        </p>
                        <p className="text-sm">
                          Value: {entry.value} ({percent}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Labels with percentages - Positioned below pie chart */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {data.map((entry, index) => {
            const total = data.reduce((sum, item) => sum + item.value, 0);
            const percent = ((entry.value / total) * 100).toFixed(0);
            
            return (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50"
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {entry.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {percent}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

