import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, ShieldAlert, Sparkles, AlertCircle, HelpCircle, ArrowRight } from 'lucide-react';
import { CategoryType, Idea } from '../types';

interface NewProposalProps {
  onSubmitSuccess: (newIdea: Idea) => void;
}

export default function NewProposal({ onSubmitSuccess }: NewProposalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<CategoryType>('교통');
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // States to show the immediate beautiful AI confirmation card
  const [aiResult, setAiResult] = useState<{
    success: boolean;
    idea_id: string;
    final_category: string;
    summary: string;
    similarity_score: number;
    title: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    // 20MB constraint safeguard
    if (file.size > 20 * 1024 * 1024) {
      alert("파일 허용 용량은 최대 20MB입니다.");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileBase64 = e.target?.result as string;
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileBase64,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setUploadedFile({ url: data.file_url, name: data.file_name });
        } else {
          alert("파일 업로드 실패: " + data.error);
        }
      } catch (err) {
        console.error(err);
        alert("업로드 중 통신 에러가 발생했습니다.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("제안 제목과 상세 내용을 기재해주십시오.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title,
        content,
        category,
        attachments: uploadedFile ? [uploadedFile] : [],
      };

      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "제안 등록 실패");
      }

      const result = await response.json();
      
      // Save full output state to render the prompt-driven interactive success screen
      setAiResult({
        success: true,
        idea_id: result.idea_id,
        final_category: result.final_category,
        summary: result.summary,
        similarity_score: result.similarity_score,
        title,
      });

      // Clear the input fields for the next entries
      setTitle('');
      setContent('');
      setUploadedFile(null);
    } catch (err: any) {
      alert(err.message || "서버 통신 중 에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const closeOverlayAndRefresh = () => {
    if (aiResult) {
      onSubmitSuccess({
        id: aiResult.idea_id,
        title: aiResult.title,
        content: '',
        category: aiResult.final_category as any,
        status: '접수',
        summary: aiResult.summary,
        similarity_flag: aiResult.similarity_score > 0,
        similarity_score: aiResult.similarity_score,
        created_at: new Date().toISOString(),
      });
      setAiResult(null);
    }
  };

  return (
    <div className="relative">
      
      {/* AI submission completion pop-up modal panel */}
      {aiResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-100 bg-white p-4 sm:p-6 md:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900">제안이 완벽히 익명 접수되었습니다</h3>
              <p className="mt-2 max-w-md text-xs text-slate-500 leading-relaxed font-semibold">
                개인정보 식별 테이블을 분리하여 남양주시 직원 및 관리자도 제안자의 신원을 추적할 수 없습니다. 안전한 익명 기여에 감사드립니다.
              </p>
            </div>

            {/* AI analysis panel */}
            <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-blue-700 animate-pulse" />
                  <span className="text-sm font-bold text-blue-900">Gemini AI 실시간 정책 분석 리포트</span>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-0.5 text-[10px] font-bold text-blue-800">
                  {aiResult.final_category}
                </span>
              </div>

              {/* 3 point summary */}
              <div className="mt-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-700">익명 제안 공문식 3줄 자동 요약</h4>
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-3.5">
                  <pre className="whitespace-pre-wrap font-sans text-xs text-slate-600 leading-relaxed font-semibold">
                    {aiResult.summary}
                  </pre>
                </div>
              </div>

              {/* Sim check rating */}
              <div className="mt-4 flex flex-col justify-between rounded-xl bg-orange-50/50 border border-orange-100 px-4 py-3 sm:flex-row sm:items-center">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="h-5.5 w-5.5 text-orange-600" />
                  <div>
                    <h5 className="text-xs font-bold text-orange-950">기접수 아이디어 유사도 검증</h5>
                    <p className="text-[10px] text-orange-700 font-medium leading-normal">
                      남양주시 시정 데이터베이스의 유사 대안 제안 대조 결과입니다.
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:mt-0 text-right">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                    aiResult.similarity_score > 40
                      ? 'bg-orange-200 text-orange-900'
                      : 'bg-emerald-150 text-emerald-800'
                  }`}>
                    {aiResult.similarity_score > 0
                      ? `유사성 감지 비율: ${aiResult.similarity_score}%`
                      : '유사 중복 제안 없음'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={closeOverlayAndRefresh}
              className="mt-6 flex w-full items-center justify-center space-x-2 rounded-xl bg-blue-700 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/10 hover:bg-blue-800 transition"
            >
              <span>나의 제안함에서 확인하기</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Primary proposal write board */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl sm:p-8">
        <div className="border-b border-slate-100 pb-5">
          <div className="flex items-center space-x-2">
            <span className="inline-block rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
              C-Platform
            </span>
            <span className="text-xs text-slate-400 font-semibold">| 익명 기여관</span>
          </div>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
            시정 혁신 아이디어 제안하기
          </h2>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed font-semibold">
            남양주시의 튼튼한 미래를 만드는 아이디어를 보내주셔요. 작성된 의견은 Gemini AI 분석기를 통해 3줄 개조식 공문서로 번역되고 실시간 분류 가동을 거쳐 시정 실무진에 자동 연동됩니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Category SELECT */}
          <div>
            <label htmlFor="category-select" className="block text-xs font-bold text-slate-700">
              제안 분야 <span className="text-rose-500">*</span>
            </label>
            <div className="mt-1.5 grid grid-cols-4 gap-2 sm:grid-cols-8">
              {(['교통', '복지', '환경', '교육', '문화', '안전', '경제', '기타'] as CategoryType[]).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`rounded-xl py-2 px-0.5 text-center text-[11px] sm:text-xs font-bold transition ${
                    category === cat
                      ? 'bg-blue-700 text-white shadow-sm shadow-blue-500/10'
                      : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400 leading-normal font-medium">
              * 임의로 분야를 지정하셔도 인공지능이 제안서 본문을 판단하여 더 정밀한 부서 카테고리를 찾아 재교정해 드립니다.
            </p>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title-input" className="block text-xs font-bold text-slate-700">
              제안 제목 <span className="text-rose-500">*</span>
            </label>
            <input
              id="title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예시) 다산동 상가 밀집구역 전기차 안심 충전 공간 확보 건의"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:outline-hidden"
            />
          </div>

          {/* Detailed Content */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="content-input" className="block text-xs font-bold text-slate-700">
                제안 상세내용 <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                공백 포함 {content.length}자
              </span>
            </div>
            <textarea
              id="content-input"
              required
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="아래 항목들을 구체적으로 입력하시면 예산 심사 및 채택률이 눈에 띄게 증가합니다.&#10;- 현황 및 불편 요소:&#10;- 개선 및 도입 방안:&#10;- 기대효과:"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-800 placeholder:text-slate-400 leading-relaxed focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:outline-hidden"
            />
          </div>

          {/* Drag & drop file selector */}
          <div>
            <span className="block text-xs font-bold text-slate-700">첨부파일 추가 (선택)</span>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-1.5 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all cursor-pointer ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/20'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.jpg,.png,.docx"
                onChange={handleFileChange}
              />
              <UploadCloud className="h-8 w-8 text-slate-400" />
              <p className="mt-2 text-xs font-bold text-slate-700">클릭하거나 파일을 여기로 드래그하세요</p>
              <p className="mt-0.5 text-[10px] text-slate-400 font-medium">
                PDF, JPG, PNG, DOCX 포맷 가능 (최대 용량 20MB)
              </p>
            </div>

            {/* Display uploaded file status */}
            {uploading && (
              <div className="mt-2.5 flex items-center space-x-2 text-xs text-slate-500 font-bold">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                <span>서버에 안전 보관 중... 잠시만 기다리십시오 ...</span>
              </div>
            )}

            {uploadedFile && (
              <div className="mt-2.5 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-700" />
                  <span className="font-semibold text-slate-700">{uploadedFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedFile(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-[10px] font-bold"
                >
                  제거하기
                </button>
              </div>
            )}
          </div>

          {/* Privacy statement banner */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="mt-0.5 h-4.5 w-4.5 text-slate-600 shrink-0" />
              <div className="text-[11px] leading-relaxed text-slate-500 font-semibold">
                <span className="font-bold text-slate-800">[익명성 제공 서약]</span> 당 플랫폼은 보안성 강화를 위해 제출 시 작성자 매핑 정보를 ideas 테이블과 물리 분리 설계하였습니다. 이로 인해 정책 심사를 집행하는 주무 부처의 검토자 또는 시청 관리자 등 누구도 개인의 메일 주소나 Nickname 정보를 역방향으로 조회할 수 없는 암호화 격리를 실사합니다.
              </div>
            </div>
          </div>

          {/* Submit btn */}
          <button
            type="submit"
            disabled={loading || uploading}
            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-blue-700 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-500/10 hover:bg-blue-800 transition disabled:bg-slate-300"
          >
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span>
              {loading ? 'AI 분석 보고서 작성 및 암호화 전송 중...' : '국민 아이디어 안전하게 제출하기'}
            </span>
          </button>
        </form>
      </div>

    </div>
  );
}
