import { authApi, getAccessToken, getRefreshToken, setTokens, clearTokens, getDashboardPathForRole } from './api';

export const authService = {
  ...authApi,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  getDashboardPathForRole,
};

export default authService;
