-- ============================================================
-- GyAR Barbershop — Safe Reset + Install
-- Ejecuta esto en Supabase SQL Editor si ya existían tablas
-- ============================================================

-- 1. Borrar tablas existentes (en orden por dependencias)
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.blocked_slots CASCADE;
DROP TABLE IF EXISTS public.haircuts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Borrar funciones y triggers existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_barber();

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role              TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('barber', 'client')),
  email             TEXT,
  name              TEXT,
  university_grade  TEXT,
  dorm_resident     BOOLEAN DEFAULT FALSE,
  penalty_fee       INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- HAIRCUTS CATALOG
-- ============================================================
CREATE TABLE public.haircuts (
  id          BIGSERIAL PRIMARY KEY,
  name        JSONB NOT NULL,
  image_url   TEXT,
  description JSONB,
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.haircuts (name, image_url, description) VALUES
(
  '{"ko":"가위 클래식","en":"Classic Scissors","de":"Klassischer Schnitt","fr":"Coupe Classique","ru":"Классические ножницы","es":"Tijera Clásica"}',
  '/haircuts/tijera_clasica.jpg',
  '{"ko":"깔끔하고 자연스러운 가위 컷. 모든 헤어 타입에 적합합니다.","en":"Clean and natural scissors cut. Suitable for all hair types.","de":"Sauberer und natürlicher Scherenschnitt.","fr":"Coupe aux ciseaux propre et naturelle.","ru":"Чистая и естественная стрижка ножницами.","es":"Corte limpio y natural con tijera."}'
),
(
  '{"ko":"멀렛","en":"Mullet","de":"Vokuhila","fr":"Nuque longue","ru":"Малле́т","es":"Mullet"}',
  '/haircuts/mullet.jpg',
  '{"ko":"앞은 짧고 뒤는 긴 트렌디한 스타일. K-pop 감성.","en":"Short in front, long in the back. Trendy K-pop vibes.","de":"Vorne kurz, hinten lang. Trendiger K-Pop Stil.","fr":"Court devant, long derrière. Tendance K-pop.","ru":"Короткий спереди, длинный сзади.","es":"Corto por delante, largo por detrás."}'
),
(
  '{"ko":"페이드","en":"Fade","de":"Fade","fr":"Fondu","ru":"Фейд","es":"Fade"}',
  '/haircuts/fade.jpg',
  '{"ko":"옆면을 깔끔하게 정리한 스킨 페이드.","en":"Clean skin fade on the sides. Sleek streetwear aesthetic.","de":"Sauberer Skin Fade an den Seiten.","fr":"Fondu skin sur les côtés.","ru":"Чистый скин-фейд по бокам.","es":"Fade en los lados limpio y definido."}'
),
(
  '{"ko":"버즈컷","en":"Buzz Cut","de":"Bürstenschnitt","fr":"Coupe brosse","ru":"Бакс Кат","es":"Buzz Cut"}',
  '/haircuts/buzz_cut.jpg',
  '{"ko":"균일하고 짧게 깎는 스타일. 관리가 매우 쉽습니다.","en":"Uniformly short all around. Very easy to maintain.","de":"Gleichmäßig kurz rundum. Sehr pflegeleicht.","fr":"Court et uniforme partout.","ru":"Равномерно короткий по всей голове.","es":"Corte uniforme y muy corto."}'
),
(
  '{"ko":"언더컷","en":"Undercut","de":"Undercut","fr":"Undercut","ru":"Андеркат","es":"Undercut"}',
  '/haircuts/undercut.jpg',
  '{"ko":"옆면을 밀고 위쪽 머리를 길게 유지하는 스타일.","en":"Shaved sides with a long styled top. Sleek and modern.","de":"Rasierte Seiten mit längerem Oberteil.","fr":"Côtés rasés, dessus long et stylé.","ru":"Выбритые стороны с длинной укладкой сверху.","es":"Lados rapados con parte superior larga."}'
),
(
  '{"ko":"투블럭","en":"Two-Block","de":"Two-Block","fr":"Two-Block","ru":"Ту-блок","es":"Two-Block"}',
  '/haircuts/two_block.jpg',
  '{"ko":"아래와 옆면을 짧게 하고 윗머리를 자연스럽게 내려오는 K-스타일.","en":"Classic K-style: shaved underneath, natural longer top falling forward.","de":"Klassischer K-Style: kurz unten, langes natürliches Oberteil.","fr":"Style K classique: rasé en dessous, dessus long et naturel.","ru":"Классический K-стиль.","es":"Estilo K clásico: rapado por debajo."}'
),
(
  '{"ko":"포마도","en":"Pompadour","de":"Pompadour","fr":"Pompadour","ru":"Помпадур","es":"Pompadour"}',
  '/haircuts/pompadour.jpg',
  '{"ko":"앞머리를 위로 빗어 올린 볼륨감 있는 스타일.","en":"Dramatically swept back on top, faded sides. Voluminous and bold.","de":"Dramatisch nach oben und zurück gestylt.","fr":"Cheveux dressés vers le haut. Volumineux.","ru":"Волосы эффектно зачёсаны назад.","es":"Cabello peinado dramáticamente hacia arriba."}'
);

-- ============================================================
-- BLOCKED SLOTS
-- ============================================================
CREATE TABLE public.blocked_slots (
  id      BIGSERIAL PRIMARY KEY,
  date    DATE NOT NULL,
  time    TIME NOT NULL,
  reason  TEXT,
  UNIQUE(date, time)
);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE TABLE public.appointments (
  id               BIGSERIAL PRIMARY KEY,
  client_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  haircut_id       BIGINT REFERENCES public.haircuts(id),
  date             DATE NOT NULL,
  time             TIME NOT NULL,
  haircut_style    TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'completed', 'no-show', 'cancelled')),
  penalty_applied  INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX idx_appointments_date ON public.appointments(date);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.haircuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_barber()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'barber'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
CREATE POLICY "Users can view own profile"       ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"     ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Barbers can view all profiles"    ON public.profiles FOR SELECT USING (public.is_barber());
CREATE POLICY "Barbers can update any profile"   ON public.profiles FOR UPDATE USING (public.is_barber());
CREATE POLICY "Allow profile insert on signup"   ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- HAIRCUTS
CREATE POLICY "Haircuts are publicly readable"   ON public.haircuts FOR SELECT USING (true);
CREATE POLICY "Barbers can manage haircuts"      ON public.haircuts FOR ALL USING (public.is_barber());

-- BLOCKED SLOTS
CREATE POLICY "Authenticated users view blocked" ON public.blocked_slots FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Barbers can manage blocked slots" ON public.blocked_slots FOR ALL USING (public.is_barber());

-- APPOINTMENTS
CREATE POLICY "Clients view own appointments"    ON public.appointments FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Clients can book appointments"    ON public.appointments FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients can cancel own"           ON public.appointments FOR UPDATE USING (auth.uid() = client_id) WITH CHECK (status = 'cancelled');
CREATE POLICY "Barbers can view all"             ON public.appointments FOR SELECT USING (public.is_barber());
CREATE POLICY "Barbers can update appointments"  ON public.appointments FOR UPDATE USING (public.is_barber());
