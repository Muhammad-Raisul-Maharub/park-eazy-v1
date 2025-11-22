
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Car, Eye, EyeOff } from 'lucide-react';
import GoogleButton from '../../components/common/GoogleButton';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();

  if (!authContext) {
    throw new Error('LoginPage must be used within an AuthProvider');
  }

  const { login } = authContext;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      // Show actual error message if available, otherwise generic
      setError(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      // OAuth will redirect, so we don't need to navigate
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in with Google');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=2670&auto=format&fit=crop')" }}>

      {/* Dark Overlay with slight blue tint for depth */}
      <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-[4px]"></div>

      <div className="w-full max-w-[440px] bg-[#0f172a]/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 animate-fadeIn">

        {/* Header Section */}
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="bg-[#10b981]/10 p-4 rounded-2xl border border-[#10b981]/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <Car className="h-8 w-8 text-[#10b981]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white tracking-tight">Park-Eazy</h1>
            <h2 className="text-slate-400 font-medium">Welcome Back!</h2>
          </div>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email-address" className="text-sm font-medium text-slate-300">Email Address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full px-4 py-3.5 rounded-xl border border-slate-700/80 bg-[#1e293b]/80 text-white placeholder-slate-500 focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 focus:outline-none transition-all"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="block w-full px-4 py-3.5 rounded-xl border border-slate-700/80 bg-[#1e293b]/80 text-white placeholder-slate-500 focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 focus:outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-[#10b981] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-medium animate-fadeIn">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end">
            <Link to="/forgot-password" className="text-sm font-medium text-[#10b981] hover:text-[#34d399] transition-colors">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-[#10b981]/20 text-base font-bold text-white bg-[#10b981] hover:bg-[#059669] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#10b981] disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing In...</span>
              </div>
            ) : 'Sign In'}
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-4 bg-[#0f172a]/40 text-slate-500 font-semibold tracking-wider backdrop-blur-sm">
                OR
              </span>
            </div>
          </div>

          <div className="w-full">
            <GoogleButton
              onClick={handleGoogleLogin}
              isLoading={googleLoading}
              className="!bg-[#1e293b] !border-slate-700 hover:!bg-[#334155] !text-white"
            >
              Sign in with Google
            </GoogleButton>
          </div>

          <p className="text-center text-sm text-slate-400 pt-2">
            <Link to="/signup" className="font-bold text-[#10b981] hover:text-[#34d399] transition-colors">
              Sign Up
            </Link>
          </p>

          <div className="text-center pt-4">
            <Link to="/connection-test" className="text-xs text-slate-500 hover:text-slate-300 underline">
              Trouble connecting? Test Network
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
