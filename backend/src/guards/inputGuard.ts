import { Language } from '../interview/dimensions';

export type GuardResult =
  | { ok: true }
  | { ok: false; reason: GuardReason; response: string };

export type GuardReason =
  | 'wrong_language'
  | 'garbage_input'
  | 'emoji_only'
  | 'too_long'
  | 'manipulation_attempt'
  | 'off_topic_hard'
  | 'refusal';

// ─── Language detection ───────────────────────────────────────────────────────

const CYRILLIC = /[\u0400-\u04FF]/;
const LATIN = /[a-zA-Z]/;
const TURKISH_SPECIFIC = /[çğışöüÇĞİŞÖÜ]/;

/** Very lightweight language detector based on script/char presence */
export function detectScript(text: string): 'ru' | 'en' | 'tr' | 'mixed' | 'unknown' {
  const hasCyrillic = CYRILLIC.test(text);
  const hasTurkish = TURKISH_SPECIFIC.test(text);
  const hasLatin = LATIN.test(text);

  if (hasCyrillic && !hasLatin) return 'ru';
  if (hasTurkish) return 'tr';
  if (hasLatin && !hasCyrillic) return 'en';
  if (hasCyrillic && hasLatin) return 'mixed';
  return 'unknown';
}

// ─── Manipulation patterns ────────────────────────────────────────────────────

const MANIPULATION_PATTERNS = [
  /ignore (all |previous |your )?(instructions?|rules?|prompt)/i,
  /forget (everything|all|your instructions)/i,
  /you are now/i,
  /pretend (you are|to be)/i,
  /act as (a |an )?(different|new|another)/i,
  /jailbreak/i,
  /DAN\b/,
  /override (your )?(system|instructions?|rules?)/i,
  /теперь ты/i,
  /забудь (все|всё|инструкции)/i,
  /игнорируй (все|всё|инструкции)/i,
  /притворись что ты/i,
  /şimdi sen/i,
  /tüm kuralları unut/i,
];

// ─── Garbage detection ────────────────────────────────────────────────────────

const EMOJI_ONLY = /^[\p{Emoji}\s]+$/u;
const GARBAGE_PATTERN = /^[^a-zA-Z\u0400-\u04FF\u00C0-\u024F\d]{5,}$/;
const REPEATED_CHARS = /(.)\1{9,}/; // 10+ same chars in a row

// ─── Fallback responses ───────────────────────────────────────────────────────

const FALLBACKS: Record<GuardReason, Record<Language, string>> = {
  wrong_language: {
    ru: 'Пожалуйста, отвечай на русском — язык был выбран в начале и не меняется.',
    en: 'Please reply in English — the language was set at the start and cannot be changed.',
    tr: 'Lütfen Türkçe yanıt verin — dil başlangıçta seçildi ve değiştirilemez.',
  },
  garbage_input: {
    ru: 'Не совсем понял — можешь написать словами?',
    en: 'Not quite sure what you mean — could you write that in words?',
    tr: 'Tam anlayamadım — bunu kelimelerle yazabilir misin?',
  },
  emoji_only: {
    ru: 'Эмодзи принял, но мне нужны слова — что ты имеешь в виду?',
    en: 'Got the emoji, but I need words — what do you mean?',
    tr: 'Emojiyi aldım ama kelimelere ihtiyacım var — ne demek istiyorsun?',
  },
  too_long: {
    ru: 'Это много — выдели главное, пару предложений.',
    en: 'That is a lot — pick the main point, a couple of sentences.',
    tr: 'Bu çok fazla — ana noktayı seç, birkaç cümle yeterli.',
  },
  manipulation_attempt: {
    ru: 'Я здесь, чтобы провести интервью. Продолжим?',
    en: 'I am here to conduct the interview. Shall we continue?',
    tr: 'Burada görüşmeyi yürütmek için varım. Devam edelim mi?',
  },
  off_topic_hard: {
    ru: 'Давай вернёмся к теме — мне интересен твой опыт на работе.',
    en: 'Let us get back on track — I am interested in your work experience.',
    tr: 'Konuya dönelim — iş deneyiminizle ilgileniyorum.',
  },
  refusal: {
    ru: 'Хорошо, пропустим этот вопрос. Идём дальше.',
    en: 'Alright, we can skip this one. Moving on.',
    tr: 'Tamam, bunu atlayabiliriz. Devam edelim.',
  },
};

// ─── Main guard ───────────────────────────────────────────────────────────────

const MAX_INPUT_CHARS = 1200;

export function runInputGuard(input: string, sessionLanguage: Language): GuardResult {
  const trimmed = input.trim();

  // 1. Too long
  if (trimmed.length > MAX_INPUT_CHARS) {
    return { ok: false, reason: 'too_long', response: FALLBACKS.too_long[sessionLanguage] };
  }

  // 2. Emoji only
  if (EMOJI_ONLY.test(trimmed)) {
    return { ok: false, reason: 'emoji_only', response: FALLBACKS.emoji_only[sessionLanguage] };
  }

  // 3. Garbage (symbols, random chars)
  if (GARBAGE_PATTERN.test(trimmed) || REPEATED_CHARS.test(trimmed)) {
    return { ok: false, reason: 'garbage_input', response: FALLBACKS.garbage_input[sessionLanguage] };
  }

  // 4. Manipulation attempt
  for (const pattern of MANIPULATION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { ok: false, reason: 'manipulation_attempt', response: FALLBACKS.manipulation_attempt[sessionLanguage] };
    }
  }

  // 5. Refusal signals
  const refusalSignals: Record<Language, RegExp> = {
    ru: /^(не хочу|не буду|пропусти|следующий|дальше|пропустить|отказываюсь)[\s.,!]*$/i,
    en: /^(skip|pass|next|refuse|i don'?t want to|no thanks)[\s.,!]*$/i,
    tr: /^(geç|atla|istemiyorum|hayır|devam et|reddetmek)[\s.,!]*$/i,
  };
  if (refusalSignals[sessionLanguage].test(trimmed)) {
    return { ok: false, reason: 'refusal', response: FALLBACKS.refusal[sessionLanguage] };
  }

  // 6. Wrong language (only if input has enough alphabetic content)
  const alphaContent = trimmed.replace(/[^a-zA-Z\u0400-\u04FF\u00C0-\u024F]/g, '');
  if (alphaContent.length >= 8) {
    const detected = detectScript(trimmed);
    const langMismatch =
      (sessionLanguage === 'ru' && detected === 'en') ||
      (sessionLanguage === 'en' && detected === 'ru') ||
      (sessionLanguage === 'tr' && detected === 'ru');

    if (langMismatch) {
      return { ok: false, reason: 'wrong_language', response: FALLBACKS.wrong_language[sessionLanguage] };
    }
  }

  return { ok: true };
}

export function getRefusalResponse(lang: Language): string {
  return FALLBACKS.refusal[lang];
}
