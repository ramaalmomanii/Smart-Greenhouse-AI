import React, { useState, useEffect } from 'react';
import { useDevices } from '../hooks/useDevices';
import { fetchDeviceDetails, fetchTelemetry, controlPump, getAiDecision } from '../api/apiClient';
import { format } from 'date-fns';

const Dashboard = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiDecision, setAiDecision] = useState(null);
  
  // Tank capacity in ml
  const TANK_CAPACITY_ML = 400;
  
  // Convert water level percentage to milliliters
  const waterLevelToMl = (percentage) => {
    return Math.round((percentage / 100) * TANK_CAPACITY_ML);
  };
  
  // Fetch devices with 10 second polling
  const { devices: devicesList, loading: devicesLoading } = useDevices(10000);
  
  // Convert devices object to array for easier rendering
  const devicesArray = Object.values(devicesList);
  
  // When a device is selected, fetch its details
  useEffect(() => {
    if (!selectedDeviceId) return;
    
    async function loadDeviceData() {
      setLoading(true);
      try {
        const deviceData = await fetchDeviceDetails(selectedDeviceId);
        const telemetryData = await fetchTelemetry(selectedDeviceId);
        setSelectedDevice(deviceData);
        setTelemetry(telemetryData);
        
        // Automatically fetch AI decision when device is selected or updated
        try {
          const decision = await getAiDecision(selectedDeviceId);
          setAiDecision(decision);
        } catch (err) {
          console.error('Error getting AI decision:', err);
        }
      } catch (err) {
        console.error('Error loading device data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadDeviceData();
    // Set up polling for device updates
    const interval = setInterval(loadDeviceData, 10000);
    return () => clearInterval(interval);
  }, [selectedDeviceId]);
  
  const handleTogglePump = async (newState) => {
    if (!selectedDeviceId) return;
    
    try {
      await controlPump(selectedDeviceId, newState);
      // Refresh device data after pump toggle
      const deviceData = await fetchDeviceDetails(selectedDeviceId);
      setSelectedDevice(deviceData);
    } catch (err) {
      console.error('Error toggling pump:', err);
    }
  };
  
  const handleGetAiDecision = async () => {
    if (!selectedDeviceId) return;
    
    try {
      const decision = await getAiDecision(selectedDeviceId);
      setAiDecision(decision);
    } catch (err) {
      console.error('Error getting AI decision:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Smart Irrigation Dashboard
          </h1>
        </div>
      </header>
      
      {/* Main Content */}
      <main>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {/* Sidebar with devices list */}
            <div className="md:col-span-1">
              <h2 className="text-lg font-medium mb-4 dark:text-white">Devices</h2>
              {devicesLoading ? (
                <div className="animate-pulse bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ) : devicesArray.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No devices connected</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {devicesArray.map(device => (
                    <div
                      key={device.deviceId}
                      className={`bg-white dark:bg-gray-800 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
                        selectedDeviceId === device.deviceId 
                          ? 'border-primary-500' 
                          : 'border-transparent'
                      }`}
                      onClick={() => setSelectedDeviceId(device.deviceId)}
                    >
                      <h3 className="font-medium dark:text-white">{device.deviceId}</h3>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Moisture</p>
                          <p className="text-sm dark:text-white">{device.moisture.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Temperature</p>
                          <p className="text-sm dark:text-white">{device.temperature.toFixed(1)}°C</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Water</p>
                          <p className="text-sm dark:text-white">{waterLevelToMl(device.waterLevel)} ml</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Pump</p>
                          <p className={`text-sm ${device.pumpState ? 'text-green-500' : 'text-red-500'}`}>
                            {device.pumpState ? 'ON' : 'OFF'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Main device area */}
            <div className="md:col-span-3">
              {selectedDevice ? (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <h2 className="text-xl font-bold mb-4 dark:text-white">
                      Device: {selectedDevice.deviceId}
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Soil Moisture</p>
                        <p className="text-2xl font-bold dark:text-white">{selectedDevice.moisture.toFixed(1)}%</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Temperature</p>
                        <p className="text-2xl font-bold dark:text-white">{selectedDevice.temperature.toFixed(1)}°C</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Humidity</p>
                        <p className="text-2xl font-bold dark:text-white">{selectedDevice.humidity.toFixed(1)}%</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Water Level</p>
                        <div className="flex items-center">
                          <p className="text-2xl font-bold dark:text-white">{waterLevelToMl(selectedDevice.waterLevel)} ml</p>
                          <p className="ml-2 text-xs text-gray-500 dark:text-gray-400">/ 400 ml</p>
                        </div>
                        <div className="mt-2 bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                          <div 
                            className="bg-blue-500 h-2.5 rounded-full" 
                            style={{ width: `${selectedDevice.waterLevel}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg col-span-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pump Control</p>
                        <div className="flex items-center mt-2">
                          <span className={`inline-flex h-6 w-6 rounded-full ${
                            selectedDevice.pumpState ? 'bg-green-500' : 'bg-red-500'
                          }`}></span>
                          <span className="ml-2 dark:text-white">
                            {selectedDevice.pumpState ? 'ON' : 'OFF'}
                          </span>
                          <div className="ml-auto">
                            <button
                              className={`px-4 py-2 rounded-md ${
                                selectedDevice.pumpState
                                  ? 'bg-red-500 hover:bg-red-600'
                                  : 'bg-green-500 hover:bg-green-600'
                              } text-white`}
                              onClick={() => handleTogglePump(!selectedDevice.pumpState)}
                            >
                              Turn {selectedDevice.pumpState ? 'OFF' : 'ON'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Decision - Updated to be more prominent */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold dark:text-white">AI Irrigation Decision</h2>
                      <button
                        className="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-md"
                        onClick={handleGetAiDecision}
                      >
                        Refresh Decision
                      </button>
                    </div>
                    
                    {loading ? (
                      <div className="animate-pulse p-4 rounded-md bg-gray-100 dark:bg-gray-700">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
                      </div>
                    ) : aiDecision ? (
                      <div className={`p-4 rounded-md ${
                        aiDecision.pump_decision
                          ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
                          : 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500'
                      }`}>
                        <div className="flex items-center">
                          <span className={`inline-flex h-6 w-6 rounded-full mr-2 ${
                            aiDecision.pump_decision ? 'bg-green-500' : 'bg-red-500'
                          }`}></span>
                          <p className="font-bold text-lg dark:text-white">
                            Recommendation: Pump should be {aiDecision.pump_decision ? 'ON' : 'OFF'}
                          </p>
                        </div>
                        <div className="mt-3 bg-white dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                          <p className="text-gray-700 dark:text-gray-300 font-medium">AI Reasoning:</p>
                          <p className="mt-1 text-gray-700 dark:text-gray-300">{aiDecision.reasoning}</p>
                        </div>
                        {aiDecision.pump_decision !== selectedDevice.pumpState && (
                          <div className="mt-3 flex justify-end">
                            <button
                              className={`px-4 py-2 rounded-md ${
                                aiDecision.pump_decision
                                  ? 'bg-green-500 hover:bg-green-600'
                                  : 'bg-red-500 hover:bg-red-600'
                              } text-white`}
                              onClick={() => handleTogglePump(aiDecision.pump_decision)}
                            >
                              Apply Recommendation
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">Loading AI recommendation...</p>
                    )}
                  </div>
                  
                  {/* Historical Data */}
                  {telemetry && telemetry.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                      <h2 className="text-xl font-bold mb-4 dark:text-white">Recent Readings</h2>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead>
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Time</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Moisture</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Temperature</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Humidity</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Water Level</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {telemetry.slice(0, 5).map((reading, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-white">
                                  {format(new Date(reading.timestamp), 'MMM dd, HH:mm:ss')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-white">
                                  {reading.moisture.toFixed(1)}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-white">
                                  {reading.temperature.toFixed(1)}°C
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-white">
                                  {reading.humidity.toFixed(1)}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-white">
                                  {waterLevelToMl(reading.waterLevel)} ml
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">Select a device to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 