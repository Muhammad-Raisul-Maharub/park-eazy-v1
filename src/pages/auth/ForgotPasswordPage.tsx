
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car } from 'lucide-react';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setMessage('');
    setLoading(true);
    
    // Simulate API call
    await new Promise(res => setTimeout(res, 1500));
    
    setLoading(false);
    setMessage('If an account with that email exists, a reset link has been sent.');
    setEmail('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative"
         style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=2670&auto=format&fit=crop')" }}>
       
      <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-[4px]"></div>

      <div className="w-full max-w-[440px] bg-[#0f172a]/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 animate-fadeIn">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="bg-[#10b981]/10 p-4 rounded-2xl border border-[#10b981]/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <Car className="h-8 w-8 text-[#10b981]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white tracking-tight">Park-Eazy</h1>
            <h2 className="text-slate-400 font-medium">Forgot your password?</h2>
          </div>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            No worries! Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-300">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full px-4 py-3.5 rounded-xl border border-slate-700/80 bg-[#1e293b]/80 text-white placeholder-slate-500 focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 focus:outline-none transition-all"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {message && (
            <div className="p-3 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20 text-[#34d399] text-sm text-center font-medium animate-fadeIn">
                {message}
            </div>
          )}

          <div>
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
                        <span>Sending...</span>
                    </div>
                ) : 'Send Reset Link'}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-sm text-slate-400">
              Remember your password?{' '}
              <Link to="/login" className="font-bold text-[#10b981] hover:text-[#34d399] transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
