export interface Member {
  id: string;
  name: string;
  role: string;
  email?: string; // 成员邮箱（可选）
  status?: 'active' | 'deleted'; // 成员状态：活跃、已删除（逻辑删除）
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

export interface EmailRecipient {
  memberId: string;
  enabled: boolean;
}

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly';

export interface EmailConfig {
  enabled: boolean;
  recipients: EmailRecipient[]; // 接收邮件的成员列表
  customEmails: string[]; // 自定义邮箱地址
  frequency: ScheduleFrequency; // 发送频率：daily(每天)、weekly(每周)、monthly(每月)
  scheduleTime: string; // 定时发送时间，格式：HH:MM
  scheduleDayOfWeek?: number; // 当 frequency 为 weekly 时，指定星期几（0=周日，1=周一，...，6=周六）
  scheduleDayOfMonth?: number; // 当 frequency 为 monthly 时，指定每月的第几天（1-31）
  lastSent: string | null; // 上次发送时间
}

export interface AppData {
  members: Member[];
  projects: Project[];
  allocations: Allocation[];
  emailConfig?: EmailConfig; // 邮件配置（可选，向后兼容）
}

export type ViewState = 'dashboard' | 'matrix' | 'settings' | 'terminology';

export const WEEK_COUNT = 4; // 改为4周（1个月）