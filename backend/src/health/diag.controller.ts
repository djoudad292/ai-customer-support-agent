import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

interface ProbeResult {
  ok: boolean;
  ms?: number;
  status?: number;
  err?: string;
}

interface GeminiModelResult {
  model: string;
  ok: boolean;
  status?: number;
  ms: number;
  err?: string;
}

interface GeminiKeyResult {
  i: number;
  keyTail: string;
  ok: boolean;
  ms: number;
  models: GeminiModelResult[];
}

interface GeminiResult {
  ok: boolean;
  keys: GeminiKeyResult[];
  err?: string;
}

function sanitizeErr(err: string | undefined): string | undefined {
  if (!err) return err;
  return err
    .replace(/sk-or-[a-zA-Z0-9-]+/g, '***')
    .replace(/AIza[a-zA-Z0-9_-]{10,}/g, '***');
}

@ApiTags('Health')
@Controller()
export class DiagController {
  @Get('diag')
  @ApiOperation({ summary: 'Live LLM provider probe (read-only)' })
  async probe(): Promise<Record<string, unknown>> {
    const llmModel = process.env.LLM_MODEL || 'meta-llama/llama-3.1-8b-instruct';

    const openrouter = await this.probeOpenRouter(llmModel);
    const gemini = await this.probeGemini();

    return {
      ok: openrouter.ok || gemini.ok,
      llmModel,
      openrouter,
      gemini,
      timestamp: new Date().toISOString(),
    };
  }

  private async probeOpenRouter(model: string): Promise<ProbeResult> {
    if (!process.env.OPENROUTER_API_KEY) {
      return { ok: false, err: 'NO_KEY' };
    }
    const start = Date.now();
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Reply with OK' }],
          max_tokens: 16,
        }),
      });
      const ms = Date.now() - start;
      if (!res.ok) {
        const body = await res.text();
        return {
          ok: false,
          ms,
          status: res.status,
          err: sanitizeErr(`HTTP_${res.status}_${body.slice(0, 200)}`),
        };
      }
      return { ok: true, ms, status: res.status };
    } catch (e) {
      return { ok: false, ms: Date.now() - start, err: sanitizeErr(String(e).slice(0, 200)) };
    }
  }

  private async probeGemini(): Promise<GeminiResult> {
    const geminiModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];
    const geminiKeys: string[] = [
      process.env.GOOGLE_API_KEY,
      ...(process.env.GOOGLE_API_KEY_2 ? process.env.GOOGLE_API_KEY_2.split(/[\s,]+/) : []),
    ].filter(Boolean);
    const keys = geminiKeys.slice(0, 3);
    if (keys.length === 0) {
      return { ok: false, keys: [], err: 'NO_KEY' };
    }
    const results: GeminiKeyResult[] = [];
    let anyOk = false;
    for (let i = 0; i < keys.length; i++) {
      const keyResult: GeminiKeyResult = { i, keyTail: keys[i].slice(-4), ok: false, ms: 0, models: [] };
      for (const model of geminiModels) {
        const start = Date.now();
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keys[i]}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: AbortSignal.timeout(6000),
              body: JSON.stringify({
                contents: [{ parts: [{ text: 'Reply with OK' }] }],
              }),
            },
          );
          const ms = Date.now() - start;
          if (res.ok) {
            keyResult.ok = true;
            anyOk = true;
            keyResult.models.push({ model, ok: true, status: res.status, ms });
          } else {
            const body = await res.text();
            keyResult.models.push({
              model,
              ok: false,
              status: res.status,
              ms,
              err: sanitizeErr(`HTTP_${res.status}_${body.slice(0, 200)}`),
            });
          }
        } catch (e) {
          keyResult.models.push({
            model,
            ok: false,
            ms: Date.now() - start,
            err: sanitizeErr(String(e).slice(0, 200)),
          });
        }
      }
      keyResult.ms = keyResult.models.reduce((acc, m) => acc + m.ms, 0);
      results.push(keyResult);
    }
    return { ok: anyOk, keys: results };
  }
}
