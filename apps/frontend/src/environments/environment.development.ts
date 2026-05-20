import { resolveApiUrl } from '../app/core/utils/api-url.util';

export const environment = {
  production: false,
  apiUrl: resolveApiUrl('http://localhost:3000'),
};
