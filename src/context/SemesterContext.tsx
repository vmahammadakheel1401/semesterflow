import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTodayDateString } from '../utils/dateUtils';
import {
  CalendarEvent,
  CollegeClass,
  UnavailableBlock,
  Goal,
  WeeklyTarget,
  DailyTask,
  FreeTimeAllocation,
  SemesterInfo,
  UserProfile,
  EventType,
} from '../types';
import {
  INITIAL_USER_PROFILE,
  INITIAL_SEMESTER_INFO,
  INITIAL_CLASSES,
  INITIAL_UNAVAILABLE_BLOCKS,
  INITIAL_GOALS,
  INITIAL_WEEKLY_TARGETS,
  INITIAL_DAILY_TASKS,
  INITIAL_FREE_TIME_ALLOCATIONS,
  INITIAL_CALENDAR_EVENTS,
} from '../mockData';

export type ScreenId =
  | 'welcome'
  | 'setup'
  | 'calendar-review'
  | 'calendar'
  | 'timetable'
  | 'availability'
  | 'goals'
  | 'weekly-plan'
  | 'today'
  | 'dashboard'
  | 'settings';

export interface ModalConfig {
  isOpen: boolean;
  itemType: 'task' | 'event' | 'exam' | 'deadline' | 'holiday' | 'college_day';
  mode: 'create' | 'edit' | 'view';
  data?: any;
}

interface SemesterContextType {
  activeScreen: ScreenId;
  setActiveScreen: (screen: ScreenId) => void;
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  
  semesterInfo: SemesterInfo;
  updateSemesterInfo: (info: Partial<SemesterInfo>) => void;
  
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateCalendarEvent: (event: CalendarEvent) => void;
  deleteCalendarEvent: (id: string) => void;
  replaceCalendarEvents: (events: CalendarEvent[]) => void;
  appendCalendarEvents: (events: CalendarEvent[]) => void;
  clearCalendarEvents: () => void;

  classes: CollegeClass[];
  addClass: (cls: Omit<CollegeClass, 'id'>) => void;
  updateClass: (cls: CollegeClass) => void;
  deleteClass: (id: string) => void;
  replaceClasses: (newClasses: CollegeClass[]) => void;

  unavailableBlocks: UnavailableBlock[];
  addUnavailableBlock: (block: Omit<UnavailableBlock, 'id'>) => void;
  updateUnavailableBlock: (block: UnavailableBlock) => void;
  deleteUnavailableBlock: (id: string) => void;

  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;

  weeklyTargets: WeeklyTarget[];
  addWeeklyTarget: (target: Omit<WeeklyTarget, 'id'>) => void;
  updateWeeklyTarget: (target: WeeklyTarget) => void;
  deleteWeeklyTarget: (id: string) => void;
  toggleSubtask: (targetId: string, subtaskId: string) => void;
  addSubtask: (targetId: string, title: string) => void;
  deleteSubtask: (targetId: string, subtaskId: string) => void;

  dailyTasks: DailyTask[];
  addTask: (task: Omit<DailyTask, 'id'>) => void;
  updateTask: (task: DailyTask) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  moveTaskTime: (id: string, startTime: string, endTime: string, date?: string) => void;

  freeTimeAllocations: FreeTimeAllocation[];
  addFreeTimeAllocation: (allocation: Omit<FreeTimeAllocation, 'id'>) => void;
  updateFreeTimeAllocation: (allocation: FreeTimeAllocation) => void;
  deleteFreeTimeAllocation: (id: string) => void;
  toggleFreeTimeComplete: (id: string) => void;
  logTaskActualTime: (taskId: string, actualMinutes: number) => void;
  logAllocationActualTime: (allocationId: string, actualMinutes: number) => void;
  getFreeTimeAllocationsForDate: (dateString: string) => FreeTimeAllocation[];

  // Reusable modal for Screen 11
  modalConfig: ModalConfig;
  openModal: (
    type: 'task' | 'event' | 'exam' | 'deadline' | 'holiday' | 'college_day',
    mode: 'create' | 'edit' | 'view',
    data?: any
  ) => void;
  closeModal: () => void;

  // Helpers
  getClassesForDate: (dateString: string) => CollegeClass[];
  getEventsForDate: (dateString: string) => CalendarEvent[];
  getTasksForDate: (dateString: string) => DailyTask[];
  getUnavailableForDate: (dateString: string) => UnavailableBlock[];
  getAvailableStudyHours: (dateString: string) => number;
  getWeeklyStats: () => { totalWeeklyTargetHours: number; completedTargetHours: number; availableWeeklyStudyHours: number };
  
  todayDate: string;
  resetToToday: () => void;
  resetToDemoData: () => void;
}

const STORAGE_PREFIX = 'semesterflow_';

const SemesterContext = createContext<SemesterContextType | undefined>(undefined);

export const SemesterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('today');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString);

  // Persistent states with local storage fallbacks
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'profile');
    return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE;
  });

  const [semesterInfo, setSemesterInfo] = useState<SemesterInfo>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'semester');
    return saved ? JSON.parse(saved) : INITIAL_SEMESTER_INFO;
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'events');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Check if it's the old hardcoded mock dataset with fake OS assignments/exam halls
          const isLegacyMock = parsed.some((e: any) => e.id === 'ev-4' || (e.id === 'ev-5' && e.title?.includes('DSA')));
          if (isLegacyMock) {
            localStorage.removeItem(STORAGE_PREFIX + 'events');
            return [];
          }
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved calendar events', e);
      }
    }
    return INITIAL_CALENDAR_EVENTS;
  });

  const [classes, setClasses] = useState<CollegeClass[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'classes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Check if it's the old hardcoded mock dataset with static CSE classes
          const isLegacyMock = parsed.some(
            (c: any) =>
              c.id?.startsWith('c-mon-') ||
              c.id?.startsWith('c-tue-') ||
              c.id?.startsWith('c-wed-') ||
              c.id?.startsWith('c-thu-') ||
              c.id?.startsWith('c-fri-') ||
              c.id?.startsWith('c-sat-') ||
              c.id?.startsWith('c-dyn-') ||
              c.id?.startsWith('c-ece-') ||
              c.id?.startsWith('c-me-')
          );
          if (isLegacyMock) {
            localStorage.removeItem(STORAGE_PREFIX + 'classes');
            return [];
          }
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved classes', e);
      }
    }
    return [];
  });

  const [unavailableBlocks, setUnavailableBlocks] = useState<UnavailableBlock[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'unavailable');
    return saved ? JSON.parse(saved) : INITIAL_UNAVAILABLE_BLOCKS;
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'goals');
    return saved ? JSON.parse(saved) : INITIAL_GOALS;
  });

  const [weeklyTargets, setWeeklyTargets] = useState<WeeklyTarget[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'weekly_targets');
    return saved ? JSON.parse(saved) : INITIAL_WEEKLY_TARGETS;
  });

  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'daily_tasks');
    return saved ? JSON.parse(saved) : INITIAL_DAILY_TASKS;
  });

  const [freeTimeAllocations, setFreeTimeAllocations] = useState<FreeTimeAllocation[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'free_time_allocations');
    return saved ? JSON.parse(saved) : INITIAL_FREE_TIME_ALLOCATIONS;
  });

  // Modal configuration state
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    isOpen: false,
    itemType: 'task',
    mode: 'create',
  });

  // Auto-sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'semester', JSON.stringify(semesterInfo));
  }, [semesterInfo]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'events', JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'unavailable', JSON.stringify(unavailableBlocks));
  }, [unavailableBlocks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'weekly_targets', JSON.stringify(weeklyTargets));
  }, [weeklyTargets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'daily_tasks', JSON.stringify(dailyTasks));
  }, [dailyTasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'free_time_allocations', JSON.stringify(freeTimeAllocations));
  }, [freeTimeAllocations]);

  // Operations
  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...profile }));
  };

  const updateSemesterInfo = (info: Partial<SemesterInfo>) => {
    setSemesterInfo((prev) => ({ ...prev, ...info }));
  };

  const addCalendarEvent = (event: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: 'ev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    };
    setCalendarEvents((prev) => [...prev, newEvent]);
  };

  const updateCalendarEvent = (event: CalendarEvent) => {
    setCalendarEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
  };

  const deleteCalendarEvent = (id: string) => {
    setCalendarEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const replaceCalendarEvents = (events: CalendarEvent[]) => {
    setCalendarEvents(events);
  };

  const appendCalendarEvents = (newEvents: CalendarEvent[]) => {
    setCalendarEvents((prev) => {
      const existingSignatures = new Set(
        prev.map((e) => `${e.date}__${e.title.trim().toLowerCase()}`)
      );
      const uniqueNew = newEvents.filter(
        (e) => !existingSignatures.has(`${e.date}__${e.title.trim().toLowerCase()}`)
      );
      return [...prev, ...uniqueNew];
    });
  };

  const clearCalendarEvents = () => {
    setCalendarEvents([]);
  };

  const addClass = (cls: Omit<CollegeClass, 'id'>) => {
    const newClass: CollegeClass = {
      ...cls,
      id: 'cls-' + Date.now(),
    };
    setClasses((prev) => [...prev, newClass]);
  };

  const updateClass = (cls: CollegeClass) => {
    setClasses((prev) => prev.map((c) => (c.id === cls.id ? cls : c)));
  };

  const deleteClass = (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
  };

  const replaceClasses = (newClasses: CollegeClass[]) => {
    setClasses(newClasses);
  };

  const addUnavailableBlock = (block: Omit<UnavailableBlock, 'id'>) => {
    const newBlock: UnavailableBlock = {
      ...block,
      id: 'un-' + Date.now(),
    };
    setUnavailableBlocks((prev) => [...prev, newBlock]);
  };

  const updateUnavailableBlock = (block: UnavailableBlock) => {
    setUnavailableBlocks((prev) => prev.map((b) => (b.id === block.id ? block : b)));
  };

  const deleteUnavailableBlock = (id: string) => {
    setUnavailableBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const addGoal = (goal: Omit<Goal, 'id'>) => {
    const newGoal: Goal = {
      ...goal,
      id: 'g-' + Date.now(),
    };
    setGoals((prev) => [...prev, newGoal]);
  };

  const updateGoal = (goal: Goal) => {
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)));
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const addWeeklyTarget = (target: Omit<WeeklyTarget, 'id'>) => {
    const newTarget: WeeklyTarget = {
      ...target,
      id: 'wt-' + Date.now(),
    };
    setWeeklyTargets((prev) => [...prev, newTarget]);
  };

  const updateWeeklyTarget = (target: WeeklyTarget) => {
    setWeeklyTargets((prev) => prev.map((t) => (t.id === target.id ? target : t)));
  };

  const deleteWeeklyTarget = (id: string) => {
    setWeeklyTargets((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleSubtask = (targetId: string, subtaskId: string) => {
    setWeeklyTargets((prev) =>
      prev.map((t) => {
        if (t.id !== targetId) return t;
        const updatedSubtasks = t.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        const total = updatedSubtasks.length;
        const done = updatedSubtasks.filter((s) => s.completed).length;
        const completedHours = total > 0 ? Number(((done / total) * t.targetHours).toFixed(1)) : t.completedHours;
        return {
          ...t,
          subtasks: updatedSubtasks,
          completedHours,
        };
      })
    );
  };

  const addSubtask = (targetId: string, title: string) => {
    setWeeklyTargets((prev) =>
      prev.map((t) => {
        if (t.id !== targetId) return t;
        const newSt = { id: 'st-' + Date.now(), title, completed: false };
        return {
          ...t,
          subtasks: [...t.subtasks, newSt],
        };
      })
    );
  };

  const deleteSubtask = (targetId: string, subtaskId: string) => {
    setWeeklyTargets((prev) =>
      prev.map((t) => {
        if (t.id !== targetId) return t;
        return {
          ...t,
          subtasks: t.subtasks.filter((st) => st.id !== subtaskId),
        };
      })
    );
  };

  const addTask = (task: Omit<DailyTask, 'id'>) => {
    const newTask: DailyTask = {
      ...task,
      id: 'dt-' + Date.now(),
    };
    setDailyTasks((prev) => [...prev, newTask]);
  };

  const updateTask = (task: DailyTask) => {
    setDailyTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
  };

  const deleteTask = (id: string) => {
    setDailyTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleTaskComplete = (id: string) => {
    setDailyTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const logTaskActualTime = (taskId: string, actualMinutes: number) => {
    setDailyTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, actualMinutes } : t))
    );
  };

  const addFreeTimeAllocation = (allocation: Omit<FreeTimeAllocation, 'id'>) => {
    const newAllocation: FreeTimeAllocation = {
      ...allocation,
      id: 'fta-' + Date.now(),
    };
    setFreeTimeAllocations((prev) => [...prev, newAllocation]);
  };

  const updateFreeTimeAllocation = (allocation: FreeTimeAllocation) => {
    setFreeTimeAllocations((prev) =>
      prev.map((a) => (a.id === allocation.id ? allocation : a))
    );
  };

  const deleteFreeTimeAllocation = (id: string) => {
    setFreeTimeAllocations((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleFreeTimeComplete = (id: string) => {
    setFreeTimeAllocations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a))
    );
  };

  const logAllocationActualTime = (allocationId: string, actualMinutes: number) => {
    setFreeTimeAllocations((prev) =>
      prev.map((a) => (a.id === allocationId ? { ...a, actualMinutes } : a))
    );
  };

  const getFreeTimeAllocationsForDate = (dateString: string): FreeTimeAllocation[] => {
    return freeTimeAllocations
      .filter((a) => a.date === dateString)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const moveTaskTime = (id: string, startTime: string, endTime: string, date?: string) => {
    setDailyTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              startTime,
              endTime,
              ...(date ? { date } : {}),
            }
          : t
      )
    );
  };

  const openModal = (
    itemType: 'task' | 'event' | 'exam' | 'deadline' | 'holiday' | 'college_day',
    mode: 'create' | 'edit' | 'view',
    data?: any
  ) => {
    setModalConfig({
      isOpen: true,
      itemType,
      mode,
      data,
    });
  };

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  // Date specific query helpers
  const getDayOfWeek = (dateString: string): number => {
    const parts = dateString.split('-').map(Number);
    // Note: year, month-1, day
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.getDay();
  };

  const getClassesForDate = (dateString: string): CollegeClass[] => {
    const day = getDayOfWeek(dateString);
    // Check if the date is a holiday
    const isHoliday = calendarEvents.some(
      (e) => e.date === dateString && e.type === 'holiday'
    );
    if (isHoliday) return [];
    return classes.filter((c) => c.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getEventsForDate = (dateString: string): CalendarEvent[] => {
    return calendarEvents.filter((e) => e.date === dateString);
  };

  const getTasksForDate = (dateString: string): DailyTask[] => {
    return dailyTasks
      .filter((t) => t.date === dateString)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getUnavailableForDate = (dateString: string): UnavailableBlock[] => {
    const day = getDayOfWeek(dateString);
    return unavailableBlocks.filter((b) => {
      if (b.isRecurring) {
        return b.daysOfWeek.includes(day);
      }
      return b.date === dateString;
    });
  };

  const parseTimeMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const getAvailableStudyHours = (dateString: string): number => {
    // 24 hours = 1440 minutes
    // Total class minutes
    const dayClasses = getClassesForDate(dateString);
    let classMinutes = 0;
    dayClasses.forEach((c) => {
      const dur = parseTimeMinutes(c.endTime) - parseTimeMinutes(c.startTime);
      if (dur > 0) classMinutes += dur;
    });

    // Unavailable minutes
    const dayUnavail = getUnavailableForDate(dateString);
    let unavailMinutes = 0;
    dayUnavail.forEach((u) => {
      unavailMinutes += u.durationMinutes;
    });

    const busy = classMinutes + unavailMinutes;
    const remaining = Math.max(0, 1440 - busy);
    return Number((remaining / 60).toFixed(1));
  };

  const todayDate = getTodayDateString();

  const resetToToday = () => {
    setSelectedDate(getTodayDateString());
  };

  const getWeeklyStats = () => {
    const totalWeeklyTargetHours = weeklyTargets.reduce((sum, t) => sum + t.targetHours, 0);
    const completedTargetHours = weeklyTargets.reduce((sum, t) => sum + t.completedHours, 0);
    
    // Dynamically calculate 7 days of the current academic week (Monday through Sunday)
    const refStr = getTodayDateString();
    const [ry, rm, rd] = refStr.split('-').map(Number);
    const curr = new Date(ry, rm - 1, rd);
    const day = curr.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() + diffToMonday);

    let totalAvail = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      totalAvail += getAvailableStudyHours(`${y}-${m}-${dayStr}`);
    }

    return {
      totalWeeklyTargetHours,
      completedTargetHours: Number(completedTargetHours.toFixed(1)),
      availableWeeklyStudyHours: Number(totalAvail.toFixed(1)),
    };
  };

  const resetToDemoData = () => {
    setUserProfile(INITIAL_USER_PROFILE);
    setSemesterInfo(INITIAL_SEMESTER_INFO);
    setCalendarEvents(INITIAL_CALENDAR_EVENTS);
    setClasses(INITIAL_CLASSES);
    setUnavailableBlocks(INITIAL_UNAVAILABLE_BLOCKS);
    setGoals(INITIAL_GOALS);
    setWeeklyTargets(INITIAL_WEEKLY_TARGETS);
    setDailyTasks(INITIAL_DAILY_TASKS);
    setFreeTimeAllocations(INITIAL_FREE_TIME_ALLOCATIONS);
    setSelectedDate(getTodayDateString());
    setActiveScreen('today');
  };

  return (
    <SemesterContext.Provider
      value={{
        activeScreen,
        setActiveScreen,
        selectedDate,
        setSelectedDate,
        todayDate,
        resetToToday,
        userProfile,
        updateUserProfile,
        semesterInfo,
        updateSemesterInfo,
        calendarEvents,
        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,
        replaceCalendarEvents,
        appendCalendarEvents,
        clearCalendarEvents,
        classes,
        addClass,
        updateClass,
        deleteClass,
        replaceClasses,
        unavailableBlocks,
        addUnavailableBlock,
        updateUnavailableBlock,
        deleteUnavailableBlock,
        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        weeklyTargets,
        addWeeklyTarget,
        updateWeeklyTarget,
        deleteWeeklyTarget,
        toggleSubtask,
        addSubtask,
        deleteSubtask,
        dailyTasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        moveTaskTime,
        freeTimeAllocations,
        addFreeTimeAllocation,
        updateFreeTimeAllocation,
        deleteFreeTimeAllocation,
        toggleFreeTimeComplete,
        logTaskActualTime,
        logAllocationActualTime,
        getFreeTimeAllocationsForDate,
        modalConfig,
        openModal,
        closeModal,
        getClassesForDate,
        getEventsForDate,
        getTasksForDate,
        getUnavailableForDate,
        getAvailableStudyHours,
        getWeeklyStats,
        resetToDemoData,
      }}
    >
      {children}
    </SemesterContext.Provider>
  );
};

export const useSemester = () => {
  const context = useContext(SemesterContext);
  if (!context) {
    throw new Error('useSemester must be used within a SemesterProvider');
  }
  return context;
};
