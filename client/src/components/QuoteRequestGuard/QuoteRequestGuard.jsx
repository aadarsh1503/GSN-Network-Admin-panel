import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const QuoteRequestGuard = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRole = () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // If user is logged in and is a company member
      if (user.id && user.role === 'company') {
        toast.error('Company members cannot request quotes directly. Please create a user account to access the user dashboard and make quote requests.', {
          duration: 6000,
          style: {
            background: '#FEF2F2',
            color: '#DC2626',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '14px',
            maxWidth: '500px'
          }
        });
        
        // Show confirmation dialog
        const shouldCreateAccount = window.confirm(
          'Company members cannot request quotes directly.\n\n' +
          'To request quotes, you need to create a separate user account.\n\n' +
          'Would you like to create a user account now?'
        );
        
        if (shouldCreateAccount) {
          navigate('/user-register', { 
            state: { 
              from: '/user/dashboard',
              message: 'Create your user account to request and track quotes'
            }
          });
        } else {
          // Redirect back to company dashboard
          navigate('/company/dashboard');
        }
        
        return false; // Prevent rendering
      }
      
      return true; // Allow rendering
    };

    if (!checkUserRole()) {
      return;
    }
  }, [navigate]);

  // Check if user should be allowed to see the component
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.id && user.role === 'company') {
    return null; // Don't render anything for company users
  }

  return children;
};

export default QuoteRequestGuard;