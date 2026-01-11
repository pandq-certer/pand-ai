import { Allocation, Member, Project, WEEK_COUNT } from './types';

// Helper to get the Monday of the current week
export const getMonday = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(date.setDate(diff));
};

// Generate the next 4 Mondays as ISO strings
export const getNext13Weeks = (): string[] => {
  const weeks: string[] = [];
  const current = getMonday(new Date());

  for (let i = 0; i < WEEK_COUNT; i++) {
    const nextWeek = new Date(current);
    nextWeek.setDate(current.getDate() + (i * 7));
    weeks.push(nextWeek.toISOString().split('T')[0]);
  }
  return weeks;
};

// Generate weeks around a specific date for historical viewing
export const getWeeksAroundDate = (centerDate: Date, weekCount: number = 4): string[] => {
  const weeks: string[] = [];
  const centerMonday = getMonday(centerDate);

  // Generate weeks starting from 2 weeks before the center date
  const startMonday = new Date(centerMonday);
  startMonday.setDate(centerMonday.getDate() - 14); // Go back 2 weeks

  for (let i = 0; i < weekCount; i++) {
    const week = new Date(startMonday);
    week.setDate(startMonday.getDate() + (i * 7));
    weeks.push(week.toISOString().split('T')[0]);
  }
  return weeks;
};

// Format date for display (e.g., "Jan 05")
export const formatDateShort = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Generate a unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Calculate total load for a member in a specific week
export const calculateMemberLoad = (
  memberId: string, 
  week: string, 
  allocations: Allocation[]
): number => {
  return allocations
    .filter(a => a.memberId === memberId && a.weekDate === week)
    .reduce((sum, a) => sum + a.value, 0);
};

// Calculate when a member becomes free (load drops to 0)
export const findFreeDate = (memberId: string, allocations: Allocation[], weeks: string[]): string | null => {
  // We check from the first week onwards. 
  // If they are 0 now, they are ready now.
  // If they are busy now, find the first future week where sum is 0.
  
  for (const week of weeks) {
    const load = calculateMemberLoad(memberId, week, allocations);
    if (load === 0) {
      return week;
    }
  }
  return null;
};
