// Debug script to check quote and response data for approved status
// Run this in browser console on the quote details page

console.log('=== QUOTE APPROVED STATUS DEBUG ===');

// Check if we're on the right page
const currentUrl = window.location.href;
console.log('Current URL:', currentUrl);

// Try to access React component state (this might not work depending on React version)
const reactFiberKey = Object.keys(document.querySelector('#root')).find(key => key.startsWith('__reactFiber'));
if (reactFiberKey) {
  console.log('React Fiber found, attempting to access component state...');
}

// Alternative: Check for any global variables or data
if (window.quote) {
  console.log('Quote data found:', window.quote);
}

if (window.responses) {
  console.log('Responses data found:', window.responses);
}

// Check localStorage for any relevant data
const localStorageKeys = Object.keys(localStorage);
console.log('LocalStorage keys:', localStorageKeys);

// Check for any API calls in network tab
console.log('Check Network tab for these API calls:');
console.log('1. /api/user-quotes/my-quotes');
console.log('2. /api/enhanced-quotes/{quoteId}/responses-with-bank-details');

// Instructions for manual debugging
console.log('\n=== MANUAL DEBUGGING STEPS ===');
console.log('1. Open Network tab in DevTools');
console.log('2. Refresh the page');
console.log('3. Look for the API responses mentioned above');
console.log('4. Check the response data for:');
console.log('   - quote.status (should be "approved")');
console.log('   - responses array with user_response_status and payment_status');
console.log('5. If quote.status is "approved" but no company shows:');
console.log('   - Check if any response has user_response_status === "accepted"');
console.log('   - Check payment_status values (verified, pending, rejected, null)');

// Function to simulate the filtering logic
function debugFilterLogic(quote, responses) {
  console.log('\n=== FILTER LOGIC DEBUG ===');
  console.log('Quote status:', quote?.status);
  console.log('Total responses:', responses?.length || 0);
  
  if (!responses || !Array.isArray(responses)) {
    console.log('❌ No responses array found');
    return;
  }
  
  responses.forEach((response, index) => {
    console.log(`Response ${index + 1}:`, {
      company_name: response.company_name,
      user_response_status: response.user_response_status,
      payment_status: response.payment_status,
      payment_proof_uploaded: response.payment_proof_uploaded
    });
  });
  
  if (quote?.status === 'approved') {
    const acceptedResponses = responses.filter(r => r.user_response_status === 'accepted');
    const verifiedResponses = responses.filter(r => r.user_response_status === 'accepted' && r.payment_status === 'verified');
    
    console.log('Accepted responses:', acceptedResponses.length);
    console.log('Verified responses:', verifiedResponses.length);
    
    if (acceptedResponses.length > 0) {
      console.log('✅ Should show accepted companies:', acceptedResponses.map(r => r.company_name));
    } else {
      console.log('❌ No accepted responses found');
    }
  }
}

// Export function for manual use
window.debugFilterLogic = debugFilterLogic;

console.log('\n=== USAGE ===');
console.log('Call debugFilterLogic(quote, responses) with your data to test filtering logic');
console.log('Example: debugFilterLogic({status: "approved"}, [{company_name: "Test", user_response_status: "accepted"}])');