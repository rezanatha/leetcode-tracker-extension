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

export const addProblemToNotionDB = async (notionToken: string) => {

};

export const removeProblemFromNotionDB = async (notionToken: string) => {

};

export const syncNotionDBProblem = async () => {

};