export interface LeetCodeProblem {
  id: string;
  title: string;
  url: string;
  problemNameFromUrl: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  status?: 'Solved' | 'Attempted' | 'Not Started';
  dateAdded: string;
  notes?: string;
}

export interface StorageData {
  problems: LeetCodeProblem[];
}