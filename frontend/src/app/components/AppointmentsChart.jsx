import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs.jsx";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function AppointmentsChart({ weeklyData, monthlyData }) {
  const [chartHeight, setChartHeight] = React.useState(300);

  React.useEffect(() => {
    const updateHeight = () => {
      if (window.innerWidth < 640) {
        setChartHeight(250);
      } else if (window.innerWidth < 1024) {
        setChartHeight(280);
      } else {
        setChartHeight(300);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 sm:p-4 rounded-xl shadow-md dark:shadow-none">
      <CardHeader>
        <CardTitle className="dark:text-white text-lg sm:text-xl p-4 sm:p-6">Appointments & Calls Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full max-w-md p-0 grid-cols-3 space-x-2">
            <TabsTrigger 
              value="weekly" 
              className="text-xs sm:text-sm data-[state=active]:bg-gray-500 data-[state=active]:text-white dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white"
            >
              Weekly
            </TabsTrigger>
            <TabsTrigger 
              value="monthly" 
              className="text-xs sm:text-sm data-[state=active]:bg-gray-500 data-[state=active]:text-white dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white"
            >
              Monthly
            </TabsTrigger>
            <TabsTrigger 
              value="bar" 
              className="text-xs sm:text-sm data-[state=active]:bg-gray-500 data-[state=active]:text-white dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white"
            >
              Bar Chart
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="weekly" className="mt-4 sm:mt-6">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280" 
                  className="dark:stroke-gray-400"
                  tick={{ fill: '#6b7280' }}
                  style={{ fill: '#6b7280' }}
                />
                <YAxis 
                  stroke="#6b7280" 
                  className="dark:stroke-gray-400"
                  tick={{ fill: '#6b7280' }}
                  style={{ fill: '#6b7280' }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const isDark = document.documentElement.classList.contains('dark');
                      return (
                        <div 
                          className="rounded-lg border p-3 shadow-md"
                          style={{
                            backgroundColor: isDark ? 'rgb(31, 41, 55)' : 'rgb(255, 255, 255)',
                            borderColor: isDark ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)',
                            color: isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)'
                          }}
                        >
                          <p className="font-medium mb-2">{payload[0].payload.name}</p>
                          {payload.map((entry, index) => (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                              {entry.name}: {entry.value}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ color: '#6b7280' }} className="dark:[&_text]:fill-gray-400" />
                <Area 
                  type="monotone" 
                  dataKey="appointments" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorAppointments)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="calls" 
                  stroke="#14b8a6" 
                  fillOpacity={1} 
                  fill="url(#colorCalls)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="monthly" className="mt-4 sm:mt-6">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280" 
                  className="dark:stroke-gray-400"
                  tick={{ fill: '#6b7280' }}
                  style={{ fill: '#6b7280' }}
                />
                <YAxis 
                  stroke="#6b7280" 
                  className="dark:stroke-gray-400"
                  tick={{ fill: '#6b7280' }}
                  style={{ fill: '#6b7280' }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const isDark = document.documentElement.classList.contains('dark');
                      return (
                        <div 
                          className="rounded-lg border p-3 shadow-md"
                          style={{
                            backgroundColor: isDark ? 'rgb(31, 41, 55)' : 'rgb(255, 255, 255)',
                            borderColor: isDark ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)',
                            color: isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)'
                          }}
                        >
                          <p className="font-medium mb-2">{payload[0].payload.name}</p>
                          {payload.map((entry, index) => (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                              {entry.name}: {entry.value}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ color: '#6b7280' }} className="dark:[&_text]:fill-gray-400" />
                <Line 
                  type="monotone" 
                  dataKey="appointments" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 5 }}
                  activeDot={{ r: 7 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="calls" 
                  stroke="#14b8a6" 
                  strokeWidth={3}
                  dot={{ fill: '#14b8a6', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="bar" className="mt-4 sm:mt-6">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280" 
                  className="dark:stroke-gray-400"
                  tick={{ fill: '#6b7280' }}
                  style={{ fill: '#6b7280' }}
                />
                <YAxis 
                  stroke="#6b7280" 
                  className="dark:stroke-gray-400"
                  tick={{ fill: '#6b7280' }}
                  style={{ fill: '#6b7280' }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const isDark = document.documentElement.classList.contains('dark');
                      return (
                        <div 
                          className="rounded-lg border p-3 shadow-md"
                          style={{
                            backgroundColor: isDark ? 'rgb(31, 41, 55)' : 'rgb(255, 255, 255)',
                            borderColor: isDark ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)',
                            color: isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)'
                          }}
                        >
                          <p className="font-medium mb-2">{payload[0].payload.name}</p>
                          {payload.map((entry, index) => (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                              {entry.name}: {entry.value}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ color: '#6b7280' }} className="dark:[&_text]:fill-gray-400" />
                <Bar dataKey="appointments" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="calls" fill="#14b8a6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

