/**
 * useCoordinator — Role-based access hook
 * Returns whether the current authenticated user holds the 'coordinator' role.
 */
import { getStoredUser } from '../services/api';

export function useCoordinator() {
  const user = getStoredUser();
  return user?.role === 'coordinator';
}
