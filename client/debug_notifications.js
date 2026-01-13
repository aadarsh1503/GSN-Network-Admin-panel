// Debug script to check notification system setup
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Debugging Client Notification System...\n');

const requiredFiles = [
  'src/contexts/GlobalNotificationContext.jsx',
  'src/components/Notifications/ConnectionStatus.jsx',
  'src/components/Notifications/NotificationTester.jsx',
  'src/pages/Admin/NotificationTest.jsx',
  'src/styles/notifications.css'
];

console.log('1. Checking required files...');
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Check package.json dependencies
console.log('\n2. Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const requiredDeps = ['react-toastify', 'react-hot-toast'];

requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
  } else {
    console.log(`❌ ${dep} - MISSING`);
  }
});

// Check if App.jsx has the correct imports
console.log('\n3. Checking App.jsx imports...');
const appJsxPath = path.join(__dirname, 'src/App.jsx');
if (fs.existsSync(appJsxPath)) {
  const appContent = fs.readFileSync(appJsxPath, 'utf8');
  
  const requiredImports = [
    'GlobalNotificationProvider',
    'ToastContainer',
    'react-toastify/dist/ReactToastify.css',
    'ConnectionStatus'
  ];
  
  requiredImports.forEach(imp => {
    if (appContent.includes(imp)) {
      console.log(`✅ ${imp} imported`);
    } else {
      console.log(`❌ ${imp} - NOT IMPORTED`);
    }
  });
} else {
  console.log('❌ App.jsx not found');
}

console.log('\n🎉 Client diagnostic completed!');
console.log('\nIf all checks pass, the notification system should work.');
console.log('Open http://localhost:5173 and check the browser console for any runtime errors.');