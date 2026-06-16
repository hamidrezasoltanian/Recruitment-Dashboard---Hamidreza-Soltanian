const { execSync } = require('child_process');

try {
  const pdfPath = '/home/hamidreza/Downloads/Recruitment dashboard/Recruitment-Dashboard---Hamidreza-Soltanian/مهرناز_موذنی_JobVision_Persian_Resume (1).pdf';
  const rawText = execSync(`pdftotext "${pdfPath}" -`, { encoding: 'utf-8' });
  
  // Normalize
  let text = rawText.normalize('NFKC');
  
  // Remove control characters and direction marks
  text = text.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');
  
  console.log("--- CLEANED TEXT ---");
  console.log(text);
} catch (e) {
  console.error("Error:", e);
}
