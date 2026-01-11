import { AppData, Member, Project, Allocation } from '../types';
import { generateId, getNext13Weeks } from '../utils';

const STORAGE_KEY = 'resource_planner_db_v1';

const INITIAL_DATA: AppData = {
  members: [
    { id: 'm1', name: 'Alice Chen', role: 'DB Architect' },
    { id: 'm2', name: 'Bob Smith', role: 'Data Engineer' },
    { id: 'm3', name: 'Charlie Kim', role: 'DBA' },
    { id: 'm4', name: 'Diana Prince', role: 'ETL Developer' },
    { id: 'm5', name: 'Ethan Hunt', role: 'Data Analyst' },
    { id: 'm6', name: 'Fiona Gallagher', role: 'Backend Dev' },
  ],
  projects: [
    { id: 'p1', name: 'FinTech Migration', status: 'active', projectStatus: 'ongoing' },
    { id: 'p2', name: 'Real-time Ledger', status: 'active', projectStatus: 'ongoing' },
    { id: 'p3', name: 'Audit Logs 2.0', status: 'active', projectStatus: 'ongoing' },
  ],
  allocations: []
};

// Seed some initial random data if empty
const seedData = (data: AppData): AppData => {
  if (data.allocations.length > 0) return data;
  
  const weeks = getNext13Weeks();
  const newAllocations: Allocation[] = [];

  // Randomly assign projects
  data.members.forEach(m => {
    data.projects.forEach(p => {
      if (Math.random() > 0.7) { // 30% chance a member is on a project
        weeks.forEach(w => {
           // Decaying allocation to simulate project ending
           const val = Math.max(0, parseFloat((Math.random() * 0.8).toFixed(1)));
           if (val > 0) {
             newAllocations.push({
               id: generateId(),
               memberId: m.id,
               projectId: p.id,
               weekDate: w,
               value: val
             });
           }
        });
      }
    });
  });
  
  return { ...data, allocations: newAllocations };
};

export const loadData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const data = JSON.parse(stored);
    // Migrate old data to add projectStatus field if missing
    if (data.projects && data.projects.length > 0) {
      data.projects = data.projects.map((p: Project) => ({
        ...p,
        projectStatus: p.projectStatus || 'ongoing'
      }));
    }
    return data;
  }
  const seeded = seedData(INITIAL_DATA);
  saveData(seeded);
  return seeded;
};

export const saveData = (data: AppData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const updateAllocation = (
  currentData: AppData,
  memberId: string,
  projectId: string,
  weekDate: string,
  value: number
): AppData => {
  const existingIndex = currentData.allocations.findIndex(
    a => a.memberId === memberId && a.projectId === projectId && a.weekDate === weekDate
  );

  let newAllocations = [...currentData.allocations];

  if (value <= 0) {
    if (existingIndex >= 0) {
      newAllocations.splice(existingIndex, 1);
    }
  } else {
    if (existingIndex >= 0) {
      newAllocations[existingIndex] = { ...newAllocations[existingIndex], value };
    } else {
      newAllocations.push({
        id: generateId(),
        memberId,
        projectId,
        weekDate,
        value
      });
    }
  }

  const newData = { ...currentData, allocations: newAllocations };
  saveData(newData);
  return newData;
};
