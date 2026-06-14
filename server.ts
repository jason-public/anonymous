import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import {
  findUserById,
  findUserByEmail,
  createUser as dbCreateUser,
  findIdeasByUserId,
  findAllIdeas,
  findIdeaById,
  deleteIdea as dbDeleteIdea,
  createIdea as dbCreateIdea,
  updateIdeaStatus as dbUpdateIdeaStatus,
  findMappingByIdeaId,
  findNotificationsByUserId,
  markNotificationsAsRead,
  createNotification as dbCreateNotification,
  isSupabaseActive,
  signUpWithAuth,
  signInWithAuth,
  findAllUsers,
  addCommentToIdea as dbAddCommentToIdea
} from "./src/lib/supabaseService.ts";

// Load environment variables
dotenv.config();

// In bundled Node CJS environment, use process.cwd() to resolve paths securely
const __dirname = process.cwd();

const app = express();
const PORT = 3000;

// Set up server-side uploads directory and database directory
const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use("/uploads", express.static(UPLOADS_DIR));

// Initialize Gemini client lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("Gemini API client initialized successfully.");
    } else {
      console.log("No valid GEMINI_API_KEY found in process.env. Falling back to local mock analyzer.");
    }
  }
  return aiClient;
}

// Helper to simulation token/userID lookup (Simple static auth for demo/applet robustness)
let activeSessionUserId: string | null = "user_1"; // Default to logged-in user 1 for easy instant demo flow

// --- API ROUTES ---

// Auth Endpoints
app.get("/api/auth/me", async (req, res) => {
  if (!activeSessionUserId) {
    return res.json({ user: null });
  }
  try {
    const user = await findUserById(activeSessionUserId);
    if (!user) {
      return res.json({ user: null });
    }
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
        is_supabase: isSupabaseActive()
      },
    });
  } catch (err: any) {
    return res.json({ user: null });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const authResult = await signInWithAuth(email, password);
    
    if (!authResult.user) {
      return res.status(401).json({ error: "이메일 또는 비밀번호가 일치하지 않습니다." });
    }
    
    activeSessionUserId = authResult.user.id;
    return res.json({
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        nickname: authResult.user.nickname,
        role: authResult.user.role,
        is_supabase: isSupabaseActive()
      },
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { email, password, nickname, role, passcode } = req.body;
  try {
    const authResult = await signUpWithAuth(
      email,
      password,
      nickname,
      passcode,
      role === "Admin" ? "Admin" : "User"
    );

    // If email confirmation is enabled, user session won't be active immediately
    if (authResult.emailConfirmationRequired) {
      return res.json({
        success: true,
        user: null,
        emailConfirmationRequired: true,
        message: "원격 Supabase 이메일 가입 신청서가 수용되었습니다! 가입하신 이메일의 메일함으로 가칭 인증 링크를 발송했으니, 해당 확인 버튼을 누르신 후에 로그인 하실 수 있습니다."
      });
    }

    if (authResult.user) {
      activeSessionUserId = authResult.user.id;
    }

    return res.json({
      user: authResult.user ? {
        id: authResult.user.id,
        email: authResult.user.email,
        nickname: authResult.user.nickname,
        role: authResult.user.role,
        is_supabase: isSupabaseActive()
      } : null,
      emailConfirmationRequired: false
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.post("/api/auth/logout", (req, res) => {
  activeSessionUserId = null;
  return res.json({ success: true });
});

// Quick demo login toggle endpoint
app.post("/api/auth/switch", async (req, res) => {
  const { role } = req.body;
  try {
    // Try primary seed records first
    const targetId = role === "Admin" ? "user_2" : "user_1";
    let user = await findUserById(targetId);
    
    // Fallback search if first search yields empty row
    if (!user) {
      const allIdeas = await findAllIdeas(); // triggering schema fetch or load local DB
      // We can scan some pre-populated user from local json directly
      const path = await import("path");
      const fs = await import("fs");
      const DB_PATH = path.join(process.cwd(), "data", "db.json");
      if (fs.existsSync(DB_PATH)) {
        try {
          const raw = fs.readFileSync(DB_PATH, "utf-8");
          const localData = JSON.parse(raw);
          const localUser = localData.users?.find((u: any) => u.role === role);
          if (localUser) {
            user = localUser;
          }
        } catch (_) {}
      }
    }

    if (user && user.role === role) {
      activeSessionUserId = user.id;
      return res.json({
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          role: user.role,
          is_supabase: isSupabaseActive()
        },
      });
    }
    return res.status(404).json({ error: "User role profile not found" });
  } catch (err: any) {
    return res.status(500).json({ error: "계정 스위치 처리 오류: " + err.message });
  }
});

// Create File Attachment Upload route
app.post("/api/upload", (req, res) => {
  const { fileName, fileBase64 } = req.body;
  if (!fileName || !fileBase64) {
    return res.status(400).json({ error: "Invalid upload request metadata." });
  }

  try {
    const fileExt = fileName.split(".").pop();
    const uniqueName = `${crypto.randomUUID()}.${fileExt}`;
    const base64Data = fileBase64.replace(/^data:.*?;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    
    const filePath = path.join(UPLOADS_DIR, uniqueName);
    fs.writeFileSync(filePath, buffer);

    return res.json({
      success: true,
      file_url: `/uploads/${uniqueName}`,
      file_name: fileName,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "첨부파일 서버 업로드 실패: " + error.message });
  }
});

// User views their own mapped ideas (Anonymous records linked only in user_ideas mapping)
app.get("/api/my-ideas", async (req, res) => {
  if (!activeSessionUserId) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }
  try {
    const myIdeasList = await findIdeasByUserId(activeSessionUserId);
    return res.json({ ideas: myIdeasList });
  } catch (err: any) {
    return res.status(500).json({ error: "제안 내역 조회 실패: " + err.message });
  }
});

// Fetch single idea details in real-time
app.get("/api/ideas/:id", async (req, res) => {
  if (!activeSessionUserId) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }
  try {
    const { id } = req.params;
    const idea = await findIdeaById(id);
    if (!idea) {
      return res.status(404).json({ error: "해당 제안을 찾을 수 없습니다." });
    }
    return res.json({ idea });
  } catch (err: any) {
    return res.status(500).json({ error: "제안 상세 조회 실패: " + err.message });
  }
});

// Delete single idea permanently
app.delete("/api/ideas/:id", async (req, res) => {
  if (!activeSessionUserId) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }
  try {
    const { id } = req.params;
    
    // Verify ownership or check if User is Admin
    const mapping = await findMappingByIdeaId(id);
    if (mapping && mapping.user_id !== activeSessionUserId) {
      const user = await findUserById(activeSessionUserId);
      if (!user || user.role !== "Admin") {
        return res.status(403).json({ error: "본인이 작성한 제안만 삭제할 수 있습니다." });
      }
    }

    const success = await dbDeleteIdea(id);
    if (!success) {
      return res.status(500).json({ error: "제안 삭제 처리에 실패했습니다." });
    }
    return res.json({ success: true, message: "제안이 성공적으로 삭제되었습니다." });
  } catch (err: any) {
    return res.status(500).json({ error: "제안 삭제 실패: " + err.message });
  }
});

// Get User Notifications
app.get("/api/notifications", async (req, res) => {
  if (!activeSessionUserId) {
    return res.json({ notifications: [] });
  }
  try {
    const list = await findNotificationsByUserId(activeSessionUserId);
    return res.json({ notifications: list });
  } catch (err: any) {
    return res.json({ notifications: [] });
  }
});

app.post("/api/notifications/read", async (req, res) => {
  if (!activeSessionUserId) {
    return res.json({ success: false });
  }
  try {
    await markNotificationsAsRead(activeSessionUserId);
    return res.json({ success: true });
  } catch (err: any) {
    return res.json({ success: false });
  }
});

// POST /api/ideas: Core Anonymity Pipeline & AI Summarizer / Duplicate Detection
app.post("/api/ideas", async (req, res) => {
  if (!activeSessionUserId) {
    return res.status(401).json({ error: "로그인된 세션 정보가 없습니다. 로그인 페이지로 이동합니다." });
  }
  const userId = activeSessionUserId;

  const { title, content, category, attachments } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "제안 제목과 상세 내용을 모두 작성해주세요." });
  }

  try {
    let aiSummary = "";
    let finalCategory = category || "기타";
    let aiFeasibility = "";
    let isSimilar = false;
    let similarityScore = 0;
    let similarToTitle = "";

    // 1) RUN INTUITIVE SEMANTIC SIMILARITY CHECK locally/remotely first
    const allIdeasRef = await findAllIdeas();
    const existingTitles = allIdeasRef.map((id) => id.title);
    for (const originalTitle of existingTitles) {
      const wordsContent = originalTitle.split(/\s+/).filter(w => w.length > 1);
      let matchCount = 0;
      for (const word of wordsContent) {
        if (title.includes(word)) matchCount++;
      }
      const scoreRatio = (matchCount / wordsContent.length) * 100;
      if (scoreRatio > 40 || title.includes(originalTitle) || originalTitle.includes(title)) {
        isSimilar = true;
        similarityScore = Math.round(Math.max(scoreRatio, 55));
        similarToTitle = originalTitle;
        break;
      }
    }

    // 2) AI Pipeline validation with Gemini
    const gemini = getGeminiClient();
    if (gemini) {
      console.log("Running server-side Gemini 3.5 Flash pipeline for summarized content...");
      const prompt = `
당신은 대한민국 지방자치단체 정책 검토 전문 AI 시스템입니다.
시민이 제출한 다음 제안서의 제목과 상세내용을 정밀 분석해 주세요.

[제안 제목]: ${title}
[제안 상세내용]: ${content}
[작성자가 임시 선택한 분야]: ${category}

요구사항:
1. summary: 제안 내용을 완벽한 공공기관 3단 보고서 요약식으로 한국어로 '정확히 3줄' 요약 작성하시오.
   각 줄은 가독성이 훌륭한 대안 및 핵심 요소를 포함한 개조식 문장이여야 합니다. (예: "1. [현황 및 필요성] ...\\n2. [제안 내용] ...\\n3. [기대 효과] ...")
2. final_category: 작성자의 임시 분류에 얽메이지 않고, 내용상 다음 8가지 단어 중 가장 적절한 '단 하나'의 최적 카테고리를 한국어로 매치하여 단어로만 기록하십시오: ['교통', '복지', '환경', '교육', '문화', '안전', '경제', '기타']
3. feasibility: 시정 반영을 위한 기술적, 행정적 실현 가능성 및 보완 제언을 3줄 내외의 친근하고 건설적인 요약글로 작성해 주십시오.

반드시 다른 마크다운 태그, 특수 꼬리글 없이, 아래 형태의 유효한 RFC JSON 규격 개체만 한글로 답변하십시오:
{
  "summary": "1. [현황 및 필요성] ...\\n2. [제안 내용] ...\\n3. [기대 효과] ...",
  "final_category": "교통",
  "feasibility": "복지 사각지대 해소 측면에서 뛰어난 효율을 띌 수 있습니다..."
}
`;

      try {
        const aiResponse = await gemini.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                final_category: { type: Type.STRING },
                feasibility: { type: Type.STRING }
              },
              required: ["summary", "final_category", "feasibility"]
            }
          }
        });

        const jsonText = aiResponse.text?.trim() || "";
        const aiData = JSON.parse(jsonText);
        
        aiSummary = aiData.summary || "";
        if (aiData.final_category && ["교통", "복지", "환경", "교육", "문화", "안전", "경제", "기타"].includes(aiData.final_category)) {
          finalCategory = aiData.final_category;
        }
        aiFeasibility = aiData.feasibility || "";
        console.log("Successfully retrieved and parsed AI Summary:", finalCategory);
      } catch (gem_err: any) {
        console.error("Error executing dynamic Gemini call, falling back to heuristic mock:", gem_err.message);
        aiSummary = `1. [현황 및 필요성] 제안자 제기 문제: '${title.substring(0, 30)}'...에 대한 사회적 해결 요구 증대.\n2. [제안 내용] 대안 제시를 통한 시민 자가 시정 참여 및 자원 연동 확대.\n3. [기대 효과] 적극 시정 구현 및 참여형 지자체 만족도 증진.`;
        aiFeasibility = "전체적인 추진 구조가 합리적이며 지자체 관련 조례 개정을 통해 신속히 행정 지원이 도입될 타당성이 큽니다.";
      }
    } else {
      aiSummary = `1. [현황 및 필요성] 시정 정책 인프라 미비로 인한 개선요청 확대 건.\n2. [제안 내용] 시민의 아이디어 '${title}' 바탕의 규제 개혁 및 시책 신규 융합 방안 제기.\n3. [기대 효과] 행정 소통 효율화 및 지역 거점 기반 친화성 향상.`;
      aiFeasibility = "지역 예산 수립 타당성을 기초로 검토가 필요하며 시각적 수혜 인구 가시성이 높아 적극 추진에 긍정적입니다.";
    }

    // Generate unique random UUID
    const newIdeaId = `idea-${crypto.randomUUID()}`;
    const newIdea = {
      id: newIdeaId,
      title,
      content,
      category: finalCategory,
      status: "접수" as any,
      summary: aiSummary,
      similarity_flag: isSimilar,
      similarity_score: similarityScore,
      similar_to_title: similarToTitle || undefined,
      created_at: new Date().toISOString(),
      attachments: attachments || [],
      admin_notes: aiFeasibility ? `[AI 기술 검토 제언]:\n${aiFeasibility}` : "",
      history: [
        {
          id: `hist-${Date.now()}`,
          status: "접수" as any,
          admin_notes: aiFeasibility ? `[AI 기술 검토 제언]:\n${aiFeasibility}` : "제안이 성공적으로 등록되었습니다. 담당 부서에서 검토를 준비하고 있습니다.",
          updated_at: new Date().toISOString(),
          updated_by_nickname: "시스템 AI 분석기"
        }
      ]
    };

    // DB TRANSACTION (DURABLE & ANONYMOUS MECHANISM)
    await dbCreateIdea(newIdea, userId);

    // Create notification to inform citizen about successful dispatch
    await dbCreateNotification({
      id: `notif-${Date.now()}`,
      user_id: userId,
      type: "SUBMIT_SUCCESS",
      message: `제안하신 [${title}] 아이디어가 정상 접수되었습니다. AI 실시간 보고서 요약 및 중복성 분석이 완료되어 시정에 기밀하게 반영 중입니다.`,
      is_read: false,
      created_at: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      idea_id: newIdeaId,
      final_category: finalCategory,
      summary: aiSummary,
      similarity_score: similarityScore,
    });
  } catch (error: any) {
    console.error("Encountered error adding idea:", error);
    return res.status(500).json({ error: "제안 제출 처리 중 시스템 오류가 발생했습니다: " + error.message });
  }
});

// Admin Dashboard stats - (Completely separate anonymized metrics calculation)
app.get("/api/admin/stats", async (req, res) => {
  if (!activeSessionUserId) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }
  try {
    const user = await findUserById(activeSessionUserId);
    if (!user || user.role !== "Admin") {
      return res.status(403).json({ error: "시정 담당공무원(Admin) 권한이 필요한 대시보드 구역입니다." });
    }

    const allIdeas = await findAllIdeas();
    const totalCount = allIdeas.length;

    const statusCounts = allIdeas.reduce((acc, idea) => {
      acc[idea.status] = (acc[idea.status] || 0) + 1;
      return acc;
    }, { "접수": 0, "검토중": 0, "채택": 0, "보류": 0, "반려": 0 } as Record<string, number>);

    const categoryCounts = allIdeas.reduce((acc, idea) => {
      acc[idea.category] = (acc[idea.category] || 0) + 1;
      return acc;
    }, { "교통": 0, "복지": 0, "환경": 0, "교육": 0, "문화": 0, "안전": 0, "경제": 0, "기타": 0 } as Record<string, number>);

    const categoryRatios = Object.keys(categoryCounts).map((cat) => {
      const score = categoryCounts[cat];
      return {
        category: cat,
        count: score,
        percentage: totalCount > 0 ? parseFloat(((score / totalCount) * 100).toFixed(1)) : 0
      };
    });

    const duplicateFlaggedCount = allIdeas.filter(idea => idea.similarity_flag).length;

    return res.json({
      total_count: totalCount,
      status_counts: statusCounts,
      category_ratios: categoryRatios,
      duplicate_flagged_count: duplicateFlaggedCount
    });
  } catch (err: any) {
    return res.status(500).json({ error: "통계 데이터 집계 오류: " + err.message });
  }
});

// Admin Fetch users list - Fetches the live profiles from auth/public database safely for verified admins
app.get("/api/admin/users", async (req, res) => {
  if (!activeSessionUserId) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }
  try {
    const user = await findUserById(activeSessionUserId);
    if (!user || user.role !== "Admin") {
      return res.status(403).json({ error: "시정 담당공무원(Admin) 권한이 필요한 대시보드 구역입니다." });
    }
    const users = await findAllUsers();
    return res.json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: "사용자 목록 로드 실패: " + err.message });
  }
});

// Admin Fetch list - Completely anonymous! Only returns ideas, without join user profile details!
app.get("/api/admin/ideas", async (req, res) => {
  if (!activeSessionUserId) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }
  try {
    const user = await findUserById(activeSessionUserId);
    if (!user || user.role !== "Admin") {
      return res.status(403).json({ error: "권한이 없습니다." });
    }
    const allIdeas = await findAllIdeas();
    return res.json({ ideas: allIdeas });
  } catch (err: any) {
    return res.status(500).json({ error: "민원 목록 로드 실패: " + err.message });
  }
});

// Admin update status of an ideas (post state change)
app.patch("/api/admin/ideas/:id", async (req, res) => {
  const { id } = req.params;
  const { status, admin_notes } = req.body;

  if (!activeSessionUserId) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }
  try {
    const user = await findUserById(activeSessionUserId);
    if (!user || user.role !== "Admin") {
      return res.status(403).json({ error: "권한이 없습니다." });
    }

    const allIdeas = await findAllIdeas();
    const existingIdea = allIdeas.find((i) => i.id === id);
    if (!existingIdea) {
      return res.status(404).json({ error: "아이디어를 찾을 수 없습니다." });
    }

    const oldStatus = existingIdea.status;
    const updatedBy = user ? user.nickname : "시정 담당공무원";
    const updatedIdea = await dbUpdateIdeaStatus(id, status, admin_notes, updatedBy);

    // Trace back which user requested this privately to issue a notification
    const mapping = await findMappingByIdeaId(id);
    if (mapping) {
      await dbCreateNotification({
        id: `notif-${Date.now()}`,
        user_id: mapping.user_id,
        type: "STATUS_CHANGE",
        message: `제안하신 [${existingIdea.title.substring(0, 20)}...]의 심사 상태가 [${oldStatus}] ➜ [${status || oldStatus}](으)로 업데이트 되었습니다. 신속하고 성실하게 검토 결과를 반영하겠습니다.`,
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    return res.json({ success: true, idea: updatedIdea });
  } catch (err: any) {
    return res.status(500).json({ error: "상태 변경 저장 실패: " + err.message });
  }
});

// 제안자(시민)가 상세 보기 모달에서 담당자에게 추가 피드백/의견 소통 메시지를 던질 수 있는 API
app.post("/api/ideas/:id/comment", async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!activeSessionUserId) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }

  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "메시지 내용을 입력해 주세요." });
  }

  try {
    // 1. 보안/매핑 점검: 현재 접속 유저가 이 아이디어의 원작성자가 맞는지 검증
    const mapping = await findMappingByIdeaId(id);
    if (!mapping || mapping.user_id !== activeSessionUserId) {
      return res.status(403).json({ error: "본인의 제안에만 추가 소통 의견을 남길 수 있습니다." });
    }

    const user = await findUserById(activeSessionUserId);
    const nickname = user ? `${user.nickname} (제안자)` : "시민 제안자";

    const updatedIdea = await dbAddCommentToIdea(id, message, nickname);

    return res.json({ success: true, idea: updatedIdea });
  } catch (err: any) {
    return res.status(500).json({ error: "소통 기록 등록 실패: " + err.message });
  }
});

// Serve static asset fallback and boot
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Start Server
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on host 0.0.0.0 and port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to bootstrap fullstack server:", err);
});
