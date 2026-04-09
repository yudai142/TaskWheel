import axios from 'axios';

type MockedAxios = {
  get: { mockResolvedValue: (value: unknown) => void };
  post: { mockResolvedValue: (value: unknown) => void };
  patch: { mockResolvedValue: (value: unknown) => void };
  delete: { mockResolvedValue: (value: unknown) => void };
};

export const setDefaultAxiosMocks = () => {
  const mockedAxios = axios as unknown as MockedAxios;

  mockedAxios.get.mockResolvedValue({ data: [] });
  mockedAxios.post.mockResolvedValue({ data: {} });
  mockedAxios.patch.mockResolvedValue({ data: {} });
  mockedAxios.delete.mockResolvedValue({ data: {} });
};
