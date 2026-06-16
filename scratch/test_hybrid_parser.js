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
  const rawLayoutText = execSync(`pdftotext -layout "${pdfPath}" -`, { encoding: 'utf-8' });
  
  let text = rawText.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');
  let layoutText = rawLayoutText.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');

  // 1. Name, Email, Phone
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const parsedEmail = emailMatch ? emailMatch[0].trim() : '';

  const phoneMatch = text.match(/09\d{9}/) || text.match(/09\d{2}[-\s]*\d{3}[-\s]*\d{4}/);
  const parsedPhone = phoneMatch ? phoneMatch[0].replace(/[-\s]/g, '') : '';

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
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

  // 2. Experience and Salary from Layout Mode
  let parsedExperience = '';
  let parsedSalary = '';

  const layoutLines = layoutText.split('\n');
  for (const line of layoutLines) {
    if (line.includes('می زان سابقه کاری') || line.includes('میزان سابقه کاری')) {
      const match = line.match(/(\d+)\s*(سال|ماه)/);
      if (match) {
        parsedExperience = match[0].trim();
      }
    }
    if (line.includes('حقوق') && !line.includes('حقوق و سابقه')) {
      const parts = line.split(/حقوق\s*:/);
      if (parts.length > 1) {
        // Look for salary patterns in the left side
        const leftPart = parts[0].trim();
        const salaryMatch = leftPart.match(/(\d+\s*-\s*\d+\s*میلیون\s*توم\s*ان)|(\d+\s*-\s*\d+\s*میلیون\s*تومان)|(توافقی)/);
        if (salaryMatch) {
          parsedSalary = cleanPersianSpaces(salaryMatch[0]);
        } else {
          // If no specific match, just take the last few words
          parsedSalary = cleanPersianSpaces(leftPart.split(/\s{2,}/).pop() || '');
        }
      }
    }
  }

  // Fallbacks if layout mode fails
  if (!parsedExperience) {
    let foundHeading = false;
    for (const line of lines) {
      if (line.includes('می زان سابقه کاری') || line.includes('حقوق و سابقه')) {
        foundHeading = true;
      }
      if (foundHeading && /^\s*\d+\s*(سال|ماه)\s*$/.test(line)) {
        parsedExperience = cleanPersianSpaces(line);
        break;
      }
    }
  }

  if (!parsedSalary) {
    let foundHeading = false;
    for (const line of lines) {
      if (line.includes('می زان سابقه کاری') || line.includes('حقوق و سابقه')) {
        foundHeading = true;
      }
      if (foundHeading && (line.includes('میلیون') || line.includes('تومان') || line.includes('توافقی')) && !line.includes('تا') && !line.includes(')')) {
        parsedSalary = cleanPersianSpaces(line);
        break;
      }
    }
  }

  // 3. Job Hopping from durations
  const durationRegex = /(\d+)\s*\)\s*(?:\d+)?\s*(سال|ماه)(?:\s*و\s*(\d+)?\s*ماه)?/g;
  let match;
  const durations = [];
  while ((match = durationRegex.exec(text)) !== null) {
    const val1 = parseInt(match[1], 10);
    const type1 = match[2];
    const val2 = match[3] ? parseInt(match[3], 10) : 0;
    let months = 0;
    if (type1 === 'ماه') {
      months = val1;
    } else if (type1 === 'سال') {
      months = val1 * 12 + val2;
    }
    durations.push(months);
  }

  let jobHopping = 'hopping_green';
  if (durations.length > 0) {
    const shortJobsCount = durations.filter(m => m < 12).length;
    const totalJobs = durations.length;
    if (totalJobs >= 2 && (shortJobsCount / totalJobs) >= 0.5) {
      jobHopping = 'hopping_red';
    } else if (shortJobsCount > 0) {
      jobHopping = 'hopping_yellow';
    }
  }

  // Relevant Experience rating
  let relevantExperience = 'exp_red';
  if (parsedExperience) {
    const yearMatch = parsedExperience.match(/(\d+)\s*سال/);
    const monthMatch = parsedExperience.match(/(\d+)\s*ماه/);
    let totalMonths = 0;
    if (yearMatch) totalMonths += parseInt(yearMatch[1], 10) * 12;
    if (monthMatch) totalMonths += parseInt(monthMatch[1], 10);

    if (totalMonths > 36) {
      relevantExperience = 'exp_green';
    } else if (totalMonths >= 12) {
      relevantExperience = 'exp_yellow';
    }
  }

  console.log("--- FINAL RESULTS ---");
  console.log("Name:", parsedName);
  console.log("Email:", parsedEmail);
  console.log("Phone:", parsedPhone);
  console.log("Experience:", parsedExperience);
  console.log("Salary:", parsedSalary);
  console.log("Job Hopping:", jobHopping);
  console.log("Relevant Experience Rating:", relevantExperience);

} catch (e) {
  console.error("Error:", e);
}
