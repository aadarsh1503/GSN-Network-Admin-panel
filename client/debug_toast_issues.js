// Debug script for toast issues
// Run this in browser console on CompanyOwners page

console.log('=== Toast Debug Information ===');

// Check if react-toastify is loaded
console.log('React Toastify loaded:', typeof window.toast !== 'undefined');

// Check if adminToast is available
console.log('AdminToast available:', typeof window.adminToast !== 'undefined');

// Check ToastContainer configuration
const toastContainer = document.querySelector('.admin-toast-container');
console.log('Toast container found:', !!toastContainer);

if (toastContainer) {
  console.log('Toast container classes:', toastContainer.className);
}

// Check for existing toasts
const existingToasts = document.querySelectorAll('.admin-toast');
console.log('Existing toasts count:', existingToasts.length);

existingToasts.forEach((toast, index) => {
  console.log(`Toast ${index + 1}:`, {
    classes: toast.className,
    text: toast.textContent,
    style: toast.style.cssText
  });
});

// Test function
window.testToastAutoClose = function() {
  console.log('Testing toast auto-close...');
  
  // Clear any existing toasts first
  if (window.toast && window.toast.dismiss) {
    window.toast.dismiss();
  }
  
  // Test with direct toast call
  setTimeout(() => {
    console.log('Creating test toast...');
    if (window.adminToast) {
      window.adminToast.success('Test toast - should auto-close in 5 seconds');
    }
  }, 500);
  
  // Check if toast is still there after 6 seconds
  setTimeout(() => {
    const remainingToasts = document.querySelectorAll('.admin-toast');
    console.log('Toasts remaining after 6 seconds:', remainingToasts.length);
    if (remainingToasts.length > 0) {
      console.error('ISSUE: Toast did not auto-close!');
    } else {
      console.log('SUCCESS: Toast auto-closed correctly!');
    }
  }, 6000);
};

console.log('Run testToastAutoClose() to test auto-close functionality');