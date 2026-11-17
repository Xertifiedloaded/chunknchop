export function destinationForRole(role: string | undefined | null) {
  switch (role?.toLowerCase()) {
    case 'admin':
      return '/admin';
    case 'rider':
      return '/rider';
    case 'customer':
    default:
      return '/account/orders';
  }
}
