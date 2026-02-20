const ROLES = {
  ADMIN: 'admin',
  REVIEWER: 'reviewer',
  DEVELOPER: 'developer'
};

const ROLE_PERMISSIONS = {
  admin: ['read', 'create', 'update', 'delete', 'approve', 'reject', 'assign', 'manage_settings'],
  reviewer: ['read', 'approve', 'reject', 'comment'],
  developer: ['read', 'create', 'update']
};

const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

module.exports = {
  ROLES,
  ROLE_PERMISSIONS,
  hasPermission
};
