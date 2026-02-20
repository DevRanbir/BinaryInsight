const AuditLog = require('../models/AuditLog');

const auditMiddleware = (action) => {
  return async (req, res, next) => {
    const originalJson = res.json;

    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        AuditLog.create({
          userId: req.user?.id,
          action,
          description: `${req.method} ${req.path}`,
          ip: req.ip
        }).catch(err => console.error('Audit log error:', err));
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

module.exports = auditMiddleware;
