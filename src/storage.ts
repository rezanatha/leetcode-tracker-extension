import { LeetCodeProblem, StorageData, ConfigData, SecureConfigData, NonSecureConfigData } from './types';
import { CryptoService } from './crypto';
import { testNotionConnection } from './notion';

export class StorageService {
  private static readonly STORAGE_KEY = 'leetcode_problems';
  private static readonly CONFIG_KEY = 'leetcode_config';
  private static readonly SECURE_CONFIG_KEY = 'leetcode_secure_config';

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

  // Secure storage methods for sensitive data with encryption
  static async getSecureConfig(): Promise<SecureConfigData> {
    return new Promise(async (resolve) => {
      try {
        // Use local storage for persistent encrypted storage
        chrome.storage.local.get([this.SECURE_CONFIG_KEY], async (result) => {
          if (result[this.SECURE_CONFIG_KEY]) {
            try {
              // Try to decrypt if encryption is available
              if (CryptoService.isAvailable() && typeof result[this.SECURE_CONFIG_KEY] === 'string') {
                const decryptedToken = await CryptoService.decrypt(result[this.SECURE_CONFIG_KEY]);
                resolve({ notionToken: decryptedToken });
                return;
              } else if (typeof result[this.SECURE_CONFIG_KEY] === 'object') {
                // Handle unencrypted legacy data
                resolve(result[this.SECURE_CONFIG_KEY]);
                return;
              }
            } catch (error) {
              console.warn('Failed to decrypt token, treating as legacy unencrypted data:', error);
              // Fallback to treating as unencrypted if it's an object
              if (typeof result[this.SECURE_CONFIG_KEY] === 'object') {
                resolve(result[this.SECURE_CONFIG_KEY]);
                return;
              }
            }
          }
          resolve({ notionToken: '' });
        });
      } catch (error) {
        console.error('Error in getSecureConfig:', error);
        resolve({ notionToken: '' });
      }
    });
  }

  static async saveSecureConfig(secureConfig: SecureConfigData): Promise<void> {
    return new Promise(async (resolve) => {
      try {
        let dataToStore: string | SecureConfigData = secureConfig;

        // Encrypt the token if encryption is available and token is not empty
        if (CryptoService.isAvailable() && secureConfig.notionToken.trim()) {
          try {
            dataToStore = await CryptoService.encrypt(secureConfig.notionToken);
            console.log('Token encrypted and stored persistently');
          } catch (error) {
            console.warn('Encryption failed, storing unencrypted:', error);
            dataToStore = secureConfig;
          }
        } else if (!CryptoService.isAvailable()) {
          console.warn('Encryption not available, storing token unencrypted');
        }

        // Use local storage for persistent encrypted storage
        chrome.storage.local.set({ [this.SECURE_CONFIG_KEY]: dataToStore }, () => {
          resolve();
        });
      } catch (error) {
        console.error('Error in saveSecureConfig:', error);
        resolve();
      }
    });
  }

  static async getNonSecureConfig(): Promise<NonSecureConfigData> {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.CONFIG_KEY], (result) => {
        const config: NonSecureConfigData = result[this.CONFIG_KEY] || { databaseId: '' };
        resolve(config);
      });
    });
  }

  static async saveNonSecureConfig(config: NonSecureConfigData): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.CONFIG_KEY]: config }, () => {
        resolve();
      });
    });
  }

  // Legacy methods for backward compatibility - now combines secure and non-secure data
  static async getConfig(): Promise<ConfigData> {
    const [secureConfig, nonSecureConfig] = await Promise.all([
      this.getSecureConfig(),
      this.getNonSecureConfig()
    ]);
    
    return {
      notionToken: secureConfig.notionToken,
      databaseId: nonSecureConfig.databaseId,
      parentPageId: nonSecureConfig.parentPageId,
      parentPageTitle: nonSecureConfig.parentPageTitle
    };
  }

  static async saveConfig(config: ConfigData): Promise<void> {
    const secureConfig: SecureConfigData = {
      notionToken: config.notionToken
    };
    
    const nonSecureConfig: NonSecureConfigData = {
      databaseId: config.databaseId,
      parentPageId: config.parentPageId,
      parentPageTitle: config.parentPageTitle
    };

    await Promise.all([
      this.saveSecureConfig(secureConfig),
      this.saveNonSecureConfig(nonSecureConfig)
    ]);
  }

  static async clearConfig(): Promise<void> {
    return new Promise((resolve) => {
      const keysToRemove = [this.CONFIG_KEY, this.SECURE_CONFIG_KEY];
      
      // Clear from local storage (where everything is now stored)
      chrome.storage.local.remove(keysToRemove, () => {
        console.log('Configuration and encrypted tokens cleared');
        resolve();
      });
    });
  }

  // Token validation methods
  static async validateAndCleanupToken(): Promise<{ isValid: boolean; wasCleared: boolean }> {
    try {
      const secureConfig = await this.getSecureConfig();
      
      if (!secureConfig.notionToken || !secureConfig.notionToken.trim()) {
        return { isValid: false, wasCleared: false };
      }

      // Test the token with Notion API
      const testResult = await testNotionConnection(secureConfig.notionToken);
      
      if (!testResult.success) {
        // Token is invalid, clear it
        await this.saveSecureConfig({ notionToken: '' });
        console.warn('Invalid Notion token cleared from storage');
        return { isValid: false, wasCleared: true };
      }

      return { isValid: true, wasCleared: false };
    } catch (error) {
      console.error('Error validating token:', error);
      return { isValid: false, wasCleared: false };
    }
  }

  static async getValidatedConfig(): Promise<ConfigData & { tokenStatus: 'valid' | 'invalid' | 'missing' }> {
    const config = await this.getConfig();
    
    if (!config.notionToken || !config.notionToken.trim()) {
      return { ...config, tokenStatus: 'missing' };
    }

    try {
      const testResult = await testNotionConnection(config.notionToken);
      return { 
        ...config, 
        tokenStatus: testResult.success ? 'valid' : 'invalid' 
      };
    } catch (error) {
      console.error('Error validating token in getValidatedConfig:', error);
      return { ...config, tokenStatus: 'invalid' };
    }
  }

  // Storage capability detection
  static getStorageCapabilities(): {
    hasSessionStorage: boolean;
    hasEncryption: boolean;
    securityLevel: 'high' | 'medium' | 'low';
    recommendations: string[];
    isPersistent: boolean;
  } {
    const hasSessionStorage = !!chrome.storage?.session;
    const hasEncryption = CryptoService.isAvailable();
    const isPersistent = true; // Always true now since we use local storage
    
    let securityLevel: 'high' | 'medium' | 'low';
    const recommendations: string[] = [];

    if (hasEncryption) {
      securityLevel = 'high';
      recommendations.push('Tokens are encrypted and persist across browser sessions');
    } else {
      securityLevel = 'medium';
      recommendations.push('Encryption unavailable - tokens stored in plain text but persist across sessions');
      recommendations.push('Consider updating to a newer browser version for encryption support');
    }

    return {
      hasSessionStorage,
      hasEncryption,
      securityLevel,
      recommendations,
      isPersistent
    };
  }
}