import { getMembershipDirectory } from './controllers/directoryController.js';

// Mock request and response objects
const mockReq = {
    query: {
        page: 1,
        limit: 12
    }
};

const mockRes = {
    status: (code) => ({
        json: (data) => {
            console.log('Status:', code);
            console.log('Response:', JSON.stringify(data, null, 2));
        }
    })
};

console.log('Testing getMembershipDirectory controller directly...');
getMembershipDirectory(mockReq, mockRes);