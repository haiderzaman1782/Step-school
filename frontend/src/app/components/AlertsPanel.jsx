import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.jsx";
import { Badge } from "./ui/badge.jsx";
import { TriangleAlert, CircleX, Clock } from "lucide-react";
import { cn } from "./ui/utils.js";
import { formatDistanceToNow } from "date-fns";

const alertConfig = {
  critical: {
    icon: CircleX,
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800",
    textColor: "text-red-900 dark:text-red-100",
    badgeColor: "bg-red-500 text-white",
    iconColor: "text-red-600 dark:text-red-400"
  },
  warning: {
    icon: TriangleAlert,
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    textColor: "text-yellow-900 dark:text-yellow-100",
    badgeColor: "bg-yellow-500 text-white",
    iconColor: "text-yellow-600 dark:text-yellow-400"
  },
  info: {
    icon: Clock,
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    textColor: "text-blue-900 dark:text-blue-100",
    badgeColor: "bg-blue-500 text-white",
    iconColor: "text-blue-600 dark:text-blue-400"
  }
};

export function AlertsPanel({ alerts, onAlertClick}) {
  const criticalCount = alerts.filter(a => a.type === "critical").length;

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 sm:p-4 rounded-xl shadow-md dark:shadow-none">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="dark:text-white text-lg sm:text-xl"> Critical Alerts</CardTitle>
          {criticalCount > 0 && (
            <Badge variant="destructive" className="animate-pulse text-xs sm:text-sm">
              {criticalCount} Critical
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
          {alerts.map((alert) => {
            const config = alertConfig[alert.type];
            const Icon = config.icon;
            
            return (
              <div
                key={alert.id}
                onClick={() => onAlertClick && onAlertClick(alert)}
                className={cn(
                  "p-3 sm:p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md",
                  config.bgColor,
                  config.borderColor,
                  alert.type === "critical" && "animate-pulse-subtle"
                )}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    config.bgColor
                  )}>
                    <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", config.iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2 mb-1">
                      <Badge className={cn(config.badgeColor, "text-xs w-fit")}>
                        {alert.category.replace("-", " ").toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className={cn("text-xs sm:text-sm font-medium mt-2 break-words", config.textColor)}>
                      {alert.message}
                    </p>
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

