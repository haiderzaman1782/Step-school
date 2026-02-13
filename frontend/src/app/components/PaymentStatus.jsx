import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.jsx";
import { Progress } from "./ui/progress.jsx";
import { DollarSign, CircleCheck, Clock, CircleX } from "lucide-react";

export function PaymentStatus({ payments = [] }) {
  // Calculate amounts from database payments, ensuring proper number parsing
  const totalAmount = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const paidAmount = payments.filter(p => p.status === "paid").reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const pendingAmount = payments.filter(p => p.status === "pending").reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const failedAmount = payments.filter(p => p.status === "failed").reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  // Avoid division by zero
  const paidPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  const stats = [
    {
      label: "Paid",
      amount: paidAmount,
      count: payments.filter(p => p.status === "paid").length,
      icon: CircleCheck,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    {
      label: "Pending",
      amount: pendingAmount,
      count: payments.filter(p => p.status === "pending").length,
      icon: Clock,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20"
    },
    {
      label: "Failed",
      amount: failedAmount,
      count: payments.filter(p => p.status === "failed").length,
      icon: CircleX,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/20 border-2 border-red-500"
    }
  ];

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 sm:p-4 rounded-xl shadow-md dark:shadow-none">
      <CardHeader>
        <CardTitle className="dark:text-white">Payment Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Total Revenue */}
        <div className="flex items-center justify-between sm:p-6 bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-950/30 dark:to-teal-950/30 rounded-lg">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-300">${totalAmount.toFixed(2)}</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>

        {/* Payment Progress */}
        <div className="space-y-2 pb-5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Collection Rate</span>
            <span className="font-semibold text-gray-900 dark:text-white">{paidPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={paidPercentage} className="h-2" />
        </div>

        {/* Status Breakdown */}
        <div className="space-y-2 sm:space-y-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`flex items-center justify-between space-y-5 p-2 sm:p-3 rounded-lg ${stat.bgColor}`}>
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color} flex-shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">{stat.label}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{stat.count} transactions</p>
                  </div>
                </div>
                <p className={`text-sm sm:text-base font-bold ${stat.color} ml-2 flex-shrink-0`}>${stat.amount.toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

