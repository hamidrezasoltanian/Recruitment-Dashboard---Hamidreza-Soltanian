const { execSync } = require('child_process');

function cleanPersianSpaces(str) {
  let cleaned = str.replace(/\s+/g, ' ').trim();
  const commonFixes = {
    'مه رناز': 'مهرناز',
    'کا ر': 'کار',
    'کار شنا': 'کارشنا',
    'رشناس': 'رشناس',
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
    const regex = new RegExp(wrong, 'g');
    cleaned = cleaned.replace(regex, right);
  }
  return cleaned;
}

try {
  const pdfPath = '/home/hamidreza/Downloads/Recruitment dashboard/Recruitment-Dashboard---Hamidreza-Soltanian/مهرناز_موذنی_JobVision_Persian_Resume (1).pdf';
  const rawText = execSync(`pdftotext "${pdfPath}" -`, { encoding: 'utf-8' });
  
  // Normalize
  let text = rawText.normalize('NFKC');
  text = text.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');
  
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Email extraction
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const parsedEmail = emailMatch ? emailMatch[0].trim() : '';

  // 2. Phone extraction
  const phoneMatch = text.match(/09\d{9}/) || text.match(/09\d{2}[-\s]*\d{3}[-\s]*\d{4}/);
  const parsedPhone = phoneMatch ? phoneMatch[0].replace(/[-\s]/g, '') : '';

  // 3. Name extraction
  let parsedName = '';
  for (const line of lines) {
    if (
      line.length >= 3 &&
      line.length <= 30 &&
      !line.includes(':') &&
      !line.includes('روز') &&
      !line.includes('رسانی') &&
      !line.includes('سوابق') &&
      !line.includes('شناسه') &&
      !line.includes('کاربری') &&
      !line.includes('صفحه') &&
      !/\d/.test(line)
    ) {
      parsedName = cleanPersianSpaces(line);
      break;
    }
  }

  console.log("--- EXTRACTION RESULTS ---");
  console.log("Parsed Name:", parsedName);
  console.log("Parsed Email:", parsedEmail);
  console.log("Parsed Phone:", parsedPhone);

} catch (e) {
  console.error("Error:", e);
}
