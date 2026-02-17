/**
 * Transform backend appointment to frontend format
 * Maintains exact field names expected by frontend components
 */
/* transformAppointment removed */

/**
 * Transform backend voucher to frontend format
 */
export const transformVoucher = (v) => {
  if (!v) return null;
  return {
    id: v.id,
    voucherNumber: v.voucher_number,
    clientId: v.client_id,
    clientName: v.client_name,
    amount: parseFloat(v.amount) || 0,
    status: v.status || 'pending',
    dueDate: v.due_date,
    paymentTypeId: v.payment_type_id,
    paymentTypeName: v.payment_type_name,
    description: v.description || '',
    attachmentUrl: v.attachment_url || null,
    createdAt: v.created_at,
    updatedAt: v.updated_at
  };
};

/**
 * Transform backend call to frontend format
 * Maintains exact field names expected by frontend components
 */
/* transformCall removed */

/**
 * Transform backend user to frontend format
 */
export const transformUser = (user) => {
  if (!user) return null;
  return {
    id: user.id?.toString(),
    fullName: user.full_name || user.fullname || user.name || 'Unknown User',
    email: user.email || '',
    phone: user.phone || '',
    role: user.role === 'customer' ? 'client' : (user.role || 'client'),
    status: user.status || 'active',
    lastActivity: user.lastactivity || user.updated_at || user.created_at,
    createdAt: user.createdat || user.created_at,
    avatar: user.avatar && user.avatar.trim() !== ''
      ? (user.avatar.startsWith('http')
        ? user.avatar
        : user.avatar.startsWith('/uploads')
          ? `${(import.meta.env.VITE_API_URL || 'http://localhost:3001').replace('/api', '')}${user.avatar}`
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.fullname || user.email || 'User')}&background=random`)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.fullname || user.email || 'User')}&background=random`,
    failedCalls: user.failedcalls || 0,
    overdueVouchers: user.overduevouchers || 0,
    totalVouchers: user.totalvouchers || 0,
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
