import { createContext, useContext, useState } from 'react';
import FuturisticLoader from '../components/Loader/FuturisticLoader';

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  const showLoading = (message = 'Loading...') => {
    setLoadingMessage(message);
    setLoading(true);
  };

  const hideLoading = () => {
    setLoading(false);
  };

  const withLoading = async (asyncFunction, message = 'Loading...') => {
    try {
      showLoading(message);
      const result = await asyncFunction();
      return result;
    } finally {
      hideLoading();
    }
  };

  return (
    <LoadingContext.Provider value={{
      loading,
      showLoading,
      hideLoading,
      withLoading
    }}>
      {children}
      {loading && <FuturisticLoader message={loadingMessage} />}
    </LoadingContext.Provider>
  );
};

export default LoadingContext;