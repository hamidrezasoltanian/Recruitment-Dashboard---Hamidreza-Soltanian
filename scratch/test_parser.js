const { execSync } = require('child_process');

const pdfPath = '/home/hamidreza/Downloads/Recruitment dashboard/Recruitment-Dashboard---Hamidreza-Soltanian/مهرناز_موذنی_JobVision_Persian_Resume (1).pdf';

// Strategy 1: Non-layout text
const rawText = execSync(`pdftotext "${pdfPath}" -`, { encoding: 'utf-8' }).normalize('NFKC');
let text = rawText.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');

console.log("--- TESTING STRATEGY 1 (Non-Layout) ---");

// Let's find "می زان سابقه کاری"
// Since the value might be on a separate line or elsewhere, let's find all occurrences of X سال or X ماه in the document
// and exclude:
// 1. age (which is under/near "سن:")
// 2. job duration (which has ")" or "(" or "تا")
// 3. course length (which is after "طول دوره")

const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
console.log("Total lines:", lines.length);

let totalExperience = '';
let requestedSalary = '';

// Let's find salary by looking for a line containing "میلیون" or "تومان" or "توم ان" that is NOT part of job description
// typically in JobVision it looks like: "X - Y میلیون تومان" or "توافقی"
for (const line of lines) {
  if ((line.includes('میلیون') || line.includes('توم ان') || line.includes('تومان')) && !line.includes('تا') && !line.includes(')')) {
    requestedSalary = line;
  }
}

// Let's find experience. In the text, we have:
// "می زان سابقه کاری:" followed by "حقوق:" on next lines.
// And under "سوابق تحصیلی", we have "4سال".
// Let's find any line that is exactly "X سال" or "X ماه" (with optional spaces)
for (const line of lines) {
  if (/^\s*\d+\s*(سال|ماه)\s*$/.test(line)) {
    totalExperience = line;
  }
}

console.log("Parsed Experience:", totalExperience);
console.log("Parsed Salary:", requestedSalary);


// Strategy 2: Layout text
console.log("\n--- TESTING STRATEGY 2 (Layout) ---");
const rawLayoutText = execSync(`pdftotext -layout "${pdfPath}" -`, { encoding: 'utf-8' }).normalize('NFKC');
let layoutText = rawLayoutText.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');

const layoutLines = layoutText.split('\n');
for (const line of layoutLines) {
  if (line.includes('می زان سابقه کاری')) {
    console.log("Found experience line:", line);
    // Extract the value part (which is usually on the left of the label in layout mode)
    const match = line.match(/(\d+)\s*(سال|ماه)/);
    if (match) {
      console.log("Matched experience in layout:", match[0]);
    }
  }
  if (line.includes('حقوق') && !line.includes('حقوق و سابقه')) {
    console.log("Found salary line:", line);
    // Salary might be something like: "20 - 25 میلیون توم ان" or "توافقی"
    // Let's extract any text on the left of "حقوق:"
    const parts = line.split(/حقوق\s*:/);
    if (parts.length > 0) {
      console.log("Parsed salary in layout:", parts[0].trim());
    }
  }
}
