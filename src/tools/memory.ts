import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ToolDefinition } from './types.js';

const memoryFile = path.resolve('data/memory.json');

type Memory = {
  id: number;
  text: string;
  category: string;
  importance: number;
  created_at: string;
  updated_at: string;
};

async function loadMemories(): Promise<Memory[]> {
  try {
    const data = await fs.readFile(memoryFile, 'utf8');
    return JSON.parse(data) as Memory[];
  } catch {
    return [];
  }
}

async function saveMemories(memories: Memory[]) {
  await fs.mkdir(path.dirname(memoryFile), { recursive: true });
  await fs.writeFile(
    memoryFile,
    JSON.stringify(memories, null, 2),
    'utf8'
  );
}

export const memoryTool: ToolDefinition = {
  name: 'remember',
  description:
    'Save useful information to NOVA local memory. Use categories and importance to organize memories and avoid unnecessary duplicates.',

  permission: 'write_low_risk',

  parameters: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The information to remember.'
      },
      category: {
        type: 'string',
        description:
          'Memory category such as preference, project, person, fact, instruction, or other.'
      },
      importance: {
        type: 'number',
        description: 'Importance from 1 to 5.'
      }
    },
    required: ['text'],
    additionalProperties: false
  },

  async execute(args) {
    const text = String(args.text ?? '').trim();

    if (!text) {
      throw new Error('Memory text is required');
    }

    const category = String(args.category ?? 'other').trim().toLowerCase();

    const importance = Math.min(
      5,
      Math.max(1, Number(args.importance ?? 3))
    );

    const memories = await loadMemories();

    const normalized = text.toLowerCase();

    const duplicate = memories.find(
      memory => memory.text.toLowerCase() === normalized
    );

    if (duplicate) {
      duplicate.updated_at = new Date().toISOString();
      duplicate.importance = importance;
      duplicate.category = category;

      await saveMemories(memories);

      return {
        success: true,
        action: 'updated_existing_memory',
        memory: duplicate
      };
    }

    const now = new Date().toISOString();

    const memory: Memory = {
      id: Date.now(),
      text,
      category,
      importance,
      created_at: now,
      updated_at: now
    };

    memories.push(memory);

    await saveMemories(memories);

    return {
      success: true,
      action: 'created_memory',
      memory
    };
  }
};

export const recallTool: ToolDefinition = {
  name: 'recall',
  description:
    'Recall relevant information from NOVA local memory. Results are ranked by relevance and importance.',

  permission: 'read_only',

  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'What information to look for in memory.'
      },
      category: {
        type: 'string',
        description: 'Optional category filter.'
      }
    },
    required: ['query'],
    additionalProperties: false
  },

  async execute(args) {
    const query = String(args.query ?? '').trim().toLowerCase();

    if (!query) {
      throw new Error('Memory query is required');
    }

    const category = String(args.category ?? '').trim().toLowerCase();

    const memories = await loadMemories();

    const words = query
      .split(/\s+/)
      .filter(word => word.length > 1);

    const scored = memories
      .filter(memory =>
        !category || memory.category.toLowerCase() === category
      )
      .map(memory => {
        const text = memory.text.toLowerCase();

        let score = 0;

        for (const word of words) {
          if (text.includes(word)) {
            score += 1;
          }
        }

        score += memory.importance * 0.2;

        return {
          memory,
          score
        };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return {
      query,
      count: scored.length,
      memories: scored.slice(0, 10).map(item => item.memory)
    };
  }
};

export const listMemoriesTool: ToolDefinition = {
  name: 'list_memories',
  description: 'List recently saved memories from NOVA local memory.',
  permission: 'read_only',

  parameters: {
    type: 'object',
    properties: {},
    additionalProperties: false
  },

  async execute() {
    const memories = await loadMemories();

    return {
      success: true,
      memories: memories.slice(-20)
    };
  }
};

export const forgetMemoryTool: ToolDefinition = {
  name: 'forget_memory',
  description: 'Delete a specific saved memory by its ID.',
  permission: 'write_low_risk',

  parameters: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'The ID of the memory to delete.'
      }
    },
    required: ['id'],
    additionalProperties: false
  },

  async execute(args) {
    const id = Number(args.id);

    if (!Number.isFinite(id)) {
      throw new Error('A valid memory ID is required');
    }

    const memories = await loadMemories();
    const index = memories.findIndex(memory => memory.id === id);

    if (index === -1) {
      return {
        success: false,
        message: `No memory found with ID ${id}.`
      };
    }

    const [deleted] = memories.splice(index, 1);
    await saveMemories(memories);

    return {
      success: true,
      deleted
    };
  }
};

