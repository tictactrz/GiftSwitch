import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
            <div className="mt-4 space-y-4">
              <div className="flex items-center">
                <input
                  id="emailNotifications"
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="emailNotifications" className="ml-3 text-sm text-gray-700">
                  Email notifications
                </label>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900">Privacy</h2>
            {/* Add privacy settings here */}
          </div>
        </div>
      </div>
    </div>
  );
} 