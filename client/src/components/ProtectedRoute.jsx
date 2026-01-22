import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getToken, isTokenExpired, removeToken } from '../utils/api';
import activityTracker from '../utils/activityTracker';

/**
 * A wrapper component that protects routes from unauthorized access.
 * It checks for user authentication, token validity, and role-based authorization.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The component to render if the user is authorized.
 * @param {string[]} props.allowedRoles - An array of roles that are allowed to access the route.
 * @returns {React.ReactElement} Either the children component or a Navigate component for redirection.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);
    const [authState, setAuthState] = useState({ token: null, user: null, isValid: false });
    
    useEffect(() => {
        const checkAuth = async () => {
            // Add a small delay to ensure localStorage is updated after login
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const token = getToken();
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : null;

            const isValid = !!(token && !isTokenExpired(token) && user);
            setAuthState({ token, user, isValid });
            
            // Start activity tracking if user is authenticated
            if (isValid && !activityTracker.isActive) {
                activityTracker.startTracking();
            } else if (!isValid && activityTracker.isActive) {
                activityTracker.stopTracking();
            }
            
            setIsChecking(false);
        };
        
        checkAuth();
    }, [location.pathname, allowedRoles]);
    
    if (isChecking) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh' 
            }}>
                <div>Checking authentication...</div>
            </div>
        );
    }

    // --- LOGIC CHECK 1: Is there a valid token? ---
    if (!authState.token || isTokenExpired(authState.token)) {
        activityTracker.stopTracking(); // Stop tracking on logout
        removeToken();
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // --- LOGIC CHECK 2: Is the user logged in at all? ---
    if (!authState.user) {
        activityTracker.stopTracking(); // Stop tracking on logout
        removeToken();
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // --- LOGIC CHECK 3: Does the logged-in user have the correct role? ---
    const isAuthorized = allowedRoles.includes(authState.user.role);

    if (!isAuthorized) {
        return <Navigate to="/unauthorized" replace />;
    }
    
    // Clear the login flags since we've successfully authenticated
    sessionStorage.removeItem('isLoggingIn');
    sessionStorage.removeItem('justLoggedIn');
    
    return children;
};

export default ProtectedRoute;