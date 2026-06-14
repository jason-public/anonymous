import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Define table types for strict schema alignment
export interface DbUser {
  id: string;
  email: string;
  password?: string;
  nickname: string;
  role: "User" | "Admin";
  created_at?: string;
}

export interface DbIdea {
  id: string;
  title: string;
  content: string;
  category: string;
  status: "접수" | "검토중" | "채택" | "보류" | "반려";
  summary: string;
  similarity_flag: boolean;
  similarity_score: number;
  similar_to_title?: string;
  attachments: any[];
  admin_notes: string;
  created_at: string;
  history?: any[];
}

export interface DbUserIdea {
  user_id: string;
  idea_id: string;
}

export interface DbNotification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface LocalSchema {
  users: DbUser[];
  ideas: DbIdea[];
  user_ideas: DbUserIdea[];
  notifications: DbNotification[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const defaultDb: LocalSchema = {
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
      admin_notes: "2026년 하반기 시정 추경 예산 편성 검토 대상으로 분류하고, 다산동 행정복지센터 인근 교통 밀집 지구에 우선 설치하기로 함.",
      history: [
        {
          id: "hist-seed-1a",
          status: "접수",
          admin_notes: "스마트 정류장 냉난방/공기청정 쉘터 제안이 접수되었습니다.",
          updated_at: "2026-06-10T10:30:00.000Z",
          updated_by_nickname: "시스템 AI 분석기"
        },
        {
          id: "hist-seed-1b",
          status: "검토중",
          admin_notes: "다산동 교통기획팀 담당 부서에 배정되어 실무 환경성 실사 및 타당성 조사를 진행 중입니다.",
          updated_at: "2026-06-11T11:00:00.000Z",
          updated_by_nickname: "시정기획관_황희"
        },
        {
          id: "hist-seed-1c",
          status: "채택",
          admin_notes: "2026년 하반기 시정 추경 예산 편성 검토 대상으로 분류하고, 다산동 행정복지센터 인근 교통 밀집 지구에 우선 설치하기로 결정하였습니다.",
          updated_at: "2026-06-12T15:30:00.000Z",
          updated_by_nickname: "시정기획관_황희"
        }
      ]
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
      admin_notes: "보건소 및 복지정책과와 협업하여 시범 운영 세대 선정을 준비 중입니다.",
      history: [
        {
          id: "hist-seed-2a",
          status: "접수",
          admin_notes: "독거 어르신 안부 확인 인프라 제안이 원활하게 접수되었습니다.",
          updated_at: "2026-06-11T14:20:00.000Z",
          updated_by_nickname: "시스템 AI 분석기"
        },
        {
          id: "hist-seed-2b",
          status: "검토중",
          admin_notes: "보건소 및 복지정책과와 협업하여 시범 운영 세대 선정을 준비 중입니다.",
          updated_at: "2026-06-12T09:40:00.000Z",
          updated_by_nickname: "시정기획관_황희"
        }
      ]
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
      admin_notes: "",
      history: [
        {
          id: "hist-seed-3a",
          status: "접수",
          admin_notes: "왕숙천·한강 전용 자전거 쓰레기통 제안이 성공적으로 접수되었습니다.",
          updated_at: "2026-06-12T09:15:00.000Z",
          updated_by_nickname: "시스템 AI 분석기"
        }
      ]
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

// Initialize Supabase client lazily
let supabaseUrl = process.env.SUPABASE_URL || "";
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
let supabaseEnabled = false;

if (supabaseUrl && supabaseKey && supabaseUrl !== "https://your-project-id.supabase.co") {
  supabaseEnabled = true;
  console.log("Supabase config detected. Activating live database integration.");
} else {
  console.log("Supabase config is missing. Operating under high-fidelity local fallback database.");
}

const supabase = supabaseEnabled ? createClient(supabaseUrl, supabaseKey) : null;

export function isSupabaseActive(): boolean {
  return supabaseEnabled;
}

// Integrated Authentications with direct Supabase Auth & Local Fallback
export interface AuthResult {
  user: DbUser | null;
  emailConfirmationRequired?: boolean;
}

export async function signUpWithAuth(
  email: string,
  password?: string,
  nickname?: string,
  passcode?: string,
  role: "User" | "Admin" = "User"
): Promise<AuthResult> {
  const code = (passcode || "").trim();
  const validPasscodes = ["1331", "NYJ-2026", "남양주혁신", "2026", "nyj2026", "1052"];
  if (!validPasscodes.includes(code)) {
    throw new Error("발급받은 올바른 암호번호(승인 코드)가 아닙니다. 가입 권한을 확인해 주세요.");
  }

  const finalNickname = nickname || email.split("@")[0];

  if (supabaseEnabled && supabase) {
    // 1) Register inside Supabase Auth with custom user metadata options
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: password || "user123!",
      options: {
        data: {
          nickname: finalNickname,
          role: role
        }
      }
    });

    if (authError) {
      // Clean display translation
      if (authError.message.includes("User already registered") || authError.message.toLowerCase().includes("already registered")) {
        throw new Error("이미 생성된 메일 주소입니다.");
      }
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error("Supabase Auth 계정 생성에 오류가 있습니다.");
    }

    const userId = authData.user.id;

    // 2) Write user record to our public.users mapping database table (Fallback manual sync)
    try {
      const userPayload: any = {
        id: userId,
        email,
        nickname: finalNickname,
        role
      };
      
      // If password field is required by legacy schemas, we include it, otherwise trigger can drop it if nullable
      if (password) {
        userPayload.password = password;
      } else {
        userPayload.password = "user123!";
      }

      const { error: insertError } = await supabase
        .from("users")
        .upsert([userPayload], { onConflict: "id" });

      if (insertError) {
        console.error("Failed manual sync profile to public.users table (might be handled by trigger instead):", insertError.message);
      } else {
        console.log("Successfully ran manual fallback profile sync to public.users for user:", userId);
      }
    } catch (profileErr: any) {
      console.error("Dynamic sync profile catch error:", profileErr.message);
    }

    // Check if email confirmation is required (session will be null if e-mail confirmation is enabled)
    const isUnconfirmed = !authData.session;
    return {
      user: {
        id: userId,
        email,
        nickname: finalNickname,
        role,
      },
      emailConfirmationRequired: isUnconfirmed
    };
  } else {
    // Local fallback database flow
    const db = loadLocalDb();
    if (db.users.some(u => u.email === email)) {
      throw new Error("이미 존재하는 이메일 계정입니다.");
    }

    const localUser: DbUser = {
      id: `user_${Date.now()}`,
      email,
      password: password || "user123",
      nickname: finalNickname,
      role
    };

    db.users.push(localUser);
    saveLocalDb(db);

    return {
      user: localUser,
      emailConfirmationRequired: false
    };
  }
}

export async function signInWithAuth(
  email: string,
  password?: string
): Promise<AuthResult> {
  const pwd = password || "";

  if (supabaseEnabled && supabase) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: pwd,
    });

    if (authError) {
      // Check for specific confirmation warning message
      if (authError.message.toLowerCase().includes("email not confirmed") || authError.status === 400 && authError.message.toLowerCase().includes("confirm")) {
        throw new Error("이메일 가입 승인 검증이 완료되지 않았습니다. 전송된 이메일 메일함의 가입 인증 주소를 클릭해 주셔요.");
      }
      throw new Error("이메일 주소 또는 암호가 유효하지 않습니다: " + authError.message);
    }

    if (!authData.user) {
      throw new Error("인증 기록이 유효하지 않습니다.");
    }

    // Fetch user profile info from public.users table or automatically sync if missing
    let userProfile = await findUserById(authData.user.id);
    if (!userProfile) {
      // Dynamic profile sync-healing
      console.log(`Dynamic recovery profile syncing for user ${authData.user.id}`);
      const fallbackNickname = email.split("@")[0];
      try {
        const { data: profile, error } = await supabase
          .from("users")
          .insert([{
            id: authData.user.id,
            email,
            password: pwd,
            nickname: fallbackNickname,
            role: "User"
          }])
          .select()
          .single();

        if (!error && profile) {
          userProfile = profile as DbUser;
        }
      } catch (_) {}
    }

    return {
      user: userProfile || {
        id: authData.user.id,
        email,
        nickname: email.split("@")[0],
        role: "User"
      },
      emailConfirmationRequired: false
    };
  } else {
    // Local DB fallback processing
    const db = loadLocalDb();
    const matched = db.users.find(u => u.email === email && u.password === pwd);
    if (!matched) {
      throw new Error("이메일 또는 비밀번호가 일치하지 않습니다.");
    }

    return {
      user: matched,
      emailConfirmationRequired: false
    };
  }
}

// Low-db Local File IO Helpers
function loadLocalDb(): LocalSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2), "utf-8");
    return defaultDb;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Local database read failed, returning defaults:", err);
    return defaultDb;
  }
}

function saveLocalDb(data: LocalSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Local database save failed:", err);
  }
}

// Unified Database Access Layer (Supabase with Local Heuristic Fallback)

// 1. Fetch user profile by ID
export async function findUserById(id: string): Promise<DbUser | null> {
  if (supabaseEnabled && supabase) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        if (error.code === "PGRST116") return null; // No rows found
        throw error;
      }
      return data as DbUser;
    } catch (err: any) {
      console.error("Supabase findUserById failed. Falling back to local.", err.message);
    }
  }

  const db = loadLocalDb();
  return db.users.find((u) => u.id === id) || null;
}

// 2. Fetch user profile by Email
export async function findUserByEmail(email: string): Promise<DbUser | null> {
  if (supabaseEnabled && supabase) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();
      if (error) {
        if (error.code === "PGRST116") return null; // No rows found
        throw error;
      }
      return data as DbUser;
    } catch (err: any) {
      console.error("Supabase findUserByEmail failed. Falling back to local.", err.message);
    }
  }

  const db = loadLocalDb();
  return db.users.find((u) => u.email === email) || null;
}

// 3. Register / Create User
export async function createUser(user: DbUser): Promise<DbUser> {
  if (supabaseEnabled && supabase) {
    try {
      const { data, error } = await supabase
        .from("users")
        .insert([{
          id: user.id,
          email: user.email,
          password: user.password,
          nickname: user.nickname,
          role: user.role
        }])
        .select()
        .single();
      if (error) throw error;
      return data as DbUser;
    } catch (err: any) {
      console.error("Supabase createUser failed. Saving locally.", err.message);
    }
  }

  const db = loadLocalDb();
  // Ensure email uniqueness locally
  if (db.users.some(u => u.email === user.email)) {
    throw new Error("이미 존재하는 이메일 계정입니다.");
  }
  db.users.push(user);
  saveLocalDb(db);
  return user;
}

// 3b. Fetch all users from both auth.users (via admin API) and public.users mapping
export async function findAllUsers(): Promise<DbUser[]> {
  if (supabaseEnabled && supabase) {
    try {
      // Fetch user profile mappings
      const { data: publicUsers, error: publicUsersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (publicUsersError) {
        console.warn("Error fetching public.users mapping:", publicUsersError.message);
      }

      // Query live auth database using admin key to pull current authorization metadata
      try {
        const { data: authUsersData, error: authUsersError } = await supabase.auth.admin.listUsers();
        if (!authUsersError && authUsersData?.users) {
          const mergedUsers: DbUser[] = authUsersData.users.map((au) => {
            const match = publicUsers?.find((pu: any) => pu.id === au.id);
            return {
              id: au.id,
              email: au.email || "",
              nickname: match?.nickname || au.user_metadata?.nickname || au.email?.split("@")[0] || "미확인 사용자",
              role: (match?.role || au.user_metadata?.role || "User") as "User" | "Admin",
              created_at: au.created_at || match?.created_at
            };
          });
          return mergedUsers;
        }
      } catch (authErr: any) {
        console.warn("auth.admin.listUsers failed (possibly missing or local permissions):", authErr.message);
      }

      // If auth.admin.listUsers fails or isn't accessible, return the public.users records directly
      if (publicUsers && publicUsers.length > 0) {
        return publicUsers as DbUser[];
      }
    } catch (err: any) {
      console.error("Supabase findAllUsers failed. Falling back to local.", err.message);
    }
  }

  const db = loadLocalDb();
  return [...db.users].reverse();
}

// 4. Fetch ideas connected to a specific citizen
export async function findIdeasByUserId(userId: string): Promise<DbIdea[]> {
  if (supabaseEnabled && supabase) {
    try {
      // Fetch user_ideas mappings
      const { data: mappings, error: mappingError } = await supabase
        .from("user_ideas")
        .select("idea_id")
        .eq("user_id", userId);
      
      if (mappingError) throw mappingError;

      if (!mappings || mappings.length === 0) {
        return [];
      }

      const ideaIds = mappings.map((m: any) => m.idea_id);

      // Fetch actual idea records matching those IDs
      const { data: ideas, error: ideasError } = await supabase
        .from("ideas")
        .select("*")
        .in("id", ideaIds)
        .order("created_at", { ascending: false });

      if (ideasError) throw ideasError;
      return ideas as DbIdea[];
    } catch (err: any) {
      console.error("Supabase findIdeasByUserId failed. Falling back to local.", err.message);
    }
  }

  const db = loadLocalDb();
  const ideaIds = db.user_ideas
    .filter((mapping) => mapping.user_id === userId)
    .map((mapping) => mapping.idea_id);
    
  return db.ideas.filter((idea) => ideaIds.includes(idea.id));
}

// 5. Fetch all ideas (Anonymously, for Admin Dashboard)
export async function findAllIdeas(): Promise<DbIdea[]> {
  if (supabaseEnabled && supabase) {
    try {
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DbIdea[];
    } catch (err: any) {
      console.error("Supabase findAllIdeas failed. Falling back to local.", err.message);
    }
  }

  const db = loadLocalDb();
  return db.ideas;
}

// 5b. Fetch single idea by ID
export async function findIdeaById(ideaId: string): Promise<DbIdea | null> {
  if (supabaseEnabled && supabase) {
    try {
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .eq("id", ideaId)
        .maybeSingle();
      if (error) throw error;
      return data as DbIdea | null;
    } catch (err: any) {
      console.error("Supabase findIdeaById failed. Falling back to local.", err.message);
    }
  }

  const db = loadLocalDb();
  const idea = db.ideas.find((i) => i.id === ideaId);
  return idea || null;
}

// 6. Submit a new Anonymized Idea with private mapping
export async function createIdea(idea: DbIdea, userId: string): Promise<DbIdea> {
  if (supabaseEnabled && supabase) {
    try {
      // 1. Insert global anonymous idea
      const { error: ideaError } = await supabase
        .from("ideas")
        .insert([{
          id: idea.id,
          title: idea.title,
          content: idea.content,
          category: idea.category,
          status: idea.status,
          summary: idea.summary,
          similarity_flag: idea.similarity_flag,
          similarity_score: idea.similarity_score,
          similar_to_title: idea.similar_to_title,
          attachments: idea.attachments,
          admin_notes: idea.admin_notes,
          created_at: idea.created_at,
          history: idea.history || []
        }]);

      if (ideaError) throw ideaError;

      // 2. Insert user mapping
      const { error: mapError } = await supabase
        .from("user_ideas")
        .insert([{
          user_id: userId,
          idea_id: idea.id
        }]);

      if (mapError) throw mapError;

      return idea;
    } catch (err: any) {
      console.error("Supabase createIdea failed. Saving locally.", err.message);
    }
  }

  const db = loadLocalDb();
  db.ideas.push(idea);
  db.user_ideas.push({
    user_id: userId,
    idea_id: idea.id
  });
  saveLocalDb(db);
  return idea;
}

// 7. Update Idea Status and Officer Notes (Admin)
export async function updateIdeaStatus(id: string, status: string, admin_notes?: string, updated_by_nickname?: string): Promise<DbIdea> {
  if (supabaseEnabled && supabase) {
    try {
      // First fetch current idea to get existing history
      const { data: currentIdea, error: fetchErr } = await supabase
        .from("ideas")
        .select("*")
        .eq("id", id)
        .single();
      
      let historyList = [];
      if (!fetchErr && currentIdea) {
        historyList = Array.isArray((currentIdea as any).history) ? (currentIdea as any).history : [];
      }

      const newItem = {
        id: `hist-${Date.now()}`,
        status: status,
        admin_notes: admin_notes || "",
        updated_at: new Date().toISOString(),
        updated_by_nickname: updated_by_nickname || "시정 담당공무원"
      };
      
      const updatedHistory = [...historyList, newItem];

      const updates: any = {};
      if (status) updates.status = status;
      if (admin_notes !== undefined) updates.admin_notes = admin_notes;
      updates.history = updatedHistory;

      const { data, error } = await supabase
        .from("ideas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as DbIdea;
    } catch (err: any) {
      console.error("Supabase updateIdeaStatus failed. Saving locally.", err.message);
    }
  }

  const db = loadLocalDb();
  const idea = db.ideas.find((i) => i.id === id);
  if (!idea) {
    throw new Error("아이디어를 찾을 수 없습니다.");
  }

  if (!idea.history) {
    idea.history = [];
  }

  const newItem = {
    id: `hist-${Date.now()}`,
    status: status as any,
    admin_notes: admin_notes || "",
    updated_at: new Date().toISOString(),
    updated_by_nickname: updated_by_nickname || "시정 담당공무원"
  };

  idea.history.push(newItem);

  if (status) idea.status = status as any;
  if (admin_notes !== undefined) idea.admin_notes = admin_notes;
  saveLocalDb(db);
  return idea;
}

// 7.2 Add citizen comment or dialog history response
export async function addCommentToIdea(id: string, comment: string, authorNickname: string): Promise<DbIdea> {
  if (supabaseEnabled && supabase) {
    try {
      const { data: currentIdea, error: fetchErr } = await supabase
        .from("ideas")
        .select("*")
        .eq("id", id)
        .single();
      
      let historyList = [];
      if (!fetchErr && currentIdea) {
        historyList = Array.isArray((currentIdea as any).history) ? (currentIdea as any).history : [];
      }

      const newItem = {
        id: `hist-${Date.now()}`,
        status: currentIdea ? currentIdea.status : "접수",
        admin_notes: comment,
        updated_at: new Date().toISOString(),
        updated_by_nickname: authorNickname
      };

      const updatedHistory = [...historyList, newItem];

      const { data, error } = await supabase
        .from("ideas")
        .update({ history: updatedHistory })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as DbIdea;
    } catch (err: any) {
      console.error("Supabase addCommentToIdea failed. Saving locally.", err.message);
    }
  }

  const db = loadLocalDb();
  const idea = db.ideas.find((i) => i.id === id);
  if (!idea) {
    throw new Error("아이디어를 찾을 수 없습니다.");
  }

  if (!idea.history) {
    idea.history = [];
  }

  const newItem = {
    id: `hist-${Date.now()}`,
    status: idea.status || "접수",
    admin_notes: comment,
    updated_at: new Date().toISOString(),
    updated_by_nickname: authorNickname
  };

  idea.history.push(newItem);
  saveLocalDb(db);
  return idea;
}

// 8. Find associated mapping for an idea ID
export async function findMappingByIdeaId(ideaId: string): Promise<DbUserIdea | null> {
  if (supabaseEnabled && supabase) {
    try {
      const { data, error } = await supabase
        .from("user_ideas")
        .select("user_id, idea_id")
        .eq("idea_id", ideaId)
        .maybeSingle();

      if (error) throw error;
      return data as DbUserIdea || null;
    } catch (err: any) {
      console.error("Supabase findMappingByIdeaId failed. Falling back to local.", err.message);
    }
  }

  const db = loadLocalDb();
  return db.user_ideas.find((m) => m.idea_id === ideaId) || null;
}

// 9. Fetch notifications for a user ID
export async function findNotificationsByUserId(userId: string): Promise<DbNotification[]> {
  if (supabaseEnabled && supabase) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DbNotification[];
    } catch (err: any) {
      console.error("Supabase findNotificationsByUserId failed. Falling back to local.", err.message);
    }
  }

  const db = loadLocalDb();
  return db.notifications.filter((n) => n.user_id === userId);
}

// 10. Mark all notifications as read
export async function markNotificationsAsRead(userId: string): Promise<boolean> {
  if (supabaseEnabled && supabase) {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error("Supabase markNotificationsAsRead failed. Falling back to local.", err.message);
    }
  }

  const db = loadLocalDb();
  db.notifications.forEach((n) => {
    if (n.user_id === userId) {
      n.is_read = true;
    }
  });
  saveLocalDb(db);
  return true;
}

// 11. Create a notification
export async function createNotification(notif: DbNotification): Promise<DbNotification> {
  if (supabaseEnabled && supabase) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert([notif])
        .select()
        .single();

      if (error) throw error;
      return data as DbNotification;
    } catch (err: any) {
      console.error("Supabase createNotification failed. Saving locally.", err.message);
    }
  }

  const db = loadLocalDb();
  db.notifications.push(notif);
  saveLocalDb(db);
  return notif;
}

// 12. Delete an Anonymized Idea and its user mapping
export async function deleteIdea(ideaId: string): Promise<boolean> {
  let deletedLocally = false;
  
  // Safe Fallback: Always delete from local JSON database to keep high-fidelity local state clean
  try {
    const db = loadLocalDb();
    db.ideas = db.ideas.filter((i) => i.id !== ideaId);
    db.user_ideas = db.user_ideas.filter((m) => m.idea_id !== ideaId);
    saveLocalDb(db);
    deletedLocally = true;
  } catch (localErr: any) {
    console.error("Local DB cleanup failed:", localErr.message);
  }

  if (supabaseEnabled && supabase) {
    try {
      // Delete user mapping
      const { error: mapError } = await supabase
        .from("user_ideas")
        .delete()
        .eq("idea_id", ideaId);
      if (mapError) throw mapError;

      // Delete idea
      const { error: ideaError } = await supabase
        .from("ideas")
        .delete()
        .eq("id", ideaId);
      if (ideaError) throw ideaError;

      return true;
    } catch (err: any) {
      console.error("Supabase deleteIdea failed but local cleaning ran.", err.message);
      return deletedLocally;
    }
  }

  return deletedLocally;
}
