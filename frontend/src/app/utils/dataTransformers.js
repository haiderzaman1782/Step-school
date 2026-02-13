/**
 * Transform backend appointment to frontend format
 * Maintains exact field names expected by frontend components
 */
/* transformAppointment removed */

/**
 * Transform backend payment to frontend format
 * Maintains exact field names expected by frontend components
 */
export const transformPayment = (payment) => {
  if (!payment) return null;
  return {
    id: (payment.id || payment.transactionid || payment.transactionId)?.toString() || `PAY${String(Date.now()).slice(-6)}`,
    customerName: payment.customerName || payment.customername || 'Unknown',
    service: payment.service || 'N/A',
    amount: parseFloat(payment.amount) || 0,
    status: payment.status || 'pending',
    date: payment.date || payment.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    timestamp: payment.timestamp || payment.created_at || new Date().toISOString(),
    paymentMethod: payment.paymentMethod || payment.paymentmethod || 'Other',
    transactionId: payment.transactionId || payment.transactionid || `txn_${payment.id}`,
    callReference: payment.callReference || payment.callreference || 'N/A',
    invoiceNumber: payment.invoiceNumber || payment.invoicenumber || 'N/A',
    failureReason: payment.failureReason || payment.failurereason || '',
    userId: payment.userId || payment.userid || payment.user_id || null,
  };
};

/**
 * Transform backend call to frontend format
 * Maintains exact field names expected by frontend components
 */
/* transformCall removed */

/**
 * Transform backend user to frontend format
 * Maintains exact field names expected by frontend components
 */
export const transformUser = (user, stats = {}) => {
  return {
    id: user.id?.toString() || `USR${String(user.id).padStart(3, '0')}`,
    fullName: user.fullname || 'Unknown User',
    email: user.email || '',
    phone: user.phone || '',
    role: user.role || 'customer',
    status: user.status || 'active',
    lastActivity: user.lastactivity || user.updated_at || user.created_at,
    createdAt: user.createdat || user.created_at,
    avatar: user.avatar && user.avatar.trim() !== ''
      ? (user.avatar.startsWith('http')
        ? user.avatar
        : user.avatar.startsWith('/uploads')
          ? `${(import.meta.env.VITE_API_URL || 'http://localhost:3001').replace('/api', '')}${user.avatar}`
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname || 'User')}&background=random`)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname || 'User')}&background=random`,
    failedCalls: user.failedcalls || 0,
    failedPayments: user.failedpayments || 0,
    totalCalls: user.totalcalls || 0,
    totalPayments: user.totalpayments || 0,
  };
};

/**
 * Transform backend call to live call format
 * Maintains exact field names expected by LiveCallsPanel component
 */
/* transformLiveCall removed */

// Helper functions
function formatTime(timeString) {
  if (!timeString) return '';
  // If already in "09:00 AM" format, return as is
  if (timeString.includes('AM') || timeString.includes('PM')) {
    return timeString;
  }
  // Convert TIME format (HH:MM:SS) to "HH:MM AM/PM"
  if (timeString.includes(':')) {
    const parts = timeString.split(':');
    const hour = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }
  return timeString;
}

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
