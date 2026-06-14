// ID utility functions for the recruitment dashboard

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const generateCandidateId = (): string => {
  return `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
};

export const generateCommentId = (): string => {
  return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
};

export const generateTestId = (): string => {
  return `test_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
};

export const generateNotificationId = (): string => {
  return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
};

export const isValidId = (id: string): boolean => {
  return typeof id === 'string' && id.length > 0;
};
