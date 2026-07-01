import axios from 'axios';

export const createApiClient = (baseURL: string, token: string | null) => {
  return axios.create({
    baseURL,
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });
};
