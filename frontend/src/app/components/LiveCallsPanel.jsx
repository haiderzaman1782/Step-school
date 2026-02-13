import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.jsx";
import { Badge } from "./ui/badge.jsx";
import { PhoneCall, Clock } from "lucide-react";
import { cn } from "./ui/utils.js";

const statusConfig = {
  active: {
    color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    dotColor: "bg-green-500",
    label: "Active"
  },
  "on-hold": {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
    dotColor: "bg-yellow-500",
    label: "On Hold"
  },
  transferring: {
    color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    dotColor: "bg-blue-500",
    label: "Transferring"
  }
};

export function LiveCallsPanel({ calls }) {
  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 sm:p-4 rounded-xl shadow-md dark:shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="dark:text-white">Live Voice Calls</CardTitle>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
            {calls.length} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {calls.map((call) => {
            const config = statusConfig[call.status];
            return (
              <div
                key={call.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full flex items-center justify-center">
                      <PhoneCall className="w-6 h-6 text-white" />
                    </div>
                    <span className={cn(
                      "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900",
                      config.dotColor,
                      call.status === "active" && "animate-pulse"
                    )} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{call.callerName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{call.purpose}</p>
                  </div>
                </div>
                <div className="flex sm:flex-col sm:text-right items-center sm:items-end justify-between sm:justify-start gap-2 sm:space-y-2">
                  <Badge variant="outline" className={config.color}>
                    {config.label}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{call.duration}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

