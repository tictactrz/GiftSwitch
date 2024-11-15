import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [confirmEmail, setConfirmEmail] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const result = await signUp(email, password, fullName);
      if (result?.confirmEmail) {
        setConfirmEmail(true);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    }
  };

  if (confirmEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-4">Check your email</h2>
          <p className="text-gray-600 text-center mb-6">
            We've sent you an email confirmation link. Please check your email and click the link to verify your account.
          </p>
          <div className="text-center">
            <Link 
              to="/login" 
              className="text-[#50c99d] hover:text-[#50c99d]/80 font-medium"
            >
              Return to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-[#50c99d] mb-2">Gift Switch</h1>
          <p className="text-gray-600">Simplify your next gift exchange</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Create your account</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-[#ee5e5e] px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#50c99d] focus:ring-2 focus:ring-[#6985c0]/20 outline-none transition-all"
              />
            </div>
            
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

            <div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#50c99d] focus:ring-2 focus:ring-[#6985c0]/20 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#50c99d] text-white py-3 px-4 rounded-lg hover:bg-[#50c99d]/90 transition-colors duration-200"
            >
              Sign Up
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-[#50c99d] hover:text-[#50c99d]/80 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 