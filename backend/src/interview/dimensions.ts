export type DimensionId = 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7' | 'D8' | 'D9' | 'D10';
export type Language = 'ru' | 'en' | 'tr';

export interface Dimension {
  id: DimensionId;
  /** Short label per language */
  label: Record<Language, string>;
  /** What signals to collect */
  focus: Record<Language, string>;
  /** Opening question per language */
  openingQuestion: Record<Language, string>;
  /** Min turns before moving on */
  minTurns: number;
  /** Max turns before forcing transition */
  maxTurns: number;
}

export const DIMENSIONS: Dimension[] = [
  {
    id: 'D1',
    label: { ru: 'Смысл и гордость', en: 'Meaning & Pride', tr: 'Anlam ve Gurur' },
    focus: {
      ru: 'Что человеку важно в работе, чем гордится, что даёт ощущение смысла',
      en: 'What matters to the person at work, what they are proud of, what gives a sense of meaning',
      tr: 'Kişinin işte neye önem verdiği, neyle gurur duyduğu, anlam hissi veren şeyler',
    },
    openingQuestion: {
      ru: 'Расскажи — был ли за последнее время момент на работе, когда ты почувствовал, что делаешь что-то важное? Что это было?',
      en: 'Tell me — was there a moment recently at work when you felt you were doing something meaningful? What was it?',
      tr: 'Anlat bakalım — son zamanlarda işte önemli bir şey yaptığını hissettiğin bir an oldu mu? Ne oldu?',
    },
    minTurns: 2,
    maxTurns: 4,
  },
  {
    id: 'D2',
    label: { ru: 'Нагрузка', en: 'Workload', tr: 'İş Yükü' },
    focus: {
      ru: 'Физическая и ментальная нагрузка, темп, дедлайны, ощущение перегруза или недозагруза',
      en: 'Physical and mental load, pace, deadlines, feeling of overload or underload',
      tr: 'Fiziksel ve zihinsel yük, tempo, son tarihler, aşırı veya yetersiz yüklenme hissi',
    },
    openingQuestion: {
      ru: 'Как сейчас с нагрузкой — есть ощущение, что работы слишком много, или наоборот?',
      en: 'How is the workload right now — does it feel like too much, or the opposite?',
      tr: 'Şu an iş yükü nasıl — çok fazla gibi mi hissettiriyor, yoksa tam tersi mi?',
    },
    minTurns: 2,
    maxTurns: 4,
  },
  {
    id: 'D3',
    label: { ru: 'Признание', en: 'Recognition', tr: 'Takdir' },
    focus: {
      ru: 'Чувствует ли человек, что его вклад замечают и ценят — руководство, коллеги',
      en: 'Whether the person feels their contribution is noticed and valued — by management, colleagues',
      tr: 'Kişinin katkısının fark edilip değer gördüğünü hissedip hissetmediği — yönetim, meslektaşlar',
    },
    openingQuestion: {
      ru: 'Когда ты делаешь что-то хорошо — это замечают? Как это обычно выглядит?',
      en: 'When you do something well — does anyone notice? What does that usually look like?',
      tr: 'İyi bir şey yaptığında — biri fark ediyor mu? Bu genellikle nasıl görünüyor?',
    },
    minTurns: 2,
    maxTurns: 4,
  },
  {
    id: 'D4',
    label: { ru: 'Руководство', en: 'Management', tr: 'Yönetim' },
    focus: {
      ru: 'Отношения с руководителем: поддержка, ясность задач, доверие, обратная связь',
      en: 'Relationship with manager: support, task clarity, trust, feedback',
      tr: 'Yöneticiyle ilişki: destek, görev netliği, güven, geri bildirim',
    },
    openingQuestion: {
      ru: 'Как у тебя с руководителем — чувствуешь поддержку, или скорее предоставлен сам себе?',
      en: 'How is it with your manager — do you feel supported, or mostly left on your own?',
      tr: 'Yöneticinizle nasıl — desteklendiğinizi mi hissediyorsunuz, yoksa çoğunlukla kendi başınıza mı bırakılıyorsunuz?',
    },
    minTurns: 2,
    maxTurns: 4,
  },
  {
    id: 'D5',
    label: { ru: 'Коллеги', en: 'Colleagues', tr: 'Meslektaşlar' },
    focus: {
      ru: 'Атмосфера в команде, доверие, конфликты, взаимопомощь',
      en: 'Team atmosphere, trust, conflicts, mutual support',
      tr: 'Ekip atmosferi, güven, çatışmalar, karşılıklı destek',
    },
    openingQuestion: {
      ru: 'Расскажи про команду — как вы между собой, есть ощущение, что можно опереться на коллег?',
      en: 'Tell me about the team — how do you get along, do you feel you can rely on your colleagues?',
      tr: 'Ekipten bahset — aranız nasıl, meslektaşlarınıza güvenebileceğinizi hissediyor musunuz?',
    },
    minTurns: 2,
    maxTurns: 4,
  },
  {
    id: 'D6',
    label: { ru: 'Рост', en: 'Growth', tr: 'Gelişim' },
    focus: {
      ru: 'Возможности для развития, обучения, карьерного роста, ощущение стагнации или движения',
      en: 'Opportunities for development, learning, career growth, feeling of stagnation or progress',
      tr: 'Gelişim, öğrenme, kariyer büyümesi için fırsatlar, durgunluk veya ilerleme hissi',
    },
    openingQuestion: {
      ru: 'Чувствуешь, что растёшь профессионально — или скорее топчешься на месте?',
      en: 'Do you feel like you are growing professionally — or more like standing still?',
      tr: 'Profesyonel olarak büyüdüğünüzü hissediyor musunuz — yoksa daha çok yerinde mi sayıyorsunuz?',
    },
    minTurns: 2,
    maxTurns: 4,
  },
  {
    id: 'D7',
    label: { ru: 'Баланс', en: 'Balance', tr: 'Denge' },
    focus: {
      ru: 'Баланс работы и личной жизни, сон, восстановление, граница между работой и домом',
      en: 'Work-life balance, sleep, recovery, boundary between work and home',
      tr: 'İş-yaşam dengesi, uyku, toparlanma, iş ve ev arasındaki sınır',
    },
    openingQuestion: {
      ru: 'Как ты восстанавливаешься после работы — удаётся отключиться, или работа идёт домой?',
      en: 'How do you recover after work — can you switch off, or does work follow you home?',
      tr: 'İşten sonra nasıl toparlanıyorsunuz — kafayı dağıtabiliyor musunuz, yoksa iş eve mi geliyor?',
    },
    minTurns: 2,
    maxTurns: 4,
  },
  {
    id: 'D8',
    label: { ru: 'Голос', en: 'Voice', tr: 'Ses' },
    focus: {
      ru: 'Может ли человек высказываться, влиять на решения, чувствует ли, что его слышат',
      en: 'Whether the person can speak up, influence decisions, feels heard',
      tr: 'Kişinin konuşup konuşamadığı, kararlara etki edip edemediği, duyulduğunu hissedip hissetmediği',
    },
    openingQuestion: {
      ru: 'Если у тебя есть идея или что-то не нравится — есть ли возможность это сказать? Что обычно происходит?',
      en: 'If you have an idea or something bothers you — is there a way to say it? What usually happens?',
      tr: 'Bir fikriniz varsa veya bir şey sizi rahatsız ediyorsa — bunu söyleme imkânınız var mı? Genellikle ne oluyor?',
    },
    minTurns: 2,
    maxTurns: 4,
  },
  {
    id: 'D9',
    label: { ru: 'Препятствия', en: 'Obstacles', tr: 'Engeller' },
    focus: {
      ru: 'Что мешает работать эффективно: процессы, инструменты, люди, бюрократия',
      en: 'What prevents working effectively: processes, tools, people, bureaucracy',
      tr: 'Etkili çalışmayı engelleyen şeyler: süreçler, araçlar, insanlar, bürokrasi',
    },
    openingQuestion: {
      ru: 'Что сейчас больше всего мешает тебе работать так, как хочется?',
      en: 'What is getting in the way of working the way you want to right now?',
      tr: 'Şu an istediğiniz gibi çalışmanızın önünde en çok ne var?',
    },
    minTurns: 2,
    maxTurns: 4,
  },
  {
    id: 'D10',
    label: { ru: 'Общее', en: 'Overall', tr: 'Genel' },
    focus: {
      ru: 'Общее ощущение от работы, что хотелось бы изменить, что остаётся',
      en: 'Overall feeling about work, what they would like to change, what keeps them',
      tr: 'İş hakkında genel his, değiştirmek istedikleri, onları tutan şeyler',
    },
    openingQuestion: {
      ru: 'Если в целом — что сейчас держит тебя на этой работе, и что хотелось бы изменить?',
      en: 'Overall — what keeps you at this job right now, and what would you like to change?',
      tr: 'Genel olarak — sizi şu an bu işte tutan ne, ve ne değiştirmek isterdiniz?',
    },
    minTurns: 2,
    maxTurns: 5,
  },
];

export const DIMENSION_MAP = new Map<DimensionId, Dimension>(
  DIMENSIONS.map((d) => [d.id, d])
);

export const DIMENSION_ORDER: DimensionId[] = DIMENSIONS.map((d) => d.id);

export function getNextDimension(current: DimensionId): DimensionId | null {
  const idx = DIMENSION_ORDER.indexOf(current);
  return idx < DIMENSION_ORDER.length - 1 ? DIMENSION_ORDER[idx + 1] : null;
}
