// Default snippets configuration for new installations
export const DEFAULT_SNIPPETS = [
  {
    id: 'default_photorealistic',
    text: '(photorealistic:1.2), highly detailed, studio lighting, cinematic composition',
    tags: ['photo', 'lighting'],
    title: '(photorealistic:1.2), highly detailed, studio lighting',
    description:
      'High-quality photorealistic rendering with professional lighting',
    category: 'Start Here',
    version: '1.0'
  },
  {
    id: 'default_cyberpunk',
    text: '(cyberpunk engineer), glowing tattoos, neon visor, dark synthetic jacket',
    tags: ['cyberpunk'],
    title: '(cyberpunk engineer), glowing tattoos, neon visor',
    description:
      'Cyberpunk character with futuristic elements and glowing features',
    category: 'Start Here',
    version: '1.0'
  },
  {
    id: 'default_space',
    text: 'abandoned space station, flickering lights, zero gravity, floating debris, eerie silence',
    tags: ['space'],
    title: 'abandoned space station, flickering lights, zero gravity',
    description: 'Atmospheric space environment with abandoned technology',
    category: 'Start Here',
    version: '1.0'
  }
];
// Function to create default snippets with proper timestamps
export function createDefaultSnippets() {
  const timestamp = Date.now();
  return DEFAULT_SNIPPETS.map((snippet, index) => ({
    ...snippet,
    created: timestamp + index, // Ensure unique timestamps
    modified: timestamp + index,
    id: snippet.id // Use the predefined IDs for consistency
  }));
}
// Function to check if default snippets already exist
export async function checkDefaultSnippetsExist() {
  try {
    const existingSnippets = [];
    for (const snippet of DEFAULT_SNIPPETS) {
      const filePath = `snippets/Start Here/${snippet.id}.json`;
      try {
        const content = await window.electronAPI.readFile(filePath);
        const parsed = JSON.parse(content);
        if (parsed && parsed.id) {
          existingSnippets.push(snippet.id);
        }
      } catch (e) {
        // File doesn't exist or is invalid
      }
    }
    return existingSnippets;
  } catch (error) {
    console.error('Error checking default snippets:', error);
    return [];
  }
}
// Function to create missing default snippets
export async function createMissingDefaultSnippets() {
  try {
    const existingSnippets = await checkDefaultSnippetsExist();
    const missingSnippets = DEFAULT_SNIPPETS.filter(
      snippet => !existingSnippets.includes(snippet.id)
    );
    if (missingSnippets.length === 0) {
      return;
    }
    const timestamp = Date.now();
    let createdCount = 0;
    for (let i = 0; i < missingSnippets.length; i++) {
      const snippet = missingSnippets[i];
      const snippetData = {
        ...snippet,
        created: timestamp + i,
        modified: timestamp + i
      };
      const filePath = `snippets/Start Here/${snippet.id}.json`;
      try {
        await window.electronAPI.writeFile(
          filePath,
          JSON.stringify(snippetData, null, 2)
        );
        createdCount++;
      } catch (error) {
        console.error(`Failed to create default snippet ${snippet.id}:`, error);
      }
    }
    if (createdCount > 0) {
    }
    return createdCount;
  } catch (error) {
    console.error('Error creating default snippets:', error);
    return 0;
  }
}
