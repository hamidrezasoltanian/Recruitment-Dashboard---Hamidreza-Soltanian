/**
 * Multer/busboy often interprets UTF-8 filenames as Latin-1 (mojibake).
 * Re-decode when the result yields Persian text.
 */
export function decodeUtf8Filename(name: string): string {
  if (!name) return '';
  if (/[\u0600-\u06FF]/.test(name)) return name;

  try {
    const decoded = Buffer.from(name, 'latin1').toString('utf8');
    if (/[\u0600-\u06FF]/.test(decoded) && !decoded.includes('\uFFFD')) {
      return decoded;
    }
  } catch {
    // ignore
  }
  return name;
}

export function cleanPersianSpaces(str: string): string {
  let cleaned = str.replace(/\s+/g, ' ').trim();
  const commonFixes: Record<string, string> = {
    'مه رناز': 'مهرناز',
    'کا ر': 'کار',
    'کار شنا': 'کارشنا',
    'توم ان': 'تومان',
    'امو زشی': 'آموزشی',
    'آمو زش': 'آموزش',
    'مد ر': 'مدیر',
    'می زان': 'میزان',
    'ثب ت': 'ثبت',
    'م بایل': 'موبایل',
    'شنا سه': 'شناسه',
    'کار ری': 'کاربری',
    'دان شگاه': 'دانشگاه',
    'آ کادم': 'آکادم',
    'تکمی ل': 'تکمیل',
    'ارز یابی': 'ارزیابی',
    'سوا بق': 'سوابق',
  };
  for (const [wrong, right] of Object.entries(commonFixes)) {
    cleaned = cleaned.replace(new RegExp(wrong, 'g'), right);
  }
  return cleaned;
}

/** Collapse letter-spaced Persian like "م ه ر ن ا ز  م و ذ ن ی" → "مهرناز موذنی" */
export function collapseLetterSpacedPersian(str: string): string {
  const trimmed = str.trim();
  if (!trimmed) return '';

  const parts = trimmed.split(/\s+/);
  const singleCharRatio = parts.filter((p) => p.length === 1).length / parts.length;

  if (singleCharRatio >= 0.5 && parts.length >= 4) {
    const segments = trimmed.split(/\s{2,}/);
    if (segments.length > 1) {
      return segments.map((seg) => seg.replace(/\s+/g, '')).join(' ').trim();
    }
    return trimmed.replace(/\s+/g, '');
  }
  return trimmed;
}

export function fixPersianNameSpacing(nameStr: string): string {
  let collapsed = collapseLetterSpacedPersian(nameStr);
  collapsed = cleanPersianSpaces(collapsed);

  let parts = collapsed.split(/\s+/).filter(Boolean);
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < parts.length - 1; i++) {
      const part1 = parts[i];
      const part2 = parts[i + 1];
      const isPart1Single = part1.length === 1;
      const isPart2Single = part2.length === 1;
      const nonConnecting = ['ا', 'د', 'ذ', 'ر', 'ز', 'ژ', 'و', 'آ', 'أ', 'إ', 'ؤ'];
      const lastChar1 = part1.charAt(part1.length - 1);
      const part1EndsWithConnecting =
        !nonConnecting.includes(lastChar1) && /[\u0600-\u06FF]/.test(lastChar1);

      let shouldMerge = false;
      if (isPart1Single || isPart2Single) {
        shouldMerge = true;
      } else if (part1.length <= 2 && part1EndsWithConnecting) {
        shouldMerge = true;
      }

      if (shouldMerge) {
        parts[i] = part1 + part2;
        parts.splice(i + 1, 1);
        changed = true;
        break;
      }
    }
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

const FILENAME_STOP_WORDS = new Set([
  'resume', 'cv', 'pdf', 'file', 'job', 'jobvision', 'persian', 'english',
  'applicant', 'candidate', 'senior', 'junior', 'intern', 'developer',
  'react', 'node', 'frontend', 'backend', 'fullstack', 'python', 'java',
  'go', 'engineer', 'manager', 'sales',
  'رزومه', 'کارجو', 'کاندید', 'همکار', 'متقاضی', 'برنامه نویس', 'برنامه',
  'نویس', 'طراح', 'فروش', 'مدیر', 'کارشناس', 'پشتیبان', 'طراحی',
  'توسعه دهنده', 'توسعه‌دهنده', 'مهندس', 'ارشد', 'جونیور', 'کارآموز',
  'جدید', 'توسعه', 'دهنده', 'پشتیبانی', 'بازاریاب', 'سایت', 'ایران',
  'تهران', 'فارسی', 'انگلیسی', 'ارتباطات', 'جاب', 'ویژن', 'جابویژن',
]);

/** Extract a clean Persian name from a JobVision / resume filename */
export function getNameFromFilename(filename: string): string {
  let cleanName = decodeUtf8Filename(filename);
  cleanName = cleanName.replace(/\.[^/.]+$/, '');

  // Strip JobVision / resume suffixes early
  cleanName = cleanName
    .replace(/[_-]?(JobVision|جاب[\s_-]*ویژن).*$/i, '')
    .replace(/[_-]?(Persian|English)?[_-]?Resume.*$/i, '')
    .replace(/[_-]?(رزومه).*$/i, '');

  cleanName = cleanName.replace(/[\s_\-()]+/g, ' ').trim();
  cleanName = cleanName.normalize('NFKC');
  cleanName = cleanName.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');

  const parts = cleanName
    .split(/\s+/)
    .filter((part) => {
      const p = part.toLowerCase().trim();
      if (!p) return false;
      if (FILENAME_STOP_WORDS.has(p)) return false;
      if (/^\d+$/.test(p)) return false;
      if (/^[a-zA-Z]+$/.test(p) && p.length > 2) return false; // drop leftover English tokens
      return true;
    });

  if (parts.length === 0) return '';

  const joined = parts.join(' ');
  // Only accept if we actually got Persian characters — avoids returning mojibake
  if (!/[\u0600-\u06FF]/.test(joined)) return '';

  return fixPersianNameSpacing(joined);
}

const NAME_SKIP_KEYWORDS = [
  'روز', 'رسانی', 'سوابق', 'شناسه', 'کاربری', 'صفحه', 'حقوق', 'سابقه',
  'تماس', 'ایمیل', 'موبایل', 'آدرس', 'تحصیلات', 'مهارت', 'زبان',
  'جاب ویژن', 'جاب‌ویژن', 'jobvision', 'resume', 'رزومه',
];

/** Extract name from PDF text lines (JobVision layout-aware) */
export function extractNameFromText(text: string): string {
  const lines = text
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '')
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines.slice(0, 25)) {
    const lower = line.toLowerCase();
    if (NAME_SKIP_KEYWORDS.some((k) => lower.includes(k.toLowerCase()))) continue;
    if (line.includes(':') || /\d/.test(line)) continue;
    if (!/[\u0600-\u06FF]/.test(line)) continue;

    // Allow longer lines when letter-spaced
    const collapsed = collapseLetterSpacedPersian(line);
    const compactLen = collapsed.replace(/\s/g, '').length;
    if (compactLen < 3 || compactLen > 40) continue;

    const fixed = fixPersianNameSpacing(line);
    const wordCount = fixed.split(/\s+/).filter(Boolean).length;
    if (wordCount >= 2 && wordCount <= 5 && /^[\u0600-\u06FF\s‌]+$/.test(fixed)) {
      return fixed;
    }
  }

  return '';
}

/** Prefer filename name, then PDF text */
export function resolveCandidateName(filename: string, pdfText: string): string {
  const fromFile = getNameFromFilename(filename);
  if (fromFile) return fromFile;
  return extractNameFromText(pdfText);
}
