const cleanPersianSpaces = (str) => {
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
};

const fixPersianNameSpacing = (nameStr) => {
  let cleaned = cleanPersianSpaces(nameStr);
  let parts = cleaned.split(' ');
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
      const part1EndsWithConnecting = !nonConnecting.includes(lastChar1) && /[\u0600-\u06FF]/.test(lastChar1);
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
};

console.log("Input: 'مژگان اح م د ی' -> Output:", fixPersianNameSpacing("مژگان اح م د ی"));
console.log("Input: 'م رضیه هدای ت زاد ه' -> Output:", fixPersianNameSpacing("م رضیه هدای ت زاد ه"));
