import axios from 'axios';

const BASE_URL = 'http://localhost:8000'; // Change this to your backend URL if needed

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchDevices = async () => {
  try {
    const response = await apiClient.get('/devices');
    return response.data;
  } catch (error) {
    console.error('Error fetching devices:', error);
    throw error;
  }
};

export const fetchDeviceDetails = async (deviceId) => {
  try {
    const response = await apiClient.get(`/devices/${deviceId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching device ${deviceId}:`, error);
    throw error;
  }
};

export const fetchTelemetry = async (deviceId) => {
  try {
    const response = await apiClient.get(`/telemetry/${deviceId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching telemetry for device ${deviceId}:`, error);
    throw error;
  }
};

export const controlPump = async (deviceId, state, manual = true) => {
  try {
    const response = await apiClient.post(`/devices/${deviceId}/pump`, {
      pump: state,
      manual,
    });
    return response.data;
  } catch (error) {
    console.error(`Error controlling pump for device ${deviceId}:`, error);
    throw error;
  }
};

export const getAiDecision = async (deviceId) => {
  try {
    const response = await apiClient.get(`/devices/${deviceId}/ai-decision`);
    return response.data;
  } catch (error) {
    console.error(`Error getting AI decision for device ${deviceId}:`, error);
    throw error;
  }
};

export const triggerAnalysis = async (deviceId) => {
  try {
    const response = await apiClient.post(`/devices/${deviceId}/analyze`);
    return response.data;
  } catch (error) {
    console.error(`Error triggering analysis for device ${deviceId}:`, error);
    throw error;
  }
}; 