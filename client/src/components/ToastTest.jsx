import React from 'react';
import { adminToast } from '../utils/adminToast';

const ToastTest = () => {
  const testToasts = () => {
    adminToast.success('Test success message - should show dark text and auto-close in 5 seconds');
    
    setTimeout(() => {
      adminToast.error('Test error message - should show dark text and auto-close in 5 seconds');
    }, 1000);
    
    setTimeout(() => {
      adminToast.info('Test info message - should show dark text and auto-close in 5 seconds');
    }, 2000);
    
    setTimeout(() => {
      adminToast.warning('Test warning message - should show dark text and auto-close in 5 seconds');
    }, 3000);
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold mb-4">Toast Functionality Test</h3>
      <button 
        onClick={testToasts}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test All Toast Types
      </button>
      <div className="mt-4 text-sm text-gray-600">
        <p>Click the button to test toast notifications.</p>
        <p>Expected behavior:</p>
        <ul className="list-disc list-inside mt-2">
          <li>Toasts should appear with dark text (not white)</li>
          <li>Toasts should auto-close after 5 seconds</li>
          <li>Toasts should have yellow/orange theme colors</li>
          <li>No page refresh should be needed</li>
        </ul>
      </div>
    </div>
  );
};

export default ToastTest;