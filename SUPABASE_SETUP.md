# 🚀 남양주시 스마트 시정 제안 - Supabase 테이블 초기화 가이드

Supabase 백엔드 데이터베이스를 활성화하기 위해 아래 SQL 스크립트를 Supabase SQL Editor에 복사하여 붙여넣고 실행해 주세요.

## 1. Supabase 접속 및 로그인
- 주소: [https://supabase.com](https://supabase.com)
- 제공해주신 계정으로 로그인해 주세요:
  - **ID / Email**: `prawess@gmail.com`
  - **비밀번호**: `@Jason5996`

## 2. SQL 실행 방법
1. Supabase 로그인 후 사용자 프로젝트 대시보드에 진입합니다.
2. 좌측 네비게이션 메뉴 중 **SQL Editor** 아이콘을 클릭합니다.
3. **"+ New query"** 버튼을 눌러 새로운 SQL 플레이그라운드를 엽니다.
4. 아래 SQL 스크립트를 전체 복사해서 붙여넣습니다.
5. 우측 하단의 **"Run" (또는 `Ctrl + Enter`)**을 실행합니다.

---

## 3. 초기화 및 트리거 연동 SQL 스크립트

아래 제공해드리는 최적화 스كري프트를 복사하여 실행해 주셔요. 
가장 큰 변화는 **Supabase Auth 계정 생성 즉시 `public.users` 테이블과 실시간 자동 유동 연합(PostgreSQL Trigger)** 구조가 신규 탑재된 점입니다. 이 트리거를 적용하면 이메일 인증이 진행 중이거나 대기 상태(unconfirmed)일지라도, Supabase 데이터베이스상에서 즉각 가입자 명단과 가이드 프로필이 100% 완전 동기화 표출됩니다!

```sql
-- 1. users 테이블 설정 (비밀번호는 Supabase Auth 보안 관리이므로 public 테이블에서는 컬럼 유연성을 높입니다)
CREATE TABLE IF NOT EXISTS public.users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password text, -- NULL 가능으로 유연하게 설정 (보안 통제)
  nickname text,
  role text DEFAULT 'User',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 기존 테이블이 존재할 경우 대비하여 password 제약 조건 DROP 처리
ALTER TABLE public.users ALTER COLUMN password DROP NOT NULL;

-- 2. ideas 테이블 설정
CREATE TABLE IF NOT EXISTS public.ideas (
  id text PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  status text DEFAULT '접수' NOT NULL,
  summary text,
  similarity_flag boolean DEFAULT false,
  similarity_score integer DEFAULT 0,
  similar_to_title text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  admin_notes text DEFAULT ''
);

-- 3. user_ideas (사이버 보안 매핑 파일) 테이블 설정
CREATE TABLE IF NOT EXISTS public.user_ideas (
  id bigserial PRIMARY KEY,
  user_id text REFERENCES public.users(id) ON DELETE CASCADE,
  idea_id text REFERENCES public.ideas(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. notifications 테이블 설정
CREATE TABLE IF NOT EXISTS public.notifications (
  id text PRIMARY KEY,
  user_id text REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. 기본 개발 테스트 계정 삽입 (선택 사항)
INSERT INTO public.users (id, email, password, nickname, role)
VALUES 
  ('user_1', 'citizen@nyj.go.kr', 'user123', '남양주시민_홍길동', 'User'),
  ('user_2', 'prawess@gmail.com', '!ryujh5996', '시정기획관_황희', 'Admin')
ON CONFLICT (id) DO NOTHING;

-- 6. Row Level Security(RLS) 정책 활성화 및 권한 개방
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 7. 심플 퍼블릭 액세스 정책 설정
CREATE POLICY "Allow all select users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow all insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update users" ON public.users FOR UPDATE USING (true);

CREATE POLICY "Allow all select ideas" ON public.ideas FOR SELECT USING (true);
CREATE POLICY "Allow all insert ideas" ON public.ideas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update ideas" ON public.ideas FOR UPDATE USING (true);

CREATE POLICY "Allow all select user_ideas" ON public.user_ideas FOR SELECT USING (true);
CREATE POLICY "Allow all insert user_ideas" ON public.user_ideas FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all select notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow all insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update notifications" ON public.notifications FOR UPDATE USING (true);

-- =========================================================================
-- ⚡ 8. Supabase Auth ➜ Public.users 실시간 자동 가입 동기화 트리거 구조 탑재 ⚡
-- =========================================================================

-- 새 회원 가입이 auth.users 에 일어날 시, 메타 정보(닉네임, 권한)를 들고 와 public.users 에 동시 밀어넣어주는 함수
CREATE OR REPLACE FUNCTION public.handle_new_auth_user_sync()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, nickname, role, created_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'User'),
    COALESCE(new.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    nickname = COALESCE(EXCLUDED.nickname, public.users.nickname),
    role = COALESCE(EXCLUDED.role, public.users.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 설정 (auth.users 인서트 직후 자동 기동)
DROP TRIGGER IF EXISTS on_auth_user_created_sync ON auth.users;
CREATE TRIGGER on_auth_user_created_sync
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user_sync();
```

---

## 4. 환경 변수 등록 정보
테이블 생성 후, Supabase 대시보드의 **Project Settings ➜ API** 섹션에 있는 키들을 설정하세요:

- `SUPABASE_URL`: 프로젝트 주소 (예: `https://xxxxxx.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (비공개 관리자용 비밀 키)

해당 정보는 AI Studio의 **Secrets** 패널에 등록하여 이용하실 수 있습니다!
*만약 환경변수가 등록되지 않으면 자동으로 안전한 로컬 오프라인 데이터베이스 폴백 시스템(`db.json`)으로 동작합니다.*
