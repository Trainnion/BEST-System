// Controls which admin pages render in the UI. API permission checks remain authoritative.
const ALL_STAFF = Object.freeze(['STAFF', 'TREASURER', 'OFFICIAL', 'ADMIN']);

export const ADMIN_ROUTE_ROLES = Object.freeze({
  '/admin/dashboard': ALL_STAFF,
  '/admin/account': ALL_STAFF,
  '/admin/documents': Object.freeze(['STAFF', 'ADMIN']),
  '/admin/blotter': Object.freeze(['STAFF', 'ADMIN']),
  '/admin/residents': Object.freeze(['STAFF', 'ADMIN']),
  '/admin/treasury': Object.freeze(['TREASURER', 'ADMIN']),
  '/admin/broadcasts': Object.freeze(['STAFF', 'OFFICIAL', 'ADMIN']),
  '/admin/directory': Object.freeze(['OFFICIAL', 'ADMIN']),
  '/admin/users': Object.freeze(['ADMIN']),
});

export function rolesForAdminPath(pathname) {
  const route = Object.keys(ADMIN_ROUTE_ROLES)
    .sort((left, right) => right.length - left.length)
    .find((base) => pathname === base || pathname.startsWith(`${base}/`));
  return route ? ADMIN_ROUTE_ROLES[route] : Object.freeze(['ADMIN']);
}

export function canAccessAdminPath(role, pathname) {
  return typeof role === 'string' && rolesForAdminPath(pathname).includes(role.toUpperCase());
}
