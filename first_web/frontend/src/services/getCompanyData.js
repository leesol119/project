import api from './api';

export const getCompanyData = async (companyName) => {
  try {
    const response = await api.get(`/data/${companyName}`);
    return response.data.result;
  } catch (error) {
    console.error('Error fetching company data:', error);
    throw error;
  }
};