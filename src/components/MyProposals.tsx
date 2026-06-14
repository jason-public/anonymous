import React, { useState } from 'react';
import { FileText, Sparkles, AlertTriangle, Clock, RefreshCw, MessageCircleHeart, X, Search, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Idea, StatusType } from '../types';

interface MyProposalsProps {
  ideas: Idea[];
  onRefresh: () => void;
  loading: boolean;
}

export default function MyProposals({ ideas, onRefresh, loading }: MyProposalsProps) {
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIdea || !commentText.trim()) return;

    setCommentLoading(true);
    try {
      const res = await fetch(`/api/ideas/${selectedIdea.id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: commentText }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.idea) {
          setSelectedIdea(data.idea);
          setCommentText("");
          onRefresh();
        }
      } else {
        const errData = await res.json();
        alert(errData.error || "메시지 등록에 실패했습니다.");
      }
    } catch (err) {
      console.error("Error submitting comment:", err);
      alert("서버 통신에 실패했습니다.");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleCardClick = async (idea: Idea) => {
    setSelectedIdea(idea);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/ideas/${idea.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.idea) {
          setSelectedIdea(data.idea);
        }
      } else {
        console.warn("Live detail fetch failed, falling back to local list cache version.");
      }
    } catch (err) {
      console.error("Error fetching idea details in real-time:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (ideaId: string) => {
    setDeleteLoading(ideaId);
    try {
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onRefresh();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "제안 삭제 중 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error("Error deleting idea:", err);
      alert("서버 연결에 실패하여 제안을 삭제할 수 없습니다.");
    } finally {
      setDeleteLoading(null);
    }
  };
  
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
              onClick={() => handleCardClick(idea)}
              className="my-proposals-card cursor-pointer relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-blue-200 group animate-fade-in"
            >
              {/* Responsive Header Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-slate-100/60 font-sans">
                <div className="flex items-center space-x-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10.5px] font-bold text-slate-600">
                    {idea.category}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10.5px] font-bold ${getStatusColor(idea.status)}`}>
                    {idea.status}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-slate-400 font-mono text-[10.5px]">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>{new Date(idea.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>

              {/* Title and details */}
              <div className="mt-4">
                <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-blue-700 transition">
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
                  <span className="font-semibold text-[11px]">
                    중복 우려 ({idea.similarity_score}%):
                  </span>
                  <span className="font-medium text-orange-700 truncate max-w-sm text-[11px]">
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

              {/* Tap-Optimized Action Footer for Mobile & Wide screen perfection */}
              <div className="mt-5 pt-3.5 border-t border-slate-100/60 flex flex-wrap items-center justify-end gap-2">
                <div className="flex items-center space-x-1 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500 border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-100 transition-all duration-200">
                  <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  <span>자세히 보기</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("이 제안을 영구적으로 삭제하시겠습니까? 관련 암호화 매핑과 데이터가 모두 소멸합니다.")) {
                      handleDelete(idea.id);
                    }
                  }}
                  disabled={deleteLoading === idea.id}
                  className="flex items-center space-x-1 rounded-xl bg-red-50 hover:bg-red-100 disabled:bg-slate-100 disabled:text-slate-400 hover:text-red-700 border border-red-100 hover:border-red-200 px-3 py-1.5 text-xs font-bold text-red-650 transition-all duration-200 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5 shrink-0" />
                  <span>{deleteLoading === idea.id ? "삭제 중..." : "제안 삭제"}</span>
                </button>
              </div>
              
            </div>
          ))}
        </div>
      )}

      {/* Detail Popup Modal */}
      <AnimatePresence>
        {selectedIdea && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedIdea(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-2xl overflow-y-auto max-h-[92vh] sm:max-h-[85vh] space-y-5 sm:space-y-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-600">
                    {selectedIdea.category}
                  </span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${getStatusColor(selectedIdea.status)}`}>
                    상태: {selectedIdea.status}
                  </span>
                  {detailLoading ? (
                    <span className="inline-flex items-center space-x-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping" />
                      <span>실시간 동기화 중...</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>실시간 데이터 수신 완료</span>
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-lg font-extrabold text-slate-900 leading-snug">
                  {selectedIdea.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIdea(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-6">
              {/* Proposal Content */}
              <div>
                <span className="block text-xs font-bold text-slate-400 mb-2">제안 상세 내용</span>
                <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-4 text-sm text-slate-700 leading-relaxed font-semibold whitespace-pre-wrap">
                  {selectedIdea.content}
                </div>
              </div>

              {/* AI summary block */}
              {selectedIdea.summary && (
                <div className="rounded-2xl bg-blue-50/30 border border-blue-100 p-4 md:p-5">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-900 border-b border-blue-50 pb-2 mb-2.5">
                    <Sparkles className="h-4.5 w-4.5 text-blue-700" />
                    <span>Gemini AI 공공 정책 분석 및 3단 보고서 번역</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-xs text-slate-650 leading-relaxed font-semibold">
                    {selectedIdea.summary}
                  </pre>
                </div>
              )}

              {/* Warnings */}
              {selectedIdea.similarity_flag && (
                <div className="flex items-start space-x-2.5 rounded-2xl bg-orange-50 border border-orange-150 p-4 text-xs text-orange-955">
                  <AlertTriangle className="h-5 w-5 text-orange-650 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-orange-950">유사 제안 중복성 경고 ({selectedIdea.similarity_score}%):</span>
                    <span className="font-medium text-orange-850 block mt-1 leading-relaxed">
                      설명: 귀하께서 기고하신 제안은 기존 제안 "{selectedIdea.similar_to_title}"과 일부 요지 및 해결책이 유사하여 시스템 필터에 감지되었습니다. 실질적인 중복 의안 여부는 심의 담당 부서 및 기획실에서 최종적으로 판단합니다.
                    </span>
                  </div>
                </div>
              )}

              {/* Timeline History log - Citizen View */}
              <div className="rounded-2xl border border-slate-150 bg-slate-50/40 p-4 sm:p-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
                  <span className="block text-xs font-extrabold text-slate-850 flex items-center space-x-1.5">
                    <Clock className="h-4 w-4 text-blue-700 shrink-0" />
                    <span>응답 히스토리 타임라인 (관리자-제안자 실시간 소통)</span>
                  </span>
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    전체 {selectedIdea.history?.length || 1}건
                  </span>
                </div>

                {selectedIdea.history && selectedIdea.history.length > 0 ? (
                  <div className="space-y-4 relative before:absolute before:inset-y-1 before:left-3.5 before:w-0.5 before:bg-slate-200">
                    {selectedIdea.history.map((hist, idx) => (
                      <div key={hist.id || idx} className="relative pl-8 animate-fade-in text-left">
                        {/* Status timeline node dots */}
                        <div className={`absolute left-[9px] top-1.5 h-3 w-3 rounded-full border-2 border-white shadow-xs ${
                          hist.status === '접수' ? 'bg-blue-600' :
                          hist.status === '검토중' ? 'bg-amber-500' :
                          hist.status === '채택' ? 'bg-emerald-500' :
                          hist.status === '보류' ? 'bg-slate-400' : 'bg-red-500'
                        }`} />

                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <div className="flex items-center space-x-2">
                            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                              hist.status === '접수' ? 'bg-blue-50 text-blue-800' :
                              hist.status === '검토중' ? 'bg-amber-100 text-amber-900' :
                              hist.status === '채택' ? 'bg-emerald-100 text-emerald-950' :
                              hist.status === '보류' ? 'bg-slate-100 text-slate-800' : 'bg-rose-100 text-rose-905'
                            }`}>
                              [{hist.status}]
                            </span>
                            <span className="text-xs font-bold text-slate-850">
                              {hist.updated_by_nickname}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold font-mono">
                            {new Date(hist.updated_at).toLocaleString('ko-KR')}
                          </span>
                        </div>
                        {hist.admin_notes && (
                          <div className="mt-2 rounded-xl bg-white border border-slate-150 p-3 text-xs text-slate-650 leading-relaxed font-semibold whitespace-pre-wrap">
                            {hist.admin_notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 relative before:absolute before:inset-y-1 before:left-3.5 before:w-0.5 before:bg-slate-200">
                    {/* Fallback layout if history isn't populated on legacy objects */}
                    <div className="relative pl-8 text-left">
                      <div className="absolute left-[9px] top-1.5 h-3 w-3 rounded-full border-2 border-white shadow-xs bg-blue-600" />
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded font-extrabold">[접수]</span>
                          <span className="text-xs font-bold text-slate-850">시스템 AI 분석기</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono font-semibold">
                          {new Date(selectedIdea.created_at).toLocaleString('ko-KR')}
                        </span>
                      </div>
                      <div className="mt-2 rounded-xl bg-white border border-slate-150 p-3 text-xs text-slate-600 leading-relaxed font-semibold">
                        제안서가 무기명 보안 채널을 통해 정상 접수되었습니다. 대기열 AI 전처리 보고서 변역이 실행 완료되었습니다.
                      </div>
                    </div>
                    {selectedIdea.admin_notes && (
                      <div className="relative pl-8 text-left">
                        <div className={`absolute left-[9px] top-1.5 h-3 w-3 rounded-full border-2 border-white shadow-xs ${
                          selectedIdea.status === '검토중' ? 'bg-amber-500' :
                          selectedIdea.status === '채택' ? 'bg-emerald-500' :
                          selectedIdea.status === '보류' ? 'bg-slate-400' : 'bg-red-500'
                        }`} />
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-extrabold">[{selectedIdea.status}]</span>
                            <span className="text-xs font-bold text-slate-850">남양주시 담당 행정관</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold font-mono">실시간 반영됨</span>
                        </div>
                        <div className="mt-2 rounded-xl bg-white border border-slate-150 p-3 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed font-semibold">
                          {selectedIdea.admin_notes}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Citizen Direct Feedback / Counter-reply Form */}
                <form onSubmit={handleSubmitComment} className="mt-5 border-t border-slate-150 pt-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="citizen-feedback-textarea" className="text-[11px] font-extrabold text-blue-900 bg-blue-50/60 px-2 py-0.5 rounded-md flex items-center space-x-1">
                      <span>👤 제안자 추가 보완 의견 및 질문 전송</span>
                    </label>
                    <span className="text-[9px] text-slate-400 font-bold">* 완전 무기명 보안 채널로 소통됩니다.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <textarea
                      id="citizen-feedback-textarea"
                      rows={2}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="심의 상황이나 행정 조치에 대해 사안 보강 설명이나 추가 질문을 남겨 전송할 수 있습니다. 입력 시 우측 버튼을 눌러 제출하세요."
                      className="w-full rounded-xl border border-slate-150 p-2.5 text-xs text-slate-755 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-hidden leading-normal font-semibold bg-white"
                    />
                    <button
                      type="submit"
                      disabled={commentLoading || !commentText.trim()}
                      className="px-4 py-4 md:py-5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 text-white font-extrabold rounded-xl text-xs transition duration-150 shadow-xs shrink-0 cursor-pointer"
                    >
                      {commentLoading ? "전송 중" : "전송"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-[11px] text-slate-400 font-mono">
              <span>제안 접수 고유번호: {selectedIdea.id}</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (confirm("이 제안을 영구적으로 삭제하시겠습니까? 관련 암호화 매핑과 데이터가 모두 소멸합니다.")) {
                      handleDelete(selectedIdea.id);
                      setSelectedIdea(null);
                    }
                  }}
                  disabled={deleteLoading === selectedIdea.id}
                  className="rounded-xl bg-red-50 hover:bg-red-100 disabled:bg-slate-100 disabled:text-slate-400 hover:text-red-700 border border-red-100 hover:border-red-200 px-4 py-2 text-xs font-bold text-red-600 transition shadow-sm hover:shadow-md flex items-center space-x-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{deleteLoading === selectedIdea.id ? "삭제 중..." : "제안 삭제"}</span>
                </button>
                <button
                  onClick={() => setSelectedIdea(null)}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-white transition shadow-sm hover:shadow-md"
                >
                  확인 완료
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    </div>
  );
}
