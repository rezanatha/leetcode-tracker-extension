export interface LeetCodeProblem {
  id: string;
  title: string;
  url: string;
  problemNameFromUrl: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  dateAdded: string;
  notes?: string;
}

export interface ConfigData {
  notionToken: string;
  databaseId: string;
  parentPageId?: string;
  parentPageTitle?: string;
}

export interface SecureConfigData {
  notionToken: string;
}

export interface NonSecureConfigData {
  databaseId: string;
  parentPageId?: string;
  parentPageTitle?: string;
}

export interface NotionPage {
  id: string;
  title: string;
  url: string;
}

export interface StorageData {
  problems: LeetCodeProblem[];
}