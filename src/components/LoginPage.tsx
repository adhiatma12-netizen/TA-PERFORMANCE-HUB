import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  RefreshCw,
  KeyRound,
  Globe,
  Database
} from 'lucide-react';
import { 
  fetchUserAccounts, 
  validateLogin, 
  verifyLdapLogin,
  UserAccount, 
  AuthMethod,
  SPREADSHEET_ID, 
  SHEET_NAME 
} from '../lib/auth';
import AnimatedBorderBeam from './AnimatedBorderBeam';

interface LoginPageProps {
  onLoginSuccess: (user: string, role: string) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  // Authentication Method: 'local' (Google Sheets - Default) atau 'ldap' (SSO)
  const [authMethod, setAuthMethod] = useState<AuthMethod>('local');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Local Google Sheets State
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [isLoadingSheet, setIsLoadingSheet] = useState(true);
  const [isLiveSync, setIsLiveSync] = useState(false);
  const [syncError, setSyncError] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Load user database from Google Sheets on component mount (for Local auth)
  const loadAccounts = async () => {
    setIsLoadingSheet(true);
    setSyncError('');
    try {
      const res = await fetchUserAccounts();
      setAccounts(res.accounts);
      setIsLiveSync(res.isLive);
      if (res.error && res.accounts.length === 0) {
        setSyncError(res.error);
      }
    } catch (err: any) {
      setSyncError('Gagal memuat database user.');
    } finally {
      setIsLoadingSheet(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleSwitchMethod = (method: AuthMethod) => {
    setAuthMethod(method);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    // Give a smooth natural validation pause
    await new Promise(resolve => setTimeout(resolve, 500));

    if (authMethod === 'local') {
      // ========================================================
      // 1. METODE LOCAL (Google Sheets Integration - Existing)
      // ========================================================
      let currentAccounts = accounts;
      if (currentAccounts.length === 0) {
        const freshRes = await fetchUserAccounts();
        currentAccounts = freshRes.accounts;
        setAccounts(currentAccounts);
      }

      const validation = validateLogin(username, password, currentAccounts);

      if (validation.success && validation.userAccount) {
        const userRole = validation.userAccount.previlage || 'USER';
        if (rememberMe) {
          localStorage.setItem('telkom_akses_auth_user', validation.userAccount.user);
          localStorage.setItem('telkom_akses_auth_role', userRole);
        } else {
          sessionStorage.setItem('telkom_akses_auth_user', validation.userAccount.user);
          sessionStorage.setItem('telkom_akses_auth_role', userRole);
        }
        onLoginSuccess(validation.userAccount.user, userRole);
      } else {
        setErrorMessage(validation.message || 'silahkan hubungi admin untuk registrasi user');
      }
    } else {
      // ========================================================
      // 2. METODE LDAP / SSO
      // Sifat Integrasi: HANYA UNTUK VERIFIKASI (Binary Check)
      // ========================================================
      const ssoResult = await verifyLdapLogin(username, password);

      if (ssoResult.success && ssoResult.user) {
        // Cek apakah akun terdaftar sebagai OWNER di daftar user Google Sheets
        const matchInSheet = accounts.find(
          acc => acc.user.toLowerCase() === ssoResult.user!.toLowerCase()
        );
        const userRole = matchInSheet ? (matchInSheet.previlage || 'USER') : (ssoResult.role || 'USER');

        if (rememberMe) {
          localStorage.setItem('telkom_akses_auth_user', ssoResult.user);
          localStorage.setItem('telkom_akses_auth_role', userRole);
        } else {
          sessionStorage.setItem('telkom_akses_auth_user', ssoResult.user);
          sessionStorage.setItem('telkom_akses_auth_role', userRole);
        }
        onLoginSuccess(ssoResult.user, userRole);
      } else {
        // Respon gagal / false -> Tampilkan pesan error sesuai spesifikasi
        setErrorMessage(ssoResult.message || 'Username atau password SSO salah');
      }
    }

    setIsSubmitting(false);
  };

  return (
    <div className="h-screen max-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/40 text-slate-800 flex flex-col relative overflow-hidden font-sans select-none">
      
      {/* Dynamic Animated Background Mesh - Bright Elegant Theme */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft glowing red gradient orb top right */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-500/10 rounded-full blur-[120px] animate-pulse" />
        
        {/* Subtle slate/gray glow bottom left */}
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-slate-200/60 rounded-full blur-[140px]" />
        
        {/* Grid texture overlay with subtle dark dots */}
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #0f172a 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
        
        {/* Glowing sweep line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
      </div>

      {/* Top Header branding bar (Frozen / Fixed) */}
      <header className="sticky top-0 z-30 shrink-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-xs">
        <div className="w-full max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-11 h-11 bg-white border border-slate-200 rounded-full overflow-hidden shadow-md shadow-slate-200/60">
              <img 
                src="/src/assets/images/telkom_akses_logo_1784023194788.jpg" 
                alt="Telkom Akses Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold tracking-tight text-lg text-slate-900">TELKOM</span>
                <span className="font-semibold tracking-wider text-lg text-red-600">AKSES</span>
              </div>
              <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase font-mono font-semibold">
                Performance Control Hub
              </p>
            </div>
          </div>

          {/* Live Status Pill: Sesuai metode yang dipilih */}
          {authMethod === 'local' ? (
            <div className="hidden sm:flex items-center space-x-2 bg-white/90 backdrop-blur-md border border-slate-200/90 px-3.5 py-1.5 rounded-full text-xs text-slate-700 shadow-sm">
              {isLoadingSheet ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                  <span className="text-slate-500 font-medium">Memuat User List...</span>
                </>
              ) : isLiveSync ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-700 font-semibold">Database User Terhubung ({accounts.length} Reg)</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-amber-700 font-semibold">Local User Cache ({accounts.length} Reg)</span>
                </>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center space-x-2 bg-white/90 backdrop-blur-md border border-slate-200/90 px-3.5 py-1.5 rounded-full text-xs text-slate-700 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-700 font-semibold">SSO Terhubung</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Login Card Stage (Scrollable) */}
      <main className="relative z-10 flex-1 overflow-y-auto flex items-center justify-center px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl p-8 shadow-2xl shadow-slate-300/50 relative"
        >
          {/* Animated moving faint red beam circling the card outline */}
          <AnimatedBorderBeam 
            radius={24} 
            duration={6} 
            beamLength={180} 
            color="#ef4444" 
            strokeWidth={2} 
          />

          {/* Title Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 border border-red-100 rounded-2xl mb-4 text-red-600 shadow-sm">
              <KeyRound className="w-7 h-7" />
            </div>
            
            {/* Title */}
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              TELKOM AKSES BUSINESS DASHBOARD
            </h1>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Pilih metode autentikasi dan masukkan kredensial untuk masuk.
            </p>
          </div>

          {/* Toggle / Segmented Control Antara METODE LOCAL & METODE LDAP/SSO */}
          <div className="mb-6 p-1.5 bg-slate-100/90 border border-slate-200/80 rounded-2xl flex items-center space-x-1.5 shadow-inner">
            {/* Opsi 1: Local (Default / Existing) */}
            <button
              type="button"
              id="auth-method-local-tab"
              onClick={() => handleSwitchMethod('local')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                authMethod === 'local'
                  ? 'bg-white text-slate-900 shadow-md shadow-slate-200/80 border border-slate-200/60 ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
              }`}
            >
              <Database className={`w-3.5 h-3.5 ${authMethod === 'local' ? 'text-red-600' : 'text-slate-400'}`} />
              <span>Local</span>
            </button>

            {/* Opsi 2: LDAP / SSO */}
            <button
              type="button"
              id="auth-method-ldap-tab"
              onClick={() => handleSwitchMethod('ldap')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                authMethod === 'ldap'
                  ? 'bg-white text-slate-900 shadow-md shadow-slate-200/80 border border-slate-200/60 ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
              }`}
            >
              <Globe className={`w-3.5 h-3.5 ${authMethod === 'ldap' ? 'text-red-600' : 'text-slate-400'}`} />
              <span>LDAP / SSO</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Input */}
            <div className="space-y-1.5">
              <label htmlFor="user-input" className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                {authMethod === 'ldap' ? 'User ID SSO' : 'Username / User ID'}
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="user-input"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={authMethod === 'ldap' ? 'Masukkan User ID' : 'Masukkan Username'}
                  className="w-full bg-slate-50/80 border border-slate-200/90 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="pass-input" className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                {authMethod === 'ldap' ? 'Password SSO' : 'Password'}
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="pass-input"
                  type={showPassword ? 'text' : 'password'}
                  required={authMethod === 'ldap'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    authMethod === 'ldap' 
                      ? 'Masukkan Password SSO' 
                      : 'Masukkan Password (kosongkan jika tanpa password)'
                  }
                  className="w-full bg-slate-50/80 border border-slate-200/90 rounded-xl pl-10 pr-11 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-700 transition-colors p-1"
                  title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me / Session Option */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 bg-white text-red-600 focus:ring-red-500 focus:ring-offset-white"
                />
                <span className="group-hover:text-slate-900 transition-colors font-medium">Ingat Sesi Login</span>
              </label>
              
              {authMethod === 'local' && (
                <button 
                  type="button" 
                  onClick={loadAccounts}
                  className="inline-flex items-center space-x-1 text-slate-500 hover:text-red-600 transition-colors font-medium"
                  title="Sinkronkan Ulang User List"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingSheet ? 'animate-spin' : ''}`} />
                  <span>Sync List User</span>
                </button>
              )}
            </div>

            {/* Error Message Box */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3.5 text-xs flex items-start space-x-3 shadow-sm"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">
                    <p className="font-bold text-red-900 uppercase tracking-wide text-[10px] mb-0.5">Akses Ditolak</p>
                    <p className="font-semibold text-red-700">{errorMessage}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Login Button */}
            <button
              type="submit"
              disabled={isSubmitting || (authMethod === 'local' && isLoadingSheet)}
              className={`w-full py-3.5 px-6 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-red-600/25 flex items-center justify-center space-x-2 active:scale-[0.98] cursor-pointer ${
                isSubmitting || (authMethod === 'local' && isLoadingSheet) ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Memverifikasi {authMethod === 'ldap' ? 'ke SSO...' : 'Kredensial...'}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>
                    {authMethod === 'ldap' ? 'LOGIN VIA SSO' : 'LOGIN KE DASHBOARD'}
                  </span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </main>

      {/* Bottom Footer (Frozen / Fixed) */}
      <footer className="sticky bottom-0 z-30 shrink-0 w-full bg-white/85 backdrop-blur-md border-t border-slate-200/80 py-3 text-center text-xs text-slate-500 shadow-xs">
        <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-center">
          <p>© 2026 Adhiatma21 Creative Studio - Service Area Performance Dashboard. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
