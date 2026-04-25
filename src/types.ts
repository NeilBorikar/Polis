export type IssueStatus = 'New' | 'In Progress' | 'Resolved';
export type IssueCategory = 'Pothole' | 'Garbage' | 'Safety' | 'Greenery';

export interface Issue {
  id: string;
  category: IssueCategory;
  status: IssueStatus;
  coordinates: [number, number, number]; // [x, y, z] for 3D map
  timestamp: string; // ISO String
  description?: string;
  verified: boolean;
}
