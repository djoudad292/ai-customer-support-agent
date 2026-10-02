import { Injectable, Logger } from '@nestjs/common';

/** Dimensionality of the pgvector column declared on `Chunk.embedding`. */
export const EMBEDDING_DIM = 1536;

/** A cold OpenAI call must not pin a chat request open. */
const EMBEDDING_TIMEOUT_MS = 15000;

/** OpenAI caps the input; keep well inside it so a chunk never gets truncated mid-word. */
const EMBEDDING_MAX_CHARS = 8000;

export class EmbeddingUnavailableError extends Error {
  readonly code = 'EMBEDDING_UNAVAILABLE';

  constructor(message: string) {
    super(message);
    this.name = 'EmbeddingUnavailableError';
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const deadline = new Promise<T>((_, reject) => {
    timer = setTimeout(
      () => reject(new EmbeddingUnavailableError(`${label}_TIMEOUT_${ms}ms`)),
      ms,
    );
  });
  // Always clear the timer: a pending 15s deadline per embedding would pin the
  // event loop open long after the request finished.
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer)) as Promise<T>;
}

/**
 * Real 1536-dim embeddings from OpenAI (`text-embedding-3-small` by default).
 *
 * Deliberately has NO local hash fallback: a placeholder vector is
 * indistinguishable from a real one at query time and silently destroys
 * ranking quality. Every failure is surfaced as EmbeddingUnavailableError so
 * the retrieval layer can degrade to keyword mode instead.
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  get isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  get model(): string {
    return process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
  }

  private get apiKey(): string {
    return process.env.OPENAI_API_KEY || '';
  }

  /**
   * @throws EmbeddingUnavailableError when the key is missing or the API call
   * fails — callers must not substitute a meaningless vector.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = this.apiKey;
    if (!apiKey) {
      throw new EmbeddingUnavailableError('OPENAI_API_KEY missing — vector retrieval unavailable');
    }

    const res = await withTimeout(
      fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: String(text ?? '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, EMBEDDING_MAX_CHARS),
        }),
      }),
      EMBEDDING_TIMEOUT_MS,
      'embedding',
    ).catch((err: Error) => {
      throw err instanceof EmbeddingUnavailableError
        ? err
        : new EmbeddingUnavailableError(`embedding request failed: ${err.message}`);
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new EmbeddingUnavailableError(
        `OpenAI embedding HTTP ${res.status}: ${body.slice(0, 150)}`,
      );
    }

    const json: any = await res.json().catch((err: Error) => {
      throw new EmbeddingUnavailableError(`embedding response unreadable: ${err.message}`);
    });
    const embedding: unknown = json?.data?.[0]?.embedding;
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new EmbeddingUnavailableError('OpenAI returned no embedding vector');
    }
    if (embedding.length !== EMBEDDING_DIM) {
      throw new EmbeddingUnavailableError(
        `embedding dim ${embedding.length} != ${EMBEDDING_DIM} (model ${this.model})`,
      );
    }
    return embedding as number[];
  }

  /**
   * Never throws. `null` means "no vector available for this text" — the
   * caller either skips embedding the row or degrades retrieval to keywords.
   */
  async tryGenerateEmbedding(text: string): Promise<number[] | null> {
    try {
      return await this.generateEmbedding(text);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Embedding unavailable: ${message}`);
      return null;
    }
  }
}
