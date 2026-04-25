import { create } from 'zustand';
import type { Issue, IssueStatus } from './types';

interface AppState {
  issues: Issue[];
  timeFilter: number; // 0 (Morning) to 100 (Night)
  selectedIssueId: string | null;
  addIssue: (issue: Omit<Issue, 'id' | 'timestamp' | 'verified'>) => void;
  updateIssueStatus: (id: string, status: IssueStatus) => void;
  resolveIssue: (id: string) => void;
  setTimeFilter: (val: number) => void;
  setSelectedIssueId: (id: string | null) => void;
}

// Generate some initial mock data
const MOCK_ISSUES: Issue[] = [
  { id: '1', category: 'Pothole', status: 'New', coordinates: [2, 0.5, 3], timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), verified: false, description: 'Large pothole near main street.' },
  { id: '2', category: 'Garbage', status: 'In Progress', coordinates: [-3, 0.5, -4], timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), verified: false, description: 'Trash bin overflowing.' },
  { id: '3', category: 'Safety', status: 'Resolved', coordinates: [5, 0.5, -2], timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), verified: true, description: 'Broken streetlight.' },
  { id: '4', category: 'Greenery', status: 'New', coordinates: [-1, 0.5, 6], timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(), verified: false, description: 'Fallen tree branch.' },
];

export const useStore = create<AppState>((set) => ({
  issues: MOCK_ISSUES,
  timeFilter: 50,
  selectedIssueId: null,
  addIssue: (issue) => set((state) => ({
    issues: [...state.issues, { ...issue, id: Math.random().toString(36).substring(2, 9), timestamp: new Date().toISOString(), verified: false }]
  })),
  updateIssueStatus: (id, status) => set((state) => ({
    issues: state.issues.map(i => i.id === id ? { ...i, status } : i)
  })),
  resolveIssue: (id) => set((state) => ({
    // Automatically marks as verified when resolved by admin
    issues: state.issues.map(i => i.id === id ? { ...i, status: 'Resolved', verified: true } : i)
  })),
  setTimeFilter: (val) => set({ timeFilter: val }),
  setSelectedIssueId: (id) => set({ selectedIssueId: id })
}));
