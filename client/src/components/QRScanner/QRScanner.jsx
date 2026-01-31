import React, { useState } from 'react';
import { FaQrcode, FaTimes } from 'react-icons/fa';

const QRScanner = ({ onScan, onClose }) => {
  const [scannedData, setScannedData] = useState('');

  const handleManualInput = () => {
    if (scannedData.trim()) {
      try {
        const data = JSON.parse(scannedData);
        onScan(data);
      } catch (error) {
        alert('Invalid QR code data format');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FaQrcode className="text-[#bca142]" />
            Scan QR Code
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-xl font-bold"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="p-6">
          <div className="text-center mb-4">
            <FaQrcode className="mx-auto text-gray-400 mb-2" size={48} />
            <p className="text-gray-600">QR Code camera scanner not implemented yet.</p>
            <p className="text-sm text-gray-500">For now, you can paste the QR code data manually:</p>
          </div>
          
          <div className="space-y-4">
            <textarea
              value={scannedData}
              onChange={(e) => setScannedData(e.target.value)}
              placeholder="Paste QR code JSON data here..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bca142]"
              rows="4"
            />
            
            <div className="flex gap-2">
              <button
                onClick={handleManualInput}
                className="flex-1 bg-[#bca142] text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Process Data
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;