export interface ParsedCandidate {
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
}

export function parseJobVisionProfile(text: string): ParsedCandidate {
  const result: ParsedCandidate = {};

  // Phone: Iranian mobile (09xx...) or landline
  const phoneMatch = text.match(/(?:^|\s|:|\()(09[0-9]{9})(?:\s|$|-|\)|,)/m)
    || text.match(/09[0-9]{2}[-\s]?[0-9]{3}[-\s]?[0-9]{4}/);
  if (phoneMatch) {
    result.phone = phoneMatch[1] || phoneMatch[0];
    result.phone = result.phone.replace(/[-\s]/g, '').trim();
  }

  // Email
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/);
  if (emailMatch) {
    result.email = emailMatch[0].trim();
  }

  // Name: JobVision typically shows name prominently at top
  // Try to find "نام:" or "نام و نام خانوادگی" label patterns
  const namedLabelMatch = text.match(/(?:نام و نام خانوادگی|نام کامل|نام)[:\s]+([^\n\r،,]+)/);
  if (namedLabelMatch) {
    result.name = namedLabelMatch[1].trim();
  } else {
    // Fallback: look for a line that looks like a Persian full name (2-4 words, no numbers)
    const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean);
    for (const line of lines.slice(0, 20)) {
      const isFarsiName = /^[؀-ۿ\s]{4,40}$/.test(line) && line.split(/\s+/).length >= 2 && line.split(/\s+/).length <= 4;
      if (isFarsiName && !line.includes('جاب') && !line.includes('ویژن') && !line.includes('استخدام')) {
        result.name = line;
        break;
      }
    }
  }

  // Position: look for job title labels
  const positionMatch = text.match(/(?:موقعیت شغلی|عنوان شغلی|سمت|پست)[:\s]+([^\n\r،,]{3,60})/);
  if (positionMatch) {
    result.position = positionMatch[1].trim();
  }

  return result;
}
