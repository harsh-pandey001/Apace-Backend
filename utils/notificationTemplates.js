const notificationTemplates = {
  // Customer notifications
  booking_confirmed: {
    title: 'Booking Confirmed',
    body: (data) => `Your booking has been confirmed for pickup at ${data.pickupAddress} at ${data.pickupTime || 'scheduled time'}`,
    data: (shipment) => ({
      type: 'booking_confirmed',
      shipmentId: shipment.id,
      pickupAddress: shipment.pickupAddress,
      deliveryAddress: shipment.deliveryAddress,
      scheduledPickupTime: shipment.scheduledPickupTime
    })
  },

  driver_assigned: {
    title: 'Driver Assigned',
    body: (data) => `${data.driverName} (★${data.rating || '4.5'}) will pick up your shipment. Vehicle: ${data.vehicleDetails}`,
    data: (shipment, driver, vehicle) => ({
      type: 'driver_assigned',
      shipmentId: shipment.id,
      driverId: driver.id,
      driverName: driver.name,
      driverPhone: driver.phone,
      rating: driver.rating,
      vehicleDetails: `${vehicle.make} ${vehicle.model} ${vehicle.licensePlate}`,
      vehicleId: vehicle.id
    })
  },

  pickup_completed: {
    title: 'Pickup Completed',
    body: (data) => `Your shipment has been picked up and is on the way to ${data.deliveryAddress}`,
    data: (shipment) => ({
      type: 'pickup_completed',
      shipmentId: shipment.id,
      deliveryAddress: shipment.deliveryAddress,
      estimatedDeliveryTime: shipment.estimatedDeliveryTime
    })
  },

  in_transit: {
    title: 'In Transit',
    body: (data) => `Your shipment is on the way to ${data.deliveryAddress}. Estimated arrival: ${data.estimatedArrival || 'within scheduled time'}`,
    data: (shipment) => ({
      type: 'in_transit',
      shipmentId: shipment.id,
      currentLocation: shipment.currentLocation,
      estimatedArrival: shipment.estimatedDeliveryTime
    })
  },

  out_for_delivery: {
    title: 'Out for Delivery',
    body: (data) => `Your shipment is out for delivery to ${data.deliveryAddress} and will arrive in approximately ${data.eta} minutes`,
    data: (shipment, eta = 30) => ({
      type: 'out_for_delivery',
      shipmentId: shipment.id,
      eta: eta,
      deliveryAddress: shipment.deliveryAddress,
      driverPhone: shipment.driverPhone
    })
  },

  delivered: {
    title: 'Delivered Successfully',
    body: (data) => `Your shipment has been delivered successfully to ${data.deliveryAddress}`,
    data: (shipment) => ({
      type: 'delivered',
      shipmentId: shipment.id,
      deliveryAddress: shipment.deliveryAddress,
      deliveryTime: new Date().toISOString(),
      rating_requested: true
    })
  },

  cancelled: {
    title: 'Shipment Cancelled',
    body: (data) => `Your shipment from ${data.pickupAddress} to ${data.deliveryAddress} has been cancelled. ${data.reason || 'Please contact customer support for details.'}`,
    data: (shipment, reason) => ({
      type: 'cancelled',
      shipmentId: shipment.id,
      pickupAddress: shipment.pickupAddress,
      deliveryAddress: shipment.deliveryAddress,
      reason: reason,
      refundInfo: shipment.refundInfo
    })
  },

  delayed: {
    title: 'Delivery Delayed',
    body: (data) => `Your delivery to ${data.deliveryAddress} is delayed by approximately ${data.delayMinutes} minutes due to ${data.reason}`,
    data: (shipment, delayMinutes, reason) => ({
      type: 'delayed',
      shipmentId: shipment.id,
      deliveryAddress: shipment.deliveryAddress,
      delayMinutes: delayMinutes,
      reason: reason,
      newEstimatedTime: shipment.newEstimatedTime
    })
  },

  // Driver notifications
  new_assignment: {
    title: 'New Shipment Assignment',
    body: (data) => `New shipment assigned: Pickup from ${data.pickupArea} to ${data.deliveryArea}. Payment: ₹${data.amount}`,
    data: (shipment) => ({
      type: 'new_assignment',
      shipmentId: shipment.id,
      pickupAddress: shipment.pickupAddress,
      deliveryAddress: shipment.deliveryAddress,
      pickupArea: shipment.pickupArea,
      deliveryArea: shipment.deliveryArea,
      amount: shipment.totalAmount,
      scheduledPickupTime: shipment.scheduledPickupTime,
      customerPhone: shipment.customerPhone
    })
  },

  pickup_reminder: {
    title: 'Pickup Reminder',
    body: (data) => `Reminder: Pickup at ${data.pickupAddress} in ${data.minutesUntilPickup} minutes`,
    data: (shipment, minutesUntilPickup) => ({
      type: 'pickup_reminder',
      shipmentId: shipment.id,
      pickupAddress: shipment.pickupAddress,
      minutesUntilPickup: minutesUntilPickup,
      customerPhone: shipment.customerPhone,
      customerName: shipment.customerName
    })
  },

  payment_received: {
    title: 'Payment Received',
    body: (data) => `Payment of ₹${data.amount} received for your shipment. Thank you!`,
    data: (shipment, amount) => ({
      type: 'payment_received',
      shipmentId: shipment.id,
      amount: amount,
      paymentMethod: shipment.paymentMethod,
      transactionId: shipment.transactionId
    })
  },

  // General notifications
  general: {
    title: (data) => data.title,
    body: (data) => data.body,
    data: (customData) => ({
      type: 'general',
      ...customData
    })
  },

  // Admin notification types
  system_announcement: {
    title: (data) => data.title,
    body: (data) => data.body,
    data: (customData) => ({
      type: 'system_announcement',
      ...customData
    })
  },

  service_update: {
    title: (data) => data.title,
    body: (data) => data.body,
    data: (customData) => ({
      type: 'service_update',
      ...customData
    })
  },

  emergency_alert: {
    title: (data) => data.title,
    body: (data) => data.body,
    data: (customData) => ({
      type: 'emergency_alert',
      ...customData
    })
  },

  maintenance_notice: {
    title: (data) => data.title,
    body: (data) => data.body,
    data: (customData) => ({
      type: 'maintenance_notice',
      ...customData
    })
  }
};

// Helper function to generate notification content
const generateNotificationContent = (type, templateData, additionalData = {}) => {
  const template = notificationTemplates[type];
  
  if (!template) {
    throw new Error(`Unknown notification type: ${type}`);
  }

  const title = typeof template.title === 'function' 
    ? template.title(templateData) 
    : template.title;

  const body = typeof template.body === 'function' 
    ? template.body(templateData) 
    : template.body;

  const data = typeof template.data === 'function' 
    ? template.data(templateData, additionalData) 
    : template.data;

  return {
    title,
    body,
    data: {
      ...data,
      timestamp: new Date().toISOString(),
      ...additionalData
    }
  };
};

// Helper function to get notification priority based on type
const getNotificationPriority = (type) => {
  const urgentPriorityTypes = ['emergency_alert'];
  const highPriorityTypes = ['cancelled', 'delayed', 'new_assignment', 'pickup_reminder', 'system_announcement'];
  const lowPriorityTypes = ['payment_received', 'general', 'maintenance_notice'];
  
  if (urgentPriorityTypes.includes(type)) {
    return 'urgent';
  } else if (highPriorityTypes.includes(type)) {
    return 'high';
  } else if (lowPriorityTypes.includes(type)) {
    return 'low';
  }
  
  return 'normal';
};

// Helper function to get notification channels based on type and user preferences
const getNotificationChannels = (type, userPreferences = {}) => {
  const channels = [];
  
  // Always include push notifications if enabled
  if (userPreferences.pushNotifications !== false) {
    channels.push('push');
  }
  
  // Add email for important notifications
  const emailTypes = ['booking_confirmed', 'delivered', 'cancelled'];
  if (emailTypes.includes(type) && userPreferences.emailNotifications) {
    channels.push('email');
  }
  
  // Add SMS for critical notifications
  const smsTypes = ['cancelled', 'delayed'];
  if (smsTypes.includes(type) && userPreferences.smsNotifications) {
    channels.push('sms');
  }
  
  return channels.length > 0 ? channels : ['push'];
};

module.exports = {
  notificationTemplates,
  generateNotificationContent,
  getNotificationPriority,
  getNotificationChannels
};