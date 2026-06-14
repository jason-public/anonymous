import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Database,
  CheckCircle,
  FileText,
  AlertTriangle,
  FolderDot,
  CheckCircle2,
  Hourglass,
  ArrowRight,
  Eye,
  Settings,
  HelpCircle,
  Sparkles,
  Download,
  Clock
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Idea, StatusType, CategoryType } from '../types';

interface AdminDashboardProps {
  onRefreshTrigger: number;
}

// Warm, professional colors for the charts
const COLORS = {
  교통: '#3b82f6', // blue
  복지: '#ec4899', // pink
  환경: '#10b981', // emerald
  교육: '#8b5cf6', // violet
  문화: '#f59e0b', // amber
  안전: '#ef4444', // red
  경제: '#14b8a6', // teal
  기타: '#64748b'  // slate
};

export default function AdminDashboard({ onRefreshTrigger }: AdminDashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [draftStatus, setDraftStatus] = useState<StatusType>('접수');
  const [draftNotes, setDraftNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // User management tab and states
  const [activeTab, setActiveTab] = useState<'ideas' | 'users'>('ideas');
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Filter systems
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');

  useEffect(() => {
    fetchStatsAndIdeas();
  }, [onRefreshTrigger]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching admin users list:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchStatsAndIdeas = async () => {
    setLoading(true);
    try {
      // 1. Fetch statistics
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Fetch anonymous ideas
      const ideasRes = await fetch('/api/admin/ideas');
      if (ideasRes.ok) {
        const ideasData = await ideasRes.json();
        setIdeas(ideasData.ideas || []);
      }

      // 3. Fetch admin users lists
      await fetchUsers();
    } catch (err) {
      console.error('Error fetching admin panels data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = (idea: Idea) => {
    setSelectedIdea(idea);
    setDraftStatus(idea.status);
    setDraftNotes(idea.admin_notes || '');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIdea) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/ideas/${selectedIdea.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: draftStatus,
          admin_notes: draftNotes,
        }),
      });

      if (res.ok) {
        // Update local list
        const updatedIdeas = ideas.map((id) => {
          if (id.id === selectedIdea.id) {
            return { ...id, status: draftStatus, admin_notes: draftNotes };
          }
          return id;
        });
        setIdeas(updatedIdeas);
        
        // Refresh overview stats
        const statsRes = await fetch('/api/admin/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        // Close details panel with feedback
        alert('심사 상태 및 공식 보고가 안전하게 기록되었습니다.');
        setSelectedIdea(null);
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('통신 오류');
    } finally {
      setActionLoading(false);
    }
  };

  const renderDetailConsole = () => (
    <div className="space-y-4 animate-fade-in text-slate-800">
      <div className="flex items-center justify-between border-b border-slate-150 pb-3">
        <span className="text-xs font-bold text-slate-850">제안 검토 콘솔</span>
        <button
          type="button"
          onClick={() => setSelectedIdea(null)}
          className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
        >
          닫기
        </button>
      </div>

      {/* Title & Body content */}
      <div>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
          {selectedIdea?.category}
        </span>
        <h4 className="mt-1 text-xs font-bold text-slate-900 leading-snug">
          {selectedIdea?.title}
        </h4>
        <div className="mt-3.5 max-h-36 overflow-y-auto rounded-xl bg-slate-50 border border-slate-100 p-3 text-[11px] text-slate-600 leading-relaxed font-semibold">
          {selectedIdea?.content || "이 씨드는 세부 원문이 사전 요약용으로 축소되었습니다. 자료를 참조해주셔요."}
        </div>
      </div>

      {/* Display downloads if available */}
      {selectedIdea?.attachments && selectedIdea.attachments.length > 0 && (
        <div className="rounded-xl border border-slate-100 p-2.5">
          <span className="block text-[10px] font-bold text-slate-500">배포 연동 첨부파일</span>
          {selectedIdea.attachments.map((at: any, i: number) => (
            <a
              key={i}
              href={at.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 flex items-center justify-between rounded bg-slate-50 p-2 text-[10px] hover:bg-slate-100"
            >
              <span className="font-semibold text-slate-700 truncate max-w-44">{at.name}</span>
              <Download className="h-3.5 w-3.5 text-blue-700" />
            </a>
          ))}
        </div>
      )}

      {/* Generated AI summary - massive time saver */}
      {selectedIdea?.summary && (
        <div className="rounded-xl bg-blue-50/40 border border-blue-50/60 p-3">
          <div className="flex items-center space-x-1.5 text-[10px] font-bold text-blue-900">
            <Sparkles className="h-3.5 w-3.5 text-blue-700" />
            <span>Gemini AI 3단 보고서 번역</span>
          </div>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-[10.5px] text-slate-750 font-semibold leading-relaxed">
            {selectedIdea.summary}
          </pre>
        </div>
      )}

      {/* Existing History Timeline - Admin View */}
      <div className="rounded-2xl border border-slate-150 p-3 bg-slate-50/50 space-y-3">
        <span className="block text-[10px] font-extrabold text-slate-500 flex items-center space-x-1">
          <Clock className="h-3.5 w-3.5 text-blue-700" />
          <span>공지 및 검토 히스토리 기록 ({selectedIdea?.history?.length || 1}건)</span>
        </span>
        
        {selectedIdea?.history && selectedIdea.history.length > 0 ? (
          <div className="space-y-3 relative before:absolute before:inset-y-1 before:left-2 before:w-0.5 before:bg-slate-200">
            {selectedIdea.history.map((hist, idx) => (
              <div key={hist.id || idx} className="relative pl-6 text-[10px] text-left">
                <div className={`absolute left-[3px] top-1.5 h-2.5 w-2.5 rounded-full border border-white shadow-xs ${
                  hist.status === '접수' ? 'bg-blue-600' :
                  hist.status === '검토중' ? 'bg-amber-500' :
                  hist.status === '채택' ? 'bg-emerald-500' :
                  hist.status === '보류' ? 'bg-slate-400' : 'bg-red-500'
                }`} />
                <div className="flex items-center justify-between font-bold text-slate-755 gap-1">
                  <div className="space-x-1">
                    <span className="text-slate-800">[{hist.status}]</span>
                    <span className="text-blue-700">{hist.updated_by_nickname}</span>
                  </div>
                  <span className="text-slate-400 font-mono font-medium">
                    {new Date(hist.updated_at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {hist.admin_notes && (
                  <div className="mt-1 bg-white border border-slate-150 p-2 rounded-lg text-[10px] text-slate-650 font-semibold whitespace-pre-wrap leading-relaxed">
                    {hist.admin_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 relative before:absolute before:inset-y-1 before:left-2 before:w-0.5 before:bg-slate-200">
            {/* Fallback layout for legacy records */}
            <div className="relative pl-6 text-[10px] text-left">
              <div className="absolute left-[3px] top-1.5 h-2.5 w-2.5 rounded-full border border-white shadow-xs bg-blue-600" />
              <div className="flex items-center justify-between font-bold text-slate-755">
                <div className="space-x-1">
                  <span className="text-slate-800">[접수]</span>
                  <span className="text-blue-700">시스템 AI 분석기</span>
                </div>
                <span className="text-slate-400 font-mono font-medium">
                  {selectedIdea?.created_at ? new Date(selectedIdea.created_at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                </span>
              </div>
              <div className="mt-1 bg-white border border-slate-150 p-2 rounded-lg text-[10px] text-slate-600 font-semibold leading-relaxed">
                제안서가 무기명 보안 채널을 통해 정상 접수되었습니다.
              </div>
            </div>
            {selectedIdea?.admin_notes && (
              <div className="relative pl-6 text-[10px] text-left">
                <div className={`absolute left-[3px] top-1.5 h-2.5 w-2.5 rounded-full border border-white shadow-xs ${
                  selectedIdea.status === '검토중' ? 'bg-amber-500' :
                  selectedIdea.status === '채택' ? 'bg-emerald-500' :
                  selectedIdea.status === '보류' ? 'bg-slate-400' : 'bg-red-500'
                }`} />
                <div className="flex items-center justify-between font-bold text-slate-755">
                  <div className="space-x-1">
                    <span className="text-slate-800">[{selectedIdea.status}]</span>
                    <span className="text-blue-700">남양주시 담당 행정관</span>
                  </div>
                  <span className="text-slate-400 font-mono font-medium">실시간 반영됨</span>
                </div>
                <div className="mt-1 bg-white border border-slate-150 p-2 rounded-lg text-[10px] text-slate-650 font-semibold whitespace-pre-wrap leading-relaxed">
                  {selectedIdea.admin_notes}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions submit Form */}
      <form onSubmit={handleUpdateStatus} className="space-y-3.5 border-t border-slate-100 pt-3.5">
        <div>
          <label htmlFor="admin-status-select" className="block text-[10px] font-bold text-slate-750">
            심의 상태 업데이트
          </label>
          <select
            id="admin-status-select"
            value={draftStatus}
            onChange={(e) => setDraftStatus(e.target.value as any)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-hidden"
          >
            <option value="접수">접수 (수신완료)</option>
            <option value="검토중">검토중 (부서배정)</option>
            <option value="채택">채택 (시정반영)</option>
            <option value="보류">보류 (예산확보중)</option>
            <option value="반려">반려 (기타사유)</option>
          </select>
        </div>

        <div>
          <label htmlFor="admin-notes-textarea" className="block text-[10px] font-bold text-slate-750">
            공식 검토의견 및 조언 기재
          </label>
          <textarea
            id="admin-notes-textarea"
            rows={4}
            value={draftNotes}
            onChange={(e) => setDraftNotes(e.target.value)}
            placeholder="시민의 익명제안함에 다이렉트로 전송 수신될 구체적인 검토 의견이나 결과를 상냥히 채워주셔요."
            className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-[10px] text-slate-800 leading-normal focus:border-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="rounded bg-slate-50 border border-slate-100 p-2.5 text-[10px] text-slate-400 italic">
          * 상태 변경 즉시 작성 유저에게 알림이 푸시 통보됩니다. 작성자의 주민 신원은 추측 또는 역추적하지 않습니다.
        </div>

        <button
          type="submit"
          disabled={actionLoading}
          className="w-full flex items-center justify-center space-x-1.5 rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-800 hover:shadow-xs transition disabled:bg-slate-350 cursor-pointer"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          <span>{actionLoading ? '심사 처리 데이터 보존 처리 중...' : '검토 결과 공식 등록 및 알림 발송'}</span>
        </button>
      </form>
    </div>
  );

  // Filtration logic
  const filteredIdeas = ideas.filter((idea) => {
    const matchesCat = selectedCategoryFilter === 'All' || idea.category === selectedCategoryFilter;
    const matchesStatus = selectedStatusFilter === 'All' || idea.status === selectedStatusFilter;
    return matchesCat && matchesStatus;
  });

  const handleDownloadCSV = () => {
    if (ideas.length === 0) {
      alert('다운로드할 제안 데이터가 없습니다.');
      return;
    }
    
    const targetIdeas = filteredIdeas;
    if (targetIdeas.length === 0) {
      alert('현재 필터 조건에 부합하는 제안 데이터가 없습니다.');
      return;
    }

    // CSV Headers
    const headers = [
      'ID', 
      '분야(Category)', 
      '제목(Title)', 
      '원문(Content)', 
      '심의상태(Status)', 
      '작성일시(Created At)', 
      '중복여부(Is Duplicate)', 
      '중복률(Similarity Score)', 
      '유사제목(Similar To)', 
      'AI요약(Generated Summary)', 
      '행원의견(Admin Notes)'
    ];
    
    // Add UTF-8 BOM representation for safe Excel viewing in Korean
    const csvRows = [
      '\uFEFF' + headers.map(header => `"${header.replace(/"/g, '""')}"`).join(',')
    ];

    for (const idea of targetIdeas) {
      const row = [
        idea.id,
        idea.category,
        idea.title,
        idea.content,
        idea.status,
        idea.created_at ? new Date(idea.created_at).toLocaleString('ko-KR') : '',
        idea.similarity_flag ? '예' : '아니오',
        idea.similarity_score !== undefined && idea.similarity_score !== null ? `${idea.similarity_score}%` : '',
        idea.similar_to_title || '',
        idea.summary || '',
        idea.admin_notes || ''
      ];
      
      const csvEscapedRow = row.map(val => {
        const text = val !== null && val !== undefined ? String(val) : '';
        return `"${text.replace(/"/g, '""')}"`;
      });
      csvRows.push(csvEscapedRow.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `남양주시_시민제안_기록_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-blue-700 border-t-transparent" />
        <p className="mt-4 text-xs font-bold text-slate-500">남양주시 스마트 시정 행정관제망 동결 및 동기화 중...</p>
      </div>
    );
  }

  // Pre-calculate count indicators for easy render
  const pendingCount = stats?.status_counts?.['접수'] || 0;
  const inReviewCount = stats?.status_counts?.['검토중'] || 0;
  const acceptedCount = stats?.status_counts?.['채택'] || 0;

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-block rounded-full bg-blue-500/10 px-3 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/20">
                ADMIN CONSOLE
              </span>
              <span className="text-xs text-slate-400 font-semibold">• 시정기획실 전용 단말</span>
            </div>
            <h2 className="mt-2 text-xl font-bold text-slate-100 sm:text-2xl">남양주시 시비정책 종합 행정관제국</h2>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed font-semibold">
              시민들이 기여한 무기명 시정 혁신 아이디어의 통합 모니터링, AI 요약 리포트, 그리고 심사 상태 관리 구역입니다.
            </p>
          </div>
          <div className="flex items-center space-x-2 rounded-xl bg-slate-800/80 px-4 py-2 text-xs font-bold tracking-tight text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>시정 데이터 교차보호 활성화</span>
          </div>
        </div>

        {/* Dynamic Snapshots */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.04] p-4 text-slate-300">
            <span className="text-[10px] text-slate-400 font-bold">누적 제안 수</span>
            <p className="mt-1 font-mono text-xl font-bold leading-none text-white sm:text-2xl">
              {stats?.total_count || 0} <span className="text-xs font-medium text-slate-400">건</span>
            </p>
          </div>
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.04] p-4 text-slate-300">
            <span className="text-[10px] text-amber-400 font-bold">검토 대기</span>
            <p className="mt-1 font-mono text-xl font-bold leading-none text-amber-300 sm:text-2xl">
              {pendingCount} <span className="text-xs font-medium text-slate-400">건</span>
            </p>
          </div>
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.04] p-4 text-slate-300">
            <span className="text-[10px] text-emerald-400 font-bold">최종 채택 수</span>
            <p className="mt-1 font-mono text-xl font-bold leading-none text-emerald-300 sm:text-2xl">
              {acceptedCount} <span className="text-xs font-medium text-slate-400">건</span>
            </p>
          </div>
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.04] p-4 text-slate-300">
            <span className="text-[10px] text-rose-400 font-bold">유사 중복 의심</span>
            <p className="mt-1 font-mono text-xl font-bold leading-none text-rose-300 sm:text-2xl">
              {stats?.duplicate_flagged_count || 0} <span className="text-xs font-medium text-slate-400">건</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation Menu */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('ideas')}
          className={`flex items-center space-x-2 px-5 py-3 text-xs font-bold transition-all border-b-2 -mb-px ${
            activeTab === 'ideas'
              ? 'border-blue-700 text-blue-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>💡 익명 시민 제안서 ({ideas.length}건)</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('users');
            fetchUsers();
          }}
          className={`flex items-center space-x-2 px-5 py-3 text-xs font-bold transition-all border-b-2 -mb-px ${
            activeTab === 'users'
              ? 'border-blue-700 text-blue-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>👥 사용자 계정 및 권한 관리 ({users.length}명)</span>
        </button>
      </div>

      {activeTab === 'ideas' ? (
        <>
          {/* 2. Charts Section */}
          {stats?.category_ratios?.length > 0 && (
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center space-x-1.5">
                <FolderDot className="h-5 w-5 text-blue-700" />
                <span className="text-sm font-bold text-slate-800">분야별 제안 접수 분포</span>
              </div>
              <div className="mt-5 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.category_ratios} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {stats.category_ratios.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.category as keyof typeof COLORS] || '#64748b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 3. Main Data Table with Anonymized Lists */}
          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* Table list - Left span */}
            <div className={`${selectedIdea ? 'lg:col-span-2' : 'lg:col-span-3'} rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-4`}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2">
                  <Database className="h-4.5 w-4.5 text-blue-700" />
                  <h3 className="text-sm font-bold text-slate-800">익명 기여 제안서 데이터베이스</h3>
                </div>
                <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-slate-100">
                  <button className="rounded px-2 py-0.5 text-[9px] font-bold bg-white text-slate-850 shadow-xs">
                    실시간 연합 조회
                  </button>
                </div>
              </div>

              {/* Table filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-[10px] font-bold text-slate-400">분야:</span>
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-700 focus:outline-hidden"
                  >
                    <option value="All">전체 분야</option>
                    {['교통', '복지', '환경', '교육', '문화', '안전', '경제', '기타'].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <span className="text-[10px] font-bold text-slate-400">상태:</span>
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-700 focus:outline-hidden"
                  >
                    <option value="All">전체 상태</option>
                    {['접수', '검토중', '채택', '보류', '반려'].map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="flex items-center space-x-1 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[11px] font-bold shadow-xs hover:shadow-xs transition duration-150 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 font-bold" />
                  <span>CSV 다운로드 ({filteredIdeas.length}건)</span>
                </button>
              </div>

              {/* List content */}
              <div className="divide-y divide-slate-100 max-h-120 overflow-y-auto pr-1">
                {filteredIdeas.length === 0 ? (
                  <div className="py-20 text-center text-xs text-slate-400">
                    필터 조건에 부합하는 제안 데이터가 없습니다.
                  </div>
                ) : (
                  filteredIdeas.map((idea) => (
                    <div
                      key={idea.id}
                      onClick={() => handleOpenDetails(idea)}
                      className={`flex flex-col p-3.5 rounded-2xl cursor-pointer transition-all hover:bg-slate-50 items-start ${
                        selectedIdea?.id === idea.id ? 'bg-blue-50/50 hover:bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                          {idea.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          idea.status === '접수' ? 'bg-blue-50 text-blue-800' :
                          idea.status === '검토중' ? 'bg-amber-50 text-amber-900' :
                          idea.status === '채택' ? 'bg-emerald-50 text-emerald-950' : 'bg-slate-100 text-slate-705'
                        }`}>
                          {idea.status}
                        </span>
                      </div>
                      
                      <h4 className="mt-2 text-xs font-bold text-slate-900 leading-snug hover:text-blue-700 transition">
                        {idea.title}
                      </h4>
                      
                      <div className="mt-2.5 flex w-full items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>무기명 (작성자 식별자 암호 격리됨)</span>
                        <span>{new Date(idea.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>

                      {idea.similarity_flag && (
                        <div className="mt-2 flex items-center space-x-1 rounded bg-orange-50 px-2 py-0.5 text-[9px] font-bold text-orange-850">
                          <AlertTriangle className="h-3 w-3 text-orange-600 shrink-0" />
                          <span>중복 우려 ({idea.similarity_score}%)</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Desktop-Only Detail Side-Panel (Spans remaining columns when an idea is chosen) */}
            <div className="hidden lg:block lg:col-span-1 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm h-fit">
              {!selectedIdea ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <Eye className="h-10 w-10 text-slate-300" />
                  <h4 className="mt-4 text-xs font-bold text-slate-750">심의 상세 패널</h4>
                  <p className="mx-auto mt-1 max-w-xs text-[10px] text-slate-400 leading-normal font-medium">
                    왼쪽 익명 제안 목록에서 특정 항목을 클릭하면 인공지능 요약, 첨부파일 조회 및 답변을 기재할 수 있는 검토기가 활성화됩니다.
                  </p>
                </div>
              ) : (
                renderDetailConsole()
              )}
            </div>

          </div>

          {/* Mobile/Tablet Overlay Detail Modal Drawer (Visible beneath lg:) */}
          {selectedIdea && (
            <div className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-4 sm:p-5 w-full max-w-xl max-h-[92vh] overflow-y-auto space-y-4 relative">
                {renderDetailConsole()}
              </div>
            </div>
          )}
        </>
      ) : (
        /* User management view */
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-700 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Supabase Auth 연동 실시간 회원 명단</h3>
                <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
                  플랫폼에 가입되고 자동 맵핑 트리거를 통과한 실시간 회원 계정들과 권한 등급을 식별합니다.
                </p>
              </div>
            </div>
            
            <button
              onClick={fetchUsers}
              disabled={usersLoading}
              className="rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-150 px-3.5 py-2 text-xs font-bold text-blue-700 transition disabled:opacity-50"
            >
              {usersLoading ? '동기화 중...' : '🔄 실시간 명단 새로고침'}
            </button>
          </div>

          {usersLoading && users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-700 border-t-transparent" />
              <p className="mt-3 text-xs font-semibold text-slate-400">Supabase 인증 계정을 연계 인출하는 중...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans border-collapse">
                <thead>
                  <tr className="border-b border-slate-150 text-[10.5px] font-bold text-slate-400">
                    <th className="pb-3 pl-3">사용자 UUID (고유키)</th>
                    <th className="pb-3">가입 이메일(ID)</th>
                    <th className="pb-3">필명 (닉네임)</th>
                    <th className="pb-3 text-center">권한 지정</th>
                    <th className="pb-3 text-right pr-3">가입 일자</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                        회원 정보가 비어 있거나 로드하는 중입니다.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/75 transition-colors text-slate-700">
                        <td className="py-3.5 pl-3 text-[10px] font-mono text-slate-400 font-medium">
                          {u.id}
                        </td>
                        <td className="py-3.5 text-xs font-bold text-slate-900">
                          {u.email}
                        </td>
                        <td className="py-3.5 text-xs font-semibold text-blue-700">
                          {u.nickname || '미배정'}
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            u.role === 'Admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {u.role === 'Admin' ? '시정 행정관 (Admin)' : '시민 제안자 (User)'}
                          </span>
                        </td>
                        <td className="py-3.5 text-right pr-3 text-[10.5px] font-mono text-slate-400">
                          {u.created_at ? new Date(u.created_at).toLocaleString('ko-KR') : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
