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
  Download
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

  // Filter systems
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');

  useEffect(() => {
    fetchStatsAndIdeas();
  }, [onRefreshTrigger]);

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

  // Filtration logic
  const filteredIdeas = ideas.filter((idea) => {
    const matchesCat = selectedCategoryFilter === 'All' || idea.category === selectedCategoryFilter;
    const matchesStatus = selectedStatusFilter === 'All' || idea.status === selectedStatusFilter;
    return matchesCat && matchesStatus;
  });

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
            <span className="text-[10px] text-orange-400 font-bold">AI 중복 경보 건수</span>
            <p className="mt-1 font-mono text-xl font-bold leading-none text-orange-300 sm:text-2xl">
              {stats?.duplicate_flagged_count || 0} <span className="text-xs font-medium text-slate-400">건</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Charts Section */}
      {stats?.category_ratios?.length > 0 && (
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center space-x-1.5">
            <FolderDot className="h-5 w-5 text-blue-700" />
            <span className="text-sm font-bold text-slate-800">분야별 제안 접수 분포 비장</span>
          </div>
          <div className="mt-5 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.category_ratios} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc' }}
                  labelStyle={{ fontWeight: 'bold', fontSize: '11px', color: '#94a3b8' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={35}>
                  {stats.category_ratios.map((entry: any, index: number) => {
                    const color = COLORS[entry.category as CategoryType] || COLORS.기타;
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 3. Main Data Table with Anonymized Lists */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Table list - Left span */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <Database className="h-4.5 w-4.5 text-blue-700" />
              <h3 className="text-sm font-bold text-slate-800">익명 기여 제안서 데이터베이스</h3>
            </div>
            <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-slate-150">
              <button className="rounded px-2 py-0.5 text-[9px] font-bold bg-white text-slate-800 shadow-xs">
                실시간 연합 조회
              </button>
            </div>
          </div>

          {/* Table filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400">카테고리:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 outline-hidden"
            >
              <option value="All">전체 분야</option>
              {['교통', '복지', '환경', '교육', '문화', '안전', '경제', '기타'].map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <span className="ml-2 text-[10px] font-bold text-slate-400">심의 상태:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 outline-hidden"
            >
              <option value="All">전체 상태</option>
              {['접수', '검토중', '채택', '보류', '반려'].map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
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
                      idea.status === '채택' ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-100 text-slate-700'
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

        {/* Detail Console Panel - Right span */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          {!selectedIdea ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Eye className="h-10 w-10 text-slate-300" />
              <h4 className="mt-4 text-xs font-bold text-slate-700">심의 상세 패널</h4>
              <p className="mx-auto mt-1 max-w-xs text-[10px] text-slate-400 leading-normal font-medium">
                왼쪽 익명 제안 목록에서 특정 항목을 클릭하면 인공지능 요약, 첨부파일 조회 및 답변을 기재할 수 있는 검토기가 활성화됩니다.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                <span className="text-xs font-bold text-slate-800">제안 검토 콘솔</span>
                <button
                  onClick={() => setSelectedIdea(null)}
                  className="text-slate-400 hover:text-slate-700 text-[10px] font-bold"
                >
                  닫기
                </button>
              </div>

              {/* Title & Body content */}
              <div>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                  {selectedIdea.category}
                </span>
                <h4 className="mt-1 text-xs font-bold text-slate-900 leading-snug">
                  {selectedIdea.title}
                </h4>
                <div className="mt-3.5 max-h-36 overflow-y-auto rounded-xl bg-slate-50 border border-slate-100 p-3 text-[11px] text-slate-600 leading-relaxed font-medium">
                  {selectedIdea.content || "이 씨드는 세부 원문이 사전 요약용으로 축소되었습니다. 상단 정류장 또는 인프라 자료를 참조해주셔요."}
                </div>
              </div>

              {/* Display downloads if available */}
              {selectedIdea.attachments && selectedIdea.attachments.length > 0 && (
                <div className="rounded-xl border border-slate-100 p-2.5">
                  <span className="block text-[10px] font-bold text-slate-500">배포 연동 첨부파일</span>
                  {selectedIdea.attachments.map((at, i) => (
                    <a
                      key={i}
                      href={at.url}
                      target="_blank"
                      rel="referrer"
                      className="mt-1.5 flex items-center justify-between rounded bg-slate-50 p-2 text-[10px] hover:bg-slate-100"
                    >
                      <span className="font-semibold text-slate-700 truncate max-w-44">{at.name}</span>
                      <Download className="h-3.5 w-3.5 text-blue-700" />
                    </a>
                  ))}
                </div>
              )}

              {/* Generated AI summary - massive time saver */}
              {selectedIdea.summary && (
                <div className="rounded-xl bg-blue-50/30 border border-blue-50/60 p-3">
                  <div className="flex items-center space-x-1.5 text-[10px] font-bold text-blue-900">
                    <Sparkles className="h-3.5 w-3.5 text-blue-700" />
                    <span>Gemini AI 3단 보고서 번역</span>
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap font-sans text-[10px] text-slate-750 font-semibold leading-relaxed">
                    {selectedIdea.summary}
                  </pre>
                </div>
              )}

              {/* Actions submit Form */}
              <form onSubmit={handleUpdateStatus} className="space-y-3.5 border-t border-slate-100 pt-3.5">
                <div>
                  <label htmlFor="admin-status-select" className="block text-[10px] font-bold text-slate-700">
                    심의 상태 업데이트
                  </label>
                  <select
                    id="admin-status-select"
                    value={draftStatus}
                    onChange={(e) => setDraftStatus(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="접수">접수 (수신완료)</option>
                    <option value="검토중">검토중 (부서배정)</option>
                    <option value="채택">채택 (시정반영)</option>
                    <option value="보류">보류 (예산확보중)</option>
                    <option value="반려">반려 (기타사유)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="admin-notes-textarea" className="block text-[10px] font-bold text-slate-700">
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
                  * 상태 변경 즉시 작성 유저에게 알림이 푸시 통보됩니다. 작성자의 개별 주민 정보는 역추적하지 않습니다.
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center space-x-1.5 rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-800 hover:shadow-xs transition disabled:bg-slate-300"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>{actionLoading ? '심사 처리 데이터 보존 처리 중...' : '검토 결과 공식 등록 및 알림 발송'}</span>
                </button>
              </form>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
