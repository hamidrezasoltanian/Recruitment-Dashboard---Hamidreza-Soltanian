import { Candidate } from '../types';
import moment from 'moment-jalaali';

export const templateService = {
  replacePlaceholders: (
    content: string,
    candidate: Candidate,
    additionalData: { [key: string]: string | undefined } = {}
  ): string => {
    let newContent = content;

    // Format current date in Persian
    const getCurrentDate = () => {
      const now = new Date();
      return now.toLocaleDateString('fa-IR');
    };

    // Format current time in Persian
    const getCurrentTime = () => {
      const now = new Date();
      return now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    };

    // Convert Gregorian date (YYYY/MM/DD) to Persian date string
    const formatInterviewDate = (dateString: string | undefined): string => {
      if (!dateString) return '[تاریخ مصاحبه تعیین نشده]';
      
      try {
        // Parse YYYY/MM/DD format
        const parts = dateString.split('/');
        if (parts.length === 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const day = parseInt(parts[2]);
          
          // Create date object
          const gregorianDate = new Date(year, month - 1, day);
          
          // Convert to Persian using moment-jalaali
          const m = moment(gregorianDate);
          const persianYear = (m as any).jYear();
          const persianMonth = (m as any).jMonth() + 1;
          const persianDay = (m as any).jDate();
          
          // Format as Persian date string
          const persianMonths = [
            'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
          ];
          
          return `${persianDay} ${persianMonths[persianMonth - 1]} ${persianYear}`;
        }
        return dateString;
      } catch (error) {
        console.error('Error formatting interview date:', error);
        return dateString;
      }
    };

    // Get candidate's current stage name
    const getCurrentStageName = () => {
      const stageMap: { [key: string]: string } = {
        'inbox': 'صندوق ورودی',
        'review': 'در حال بررسی',
        'interview-1': 'مصاحبه اول',
        'interview-2': 'مصاحبه دوم',
        'test': 'آزمون',
        'hired': 'استخدام شده',
        'rejected': 'رد شده',
        'archived': 'آرشیو شده'
      };
      return stageMap[candidate.stage] || candidate.stage;
    };

    const replacements: { [key: string]: string } = {
        // Candidate basic info
        candidateName: candidate.name || '',
        candidateEmail: candidate.email || '',
        candidatePhone: candidate.phone || '',
        position: candidate.position || '',
        
        // Interview info - convert to Persian date
        interviewDate: formatInterviewDate(candidate.interviewDate),
        interviewTime: candidate.interviewTime || '[ساعت مصاحبه تعیین نشده]',
        
        // Current stage info
        currentStage: getCurrentStageName(),
        
        // System info
        currentDate: getCurrentDate(),
        currentTime: getCurrentTime(),
        
        // Additional data (company info, stageName, etc.) - this will override above values
        ...additionalData
    };
    
    // Map company profile fields to expected template variables
    if (additionalData.name) replacements.companyName = additionalData.name;
    if (additionalData.website) replacements.companyWebsite = additionalData.website;
    if (additionalData.address) replacements.companyAddress = additionalData.address;
    if (additionalData.phone) replacements.companyPhone = additionalData.phone;
    
    // Filter out any undefined values from additionalData
    for(const key in replacements) {
        if (replacements[key] === undefined) {
            delete replacements[key];
        }
    }

    // Replace all placeholders with more flexible regex
    newContent = newContent.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return Object.prototype.hasOwnProperty.call(replacements, key) ? replacements[key] : match;
    });

    return newContent;
  },

  companyContext: (companyProfile: {
    name?: string;
    website?: string;
    address?: string;
    phone?: string;
  }) => ({
    companyName: companyProfile.name || '',
    companyWebsite: companyProfile.website || '',
    companyAddress: companyProfile.address || '',
    companyPhone: companyProfile.phone || '',
    name: companyProfile.name || '',
    website: companyProfile.website || '',
    address: companyProfile.address || '',
    phone: companyProfile.phone || '',
  }),

  contactFooter: (companyProfile: {
    name?: string;
    website?: string;
    address?: string;
    phone?: string;
  }) =>
    `\n\nبا آرزوی بهترین‌ها،\nتیم جذب و استخدام ${companyProfile.name || ''}\nوب‌سایت: ${companyProfile.website || ''}\nآدرس: ${companyProfile.address || ''}\nتلفن: ${companyProfile.phone || ''}`,
  
  hasPlaceholder: (content: string | undefined, placeholder: string): boolean => {
      if (!content) return false;
      return content.includes(`{{${placeholder}}}`);
  },

  // Get all available placeholders for help
  getAvailablePlaceholders: (): string[] => {
    return [
      'candidateName',
      'candidateEmail', 
      'candidatePhone',
      'position',
      'interviewDate',
      'interviewTime',
      'currentStage',
      'stageName',
      'currentDate',
      'currentTime',
      'companyName',
      'companyAddress',
      'companyWebsite',
      'companyPhone'
    ];
  }
};
