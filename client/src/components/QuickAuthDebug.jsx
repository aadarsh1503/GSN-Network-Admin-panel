import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const QuickAuthDebug = () => {
  const [authStatus, setAuthStatus] = useState({});
  const [loginData, setLoginData] = useState({
    email: 'a@gmail.com',
    password: '222333'
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    setAuthStatus({
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 50) + '...' : 'None',
      hasUser: !!user,
      userData: user ? JSON.parse(user) : null
    });
  };

  const quickLogin = async () => {
    try {
      console.log('🔍 Quick login attempt...');
      
      const response = await fetch('http://localhost:5000/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      if (response.ok) {
        const data = await response.json();
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        toast.success(`Logged in as ${data.user.name} (${data.user.role})`);
        checkAuthStatus();
        
        // Refresh the page to update the business disputes
        window.location.reload();
      } else {
        const errorData = await response.json();
        toast.error('Login failed: ' + errorData.message);
      }
    } catch (error) {
      toast.error('Login error: ' + error.message);
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Authentication cleared');
    checkAuthStatus();
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'white',
      border: '2px solid #ccc',
      borderRadius: '8px',
      padding: '15px',
      zIndex: 9999,
      maxWidth: '300px',
      fontSize: '12px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>🔧 Auth Debug</h4>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Status:</strong><br/>
        Token: {authStatus.hasToken ? '✅' : '❌'}<br/>
        User: {authStatus.hasUser ? '✅' : '❌'}<br/>
        {authStatus.userData && (
          <>Role: {authStatus.userData.role}<br/>
          Name: {authStatus.userData.name}</>
        )}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <input
          type="email"
          value={loginData.email}
          onChange={(e) => setLoginData({...loginData, email: e.target.value})}
          placeholder="Email"
          style={{ width: '100%', marginBottom: '5px', padding: '5px' }}
        />
        <input
          type="password"
          value={loginData.password}
          onChange={(e) => setLoginData({...loginData, password: e.target.value})}
          placeholder="Password"
          style={{ width: '100%', marginBottom: '5px', padding: '5px' }}
        />
      </div>

      <button 
        onClick={quickLogin}
        style={{
          background: '#007bff',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginRight: '5px',
          fontSize: '12px'
        }}
      >
        Quick Login
      </button>
      
      <button 
        onClick={clearAuth}
        style={{
          background: '#dc3545',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Clear Auth
      </button>
      
      <button 
        onClick={checkAuthStatus}
        style={{
          background: '#28a745',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '5px',
          width: '100%',
          fontSize: '12px'
        }}
      >
        Refresh Status
      </button>
    </div>
  );
};

export default QuickAuthDebug;