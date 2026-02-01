// utils/pendingQuote.js
import { api } from './api';
import toast from 'react-hot-toast';

export const submitPendingQuote = async () => {
  try {
    const pendingQuoteData = localStorage.getItem('pendingQuote');
    
    if (!pendingQuoteData) {
      return { success: false, message: 'No pending quote found' };
    }

    // Check user role before submitting
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // If user is a company, clear the pending quote and don't submit
    if (user.role === 'company') {
      localStorage.removeItem('pendingQuote');
      console.log('Pending quote cleared - Company users cannot request quotes');
      return { 
        success: false, 
        message: 'Company users cannot request quotes. Pending quote cleared.' 
      };
    }

    // Only allow business and regular users to submit quotes
    if (user.role !== 'business' && user.role !== 'user') {
      localStorage.removeItem('pendingQuote');
      console.log('Pending quote cleared - Invalid user role for quote requests');
      return { 
        success: false, 
        message: 'Invalid user role for quote requests. Pending quote cleared.' 
      };
    }

    const quoteData = JSON.parse(pendingQuoteData);
    
    // Submit the quote
    const response = await api.post('/api/quotes/submit', quoteData);
    
    // Clear the pending quote from localStorage
    localStorage.removeItem('pendingQuote');
    
    toast.success('Your quote request has been submitted successfully!');
    
    return { 
      success: true, 
      message: 'Quote submitted successfully',
      quoteId: response.quoteId 
    };
    
  } catch (error) {
    console.error('Error submitting pending quote:', error);
    toast.error('Failed to submit your quote request. Please try again.');
    
    return { 
      success: false, 
      message: error.message || 'Failed to submit quote' 
    };
  }
};

export const hasPendingQuote = () => {
  return localStorage.getItem('pendingQuote') !== null;
};

export const clearPendingQuote = () => {
  localStorage.removeItem('pendingQuote');
};

// New function to check if pending quote should be cleared based on user role
export const checkAndClearInvalidPendingQuote = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const pendingQuote = localStorage.getItem('pendingQuote');
  
  // If there's a pending quote and user is a company, clear it
  if (pendingQuote && user.role === 'company') {
    localStorage.removeItem('pendingQuote');
    console.log('Cleared pending quote - Company users cannot request quotes');
    return true;
  }
  
  return false;
};