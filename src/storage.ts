import { LeetCodeProblem, StorageData } from './types';

export class StorageService {
  private static readonly STORAGE_KEY = 'leetcode_problems';

  static async getProblems(): Promise<LeetCodeProblem[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        const data: StorageData = result[this.STORAGE_KEY] || { problems: [] };
        resolve(data.problems);
      });
    });
  }

  static async saveProblems(problems: LeetCodeProblem[]): Promise<void> {
    return new Promise((resolve) => {
      const data: StorageData = { problems };
      chrome.storage.local.set({ [this.STORAGE_KEY]: data }, () => {
        resolve();
      });
    });
  }

  static async addProblem(problem: LeetCodeProblem): Promise<void> {
    const problems = await this.getProblems();
    const existingIndex = problems.findIndex(p => p.problemNameFromUrl === problem.problemNameFromUrl);
    
    if (existingIndex >= 0) {
      problems[existingIndex] = problem;
    } else {
      problems.push(problem);
    }
    
    await this.saveProblems(problems);
  }

  static async deleteProblem(problemId: string): Promise<void> {
    const problems = await this.getProblems();
    const filteredProblems = problems.filter(p => p.id !== problemId);
    await this.saveProblems(filteredProblems);
  }

  static async clearAll(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove([this.STORAGE_KEY], () => {
        resolve();
      });
    });
  }
}