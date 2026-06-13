import React from 'react';
import { FileText, Sparkles, AlertTriangle, Clock, RefreshCw, MessageCircleHeart } from 'lucide-react';
import { Idea, StatusType } from '../types';

interface MyProposalsProps {
  ideas: Idea[];
  onRefresh: () => void;
  loading: boolean;
}

export default function MyProposals({ ideas, onRefresh, loading }: MyProposalsProps) {
  
  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case '접수':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case '검토중':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case '채택':
        return 'bg-emerald-50 text-emerald-900 border-emerald-200';
      case '보류':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case '반려':
        return 'bg-rose-50 text-rose-900 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Tab control & refresh */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">나의 시정 제안 보관함</h2>
          <p className="text-xs text-slate-400 font-semibold leading-normal">
            신원을 분리 암호화 매핑하여 오직 본인 휴대기기/계정에서만 조밀하게 추적 가능한 나의 제안 기록입니다.
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>새로고침</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-700 border-t-transparent" />
          <p className="mt-4 text-xs font-bold text-slate-500">나의 익명 데이터 매ッピング 조회 중...</p>
        </div>
      ) : ideas.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white py-16 px-6 text-center shadow-xs">
          <FileText className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-sm font-bold text-slate-800">제출하신 정책 제안이 없습니다</h3>
          <p className="mx-auto mt-1 max-w-xs text-xs text-slate-400 leading-relaxed font-semibold">
            '새로운 제안 작성' 탭을 통해 남양주시의 미래를 바꿀 시민 혁신 공헌 제안을 기고해 주십시오.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md animate-fade-in"
            >
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-slate-50">
                <div className="flex items-center space-x-2.5">
                  <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-600">
                    {idea.category}
                  </span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${getStatusColor(idea.status)}`}>
                    {idea.status}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-mono">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>{new Date(idea.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>

              {/* Title and details */}
              <div className="mt-4">
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {idea.title}
                </h3>
              </div>

              {/* AI summary block */}
              {idea.summary && (
                <div className="mt-4 rounded-2xl bg-blue-50/20 border border-blue-50/50 p-4">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-900">
                    <Sparkles className="h-4 w-4 text-blue-700" />
                    <span>Gemini AI 공공 양식 요약</span>
                  </div>
                  <pre className="mt-2.5 whitespace-pre-wrap font-sans text-xs text-slate-650 leading-relaxed font-semibold">
                    {idea.summary}
                  </pre>
                </div>
              )}

              {/* Duplicate danger warnings */}
              {idea.similarity_flag && (
                <div className="mt-3 flex items-center space-x-1.5 rounded-xl bg-orange-50 border border-orange-100 px-3.5 py-2.5 text-xs text-orange-900">
                  <AlertTriangle className="h-4.5 w-4.5 text-orange-650 shrink-0" />
                  <span className="font-semibold">
                    유사 제안 중복성 경고 ({idea.similarity_score}%):
                  </span>
                  <span className="font-medium text-orange-700 truncate max-w-sm">
                    "{idea.similar_to_title}"
                  </span>
                </div>
              )}

              {/* Management answer feedback */}
              {idea.admin_notes && (
                <div className="mt-4 rounded-2xl bg-teal-50/10 border border-teal-500/10 p-4">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-teal-850">
                    <MessageCircleHeart className="h-4.5 w-4.5 text-teal-650" />
                    <span>남양주시 심의실 답변 및 제언</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed font-semibold whitespace-pre-line">
                    {idea.admin_notes}
                  </p>
                </div>
              )}
              
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
