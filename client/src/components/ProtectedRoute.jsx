import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * A wrapper component that protects routes from unauthorized access.
 * It checks for user authentication and role-based authorization.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The component to render if the user is authorized.
 * @param {string[]} props.allowedRoles - An array of roles that are allowed to access the route.
 * @returns {React.ReactElement} Either the children component or a Navigate component for redirection.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    // The useLocation hook gives us information about the current URL.
    // We use it to remember where the user was trying to go before being redirected to login.
    const location = useLocation();
    
    // Attempt to retrieve the user's data from the browser's local storage.
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    // --- LOGIC CHECK 1: Is the user logged in at all? ---
    // If no user object exists, they are not authenticated.
    if (!user) {
        // This is JSX. We return the <Navigate> component from react-router-dom.
        // It will programmatically redirect the user to the "/login" page.
        // The 'state' prop passes the original location, so we can redirect them back after a successful login.
        // 'replace' prevents the user from clicking the "back" button to the protected route.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // --- LOGIC CHECK 2: Does the logged-in user have the correct role? ---
    // We check if the user's role (e.g., 'admin') is included in the list of allowed roles.
    const isAuthorized = allowedRoles.includes(user.role);

    if (!isAuthorized) {
        // This is JSX. If the user is logged in but doesn't have the right role,
        // we redirect them to a dedicated "/unauthorized" page.
        return <Navigate to="/unauthorized" replace />;
    }

    // --- SUCCESS ---
    // If both checks pass, the user is authenticated and authorized.
    // We simply render the 'children' components that were passed into this ProtectedRoute.
    // For example, <AdminLayout /> or <CompanyLayout />.
    return children;
};

export default ProtectedRoute;