import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

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

const DB_PATH = path.join(DATA_DIR, "db.json");

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

// Low-Db-like local database state
interface DbSchema {
  users: any[];
  ideas: any[];
  user_ideas: any[];
  notifications: any[];
}

const defaultDb: DbSchema = {
  users: [
    { id: "user_1", email: "citizen@nyj.go.kr", nickname: "남양주시민_홍길동", role: "User", password: "user123" },
    { id: "user_2", email: "admin@nyj.go.kr", nickname: "시정기획관_황희", role: "Admin", password: "admin123" }
  ],
  ideas: [
    {
      id: "idea-seed-1",
      title: "다산신도시 스마트 버스정류장 냉난방 및 공기청정 쉘터 확대 설치",
      content: "다산동 출퇴근 차량 정체 구역 및 기상 이변(한파, 폭염) 시 취약계층과 시민들이 대기할 수 있도록 냉난방 온열의자와 미세먼지 저감장치가 결합된 밀폐형 스마트 정류장 쉘터를 주요 간선 버스정류장에 확대 개편할 것을 제안합니다.",
      category: "교통",
      status: "채택",
      summary: "1. [현황 및 필요성] 폭염 및 한파 시 실외 버스정류장에서 대기하는 시민들의 건강 위협 및 기후변화 대응 필요성 증대.\n2. [제안 내용] 다산동 주요 간선 정류장에 열선 의자, 에어컨, 공기청정 및 실시간 버스 정보가 통합된 밀폐형 쉘터 시범 설치.\n3. [기대 효과] 대중교통 이용 편의성 대폭 증대 및 노약자·취약 계층의 기후재난 피해 최소화망 제공.",
      similarity_flag: false,
      similarity_score: 0,
      created_at: "2026-06-10T10:30:00.000Z",
      attachments: [],
      admin_notes: "2026년 하반기 시정 추경 예산 편성 검토 대상으로 분류하고, 다산동 행정복지센터 인근 교통 밀집 지구에 우선 설치하기로 함."
    },
    {
      id: "idea-seed-2",
      title: "독거 어르신 안부 확인을 위한 AI 인공지능 말벗 돌봄 인프라 도입",
      content: "코로나 이후 심화되는 고령층 고독사 문제를 방지하고자, 사회복지사의 주기적인 대면 케어가 어려운 시간 대에 인공지능 스피커 또는 스마트 실버 전화를 지원하여 맞춤형 정서 대화와 약 복용 안내 시스템을 구축해야 합니다.",
      category: "복지",
      status: "검토중",
      summary: "1. [현황 및 필요성] 노인 인구 비율 증가에 따른 고독사 위험성 및 비대면 안부 확인망 필요성 급증.\n2. [제안 내용] 고위험 독거노인 세대에 인공지능 대화형 단말기 무상 보급 및 이상 패턴 감지 시 긴급 출동 연동.\n3. [기대 효과] 사회안전망 구축을 통한 정서적 고립감 해소 및 사회 복지 예산·인력 투입 대비 최대 효율 달성.",
      similarity_flag: false,
      similarity_score: 0,
      created_at: "2026-06-11T14:20:00.000Z",
      attachments: [],
      admin_notes: "보건소 및 복지정책과와 협업하여 시범 운영 세대 선정을 준비 중입니다."
    },
    {
      id: "idea-seed-3",
      title: "왕숙천·한강 생태문화공원 일대 친환경 자전거 전용 쓰레기 수거통 설치 요구",
      content: "최근 자전거도로 및 산책로 주변 일대 쓰레기 투기가 잦으나, 도보용 쓰레기통만 있어 지나가는 라이더들이 쓰레기를 손쉽게 안전하게 버릴 수 있는 높이가 있는 골그물망 구조 of 자전거 전용 쓰레기 수거함을 시범 운용했으면 합니다.",
      category: "환경",
      status: "접수",
      summary: "1. [현황 및 필요성] 왕숙천·한강 라이딩 인구 증가에 따른 산책로 주변 무단 쓰레기 투기 예방.\n2. [제안 내용] 자전거 주행선 옆 높이에 바구니 모양의 투척식 스포츠 휴지통 설치.\n3. [기대 효과] 라이더들의 불법 투기를 재미 요소로 자발적 차단하고 쾌적한 하천 공원 미관 보존.",
      similarity_flag: false,
      similarity_score: 0,
      created_at: "2026-06-12T09:15:00.000Z",
      attachments: [],
      admin_notes: ""
    },
    {
      id: "idea-seed-4",
      title: "전통시장 바가지 요금 근절을 위한 디지털 가격 정보 표시판 현대화 사업",
      content: "지방 전통시장 활성화를 위해 고질적인 문제인 바가지 요금과 부정확한 기재를 방지하기 위해 스마트 상점화 일환으로 품목 기준 디지털 QR 전자 상장판 보급 사업을 확대 지원하여 신도시 주민과 관광객들이 안심하고 결제할 수 있는 정찰제를 활성화해주세요.",
      category: "경제",
      status: "접수",
      summary: "1. [현황 및 필요성] 전통시장 상거래 신뢰 하락 및 비대면 가격 안내 부재로 소비자와의 갈등 발생.\n2. [제안 내용] 시장 메인 입구 및 점포 규격별 디지털 정찰제 LCD 패널 설치 및 모바일 연동 앱 고도화.\n3. [기대 효과] 관광객 접근 장벽 제거 및 투명한 가격 정책 도입을 통해 전통시장 상권 경제 재도약 유도.",
      similarity_flag: false,
      similarity_score: 0,
      created_at: "2026-06-13T11:00:00.000Z",
      attachments: [],
      admin_notes: ""
    }
  ],
  user_ideas: [
    { user_id: "user_1", idea_id: "idea-seed-1" },
    { user_id: "user_1", idea_id: "idea-seed-3" }
  ],
  notifications: [
    {
      id: "notif-1",
      user_id: "user_1",
      type: "STATUS_CHANGE",
      message: "제안하신 [다산신도시 스마트 버스정류장 냉난방...] 아이디어가 '채택'되었습니다. 시정 발전에 기여해 주셔서 대단히 감사합니다!",
      is_read: false,
      created_at: "2026-06-12T16:00:00.000Z"
    }
  ]
};

// Database helper operations
function readDb(): DbSchema {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeDb(defaultDb);
      return defaultDb;
    }
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading database file, returning default database:", error);
    return defaultDb;
  }
}

function writeDb(data: DbSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database file:", error);
  }
}

// Helper to simulation token/userID lookup (Simple static auth for demo/applet robustness)
let activeSessionUserId: string | null = "user_1"; // Default to logged-in user 1 for easy instant demo flow

// --- API ROUTES ---

// Auth Endpoints
app.get("/api/auth/me", (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === activeSessionUserId);
  if (!user) {
    return res.json({ user: null });
  }
  return res.json({
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
    },
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = readDb();
  const user = db.users.find((u) => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: "이메일 또는 비밀번호가 불일치합니다." });
  }
  
  activeSessionUserId = user.id;
  return res.json({
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
    },
  });
});

app.post("/api/auth/register", (req, res) => {
  const { email, password, nickname, role } = req.body;
  const db = readDb();
  
  if (db.users.some((u) => u.email === email)) {
    return res.status(400).json({ error: "이미 가입한 이메일입니다." });
  }

  const newUser = {
    id: `user_${Date.now()}`,
    email,
    password,
    nickname: nickname || email.split("@")[0],
    role: role || "User",
  };

  db.users.push(newUser);
  writeDb(db);

  activeSessionUserId = newUser.id;
  return res.json({
    user: {
      id: newUser.id,
      email: newUser.email,
      nickname: newUser.nickname,
      role: newUser.role,
    },
  });
});

app.post("/api/auth/logout", (req, res) => {
  activeSessionUserId = null;
  return res.json({ success: true });
});

// Quick demo login toggle endpoint
app.post("/api/auth/switch", (req, res) => {
  const { role } = req.body;
  const db = readDb();
  const user = db.users.find((u) => u.role === role);
  if (user) {
    activeSessionUserId = user.id;
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
      },
    });
  }
  return res.status(404).json({ error: "User role profile not found" });
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
app.get("/api/my-ideas", (req, res) => {
  if (!activeSessionUserId) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }
  const db = readDb();
  
  // Find which idea IDs belong to this user
  const ideaIds = db.user_ideas
    .filter((mapping) => mapping.user_id === activeSessionUserId)
    .map((mapping) => mapping.idea_id);
    
  // Filter the actual ideas matching those IDs
  const myIdeasList = db.ideas.filter((idea) => ideaIds.includes(idea.id));
  
  return res.json({ ideas: myIdeasList });
});

// Get User Notifications
app.get("/api/notifications", (req, res) => {
  if (!activeSessionUserId) {
    return res.json({ notifications: [] });
  }
  const db = readDb();
  const list = db.notifications.filter((n) => n.user_id === activeSessionUserId);
  return res.json({ notifications: list });
});

app.post("/api/notifications/read", (req, res) => {
  if (!activeSessionUserId) {
    return res.json({ success: false });
  }
  const db = readDb();
  db.notifications.forEach((n) => {
    if (n.user_id === activeSessionUserId) {
      n.is_read = true;
    }
  });
  writeDb(db);
  return res.json({ success: true });
});

// POST /api/ideas: Core Anonymity Pipeline & AI Summarizer / Duplicate Detection
app.post("/api/ideas", async (req, res) => {
  if (!activeSessionUserId) {
    return res.status(401).json({ error: "로그인된 세션 정보가 없습니다. 로그인 페이지로 이동합니다." });
  }
  const userId = activeSessionUserId;
  const db = readDb();

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

    // 1) RUN INTUITIVE SEMANTIC SIMILARITY CHECK locally first
    // For extreme performance and offline-resiliency in local mode
    // We check substring inclusion or word intersections
    const existingTitles = db.ideas.map((id) => id.title);
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
        // Fail-safe heuristic fallback
        aiSummary = `1. [현황 및 필요성] 제안자 제기 문제: '${title.substring(0, 30)}'...에 대한 사회적 해결 요구 증대.\n2. [제안 내용] 대안 제시를 통한 시민 자가 시정 참여 및 자원 연동 확대.\n3. [기대 효과] 적극 시정 구현 및 참여형 지자체 만족도 증진.`;
        aiFeasibility = "전체적인 추진 구조가 합리적이며 지자체 관련 조례 개정을 통해 신속히 행정 지원이 도입될 타당성이 큽니다.";
      }
    } else {
      // Fallback local mode summary
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
      status: "접수",
      summary: aiSummary,
      similarity_flag: isSimilar,
      similarity_score: similarityScore,
      similar_to_title: similarToTitle || undefined,
      created_at: new Date().toISOString(),
      attachments: attachments || [],
      admin_notes: aiFeasibility ? `[AI 기술 검토 제언]:\n${aiFeasibility}` : ""
    };

    // DB TRANSACTION (DURABLE & ANONYMOUS MECHANISM)
    // 1) Write to completely global 'ideas' table (lacks any user reference code whatsoever!)
    db.ideas.push(newIdea);

    // 2) Write mapping only to 'user_ideas' private dictionary (strictly user personal logs, admin has restricted read access)
    db.user_ideas.push({
      user_id: userId,
      idea_id: newIdeaId
    });

    // 3) Create notification to inform citizen about successful dispatch
    db.notifications.push({
      id: `notif-${Date.now()}`,
      user_id: userId,
      type: "SUBMIT_SUCCESS",
      message: `제안하신 [${title}] 아이디어가 정상 접수되었습니다. AI 실시간 보고서 요약 및 중복성 분석이 완료되어 시정에 기밀하게 반영 중입니다.`,
      is_read: false,
      created_at: new Date().toISOString()
    });

    writeDb(db);

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
app.get("/api/admin/stats", (req, res) => {
  // Security review: verify session is admin
  const db = readDb();
  const user = db.users.find((u) => u.id === activeSessionUserId);
  if (!user || user.role !== "Admin") {
    return res.status(403).json({ error: "시정 담당공무원(Admin) 권한이 필요한 대시보드 구역입니다." });
  }

  // Calculate snapshot metrics
  const totalCount = db.ideas.length;
  const statusCounts = db.ideas.reduce((acc, idea) => {
    acc[idea.status] = (acc[idea.status] || 0) + 1;
    return acc;
  }, { "접수": 0, "검토중": 0, "채택": 0, "보류": 0, "반려": 0 });

  const categoryCounts = db.ideas.reduce((acc, idea) => {
    acc[idea.category] = (acc[idea.category] || 0) + 1;
    return acc;
  }, { "교통": 0, "복지": 0, "환경": 0, "교육": 0, "문화": 0, "안전": 0, "경제": 0, "기타": 0 });

  const categoryRatios = Object.keys(categoryCounts).map((cat) => {
    const score = categoryCounts[cat];
    return {
      category: cat,
      count: score,
      percentage: totalCount > 0 ? parseFloat(((score / totalCount) * 100).toFixed(1)) : 0
    };
  });

  const duplicateFlaggedCount = db.ideas.filter(idea => idea.similarity_flag).length;

  return res.json({
    total_count: totalCount,
    status_counts: statusCounts,
    category_ratios: categoryRatios,
    duplicate_flagged_count: duplicateFlaggedCount
  });
});

// Admin Fetch list - Completely anonymous! Only returns ideas, without join user profile details!
app.get("/api/admin/ideas", (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === activeSessionUserId);
  if (!user || user.role !== "Admin") {
    return res.status(403).json({ error: "권한이 없습니다." });
  }
  // Secure compliance: Never attach personal id information when serving to admin
  return res.json({ ideas: db.ideas });
});

// Admin update status of an ideas (post state change)
app.patch("/api/admin/ideas/:id", (req, res) => {
  const { id } = req.params;
  const { status, admin_notes } = req.body;
  const db = readDb();

  const user = db.users.find((u) => u.id === activeSessionUserId);
  if (!user || user.role !== "Admin") {
    return res.status(403).json({ error: "권한이 없습니다." });
  }

  const idea = db.ideas.find((i) => i.id === id);
  if (!idea) {
    return res.status(404).json({ error: "아이디어를 찾을 수 없습니다." });
  }

  const oldStatus = idea.status;
  idea.status = status || idea.status;
  if (admin_notes !== undefined) {
    idea.admin_notes = admin_notes;
  }

  // Trace back which user requested this privately to issue a notification
  const mapping = db.user_ideas.find((m) => m.idea_id === id);
  if (mapping) {
    db.notifications.push({
      id: `notif-${Date.now()}`,
      user_id: mapping.user_id,
      type: "STATUS_CHANGE",
      message: `제안하신 [${idea.title.substring(0, 20)}...]의 심사 상태가 [${oldStatus}] ➜ [${idea.status}](으)로 업데이트 되었습니다. 신속하고 성실하게 검토 결과를 반영하겠습니다.`,
      is_read: false,
      created_at: new Date().toISOString()
    });
  }

  writeDb(db);
  return res.json({ success: true, idea });
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
