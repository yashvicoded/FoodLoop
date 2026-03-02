import React, { useState, useEffect } from 'react'; // Add 'React' here
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listen for Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, (current) => {
      console.log("Firebase Auth Status Changed:", current);
      setUser(current);
      setLoading(false);
    });

    // 2. Safety Timeout: If Firebase doesn't respond in 3 seconds, stop loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // Show a simple text while checking
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Initializing FoodLoop...</h2>
      </div>
    );
  }

  // If no user, show Login. If user exists, show Dashboard.
  return (
    <>
      {!user ? <LoginPage /> : <Dashboard />}
    </>
  );
}

export default App;