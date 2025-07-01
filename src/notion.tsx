// Helper function to normalize URLs to base problem URL
const normalizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    // Extract: https://leetcode.com/problems/problem-name/
    if (pathParts.length >= 2 && pathParts[0] === 'problems') {
      return `${urlObj.origin}/problems/${pathParts[1]}/`;
    }
    
    // Fallback to original URL if pattern doesn't match
    return url;
  } catch {
    return url; // Return original if URL parsing fails
  }
};

// Function to scrape difficulty from LeetCode problem page
export const scrapeLeetCodeDifficulty = async (problemUrl: string): Promise<{ success: boolean; difficulty?: 'Easy' | 'Medium' | 'Hard'; error?: string }> => {
  try {
    const response = await fetch(problemUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Try multiple selectors that LeetCode might use for difficulty
    const difficultyPatterns = [
      // Look for difficulty in various class patterns
      /class="[^"]*difficulty[^"]*"[^>]*>\s*(Easy|Medium|Hard)\s*</gi,
      /class="[^"]*text-[^"]*"[^>]*>\s*(Easy|Medium|Hard)\s*</gi,
      // Look for difficulty near problem title or metadata
      /<div[^>]*>\s*(Easy|Medium|Hard)\s*<\/div>/gi,
      /<span[^>]*>\s*(Easy|Medium|Hard)\s*<\/span>/gi,
      // JSON data that might contain difficulty
      /"difficulty":\s*"(Easy|Medium|Hard)"/gi,
      /"level":\s*"(Easy|Medium|Hard)"/gi,
    ];
    
    for (const pattern of difficultyPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const difficulty = match[1]?.trim();
        if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) {
          return { success: true, difficulty: difficulty as 'Easy' | 'Medium' | 'Hard' };
        }
      }
    }
    
    // If no patterns match, try to find difficulty by context
    const contextPattern = /(?:difficulty|level)[\s\S]{0,100}(Easy|Medium|Hard)/gi;
    const contextMatch = contextPattern.exec(html);
    if (contextMatch) {
      const difficulty = contextMatch[1]?.trim();
      if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) {
        return { success: true, difficulty: difficulty as 'Easy' | 'Medium' | 'Hard' };
      }
    }
    
    return { success: false, error: 'Difficulty not found on page' };
    
  } catch (error) {
    console.error('Error scraping LeetCode difficulty:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Simple test function to learn Notion API
export const testNotionConnection = async (notionToken: string) => {
  try {
      const response = await fetch('https://api.notion.com/v1/users/me', {
        method: 'GET',
        headers: {
         'Authorization':`Bearer ${notionToken}`,
         'Notion-Version': '2022-06-28'
      }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`); 
      }
      const data = await response.json(); 
      console.log('Notion API Response:', data);
      return { success: true, data };    
    } catch (error) {
      console.error('Notion API Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
};

// Get user's workspace to create database automatically
export const getUserWorkspace = async (notionToken: string) => {
  try {
    const response = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        filter: {
          value: 'page',
          property: 'object'
        },
        page_size: 1
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error ${response.status}: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return { success: true, data: data.results[0] };
    } else {
      throw new Error('No accessible pages found in workspace');
    }

  } catch (error) {
    console.error('Get workspace error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const createNotionDBAutomatic = async (notionToken: string) => {
  try {
    // First get a page we can use as parent
    const workspaceResult = await getUserWorkspace(notionToken);
    if (!workspaceResult.success) {
      throw new Error(`Cannot find workspace: ${workspaceResult.error}`);
    }

    const parentPageId = workspaceResult.data.id;
    console.log('Using parent page:', parentPageId);

    // Now create the database
    const dbResult = await createNotionDB(notionToken, parentPageId);
    return dbResult;

  } catch (error) {
    console.error('Auto database creation error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const createNotionDB = async (notionToken: string, parentPageId: string) => {
  try {
      const response = await fetch('https://api.notion.com/v1/databases', {
        method: 'POST',
        headers: {
         'Authorization':`Bearer ${notionToken}`,
         'Content-Type': 'application/json',
         'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          parent:{
            type: 'page_id',
            page_id: parentPageId,
          },
          title: [
            {
              type: 'text',
              text: {content: 'Leetcode Problems Tracker'}
            }
          ],
          properties: {
            'Problem': {
              title: {}
            },
            'Difficulty': {
              select: {
                options: [
                  { name: 'Easy', color: 'green' },
                  { name: 'Medium', color: 'yellow' },
                  { name: 'Hard', color: 'red' }
                ]
              }
            },
            'URL': {
              url: {}
            },
            'Date Added': {
              date: {}
            },
            'Notes': {
              rich_text: {}
            }
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error ${response.status}: ${errorData.message || response.statusText}`); 
      }

      const data = await response.json(); 
      console.log('Database created:', data);
      return { success: true, data };    

    } catch (error) {
      console.error('Database Creation Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
};

export const addProblemToNotionDB = async (
  notionToken: string, 
  databaseId: string, 
  problem: {
    title: string;
    url: string;
    difficulty?: string;
    dateAdded: string;
  }
) => {
  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: {
          type: 'database_id',
          database_id: databaseId
        },
        properties: {
          'Problem': {
            title: [
              {
                type: 'text',
                text: {
                  content: problem.title
                }
              }
            ]
          },
          ...(problem.difficulty && {
            'Difficulty': {
              select: {
                name: problem.difficulty
              }
            }
          }),
          'URL': {
            url: problem.url
          },
          'Date Added': {
            date: {
              start: problem.dateAdded.split('T')[0] // Convert ISO to date format
            }
          }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error ${response.status}: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Problem added to Notion:', data);
    return { success: true, data };

  } catch (error) {
    console.error('Add problem error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const removeProblemFromNotionDB = async (
  notionToken: string,
  databaseId: string,
  problemUrl: string
) => {
  try {
    // Get all problems from the database
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error ${response.status}: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Filter results to find pages with matching normalized URLs
    const targetNormalizedUrl = normalizeUrl(problemUrl);
    const matchingPages = data.results.filter((page: any) => {
      const pageUrl = page.properties?.URL?.url;
      return pageUrl && normalizeUrl(pageUrl) === targetNormalizedUrl;
    });

    if (matchingPages.length === 0) {
      return { success: true, message: 'Problem not found in Notion database' };
    }

    // Delete each matching page (should be only one, but handle multiple just in case)
    const deleteResults = [];
    for (const page of matchingPages) {
      const deleteResponse = await fetch(`https://api.notion.com/v1/pages/${page.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${notionToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          archived: true
        })
      });

      if (deleteResponse.ok) {
        deleteResults.push({ success: true, pageId: page.id });
      } else {
        const errorData = await deleteResponse.json();
        deleteResults.push({ 
          success: false, 
          pageId: page.id, 
          error: errorData.message || 'Unknown error' 
        });
      }
    }

    const successCount = deleteResults.filter(r => r.success).length;
    const failedCount = deleteResults.filter(r => !r.success).length;

    return { 
      success: failedCount === 0, 
      message: `Deleted ${successCount} problem(s) from Notion${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
      deleteResults
    };

  } catch (error) {
    console.error('Remove problem from Notion error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const readNotionDBSchema = async (notionToken: string, databaseId: string) => {
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28'
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error ${response.status}: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        schema: data.properties,
        title: data.title,
        id: data.id
      };

    } catch (error) {
      console.error('Read database schema error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };


export const readNotionDB = async (
  notionToken: string,
  databaseId: string
) => {
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({})
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error ${response.status}: ${errorData.message || response.statusText}`);
    }
    const data = await response.json();
    return {success: true, data: data.results};
  } catch (error) {
    console.error('Read database error:', error);
    return  {success: false, error: error instanceof Error ? error.message: 'Unknown error'};
  }
};

export const getAccessiblePages = async (notionToken: string) => {
  try {
    const response = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        filter: {
          value: 'page',
          property: 'object'
        },
        page_size: 100
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error ${response.status}: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    const pages = data.results
      .filter((item: any) => {
        // Only include actual pages, not database entries
        if (item.object !== 'page') return false;
        
        // Exclude database entries (they have database_id as parent)
        if (item.parent?.type === 'database_id') return false;
        
        // Exclude pages that have Problem property (our LeetCode entries)
        if (item.properties?.Problem) return false;
        
        // Only include workspace or page children
        return item.parent?.type === 'workspace' || item.parent?.type === 'page_id';
      })
      .map((page: any) => {
        // Try different title property structures
        let title = 'Untitled Page';
        
        if (page.properties?.title?.title?.[0]?.text?.content) {
          title = page.properties.title.title[0].text.content;
        } else if (page.properties?.Name?.title?.[0]?.text?.content) {
          title = page.properties.Name.title[0].text.content;
        } else if (page.properties && Object.keys(page.properties).length > 0) {
          // Find any title-type property
          const titleProp = Object.values(page.properties).find((prop: any) => prop.type === 'title') as any;
          if (titleProp && titleProp.title?.[0]?.text?.content) {
            title = titleProp.title[0].text.content;
          }
        }
        
        return {
          id: page.id,
          title,
          url: page.url
        };
      });

    return { success: true, pages };

  } catch (error) {
    console.error('Get accessible pages error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const syncLocalProblemsToNotion = async (
  notionToken: string,
  databaseId: string,
  localProblems: any[]
) => {
  try {
    const results = {
      success: 0,
      skipped:0,
      failed: 0,
      errors: [] as string[]
    };
    //read db schema
    const schemaResult = await readNotionDBSchema(notionToken, databaseId);
    if (!schemaResult.success) {
      return { success: false, error: `Failed to read database schema: ${schemaResult.error}` };
    }

    //if schema is not the same as the original, offer to fix
    const requiredProperties = ['Problem', 'Difficulty', 'URL', 'Date Added', 'Notes'];
    const existingProperties = Object.keys(schemaResult.schema);
    const missingProperties = requiredProperties.filter(prop => !existingProperties.includes(prop));

    if (missingProperties.length > 0) {
      const missingList = missingProperties.map(prop => `• ${prop}`).join('\n');
      return { 
        success: false, 
        error: `Database schema is broken. Missing properties:\n\n${missingList}\n\nPlease add these columns to your Notion database.`,
        schemaBroken: true,
        missingProperties
      };
    }


    //read existing data
    let savedProblemUrls = new Set<string>();
    const result = await readNotionDB(notionToken, databaseId);
    if (result.success) {
      savedProblemUrls = new Set(
        result.data.map((problem: any) => {
          const url = problem.properties?.URL?.url;
          return url ? normalizeUrl(url) : null;
        }).filter(Boolean)
      );
    } else {
      console.error('Failed to read database');
    }

    console.log(`Starting sync of ${localProblems.length} problems to Notion...`);

    for (const problem of localProblems) {
      try {

        if (savedProblemUrls.has(normalizeUrl(problem.url))) {
          results.skipped++;
          console.log(`⏭️ Skipped: ${problem.title} (already exists)`);
          continue;
        }

        const result = await addProblemToNotionDB(notionToken, databaseId, {
          title: problem.title,
          url: problem.url,
          difficulty: problem.difficulty,
          dateAdded: problem.dateAdded
        });

        if (result.success) {
          results.success++;
          console.log(`✅ Synced: ${problem.title}`);
        } else {
          results.failed++;
          results.errors.push(`${problem.title}: ${result.error}`);
          console.error(`❌ Failed: ${problem.title} - ${result.error}`);
        }

        // Small delay to respect rate limits (3 req/sec)
        await new Promise(resolve => setTimeout(resolve, 350));

      } catch (error) {
        results.failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`${problem.title}: ${errorMsg}`);
        console.error(`❌ Failed: ${problem.title} - ${errorMsg}`);
      }
    }

    console.log(`Sync completed: ${results.success} successful, ${results.failed} failed`);
    return { success: true, results };

  } catch (error) {
    console.error('Sync error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const updateProblemInNotionDB = async (
  notionToken: string,
  databaseId: string,
  problemUrl: string,
  updates: {
    title?: string;
    difficulty?: string;
    notes?: string;
    dateAdded?: string;
  }
) => {
  try {
    // First, find the problem by URL
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error ${response.status}: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Find the page with matching normalized URL
    const targetNormalizedUrl = normalizeUrl(problemUrl);
    const matchingPage = data.results.find((page: any) => {
      const pageUrl = page.properties?.URL?.url;
      return pageUrl && normalizeUrl(pageUrl) === targetNormalizedUrl;
    });

    if (!matchingPage) {
      return { success: false, error: 'Problem not found in Notion database' };
    }

    // Build the update properties object
    const properties: any = {};
    
    if (updates.title) {
      properties['Problem'] = {
        title: [
          {
            type: 'text',
            text: {
              content: updates.title
            }
          }
        ]
      };
    }

    if (updates.difficulty) {
      properties['Difficulty'] = {
        select: {
          name: updates.difficulty
        }
      };
    }

    if (updates.notes) {
      properties['Notes'] = {
        rich_text: [
          {
            type: 'text',
            text: {
              content: updates.notes
            }
          }
        ]
      };
    }

    if (updates.dateAdded) {
      properties['Date Added'] = {
        date: {
          start: updates.dateAdded.split('T')[0] // Convert ISO to date format
        }
      };
    }

    // Update the page
    const updateResponse = await fetch(`https://api.notion.com/v1/pages/${matchingPage.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        properties
      })
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`API Error ${updateResponse.status}: ${errorData.message || updateResponse.statusText}`);
    }

    const updatedData = await updateResponse.json();
    console.log('Problem updated in Notion:', updatedData);
    return { success: true, data: updatedData };

  } catch (error) {
    console.error('Update problem error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const syncBidirectionalWithNotion = async (
  notionToken: string,
  databaseId: string,
  localProblems: any[]
) => {
  try {
    const results = {
      success: 0,
      skipped: 0,
      failed: 0,
      deleted: 0,
      errors: [] as string[]
    };

    // Read db schema
    const schemaResult = await readNotionDBSchema(notionToken, databaseId);
    if (!schemaResult.success) {
      return { success: false, error: `Failed to read database schema: ${schemaResult.error}` };
    }

    // If schema is not the same as the original, offer to fix
    const requiredProperties = ['Problem', 'Difficulty', 'URL', 'Date Added', 'Notes'];
    const existingProperties = Object.keys(schemaResult.schema);
    const missingProperties = requiredProperties.filter(prop => !existingProperties.includes(prop));

    if (missingProperties.length > 0) {
      const missingList = missingProperties.map(prop => `• ${prop}`).join('\n');
      return { 
        success: false, 
        error: `Database schema is broken. Missing properties:\n\n${missingList}\n\nPlease add these columns to your Notion database.`,
        schemaBroken: true,
        missingProperties
      };
    }

    // Get existing problems from Notion
    const notionResult = await readNotionDB(notionToken, databaseId);
    if (!notionResult.success) {
      return { success: false, error: `Failed to read Notion database: ${notionResult.error}` };
    }

    const notionProblems = notionResult.data;
    
    // Create sets for comparison using normalized URLs
    const localUrls = new Set(localProblems.map(p => normalizeUrl(p.url)));
    const notionUrls = new Set(
      notionProblems.map((problem: any) => {
        const url = problem.properties?.URL?.url;
        return url ? normalizeUrl(url) : null;
      }).filter(Boolean)
    );

    console.log(`Local problems: ${localUrls.size}, Notion problems: ${notionUrls.size}`);

    // Step 1: Add new problems from local to Notion
    for (const problem of localProblems) {
      try {
        if (notionUrls.has(normalizeUrl(problem.url))) {
          results.skipped++;
          console.log(`⏭️  Skipped: ${problem.title} (already exists)`);
          continue;
        }

        const result = await addProblemToNotionDB(notionToken, databaseId, {
          title: problem.title,
          url: problem.url,
          difficulty: problem.difficulty,
          dateAdded: problem.dateAdded
        });

        if (result.success) {
          results.success++;
          console.log(`✅ Added: ${problem.title}`);
        } else {
          results.failed++;
          results.errors.push(`${problem.title}: ${result.error}`);
          console.error(`❌ Failed to add: ${problem.title} - ${result.error}`);
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 350));

      } catch (error) {
        results.failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`${problem.title}: ${errorMsg}`);
        console.error(`❌ Failed: ${problem.title} - ${errorMsg}`);
      }
    }

    // Step 2: Remove problems from Notion that are not in local
    for (const notionProblem of notionProblems) {
      const notionUrl = notionProblem.properties?.URL?.url;
      if (notionUrl && !localUrls.has(normalizeUrl(notionUrl))) {
        try {
          const result = await removeProblemFromNotionDB(notionToken, databaseId, notionUrl);
          if (result.success) {
            results.deleted++;
            const title = notionProblem.properties?.Problem?.title?.[0]?.text?.content || 'Unknown';
            console.log(`🗑️  Deleted: ${title}`);
          } else {
            results.failed++;
            results.errors.push(`Delete failed: ${result.error}`);
          }

          // Rate limiting delay
          await new Promise(resolve => setTimeout(resolve, 350));

        } catch (error) {
          results.failed++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          results.errors.push(`Delete failed: ${errorMsg}`);
        }
      }
    }

    console.log(`Bidirectional sync completed: ${results.success} added, ${results.deleted} deleted, ${results.skipped} skipped, ${results.failed} failed`);
    return { success: true, results };

  } catch (error) {
    console.error('Bidirectional sync error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};