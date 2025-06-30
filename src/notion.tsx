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
            'Status': {
              select: {
                options: [
                  { name: 'Not Started', color: 'gray' },
                  { name: 'Attempted', color: 'yellow' },
                  { name: 'Solved', color: 'green' }
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
    status?: string;
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
          'Difficulty': {
            select: problem.difficulty ? {
              name: problem.difficulty
            } : null
          },
          'Status': {
            select: {
              name: problem.status || 'Not Started'
            }
          },
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
    const requiredProperties = ['Problem', 'Difficulty', 'Status', 'URL', 'Date Added', 'Notes'];
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
      savedProblemUrls = new Set(result.data.map((problem: any)=> problem.properties?.URL?.url).filter(Boolean));
    } else {
      console.error('Failed to read database');
    }

    console.log(`Starting sync of ${localProblems.length} problems to Notion...`);

    for (const problem of localProblems) {
      try {

        if (savedProblemUrls.has(problem.url)) {
          results.skipped++;
          console.log(`⏭️ Skipped: ${problem.title} (already exists)`);
          continue;
        }

        const result = await addProblemToNotionDB(notionToken, databaseId, {
          title: problem.title,
          url: problem.url,
          difficulty: problem.difficulty,
          status: problem.status,
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