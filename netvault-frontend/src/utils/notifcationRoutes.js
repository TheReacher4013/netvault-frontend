/**
 * @param {object} notification  - notification document (with source, type, entityType, entityId, actionUrl)
 * @param {string} userRole      - current user's role
 * @returns {string}             - route path to navigate to
 */
export function getNotificationRoute(notification, userRole) {
  if (!notification) return '/dashboard';

  const { source, type, entityType, entityId, actionUrl } = notification;
  const isClient      = userRole === 'client';
  const isSuperAdmin  = userRole === 'superAdmin';


  if (actionUrl) return actionUrl;

  if (source === 'broadcast') {
    if (isSuperAdmin) return '/super-admin/notifications';
    return '/notifications';
  }

 
  const id = entityId || null;

  switch (type) {

    
    case 'domain_expiry':
      if (isClient) return '/client-portal/domains';
      return id ? `/domains/${id}` : '/domains';

    case 'hosting_expiry':
    case 'ssl_expiry':
    case 'server_down':
      if (isClient) return '/client-portal/hosting';
      return id ? `/hosting/${id}` : '/hosting';

    case 'invoice_overdue':
      if (isClient) return '/client-portal/invoices';
      return id ? `/billing/${id}` : '/billing';

    case 'payment_received':
      if (isClient) return '/client-portal/invoices';
      return '/billing';

    // CRM
    case 'new_client':
      if (isClient) return '/client-portal';
      return id ? `/clients/${id}` : '/clients';

    // Generic — fall back to entityType if present
    default:
      if (entityType) {
        switch (entityType) {
          case 'domain':
            if (isClient) return '/client-portal/domains';
            return id ? `/domains/${id}` : '/domains';
          case 'hosting':
            if (isClient) return '/client-portal/hosting';
            return id ? `/hosting/${id}` : '/hosting';
          case 'client':
            if (isClient) return '/client-portal';
            return id ? `/clients/${id}` : '/clients';
          case 'invoice':
            if (isClient) return '/client-portal/invoices';
            return id ? `/billing/${id}` : '/billing';
          default:
            break;
        }
      }
      // Final fallback: go to the alerts page for the role
      if (isClient)     return '/client-portal/alerts';
      if (isSuperAdmin) return '/super-admin/alerts';
      return '/alerts';
  }
}
