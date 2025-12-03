import OpenAI from 'openai';
import { imageUriToBase64 } from '../utils/imageUtils';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true, // Required for React Native/Expo
});

export interface SimpleAnalysisResult {
  item: string;
}

export interface DetailedAnalysisResult {
  item: string;
  style?: string;
  material?: string;
  color?: string;
  condition?: string;
  repairNeeded?: string[];
  searchQueries?: string[];
  description?: string;
}

/**
 * Simple identification mode - returns just the furniture item name
 */
export async function identifyFurnitureSimple(imageUri: string): Promise<SimpleAnalysisResult> {
  try {
    const base64Image = await imageUriToBase64(imageUri);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'What furniture item is in this image? Return only the item name in one word or a short phrase (e.g., "chair", "dining table", "sofa"). If item is not a furniture item, return "Not a furniture item, try again".',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 50,
    });

    const item = response.choices[0]?.message?.content?.trim() || 'Unknown furniture';
    return { item };
  } catch (error: any) {
    console.error('Error in simple identification:', error);
    
    // Handle specific OpenAI API errors
    if (error?.status === 429) {
      if (error?.message?.includes('quota')) {
        throw new Error('OpenAI API quota exceeded. Please check your billing and plan details at https://platform.openai.com/account/billing');
      } else {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
    } else if (error?.status === 401) {
      throw new Error('Invalid API key. Please check your EXPO_PUBLIC_OPENAI_API_KEY in .env file.');
    } else if (error?.status === 400) {
      throw new Error('Invalid request. Please ensure the image is valid.');
    }
    
    throw new Error(`Failed to identify furniture: ${error?.message || error}`);
  }
}

/**
 * Detailed analysis mode - returns comprehensive information including repair context
 */
export async function analyzeFurnitureDetailed(imageUri: string): Promise<DetailedAnalysisResult> {
  try {
    const base64Image = await imageUriToBase64(imageUri);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this furniture image and provide detailed information. Return a JSON object with the following structure:
{
  "item": "furniture item name",
  "material": "primary material",
  "color": "primary color",
  "condition": "overall condition description",
  "repairNeeded": ["list of repair needs if any"],
  "searchQueries": ["search queries for repair tutorials"],
  "description": "brief description of the item"
}

If no repairs are needed, set "repairNeeded" to an empty array. Generate 3-5 specific search queries for repair tutorials if repairs are needed. IMPORTANT: Each repair issue in "repairNeeded" must have its first word capitalized (e.g., "Loose joints", "Scratched surface", "Broken leg").`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(content) as DetailedAnalysisResult;
    
    // Ensure first word of each repair issue is capitalized
    if (analysis.repairNeeded && analysis.repairNeeded.length > 0) {
      analysis.repairNeeded = analysis.repairNeeded.map(issue => {
        if (!issue || issue.length === 0) return issue;
        return issue.charAt(0).toUpperCase() + issue.slice(1);
      });
    }
    
    return analysis;
  } catch (error: any) {
    console.error('Error in detailed analysis:', error);
    
    // Handle specific OpenAI API errors
    if (error?.status === 429) {
      if (error?.message?.includes('quota')) {
        throw new Error('OpenAI API quota exceeded. Please check your billing and plan details at https://platform.openai.com/account/billing');
      } else {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
    } else if (error?.status === 401) {
      throw new Error('Invalid API key. Please check your EXPO_PUBLIC_OPENAI_API_KEY in .env file.');
    } else if (error?.status === 400) {
      throw new Error('Invalid request. Please ensure the image is valid.');
    }
    
    throw new Error(`Failed to analyze furniture: ${error?.message || error}`);
  }
}

/**
 * Analyze furniture with mode selection
 */
export async function analyzeFurniture(
  imageUri: string,
  mode: 'simple' | 'detailed' = 'simple'
): Promise<SimpleAnalysisResult | DetailedAnalysisResult> {
  if (mode === 'simple') {
    return identifyFurnitureSimple(imageUri);
  } else {
    return analyzeFurnitureDetailed(imageUri);
  }
}

/**
 * Generate embedding from furniture analysis
 * Used for similarity search
 */
export async function generateEmbedding(
  analysis: { item?: string; style?: string; material?: string; description?: string }
): Promise<number[]> {
  try {
    // Create descriptive text from analysis
    const text = `${analysis.item || ''} ${analysis.material || ''} ${analysis.description || ''}`.trim();
    
    if (!text) {
      throw new Error('Cannot generate embedding from empty analysis');
    }

    // Use OpenAI embeddings API to generate vector
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // Cost-effective embedding model
      input: text,
    });

    return response.data[0].embedding;
  } catch (error: any) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error?.message || error}`);
  }
}

export interface Tutorial {
  issue: string;
  title: string;
  steps: string[];
  materials?: string[];
  tips?: string[];
  estimatedTime?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface TutorialPlan {
  furnitureItem: string;
  tutorials: Tutorial[];
  overview?: string;
}

/**
 * Generate repair tutorials for selected issues
 */
export async function generateTutorials(
  furnitureItem: string,
  selectedIssues: string[],
  furnitureContext?: { style?: string; material?: string; condition?: string }
): Promise<TutorialPlan> {
  try {
    if (!selectedIssues || selectedIssues.length === 0) {
      throw new Error('No issues selected for tutorial generation');
    }

    const contextInfo = furnitureContext 
      ? `\nFurniture context: ${furnitureContext.style ? `Style: ${furnitureContext.style}` : ''} ${furnitureContext.material ? `Material: ${furnitureContext.material}` : ''} ${furnitureContext.condition ? `Condition: ${furnitureContext.condition}` : ''}`
      : '';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `Generate quick repair tutorials for a ${furnitureItem} with the following issues: ${selectedIssues.join(', ')}.${contextInfo}. 

Return a JSON object with this structure:
{
  "overview": "Brief overview of the repair plan",
  "tutorials": [
    {
      "issue": "exact issue name from the list",
      "title": "Descriptive tutorial title",
      "steps": ["step 1", "step 2", "step 3", ...],
      "materials": ["specific material 1 with brand/type", "specific material 2 with brand/type", ...]
    }
  ]
}

Generate one tutorial for each issue. Keep the steps quick to follow with minimal household materials such as screwdrivers(flathead, Phillips, etc.), wrenches(open ended, adjustable, etc.), and Allen keys(hex, square, etc.), measuring tape, hammer.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const plan = JSON.parse(content) as TutorialPlan;
    plan.furnitureItem = furnitureItem; // Ensure furniture item is set
    
    // Validate that we have tutorials for all selected issues
    if (!plan.tutorials || plan.tutorials.length === 0) {
      throw new Error('No tutorials generated');
    }

    return plan;
  } catch (error: any) {
    console.error('Error generating tutorials:', error);
    
    // Handle specific OpenAI API errors
    if (error?.status === 429) {
      if (error?.message?.includes('quota')) {
        throw new Error('OpenAI API quota exceeded. Please check your billing and plan details at https://platform.openai.com/account/billing');
      } else {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
    } else if (error?.status === 401) {
      throw new Error('Invalid API key. Please check your EXPO_PUBLIC_OPENAI_API_KEY in .env file.');
    } else if (error?.status === 400) {
      throw new Error('Invalid request. Please ensure the request is valid.');
    }
    
    throw new Error(`Failed to generate tutorials: ${error?.message || error}`);
  }
}

