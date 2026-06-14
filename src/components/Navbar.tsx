import React, { useState } from 'react';
import { Shield, Bell, LogIn, LogOut, RefreshCw, UserCheck, Check } from 'lucide-react';
import { UserProfile, Notification } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  notifications: Notification[];
  onLogout: () => Promise<void>;
  onSwitchUser: (role: 'User' | 'Admin') => Promise<void>;
  onReadNotifications: () => Promise<void>;
}

export default function Navbar({
  user,
  notifications,
  onLogout,
  onSwitchUser,
  onReadNotifications,
}: NavbarProps) {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const unreadNotifs = notifications.filter((notif) => !notif.is_read);

  const handleNotifClick = () => {
    setShowNotifDropdown(!showNotifDropdown);
    if (!showNotifDropdown && unreadNotifs.length > 0) {
      onReadNotifications();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo and Platform Name */}
        <div className="flex items-center space-x-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white shadow-md shadow-blue-500/20">
            <Shield className="h-5.5 w-5.5" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white ring-2 ring-white">
              AI
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                남양주시 스마트 시정 제안
              </h1>
              {user?.is_supabase && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                  Supabase Live
                </span>
              )}
            </div>
            <p className="hidden text-[10px] font-medium text-blue-700 sm:block">
              개인정보 분리 설계형 완벽 익명 보장 플랫폼
            </p>
          </div>
        </div>

        {/* Quick Demo Selector for Iframe Preview Ease */}
        <div className="hidden items-center rounded-full bg-slate-100 p-1 md:flex">
          <span className="px-3 text-[11px] font-semibold text-slate-500">데모 역할 전환:</span>
          <button
            onClick={() => onSwitchUser('User')}
            className={`flex items-center space-x-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-all duration-200 ${
              user?.role === 'User'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>시민 홍길동</span>
            {user?.role === 'User' && <Check className="h-3 w-3" />}
          </button>
          <button
            onClick={() => onSwitchUser('Admin')}
            className={`flex items-center space-x-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-all duration-200 ${
              user?.role === 'Admin'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>관리자</span>
            {user?.role === 'Admin' && <Check className="h-3 w-3" />}
          </button>
        </div>

        {/* User Options & Profile & Notifications */}
        <div className="flex items-center space-x-4">
          
          {/* Real-time Notifications Bell */}
          {user && (
            <div className="relative">
              <button
                onClick={handleNotifClick}
                className="relative rounded-full p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-950 transition-colors"
                aria-label="알림 메뉴"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Portal */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-fade-in animate-duration-150">
                  <div className="flex items-center justify-between border-b border-slate-50 px-3 py-2.5">
                    <span className="text-xs font-bold text-slate-800">새로운 알림</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      실시간 동기화
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto py-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        수신된 알림이 없습니다.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`flex flex-col rounded-lg p-2.5 text-xs transition-colors hover:bg-slate-50 ${
                            !notif.is_read ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          <p className="text-slate-700 font-medium leading-relaxed">
                            {notif.message}
                          </p>
                          <span className="mt-1 text-[10px] text-slate-400 font-mono">
                            {new Date(notif.created_at).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile Info Card */}
          {user ? (
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-100">
              <div className="hidden flex-col text-right sm:flex">
                <span className="text-xs font-bold text-slate-800">{user.nickname}</span>
                <span className={`text-[10px] font-bold ${
                  user.role === 'Admin' ? 'text-blue-700' : 'text-slate-500'
                }`}>
                  {user.role === 'Admin' ? '시정 관리자' : '남양주시민'}
                </span>
              </div>
              
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                user.role === 'Admin' ? 'bg-blue-150 text-blue-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {user.nickname.substring(0, 2)}
              </div>

              <button
                onClick={onLogout}
                className="hidden rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors sm:block"
                title="로그아웃"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          ) : (
            <button className="flex items-center space-x-1.5 rounded-full bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-800 transition">
              <LogIn className="h-4 w-4" />
              <span>로그인</span>
            </button>
          )}

        </div>
      </div>

      {/* Mobile view switch bar */}
      <div className="flex items-center justify-center space-x-4 border-t border-slate-100 bg-slate-50 px-4 py-2 md:hidden">
        <span className="text-[10px] font-bold text-slate-500">역할전환:</span>
        <button
          onClick={() => onSwitchUser('User')}
          className={`rounded px-2.5 py-1 text-[11px] font-bold transition ${
            user?.role === 'User' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
          }`}
        >
          시민 모드
        </button>
        <button
          onClick={() => onSwitchUser('Admin')}
          className={`rounded px-2.5 py-1 text-[11px] font-bold transition ${
            user?.role === 'Admin' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600'
          }`}
        >
          기획관 관리 모드
        </button>
      </div>

    </header>
  );
}
