import { MockDB } from './mockDatabase';

export const AuditService = {
    log: (userRole, action, details = {}) => {
        try {
            console.log(`[AUDIT] ${userRole}: ${action}`, details);
            MockDB.addAuditLog({
                userRole,
                action,
                details
            });
        } catch (error) {
            console.error('Failed to log audit action', error);
        }
    }
};
