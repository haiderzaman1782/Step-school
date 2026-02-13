/**
 * Helper function to normalize payment date fields
 */
const normalizePaymentDate = (payment) => {
  let paymentDate = normalizeDate(
    payment.date ||
    payment.paymentDate ||
    (payment.timestamp ? payment.timestamp.split('T')[0] : null) ||
    (payment.createdAt ? payment.createdAt.split('T')[0] : null) ||
    payment.paymentTimestamp
  );

  if (!paymentDate) {
    paymentDate = new Date().toISOString().split('T')[0];
  }

  const paymentDateObj = new Date(paymentDate);
  paymentDateObj.setHours(0, 0, 0, 0);

  return {
    ...payment,
    normalizedDate: paymentDate,
    dateObj: paymentDateObj
  };
};

/**
 * Helper function to round revenue to 2 decimal places
 */
const roundRevenue = (amount) => Math.round(amount * 100) / 100;

/**
 * Helper function to normalize date to YYYY-MM-DD format
 */
const normalizeDate = (dateValue) => {
  if (!dateValue) return null;

  // Handle string dates
  if (typeof dateValue === 'string') {
    // Handle ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
    const dateStr = dateValue.split('T')[0];
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }
    // Try to parse other string formats
    try {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  // Try to parse as Date object
  if (dateValue instanceof Date) {
    if (!isNaN(dateValue.getTime())) {
      return dateValue.toISOString().split('T')[0];
    }
  }

  // Try to parse as number (timestamp)
  if (typeof dateValue === 'number') {
    try {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  return null;
};

/* calculateWeeklyData and calculateMonthlyData removed as they used calls */

/**
 * Calculate service distribution from appointments
 */


/**
 * Calculate weekly revenue data from payments
 */
export const calculateWeeklyRevenue = (payments = []) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (payments.length === 0) {
    return days.map(day => ({ name: day, revenue: 0, transactions: 0 }));
  }

  const paymentsWithDates = payments.map(normalizePaymentDate);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  return days.map((day, index) => {
    const targetDate = new Date(startOfWeek);
    targetDate.setDate(startOfWeek.getDate() + index);
    const dateStr = targetDate.toISOString().split('T')[0];

    const dayPayments = paymentsWithDates.filter(payment => {
      return payment.normalizedDate === dateStr;
    });

    const revenue = dayPayments.reduce((sum, p) => {
      const amount = parseFloat(p.amount) || 0;
      return sum + amount;
    }, 0);

    const transactions = dayPayments.length;

    return {
      name: day,
      revenue: roundRevenue(revenue),
      transactions,
    };
  });
};

/**
 * Calculate monthly revenue data from payments (last 4 weeks)
 */
export const calculateMonthlyRevenue = (payments = []) => {
  const today = new Date();
  const weeks = [];

  if (payments.length === 0) {
    for (let i = 3; i >= 0; i--) {
      weeks.push({ name: `Week ${4 - i}`, revenue: 0, transactions: 0 });
    }
    return weeks;
  }

  const paymentsWithDates = payments.map(normalizePaymentDate);

  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (i * 7));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekPayments = paymentsWithDates.filter(payment => {
      return payment.dateObj >= weekStart && payment.dateObj <= weekEnd;
    });

    const revenue = weekPayments.reduce((sum, p) => {
      const amount = parseFloat(p.amount) || 0;
      return sum + amount;
    }, 0);

    const transactions = weekPayments.length;

    weeks.push({
      name: `Week ${4 - i}`,
      revenue: roundRevenue(revenue),
      transactions,
    });
  }

  return weeks;
};

/**
 * Calculate yearly revenue data from payments (last 12 months)
 * Groups payments by month
 */
export const calculateYearlyRevenue = (payments = []) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const today = new Date();

  if (payments.length === 0) {
    return months.map(month => ({ name: month, revenue: 0, transactions: 0 }));
  }

  const paymentsWithDates = payments.map(normalizePaymentDate);

  // Get last 12 months
  const monthlyData = [];
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const monthPayments = paymentsWithDates.filter(payment => {
      return payment.dateObj >= monthStart && payment.dateObj <= monthEnd;
    });

    const revenue = monthPayments.reduce((sum, p) => {
      const amount = parseFloat(p.amount) || 0;
      return sum + amount;
    }, 0);

    const transactions = monthPayments.length;
    const monthName = months[monthStart.getMonth()];

    monthlyData.push({
      name: monthName,
      revenue: roundRevenue(revenue),
      transactions,
    });
  }

  return monthlyData;
};