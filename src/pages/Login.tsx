import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FirebaseError } from 'firebase/app';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await signInWithEmail(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const firebaseError = err as FirebaseError;
      if (firebaseError instanceof FirebaseError) {
        if (firebaseError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else {
          setError(firebaseError.message || 'Failed to sign in');
        }
      } else {
        setError('An unexpected error occurred');
      }
      console.error('Error logging in:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-[#50c99d] mb-2">Gift Switch</h1>
          <p className="text-gray-600">Simplify your next gift exchange</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Welcome back</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-[#ee5e5e] px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#50c99d] focus:ring-2 focus:ring-[#6985c0]/20 outline-none transition-all"
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#50c99d] focus:ring-2 focus:ring-[#6985c0]/20 outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Sign in
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <img src="/google-icon.png" alt="Google" className="w-5 h-5" />
            <span>Continue with Google</span>
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-[#50c99d] hover:text-[#50c99d]/80 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 