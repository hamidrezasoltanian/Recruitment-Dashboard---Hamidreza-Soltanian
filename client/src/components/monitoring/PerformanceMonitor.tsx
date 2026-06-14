import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiService } from '../../services/apiService';

interface SystemHealth {
  status: string;
  timestamp: string;
  services: {
    database: string;
    memory: string;
    errors: string;
  };
  metrics: {
    memoryUsage: {
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
    recentErrors: number;
    uptime: number;
  };
}

interface PerformanceMetric {
  operation: string;
  count: number;
  avg: number;
  min: number;
  max: number;
  median: number;
  p95: number;
}

export const PerformanceMonitor: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealth = async () => {
    try {
      const response = await apiService.request<SystemHealth>('/monitoring/health');
      if (response.success && response.data) {
        setHealth(response.data);
      }
    } catch (error) {
      console.error('Error fetching health:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await apiService.request<{ data: PerformanceMetric[] }>('/monitoring/metrics');
      if (response.success && response.data) {
        setMetrics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const runPerformanceTest = async (testType: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.request(`/monitoring/test`, {
        method: 'POST',
        body: JSON.stringify({ testType })
      });
      
      if (response.success) {
        alert(`Performance test completed: ${(response.data as any)?.duration || 'N/A'}ms`);
      }
    } catch (error) {
      console.error('Performance test failed:', error);
      alert('Performance test failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchHealth(), fetchMetrics()]);
    };

    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Performance Monitor</h2>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            Auto Refresh (30s)
          </label>
          <button
            onClick={() => fetchHealth()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* System Health */}
      {health && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-sm border"
        >
          <h3 className="text-lg font-semibold mb-4">System Health</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.services.database)}`}>
                Database: {health.services.database}
              </div>
            </div>
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.services.memory)}`}>
                Memory: {health.services.memory}
              </div>
            </div>
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.services.errors)}`}>
                Errors: {health.services.errors}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Memory Usage</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Heap Used:</span>
                  <span className="text-sm font-medium">{health.metrics.memoryUsage.heapUsed} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Heap Total:</span>
                  <span className="text-sm font-medium">{health.metrics.memoryUsage.heapTotal} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">External:</span>
                  <span className="text-sm font-medium">{health.metrics.memoryUsage.external} MB</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">System Info</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Uptime:</span>
                  <span className="text-sm font-medium">{formatUptime(health.metrics.uptime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Recent Errors:</span>
                  <span className="text-sm font-medium">{health.metrics.recentErrors}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Check:</span>
                  <span className="text-sm font-medium">
                    {new Date(health.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-sm border"
      >
        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
        
        {metrics.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg (ms)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min (ms)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Max (ms)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P95 (ms)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.map((metric, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {metric.operation}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.avg}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.min}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.max}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.p95}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No performance metrics available</p>
        )}
      </motion.div>

      {/* Performance Tests */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-sm border"
      >
        <h3 className="text-lg font-semibold mb-4">Performance Tests</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => runPerformanceTest('basic')}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Running...' : 'Basic Test'}
          </button>
          
          <button
            onClick={() => runPerformanceTest('candidates')}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Running...' : 'Candidates Test'}
          </button>
          
          <button
            onClick={() => runPerformanceTest('analytics')}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading ? 'Running...' : 'Analytics Test'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

