// Color utility functions for the recruitment dashboard

export const getStageColor = (stage: string): string => {
  const colorMap: { [key: string]: string } = {
    'inbox': '#6B7280',      // Gray
    'applied': '#3B82F6',     // Blue
    'screened': '#F59E0B',    // Amber
    'interviewed': '#10B981', // Emerald
    'test': '#8B5CF6',        // Violet
    'offered': '#EF4444',     // Red
    'hired': '#16A34A',       // Green
    'rejected': '#6B7280',    // Gray
    'withdrawn': '#6B7280'    // Gray
  };
  
  return colorMap[stage] || '#6B7280';
};

export const getRatingColor = (rating: number): string => {
  if (rating >= 4) return '#10B981'; // Green
  if (rating >= 3) return '#F59E0B'; // Amber
  return '#EF4444'; // Red
};

export const getSourceColor = (source: string): string => {
  const colorMap: { [key: string]: string } = {
    'linkedin': '#0077B5',
    'indeed': '#003A9B',
    'glassdoor': '#0CAA41',
    'company_website': '#6366F1',
    'referral': '#EC4899',
    'recruitment_agency': '#F59E0B',
    'university': '#8B5CF6',
    'other': '#6B7280'
  };
  
  return colorMap[source] || '#6B7280';
};

export const getJobColor = (jobTitle: string): string => {
  // Generate a consistent color based on job title
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];
  
  let hash = 0;
  for (let i = 0; i < jobTitle.length; i++) {
    hash = jobTitle.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

export const generateRandomColor = (): string => {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};
