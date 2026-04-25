import { create } from 'zustand';
import type { Issue, IssueStatus } from './types';

export interface SmartBusData { total: number; running: number; stopped: number; halt: number; notPolling: number; }
export interface StreetLightData { total: number; on: number; off: number; dim1: number; dim2: number; }
export interface CCTVData { total: number; normal: number; faulty: number; noFeed: number; noRecording: number; }
export interface ITMSData { total: number; working: number; faulty: number; }
export interface EnvironmentData { severe: number; veryPoor: number; poor: number; moderate: number; satisfactory: number; good: number; }
export interface ParkingData { total: number; full: number; notOccupied: number; under25: number; under50: number; under75: number; over75: number; }
export interface GarbageData { total: number; full: number; empty: number; under25: number; under50: number; under75: number; over75: number; }
export interface PowerData { total: number; hiTechCity: number; kondapur: number; raidurg: number; }
export interface WaterData { treatmentPlants: number; plantEfficiency: number; drinkingWaterQuality: number; avgWaterProcessed: number; }
export interface STPData { treatmentPlants: number; operationalCapacity: number; avgSewageProcessed: number; operationalEfficiency: number; }

interface AppState {
  issues: Issue[];
  timeFilter: number;
  selectedIssueId: string | null;
  activeTab: string;
  smartBus: SmartBusData;
  streetLight: StreetLightData;
  cctv: CCTVData;
  itms: ITMSData;
  environment: EnvironmentData;
  parking: ParkingData;
  garbage: GarbageData;
  power: PowerData;
  water: WaterData;
  stp: STPData;
  livabilityIndex: number;
  drinkingWaterIndex: number;
  revenueIndex: number;
  addIssue: (issue: Omit<Issue, 'id' | 'timestamp' | 'verified'>) => void;
  updateIssueStatus: (id: string, status: IssueStatus) => void;
  resolveIssue: (id: string) => void;
  setTimeFilter: (val: number) => void;
  setSelectedIssueId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
}

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
  activeTab: 'Overview',
  smartBus: { total: 5, running: 2, stopped: 3, halt: 0, notPolling: 0 },
  streetLight: { total: 20, on: 12, off: 0, dim1: 6, dim2: 2 },
  cctv: { total: 14, normal: 14, faulty: 0, noFeed: 0, noRecording: 0 },
  itms: { total: 10, working: 10, faulty: 0 },
  environment: { severe: 2, veryPoor: 2, poor: 0, moderate: 1, satisfactory: 1, good: 0 },
  parking: { total: 5, full: 1, notOccupied: 1, under25: 1, under50: 0, under75: 2, over75: 1 },
  garbage: { total: 9, full: 2, empty: 0, under25: 2, under50: 2, under75: 2, over75: 0 },
  power: { total: 1095, hiTechCity: 360, kondapur: 370, raidurg: 365 },
  water: { treatmentPlants: 1, plantEfficiency: 90, drinkingWaterQuality: 95, avgWaterProcessed: 250 },
  stp: { treatmentPlants: 1, operationalCapacity: 120, avgSewageProcessed: 100, operationalEfficiency: 83 },
  livabilityIndex: 93,
  drinkingWaterIndex: 90,
  revenueIndex: 95,
  addIssue: (issue) => set((state) => ({
    issues: [...state.issues, { ...issue, id: Math.random().toString(36).substring(2, 9), timestamp: new Date().toISOString(), verified: false }]
  })),
  updateIssueStatus: (id, status) => set((state) => ({
    issues: state.issues.map(i => i.id === id ? { ...i, status } : i)
  })),
  resolveIssue: (id) => set((state) => ({
    issues: state.issues.map(i => i.id === id ? { ...i, status: 'Resolved', verified: true } : i)
  })),
  setTimeFilter: (val) => set({ timeFilter: val }),
  setSelectedIssueId: (id) => set({ selectedIssueId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
