-- ============================================================
-- Dorm's Barbershop — Haircuts Catalog v2
-- Sep 2026 trending styles: European + Korean men, women tips
-- No image_url. Adds "Other" freeform option.
-- ============================================================

-- Unlink existing appointments to avoid foreign key constraint error
UPDATE public.appointments SET haircut_id = NULL;

-- Clear existing catalog
DELETE FROM public.haircuts;

-- ============================================================
-- WOMEN'S CUTS
-- ===================================El =========================
INSERT INTO public.haircuts (name, image_url, description) VALUES

-- Puntas
(
  '{"ko":"끝 다듬기","en":"Trim the Tips","de":"Spitzen schneiden","fr":"Pointes","ru":"Подстрижка кончиков","es":"Puntas"}',
  NULL,
  '{"ko":"끝부분만 가지런히 다듬는 스타일. 모발 건강 유지에 좋습니다.","en":"Just trimming the ends to keep hair healthy and even.","de":"Nur die Spitzen kürzen, für gesundes und gleichmäßiges Haar.","fr":"Juste couper les pointes pour garder les cheveux sains et réguliers.","ru":"Подравнивание кончиков для здоровья волос.","es":"Solo recorte de puntas para mantener el cabello sano y uniforme."}'
),

-- ============================================================
-- MEN'S CUTS — KOREAN TRENDING (Sep 2026)
-- ============================================================

-- 투블럭 (Two-Block)
(
  '{"ko":"투블럭","en":"Two-Block","de":"Two-Block","fr":"Two-Block","ru":"Ту-блок","es":"Two-Block"}',
  NULL,
  '{"ko":"아래와 옆면을 짧게 하고 윗머리를 자연스럽게 내려오는 K-스타일. 2026 스탠다드.","en":"Shaved underneath, natural longer top falling forward. The K-style standard in 2026.","de":"Kurz unten, langes natürliches Oberteil — K-Style 2026.","fr":"Rasé en dessous, dessus long et naturel — le standard K-style 2026.","ru":"Выбрито снизу, натуральная длинная верхушка — K-стиль 2026.","es":"Rapado por debajo, parte superior natural caída. El estándar K-style en 2026."}'
),

-- 멀렛 (K-Mullet)
(
  '{"ko":"K-멀렛","en":"K-Mullet","de":"K-Vokuhila","fr":"K-Nuque longue","ru":"К-Маллет","es":"K-Mullet"}',
  NULL,
  '{"ko":"앞은 짧고 뒤는 길게. 2026 K-pop 아이돌 감성의 트렌디 컷.","en":"Short front, long back with a textured finish. The 2026 K-pop idol cut.","de":"Vorne kurz, hinten lang — trendiger K-Pop Schnitt 2026.","fr":"Court devant, long derrière — la coupe K-pop 2026.","ru":"Короткий спереди, длинный сзади — модный K-pop стиль 2026.","es":"Corto por delante, largo por detrás. El corte K-pop de 2026."}'
),

-- 쉐기 (Shaggy / Wolf Cut)
(
  '{"ko":"쉐기 / 울프컷","en":"Shaggy / Wolf Cut","de":"Shaggy / Wolf Cut","fr":"Wolf Cut","ru":"Вулф-кат","es":"Wolf Cut / Shaggy"}',
  NULL,
  '{"ko":"층이 많고 텍스처가 풍부한 레이어드 컷. 자연스러운 무드.","en":"Heavy layers, textured ends, natural lived-in feel. Very trendy in 2026.","de":"Viele Schichten, texturierte Enden — natürlicher Look 2026.","fr":"Beaucoup de couches, finitions texturées — tendance 2026.","ru":"Объёмные слои, текстурные концы — тренд 2026.","es":"Muchas capas y textura. Muy tendencia en 2026."}'
),

-- 댄디 컷 (Dandy)
(
  '{"ko":"댄디컷","en":"Dandy Cut","de":"Dandy Schnitt","fr":"Coupe Dandy","ru":"Денди-кат","es":"Corte Dandy"}',
  NULL,
  '{"ko":"깔끔하게 옆을 정리하고 위를 자연스럽게 넘긴 클래식 스타일.","en":"Clean sides, natural sweep on top. A timeless Korean classic.","de":"Saubere Seiten, natürlicher Seitenscheitel — koreanischer Klassiker.","fr":"Côtés nets, dessus peigné naturellement — classique coréen.","ru":"Чистые стороны, натуральная укладка сверху — корейская классика.","es":"Lados limpios, parte superior peinada de forma natural."}'
),

-- 포마도 컷 (Pompadour K-style)
(
  '{"ko":"K-포마도","en":"K-Pompadour","de":"K-Pompadour","fr":"Pompadour Coréen","ru":"К-Помпадур","es":"K-Pompadour"}',
  NULL,
  '{"ko":"한국식으로 재해석한 포마드 스타일. 볼륨감 있는 앞머리.","en":"Korean twist on the classic pompadour. Voluminous styled front.","de":"Koreanische Version des klassischen Pompadours mit Volumen.","fr":"Version coréenne du pompadour classique. Dessus volumineux.","ru":"Корейская версия классического помпадура с объёмом.","es":"Versión coreana del pompadour clásico con volumen."}'
),

-- ============================================================
-- MEN'S CUTS — EUROPEAN TRENDING (Sep 2026)
-- ============================================================

-- Textured Crop
(
  '{"ko":"텍스처드 크롭","en":"Textured Crop","de":"Textured Crop","fr":"Coupe texturée","ru":"Текстурный кроп","es":"Crop Texturizado"}',
  NULL,
  '{"ko":"짧고 텍스처가 풍부한 크롭 스타일. 유럽에서 가장 대중적인 2026 컷.","en":"Short, textured top with a drop fade. The most popular European cut of 2026.","de":"Kurz, texturiert mit Drop Fade — der beliebteste europäische Schnitt 2026.","fr":"Court et texturé avec drop fade — la coupe européenne la plus populaire en 2026.","ru":"Короткий текстурный кроп с дроп-фейдом — самая популярная европейская стрижка 2026.","es":"Corto y texturizado con drop fade. El corte europeo más popular de 2026."}'
),

-- Skin Fade
(
  '{"ko":"스킨 페이드","en":"Skin Fade","de":"Skin Fade","fr":"Fondu skin","ru":"Скин-фейд","es":"Skin Fade"}',
  NULL,
  '{"ko":"피부까지 밀어 올리는 그라데이션 페이드. 깔끔하고 선명한 라인.","en":"Faded down to the skin for a clean, sharp silhouette.","de":"Bis auf die Haut ausgeblendet — saubere, präzise Silhouette.","fr":"Fondu jusqu''à la peau pour une silhouette nette et précise.","ru":"Выбривание до кожи — чёткий, чистый силуэт.","es":"Fade hasta la piel para una silueta limpia y definida."}'
),

-- Mid Fade + Textured Top
(
  '{"ko":"미드 페이드 + 텍스처","en":"Mid Fade + Texture","de":"Mid Fade + Textur","fr":"Mid Fade + Texture","ru":"Мид-фейд + текстура","es":"Mid Fade + Textura"}',
  NULL,
  '{"ko":"중간 높이 페이드에 위쪽 텍스처를 살린 밸런스 잡힌 컷.","en":"Mid fade with textured top. Balanced, versatile and very trendy in Europe 2026.","de":"Mid Fade mit texturiertem Oberteil — ausgewogen und vielseitig, Trend 2026.","fr":"Mid fade avec dessus texturé — équilibré et polyvalent, tendance Europe 2026.","ru":"Мид-фейд с текстурной верхушкой — сбалансированный тренд Европы 2026.","es":"Mid fade con parte superior texturizada. Equilibrado y muy trendy en Europa 2026."}'
),

-- Buzz Cut
(
  '{"ko":"버즈컷","en":"Buzz Cut","de":"Bürstenschnitt","fr":"Coupe brosse","ru":"Бакс Кат","es":"Buzz Cut"}',
  NULL,
  '{"ko":"균일하고 짧게 깎는 스타일. 관리가 매우 쉽습니다.","en":"Uniformly short all around. Zero-maintenance and timeless.","de":"Gleichmäßig kurz rundum. Pflegeleicht und zeitlos.","fr":"Court et uniforme partout. Sans entretien et intemporel.","ru":"Равномерно короткий по всей голове. Минимум ухода, максимум стиля.","es":"Corte uniforme y muy corto. Sin mantenimiento y atemporal."}'
),

-- French Crop
(
  '{"ko":"프렌치 크롭","en":"French Crop","de":"French Crop","fr":"French Crop","ru":"Французский кроп","es":"French Crop"}',
  NULL,
  '{"ko":"앞머리를 이마까지 내리고 옆을 짧게 정리한 클래식 유럽 스타일.","en":"Short fringe over the forehead, clean sides. A European barbershop staple.","de":"Kurze Fransen über der Stirn, saubere Seiten — europäischer Barbershop-Klassiker.","fr":"Frange courte sur le front, côtés nets — un classique du barbershop européen.","ru":"Короткая чёлка на лоб, чистые стороны — классика европейского барбершопа.","es":"Flequillo corto sobre la frente, lados limpios. Clásico del barbershop europeo."}'
),

-- Undercut
(
  '{"ko":"언더컷","en":"Undercut","de":"Undercut","fr":"Undercut","ru":"Андеркат","es":"Undercut"}',
  NULL,
  '{"ko":"옆면을 밀고 위쪽 머리를 길게 유지하는 스타일.","en":"Shaved sides with a longer styled top. Sleek, modern and sharp.","de":"Rasierte Seiten mit längerem Oberteil — elegant und modern.","fr":"Côtés rasés, dessus long et stylé — élégant et moderne.","ru":"Выбритые стороны с длинной укладкой сверху — элегантно и современно.","es":"Lados rapados con parte superior larga. Elegante y moderno."}'
),

-- Burst Fade
(
  '{"ko":"버스트 페이드","en":"Burst Fade","de":"Burst Fade","fr":"Burst Fade","ru":"Бёрст-фейд","es":"Burst Fade"}',
  NULL,
  '{"ko":"귀 주변을 반원형으로 페이드하는 스타일. 2026 유럽 바버샵 트렌드.","en":"Semicircular fade around the ear. A standout barbershop trend in Europe 2026.","de":"Halbkreisförmiger Fade um das Ohr — Trend in europäischen Barbershops 2026.","fr":"Fondu semi-circulaire autour de l''oreille — tendance barbershop Europe 2026.","ru":"Полукруглый фейд вокруг уха — тренд европейских барбершопов 2026.","es":"Fade semicircular alrededor de la oreja. Tendencia en barbershops europeos 2026."}'
),

-- Slick Back
(
  '{"ko":"슬릭백","en":"Slick Back","de":"Slick Back","fr":"Slick Back","ru":"Слик-бэк","es":"Slick Back"}',
  NULL,
  '{"ko":"머리를 뒤로 깔끔하게 넘기는 클래식 스타일. 포마드 또는 왁스로 마무리.","en":"Hair swept cleanly back with pomade or wax. Polished and professional.","de":"Haar glatt nach hinten gekämmt mit Pomade — poliert und professionell.","fr":"Cheveux peignés en arrière avec brillantine — soigné et professionnel.","ru":"Волосы зачёсаны назад с помадой — аккуратно и профессионально.","es":"Cabello peinado hacia atrás con pomada. Pulido y profesional."}'
),

-- ============================================================
-- OTHER (freeform)
-- ============================================================
(
  '{"ko":"기타 (직접 입력)","en":"Other (specify)","de":"Sonstiges (angeben)","fr":"Autre (préciser)","ru":"Другое (указать)","es":"Otro (especificar)"}',
  NULL,
  '{"ko":"원하는 스타일을 직접 설명해 주세요.","en":"Describe the style you want in your own words.","de":"Beschreiben Sie den gewünschten Stil in eigenen Worten.","fr":"Décrivez le style souhaité avec vos propres mots.","ru":"Опишите желаемый стиль своими словами.","es":"Describe el estilo que quieres con tus propias palabras."}'
);
