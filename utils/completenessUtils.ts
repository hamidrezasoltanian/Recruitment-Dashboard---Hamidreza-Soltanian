import { Candidate } from '../types';

export interface CompletenessResult {
  score: number; // 0-100
  missing: string[];
}

const FIELDS: { check: (c: Candidate) => boolean; label: string; weight: number }[] = [
  { check: c => !!c.name?.trim(),         label: 'نام کامل',         weight: 15 },
  { check: c => !!c.email?.trim(),        label: 'ایمیل',            weight: 15 },
  { check: c => !!c.phone?.trim(),        label: 'شماره تلفن',       weight: 10 },
  { check: c => !!c.position?.trim(),     label: 'موقعیت شغلی',     weight: 15 },
  { check: c => !!c.source?.trim(),       label: 'منبع',             weight: 5  },
  { check: c => !!c.hasResume,            label: 'رزومه',            weight: 20 },
  { check: c => c.rating > 0,            label: 'امتیاز',           weight: 10 },
  { check: c => !!c.interviewDate,        label: 'تاریخ مصاحبه',    weight: 10 },
];

export const calcCompleteness = (c: Candidate): CompletenessResult => {
  let score = 0;
  const missing: string[] = [];
  for (const field of FIELDS) {
    if (field.check(c)) {
      score += field.weight;
    } else {
      missing.push(field.label);
    }
  }
  return { score, missing };
};
