export interface ParsedCandidate {
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
}

/** Normalize Arabic/Persian digits and clean invisible chars */
function normalizeText(raw: string): string {
  return raw
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

function collapseLetterSpacedPersian(str: string): string {
  const trimmed = str.trim();
  const parts = trimmed.split(/\s+/);
  const singleCharRatio = parts.filter((p) => p.length === 1).length / Math.max(parts.length, 1);
  if (singleCharRatio >= 0.5 && parts.length >= 4) {
    const segments = trimmed.split(/\s{2,}/);
    if (segments.length > 1) {
      return segments.map((seg) => seg.replace(/\s+/g, '')).join(' ').trim();
    }
    return trimmed.replace(/\s+/g, '');
  }
  return trimmed;
}

function looksLikePersianName(line: string): boolean {
  const fixed = collapseLetterSpacedPersian(line);
  if (!/^[\u0600-\u06FF\s‌]{3,40}$/.test(fixed)) return false;
  const words = fixed.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 5) return false;
  const skip = ['جاب', 'ویژن', 'استخدام', 'رزومه', 'متقاضی', 'پروفایل', 'سوابق', 'حقوق', 'تماس'];
  if (skip.some((s) => fixed.includes(s))) return false;
  return true;
}

export function parseJobVisionProfile(text: string): ParsedCandidate {
  const result: ParsedCandidate = {};
  const normalized = normalizeText(text);

  // Phone: Iranian mobile (09xx...) or landline
  const phoneMatch =
    normalized.match(/(?:^|\s|:|\()(09[0-9]{9})(?:\s|$|-|\)|,)/m) ||
    normalized.match(/09[0-9]{2}[-\s]?[0-9]{3}[-\s]?[0-9]{4}/);
  if (phoneMatch) {
    result.phone = (phoneMatch[1] || phoneMatch[0]).replace(/[-\s]/g, '').trim();
  }

  // Email
  const emailMatch = normalized.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/);
  if (emailMatch) {
    result.email = emailMatch[0].trim();
  }

  // Name: labeled patterns first
  const namedLabelMatch = normalized.match(
    /(?:نام و نام خانوادگی|نام کامل|نام)[:\s]+([^\n\r،,]{3,50})/
  );
  if (namedLabelMatch) {
    result.name = collapseLetterSpacedPersian(namedLabelMatch[1].trim());
  } else {
    const lines = normalized.split(/[\n\r]+/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines.slice(0, 25)) {
      if (looksLikePersianName(line)) {
        result.name = collapseLetterSpacedPersian(line);
        break;
      }
    }
  }

  // Position
  const positionMatch = normalized.match(
    /(?:موقعیت شغلی|عنوان شغلی|سمت|پست)[:\s]+([^\n\r،,]{3,60})/
  );
  if (positionMatch) {
    result.position = positionMatch[1].trim();
  }

  return result;
}
