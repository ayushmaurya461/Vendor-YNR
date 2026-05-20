import { resolveApiUrl } from '../app/core/utils/api-url.util';

export const environment = {
  production: true,
  apiUrl: resolveApiUrl('http://localhost:3000'),
};
