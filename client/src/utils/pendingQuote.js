// utils/pendingQuote.js
import { api } from './api';
import toast from 'react-hot-toast';

export const submitPendingQuote = async () => {
  try {
    const pendingQuoteData = localStorage.getItem('pendingQuote');
    
    if (!pendingQuoteData) {
      return { success: false, message: 'No pending quote found' };
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