export const CLEF_FLASH = '@cf/cloudflare/clef-flash';

/** Shapes from https://developers.cloudflare.com/workers-ai/models/clef-flash/ */
export type ChoiceQuestion = {
  type: 'choice';
  instructions: string;
  criteria: Record<string, string | null>;
};

export type DecisionRequest = {
  model: 'clef-flash';
  state: unknown;
  questions: Record<string, ChoiceQuestion>;
};

export type ChoiceAnswer = {
  type: 'choice';
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
};

export type DecisionResponse = {
  model: string;
  answers: Record<string, ChoiceAnswer>;
  usage: { input_tokens: number; output_tokens: number };
};

export type Decide = (request: DecisionRequest) => Promise<DecisionResponse>;

export type CategoryOption = { id: number; name: string; icon: string | null };

export type CategorySuggestion = {
  categoryId: number;
  confidence: number;
  probabilities: Record<string, number>;
  inputTokens: number;
};

export const FALLBACK_CATEGORY = 'Sin Categorizar';
export const DEFAULT_MIN_CONFIDENCE = 0.6;
export const DEFAULT_TIMEOUT_MS = 1500;

/** The `AI` binding has no typings for Clef models yet. */
export function decideWithBinding(ai: Ai): Decide {
  return (request) =>
    (ai.run as (model: string, input: unknown) => Promise<unknown>)(
      CLEF_FLASH,
      request,
    ) as Promise<DecisionResponse>;
}

export function buildCategoryRequest(
  tx: { title: string; amount: number; type: 'expense' | 'income' },
  categories: CategoryOption[],
): DecisionRequest | null {
  const options = categories.filter((c) => c.name !== FALLBACK_CATEGORY);
  // Choice questions need at least two options.
  if (options.length < 2) return null;

  return {
    model: 'clef-flash',
    state: {
      merchant_or_description: tx.title,
      amount_clp: tx.amount,
      kind: tx.type === 'expense' ? 'expense' : 'income',
      country: 'Chile',
    },
    questions: {
      category: {
        type: 'choice',
        instructions:
          "This is a personal finance transaction from Chile, often a raw card statement descriptor. Which of the user's categories does it belong to?",
        criteria: Object.fromEntries(
          options.map((c) => [String(c.id), c.name]),
        ),
      },
    },
  };
}

/**
 * Returns null when the model is unsure, slow or failing so the caller keeps
 * its fallback category; categorization must never block saving a transaction.
 */
export async function suggestCategory(
  decide: Decide,
  tx: { title: string; amount: number; type: 'expense' | 'income' },
  categories: CategoryOption[],
  {
    minConfidence = DEFAULT_MIN_CONFIDENCE,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  }: { minConfidence?: number; timeoutMs?: number } = {},
): Promise<CategorySuggestion | null> {
  const request = buildCategoryRequest(tx, categories);
  if (!request) return null;

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const response = await Promise.race([
      decide(request),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('categorize timeout')),
          timeoutMs,
        );
      }),
    ]);
    const answer = response?.answers?.category;
    if (!answer || answer.confidence < minConfidence) return null;

    const categoryId = Number(answer.choice);
    if (!categories.some((c) => c.id === categoryId)) return null;

    return {
      categoryId,
      confidence: answer.confidence,
      probabilities: answer.probabilities,
      inputTokens: response.usage?.input_tokens ?? 0,
    };
  } catch (err) {
    console.warn('categorize failed', err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
