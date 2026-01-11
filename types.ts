export interface Member {
  id: string;
  name: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  status: 'active' | 'archived';
  projectStatus: 'ongoing' | 'completed'; // 项目状态：进行中、已结项
}

export interface Allocation {
  id: string;
  memberId: string;
  projectId: string;
  weekDate: string; // ISO Date string (YYYY-MM-DD) representing Monday
  value: number; // 0.0 to 1.0+
}

export interface AppData {
  members: Member[];
  projects: Project[];
  allocations: Allocation[];
}

export type ViewState = 'dashboard' | 'matrix' | 'settings';

export const WEEK_COUNT = 4; // 改为4周（1个月）