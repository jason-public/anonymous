import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ShieldCheck,
  User,
  Sparkles,
  Layers,
  ArrowRight,
  ClipboardList,
  PenTool,
  ChevronRight,
  HelpCircle,
  FileCheck2,
  Lock,
  Compass,
  FileSpreadsheet
} from 'lucide-react';
import Navbar from './components/Navbar';
import NewProposal from './components/NewProposal';
import MyProposals from './components/MyProposals';
import AdminDashboard from './components/AdminDashboard';
import { UserProfile, Idea, Notification } from './types';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mappedIdeas, setMappedIdeas] = useState<Idea[]>([]);
  
  // Tab states for Citizen mode
  const [activeTab, setActiveTab] = useState<'intro' | 'new-proposal' | 'my-proposals'>('intro');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);

  // Login form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [passcode, setPasscode] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // App running state (status indicator of AI Analysis engine)
  const [aiEngineStatus, setAiEngineStatus] = useState<'initializing' | 'active' | 'local_fallback'>('initializing');

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        await fetchUserData();
        setAiEngineStatus(process.env.GEMINI_API_KEY ? 'active' : 'local_fallback');
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      // 1. Fetch user notifications
      const notifRes = await fetch('/api/notifications');
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications || []);
      }

      // 2. Fetch citizen proposals
      const ideasRes = await fetch('/api/my-ideas');
      if (ideasRes.ok) {
        const ideasData = await ideasRes.json();
        setMappedIdeas(ideasData.ideas || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setMappedIdeas([]);
      setNotifications([]);
      setActiveTab('intro');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwitchUserRole = async (role: 'User' | 'Admin') => {
    try {
      const res = await fetch('/api/auth/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        await fetchUserData();
        setRefreshTrigger((prev) => prev + 1);
        if (role === 'Admin') {
          setActiveTab('intro'); // Admin doesn't use citizen tabs
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReadNotifications = async () => {
    try {
      await fetch('/api/notifications/read', { method: 'POST' });
      // Update local state to read
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSuccessMessage('');
    setAuthLoading(true);

    const url = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = authMode === 'login' 
      ? { email, password }
      : { email, password, nickname, role: 'User', passcode };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.emailConfirmationRequired) {
          setSuccessMessage(data.message || '가입 인증 메일이 성공적으로 발송되었습니다. 메일의 인증 주소를 확인해 확인해 주셔요.');
          setAuthMode('login'); // switch to login form
        } else {
          setUser(data.user);
          await fetchUserData();
          setRefreshTrigger((prev) => prev + 1);
        }
      } else {
        setAuthError(data.error || '인증 처리에 실패했습니다.');
      }
    } catch (err) {
      setAuthError('네트워크 요동으로 연결에 실패했습니다.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'User' | 'Admin') => {
    setEmail(role === 'User' ? 'citizen@nyj.go.kr' : 'admin@nyj.go.kr');
    setPassword(role === 'User' ? 'user123' : 'admin123');
    setAuthMode('login');
    // Immediate login triggers
    setTimeout(async () => {
      setAuthLoading(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: role === 'User' ? 'citizen@nyj.go.kr' : 'admin@nyj.go.kr',
            password: role === 'User' ? 'user123' : 'admin123'
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data.user);
          await fetchUserData();
          setRefreshTrigger((prev) => prev + 1);
        } else {
          setAuthError(data.error);
        }
      } catch (err) {
        setAuthError('데모 로그인 오류');
      } finally {
        setAuthLoading(false);
      }
    }, 150);
  };

  const handleProposalSubmissionSuccess = (newIdea: Idea) => {
    setMappedIdeas([newIdea, ...mappedIdeas]);
    setActiveTab('my-proposals');
    setRefreshTrigger((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-blue-700 border-t-transparent" />
          <h2 className="mt-4 text-sm font-bold text-slate-800">보안 인증 상태 대입 중 ...</h2>
          <p className="mt-1 text-[11px] text-slate-400 font-semibold">남양주시 시정 혁신 보관망 암호 프로토콜 가동</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      
      {/* 1. Header & Navigation bar */}
      <Navbar
        user={user}
        notifications={notifications}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUserRole}
        onReadNotifications={handleReadNotifications}
      />

      {/* Primary layout contents container */}
      <main className="mx-auto max-w-7xl px-3.5 py-5 sm:px-6 sm:py-8 lg:px-8">
        
        <AnimatePresence mode="wait">
          {!user ? (
            
            /* --- UNAUTHENTICATED: Beautiful login panel --- */
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="mx-auto max-w-md my-12"
            >
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl sm:p-8">
                
                {/* Platform Identity branding */}
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <Lock className="h-6 w-6" />
                  </div>
                  <h2 className="mt-4 text-xl font-extrabold text-slate-900 tracking-tight">
                    남양주시 시정 제안 관리 플랫폼
                  </h2>
                  <p className="mt-1.5 text-xs text-slate-400 font-semibold leading-relaxed">
                    작성자의 연합 이메일 계정 테이블과 제안 내역을 완벽히 분리 격리하여 작성 후에도 사생활 및 신원을 절대적으로 보호하는 훌륭한 시민 참여 플랫폼입니다.
                  </p>
                </div>

                {authError && (
                  <div className="mt-5 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-800 font-bold">
                    {authError}
                  </div>
                )}

                {successMessage && (
                  <div className="mt-5 rounded-xl bg-emerald-50 border border-emerald-100 p-3.5 text-xs text-emerald-800 font-bold leading-relaxed whitespace-pre-line">
                    {successMessage}
                  </div>
                )}

                {/* Form submit */}
                <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
                  {authMode === 'register' && (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="reg-nickname" className="block text-xs font-bold text-slate-700">
                          닉네임 (신용 필명)
                        </label>
                        <input
                          id="reg-nickname"
                          type="text"
                          required
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          placeholder="예시) 남양주다산러"
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label htmlFor="reg-passcode" className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                          <span>제안자 인증 승인 암호번호</span>
                          <span className="text-[10px] text-blue-700 font-bold">필수 입력</span>
                        </label>
                        <input
                          id="reg-passcode"
                          type="text"
                          required
                          value={passcode}
                          onChange={(e) => setPasscode(e.target.value)}
                          placeholder="발급받은 암호번호 입력 (예시: 1331 또는 NYJ-2026)"
                          className="mt-1.5 w-full rounded-xl border border-blue-100 bg-blue-50/20 px-4 py-2.5 text-xs font-mono font-bold text-blue-900 placeholder:text-blue-400/70 focus:border-blue-500 focus:bg-white focus:outline-hidden text-center tracking-widest"
                        />
                        <p className="mt-1 text-[9.5px] text-slate-400 font-semibold leading-normal">
                          ※ 도배 방지 및 책임 인증을 위한 조치입니다. 사전에 배포된 암호번호를 입력해야 회원 가입이 접수됩니다. (테스트용: 1331 또는 NYJ-2026)
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="auth-email" className="block text-xs font-bold text-slate-700">
                      이메일 주소
                    </label>
                    <input
                      id="auth-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="citizen@nyj.go.kr"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label htmlFor="auth-password" className="block text-xs font-bold text-slate-700">
                      비밀번호
                    </label>
                    <input
                      id="auth-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="비밀번호 보안 입력"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full rounded-xl bg-blue-700 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:bg-blue-800 transition"
                  >
                    {authLoading ? '전송 가동 중...' : authMode === 'login' ? '로그인 시스템 연결' : '신규 회원 가입'}
                  </button>
                </form>

                {/* Switch between Auth types */}
                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'register' : 'login');
                      setAuthError('');
                      setSuccessMessage('');
                    }}
                    className="text-[11px] font-bold text-blue-700 hover:underline"
                  >
                    {authMode === 'login' ? '처음이신가요? 3초 간편회원가입' : '이미 계정이 있으신가요? 로그인하기'}
                  </button>
                </div>

                {/* Instant 1-Click Demo Login Panel (Highly Recommended for sandbox inspection) */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <span className="block text-center text-[10px] font-bold text-slate-400">
                    빠른 데모 계정 원클릭 간편 진입
                  </span>
                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => handleDemoLogin('User')}
                      className="flex items-center justify-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <User className="h-3.5 w-3.5" />
                      <span>남양주시민 홍길동</span>
                    </button>
                    <button
                      onClick={() => handleDemoLogin('Admin')}
                      className="flex items-center justify-center space-x-1.5 rounded-xl bg-blue-50/70 border border-blue-100 py-2.5 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition-colors"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>기획관 데모자</span>
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          ) : user.role === 'Admin' ? (
            
            /* --- DEPLOYED FOR ROLE: ADMIN (Municipal Officer view) --- */
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="animate-fade-in"
            >
              <AdminDashboard onRefreshTrigger={refreshTrigger} />
            </motion.div>
          ) : (
            
            /* --- DEPLOYED FOR ROLE: CITIZEN (Normal user view) --- */
            <motion.div
              key="citizen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4 md:space-y-0"
            >
              {/* Mobile Horizontal Navigation Tabs (Visible only below md:) */}
              <div className="md:hidden block">
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xs">
                  <nav className="flex space-x-1">
                    <button
                      onClick={() => setActiveTab('intro')}
                      className={`flex-grow flex items-center justify-center space-x-1.5 rounded-xl py-2 px-1 text-[11px] font-bold transition-all ${
                        activeTab === 'intro'
                          ? 'bg-blue-700 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Compass className="h-3.8 w-3.8 shrink-0" />
                      <span className="truncate">소개 & 서약</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('new-proposal')}
                      className={`flex-grow flex items-center justify-center space-x-1.5 rounded-xl py-2 px-1 text-[11px] font-bold transition-all ${
                        activeTab === 'new-proposal'
                          ? 'bg-blue-700 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <PenTool className="h-3.8 w-3.8 shrink-0" />
                      <span className="truncate">제안 작성</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('my-proposals')}
                      className={`flex-grow flex items-center justify-center space-x-1.5 rounded-xl py-2 px-1 text-[11px] font-bold transition-all ${
                        activeTab === 'my-proposals'
                          ? 'bg-blue-700 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ClipboardList className="h-3.8 w-3.8 shrink-0" />
                      <span className="truncate">나의 제안함 ({mappedIdeas.length})</span>
                    </button>
                  </nav>
                </div>
              </div>

              <div className="grid gap-6 md:gap-8 md:grid-cols-4">
                
                {/* Sidebar: Navigation tabs & Policy Agendas */}
                <div className="hidden md:block md:col-span-1 space-y-5">
                  
                  {/* Citizens personal tab toggler links */}
                  <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-2.5 shadow-xs">
                    <span className="block px-3 py-1 text-[10px] font-bold text-slate-400">
                      마이 포털 네비게이터
                    </span>
                    <nav className="mt-1.5 space-y-1">
                      <button
                        onClick={() => setActiveTab('intro')}
                        className={`flex w-full items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                          activeTab === 'intro'
                            ? 'bg-blue-700 text-white'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <Compass className="h-4 w-4" />
                        <span>플랫폼 소개 및 서약</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('new-proposal')}
                        className={`flex w-full items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                          activeTab === 'new-proposal'
                            ? 'bg-blue-700 text-white'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <PenTool className="h-4 w-4" />
                        <span>새로운 아이디어 작성</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('my-proposals')}
                        className={`flex w-full items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                          activeTab === 'my-proposals'
                            ? 'bg-blue-700 text-white'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <ClipboardList className="h-4 w-4" />
                        <span>나의 제안 보관함 ({mappedIdeas.length})</span>
                      </button>
                    </nav>
                  </div>

                  {/* High Contrast Informational side block (10 core promises list for inspiration!) */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
                    <h4 className="text-xs font-extrabold text-slate-900">'남양주 혁신 10대 약속'</h4>
                    <p className="mt-1 text-[10px] text-slate-400 font-bold leading-normal">
                      * 시민 제안 작성 시 10대 공약을 적극 고려해 주시면 좋습니다.
                    </p>
                    
                    <ul className="mt-3.5 space-y-2">
                      <li className="flex items-center space-x-2 text-[11px]">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[9px] font-bold text-blue-700 border border-blue-100">01</span>
                        <span className="font-bold text-slate-700">쾌속 교통망 확충</span>
                      </li>
                      <li className="flex items-center space-x-2 text-[11px]">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-[9px] font-bold text-emerald-700 border border-emerald-100">02</span>
                        <span className="font-bold text-slate-700">건강·안전 시스템 구축</span>
                      </li>
                      <li className="flex items-center space-x-2 text-[11px]">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-amber-50 text-[9px] font-bold text-amber-700 border border-amber-100">03</span>
                        <span className="font-bold text-slate-700">자족 경제도시 완성!</span>
                      </li>
                      <li className="flex items-center space-x-2 text-[11px]">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-[9px] font-bold text-indigo-700 border border-indigo-100">04</span>
                        <span className="font-bold text-slate-700">평생교육 및 보육시스템</span>
                      </li>
                      <li className="flex items-center space-x-2 text-[11px]">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-pink-50 text-[9px] font-bold text-pink-700 border border-pink-100">05</span>
                        <span className="font-bold text-slate-700">쾌적한 주거환경 조성</span>
                      </li>
                      <li className="flex items-center space-x-2 text-[11px]">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-teal-50 text-[9px] font-bold text-teal-700 border border-teal-100">06</span>
                        <span className="font-bold text-slate-700">민생경제 및 소상공인지원</span>
                      </li>
                      <li className="flex items-center space-x-2 text-[11px]">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-violet-50 text-[9px] font-bold text-violet-700 border border-violet-100">07</span>
                        <span className="font-bold text-slate-700">꼼꼼하고 촘촘한 맞춤복지</span>
                      </li>
                      <li className="flex items-center space-x-2 text-[11px]">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-rose-50 text-[9px] font-bold text-rose-700 border border-rose-100">08</span>
                        <span className="font-bold text-slate-700">품격 예술·문화·관광도시</span>
                      </li>
                      <li className="flex items-center space-x-2 text-[11px]">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-[9px] font-bold text-cyan-700 border border-cyan-100">09</span>
                        <span className="font-bold text-slate-700">생활체육 및 힐링공간조성</span>
                      </li>
                      <li className="flex items-center space-x-2 text-[11px]">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[9px] font-bold text-slate-700 border border-slate-200">10</span>
                        <span className="font-bold text-slate-700">시민체감 행정도시</span>
                      </li>
                    </ul>
                  </div>

                  {/* System status widget */}
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3.5 text-xs text-slate-500 font-semibold space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span>AI 공문요약 엔진</span>
                      <span className="text-blue-700 font-bold">활성화</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span>중복 제안 탐지망</span>
                      <span className="text-emerald-650 font-bold">정상 가동</span>
                    </div>
                  </div>

                </div>

                {/* Central Tab Content panels */}
                <div className="col-span-1 md:col-span-3">
                <AnimatePresence mode="wait">
                  
                  {/* TAB 1: Stunning Professional Intro Panel */}
                  {activeTab === 'intro' && (
                    <motion.div
                      key="tab-intro"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                          <Compass className="h-6 w-6" />
                        </div>
                        <h2 className="mt-4 text-xl font-extrabold tracking-tight text-slate-800">
                          남양주시 스마트 시정 제안 플랫폼: 완벽한 익명 보안 설계
                        </h2>
                        <p className="mt-2 text-xs font-semibold text-slate-500 leading-relaxed">
                          본 제안 시스템은 시민의 창의적이고 자발적인 시정 의견 기여를 돕기 위해 사생활 침해를 우회하도록 설계된 '엔터프라이즈 사양'의 혁신 플랫폼입니다.
                        </p>

                        <div className="mt-6 grid gap-5 sm:grid-cols-3">
                          
                          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-900">
                              <Layers className="h-4 w-4" />
                            </div>
                            <h4 className="mt-3 text-xs font-extrabold text-slate-800">1. 개인정보와 아이디어의 물리 분리</h4>
                            <p className="mt-1 text-[10px] leading-relaxed text-slate-400 font-semibold">
                              일반적인 DB 처리는 하나의 레코드 안에 작성자를 저장하지만, 당사는 검증용 매핑 테이블을 완전 분리하여 심의관이나 관리자가 제안서만을 조회할 때 작성자를 역방향 해독할 수 없습니다. 
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 text-pink-700">
                              <Sparkles className="h-4 w-4" />
                            </div>
                            <h4 className="mt-3 text-xs font-extrabold text-slate-800">2. Gemini AI 3단 보고서 번역</h4>
                            <p className="mt-1 text-[10px] leading-relaxed text-slate-400 font-semibold">
                              제안서를 접수함과 동시에 Gemini AI 엔진이 작동하여 주무 부서에서 기민히 보고 자료로 활용할 수 있도록 정갈한 개조식 공문서 양식으로 실시간 요약 변환을 집행합니다.
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                              <FileCheck2 className="h-4 w-4" />
                            </div>
                            <h4 className="mt-3 text-xs font-extrabold text-slate-800">3. 고차원 중복 제안 방지</h4>
                            <p className="mt-1 text-[10px] leading-relaxed text-slate-400 font-semibold">
                              이미 접수 및 실무 검토 중인 타 제안들과의 실시간 유사도 스크리닝을 즉각 실행하여 공무원의 중복 대안 검토 피로를 극적으로 줄입니다.
                            </p>
                          </div>

                        </div>

                        {/* Direct guide action button */}
                        <div className="mt-8 border-t border-slate-100 pt-6 flex items-center justify-between">
                          <div className="text-xs text-slate-400 font-semibold">
                            지금 바로 나만의 의견을 100% 익명성 아래 전달해 보셔요.
                          </div>
                          <button
                            onClick={() => setActiveTab('new-proposal')}
                            className="flex items-center space-x-1.5 rounded-xl bg-blue-700 px-5  py-2.5 text-xs font-bold text-white hover:bg-blue-800 transition"
                          >
                            <span>아이디어 기재하기</span>
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: Proposal submission form */}
                  {activeTab === 'new-proposal' && (
                    <motion.div
                      key="tab-form"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <NewProposal onSubmitSuccess={handleProposalSubmissionSuccess} />
                    </motion.div>
                  )}

                  {/* TAB 3: History board representing mapped records info */}
                  {activeTab === 'my-proposals' && (
                    <motion.div
                      key="tab-history"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <MyProposals
                        ideas={mappedIdeas}
                        onRefresh={fetchUserData}
                        loading={false}
                      />
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </div>

          </motion.div>
          )}
        </AnimatePresence>

      </main>

    </div>
  );
}
