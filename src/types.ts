export type EventType = 'college_day' | 'holiday' | 'exam' | 'event' | 'deadline';

export type TaskCategory = 'DSA' | 'COA' | 'OS' | 'ML' | 'GATE' | 'Placement' | 'Personal' | 'Project';

export type ClassType = 'lecture' | 'lab' | 'tutorial';

export type UnavailableCategory = 'Sleep' | 'Meals' | 'Gym' | 'Commute' | 'Family/personal' | 'Other';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  type: EventType;
  description?: string;
  location?: string;
}

export interface CollegeClass {
  id: string;
  subject: string;
  code: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  room: string;
  faculty: string;
  type: ClassType;
  color?: string;
}

export interface UnavailableBlock {
  id: string;
  title: string;
  category: UnavailableCategory;
  isRecurring: boolean;
  daysOfWeek: number[]; // e.g. [1,2,3,4,5] for weekdays
  date?: string; // For one-time blocks: YYYY-MM-DD
  startTime: string; // "07:00"
  endTime: string; // "08:00"
  durationMinutes: number;
}

export interface Goal {
  id: string;
  title: string;
  targetDate: string;
  weeklyTargetHours: number;
  priority: 'High' | 'Medium' | 'Low';
  description: string;
  category: string;
}

export interface TargetSubtask {
  id: string;
  title: string;
  completed: boolean;
  assignedDate?: string;
  durationMinutes?: number;
}

export interface WeeklyTarget {
  id: string;
  goalId?: string;
  title: string;
  targetHours: number;
  completedHours: number;
  weekStartDate: string; // YYYY-MM-DD of Monday
  subtasks: TargetSubtask[];
}

export interface DailyTask {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "18:00"
  endTime: string; // "18:45"
  durationMinutes: number;
  category: TaskCategory;
  goalId?: string;
  notes?: string;
  completed: boolean;
}

export interface SemesterInfo {
  name: string;
  college: string;
  branch: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  calendarFileName?: string;
  timetableFileName?: string;
  isSetupComplete: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  degree: string;
  year: string;
  semester: string;
}
