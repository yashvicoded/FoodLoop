import React, { useState } from 'react'; // Add 'React' here
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

// The "export default" part is what stops the blank screen!
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#f3f4f6' 
    }}>
      <form onSubmit={handleLogin} style={{ 
        background: 'white', 
        padding: '2rem', 
        borderRadius: '8px', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>FoodLoop Login</h2>
        
        {error && <p style={{ color: 'red', fontSize: '0.8rem' }}>{error}</p>}
        
        <input 
          type="email" 
          placeholder="Email" 
          required
          style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          required
          style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #ccc', borderRadius: '4px' }}
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button type="submit" style={{ 
          width: '100%', 
          padding: '10px', 
          backgroundColor: '#059669', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Sign In
        </button>
      </form>
    </div>
  );
}