
import React, { useState } from 'react';
import { UserRole } from '../types';
import { Bus, ShieldCheck, User as UserIcon, Lock, Mail, AlertTriangle } from 'lucide-react';

interface LoginProps {
  onLogin: (payload: { role: UserRole; identifier: string; password: string }) => Promise<void> | void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onLogin({ role, identifier: email.trim(), password });
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 bg-[url('https://picsum.photos/1920/1080?grayscale&blur=2')] bg-cover">
      <div className="max-w-md w-full space-y-8 bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/20">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-[#F47C20] rounded-xl flex items-center justify-center shadow-lg transform -rotate-6">
            <Bus className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-[#2E2D7F]">
            KIT RouteWise
          </h2>
          <p className="mt-2 text-sm text-gray-600 font-medium">
            Automated Bus Scheduling & Management
          </p>
        </div>

        <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
          <button
            onClick={() => setRole(UserRole.ADMIN)}
            className={`flex-1 flex items-center justify-center py-2 px-3 text-sm font-medium rounded-lg transition-all ${role === UserRole.ADMIN ? 'bg-white text-[#2E2D7F] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <ShieldCheck className="w-4 h-4 mr-2" /> Admin
          </button>
          <button
            onClick={() => setRole(UserRole.STUDENT)}
            className={`flex-1 flex items-center justify-center py-2 px-3 text-sm font-medium rounded-lg transition-all ${role === UserRole.STUDENT ? 'bg-white text-[#2E2D7F] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <UserIcon className="w-4 h-4 mr-2" /> Student
          </button>
          <button
            onClick={() => setRole(UserRole.DRIVER)}
            className={`flex-1 flex items-center justify-center py-2 px-3 text-sm font-medium rounded-lg transition-all ${role === UserRole.DRIVER ? 'bg-white text-[#2E2D7F] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <Bus className="w-4 h-4 mr-2" /> Driver
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertTriangle className="w-5 h-5 mt-0.5" />
                <div className="font-semibold">{error}</div>
              </div>
            )}
            <div className="relative">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                {role === UserRole.STUDENT ? 'Roll No' : role === UserRole.DRIVER ? 'EMAIL' : 'Admin Username'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-[#F47C20] focus:border-[#F47C20] sm:text-sm transition-all bg-gray-50/50"
                  placeholder="Enter your credentials"
                />
              </div>
            </div>

            <div className="relative">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-[#F47C20] focus:border-[#F47C20] sm:text-sm transition-all bg-gray-50/50"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input type="checkbox" className="h-4 w-4 text-[#F47C20] focus:ring-[#F47C20] border-gray-300 rounded" />
              <label className="ml-2 block text-sm text-gray-900">Remember me</label>
            </div>
            <div className="text-sm">
              <a href="#" className="font-medium text-[#F47C20] hover:text-[#e06b12]">Forgot password?</a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[#F47C20] hover:bg-[#e06b12] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F47C20] transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg"
            >
              {loading ? 'Signing in…' : `Sign in as ${role.charAt(0) + role.slice(1).toLowerCase()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
