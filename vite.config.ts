import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { GoogleGenAI } from '@google/genai';
import type { IncomingMessage, ServerResponse } from 'http';

function geminiServerPlugin(): Plugin {
  return {
    name: 'gemini-server-proxy',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        if (!req.url?.startsWith('/api/gemini/')) {
          return next();
        }

        const env = loadEnv('development', process.cwd(), '');
        const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || '';
        const modelName = process.env.GEMINI_MODEL || env.GEMINI_MODEL || 'gemini-2.5-flash';

        res.setHeader('Content-Type', 'application/json');

        const isKeyConfigured = Boolean(
          apiKey && 
          apiKey.trim().length > 10 && 
          !apiKey.includes('PASTE_') && 
          !apiKey.includes('your_') && 
          !apiKey.includes('YOUR_')
        );

        // Helper to read JSON body
        const readBody = async (): Promise<Record<string, unknown>> => {
          return new Promise((resolve) => {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch {
                resolve({});
              }
            });
          });
        };

        // Helper to generate content with fallback models
        const generateWithFallback = async (ai: GoogleGenAI, contents: string, preferredModel: string) => {
          const modelsToTry = [
            preferredModel,
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-1.5-flash',
            'gemini-1.5-flash-8b',
            'gemini-pro'
          ].filter((v, i, a) => a.indexOf(v) === i && Boolean(v));

          let lastError: unknown = null;
          for (const m of modelsToTry) {
            try {
              // Wrap call in a 5-second timeout
              const callPromise = ai.models.generateContent({
                model: m,
                contents
              });
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`Timeout on model ${m}`)), 6000)
              );
              
              const res = await Promise.race([callPromise, timeoutPromise]) as { text?: string };
              if (res && res.text) {
                return { text: res.text, modelUsed: m };
              }
            } catch (err: unknown) {
              lastError = err;
            }
          }
          throw lastError || new Error('Failed to generate with any Gemini model');
        };

        // 1. Connection Test Endpoint
        if (req.url === '/api/gemini/test') {
          if (!isKeyConfigured) {
            res.statusCode = 200;
            return res.end(JSON.stringify({
              status: 'demo',
              mode: 'DEMO AI MODE',
              message: 'Running in Demo AI Mode (No GEMINI_API_KEY configured in .env)',
              model: modelName,
              configured: false
            }));
          }

          const start = Date.now();
          try {
            const ai = new GoogleGenAI({ apiKey });
            const result = await generateWithFallback(ai, 'Ping DOMINO AI. Reply "OK".', modelName);

            if (result?.text) {
              const latencyMs = Date.now() - start;
              res.statusCode = 200;
              return res.end(JSON.stringify({
                status: 'connected',
                mode: 'LIVE GEMINI',
                message: 'Gemini connection successful ✓',
                model: result.modelUsed,
                latencyMs,
                configured: true
              }));
            } else {
              throw new Error('Empty response from Gemini');
            }
          } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Connection failed';
            res.statusCode = 200;
            return res.end(JSON.stringify({
              status: 'error',
              mode: 'DEMO AI MODE',
              message: 'Gemini unavailable — Demo Mode active',
              error: errorMessage,
              model: modelName,
              configured: false
            }));
          }
        }

        // 2. Parse Trip Endpoint
        if (req.url === '/api/gemini/parse-trip') {
          const body = await readBody();
          if (!isKeyConfigured) {
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: false, fallback: true }));
          }
          try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `You are DOMINO Trip Parser. Normalize this travel text into a journey summary: "${body.rawText || 'Nagpur to Mumbai via Delhi'}". Return a JSON object with keys: summary (string), eventsCount (number), origin (string), destination (string).`;
            const result = await generateWithFallback(ai, prompt, modelName);
            const text = result?.text || '';
            const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, ...parsed, source: 'GEMINI', model: result.modelUsed }));
          } catch {
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: false, fallback: true }));
          }
        }

        // 3. Explain Disruption Endpoint
        if (req.url === '/api/gemini/explain-disruption') {
          const body = await readBody();
          if (!isKeyConfigured) {
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: false, fallback: true }));
          }
          try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `You are DOMINO Disruption Agent. Explain in 1 crisp sentence why flight ${body.flightCode} is delayed by +${body.delayMinutes} minutes due to "${body.reason}" and how it shifts the schedule.`;
            const result = await generateWithFallback(ai, prompt, modelName);
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, text: result?.text?.trim(), model: result.modelUsed }));
          } catch {
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: false, fallback: true }));
          }
        }

        // 4. Explain Impact Endpoint
        if (req.url === '/api/gemini/explain-impact') {
          const body = await readBody();
          if (!isKeyConfigured) {
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: false, fallback: true }));
          }
          try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `You are DOMINO Disruption AI. Explain in 2 concise sentences why event "${body.nodeTitle}" (${body.scheduledStart}) is affected by a +${body.delayMinutes}m delay on upstream flight (Reason: ${body.reason}). Focus on temporal buffer exhaustion.`;
            const result = await generateWithFallback(ai, prompt, modelName);
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, text: result?.text?.trim(), model: result.modelUsed }));
          } catch {
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: false, fallback: true }));
          }
        }

        // 5. Explain Recovery Endpoint
        if (req.url === '/api/gemini/explain-recovery') {
          const body = await readBody();
          if (!isKeyConfigured) {
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: false, fallback: true }));
          }
          try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `You are DOMINO Replanning Agent. Summarize recovery plan "${body.planName}" for a +${body.delayMinutes}m delay in 2 crisp, executive sentences explaining preserved priorities and trade-offs.`;
            const result = await generateWithFallback(ai, prompt, modelName);
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, text: result?.text?.trim(), model: result.modelUsed }));
          } catch {
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: false, fallback: true }));
          }
        }

        // 6. Generate Notification Endpoint
        if (req.url === '/api/gemini/generate-notification') {
          const body = await readBody();
          if (!isKeyConfigured) {
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: false, fallback: true }));
          }
          try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `Generate a polite, 2-sentence WhatsApp alert to ${body.recipientRole} ${body.recipientName} regarding updated schedule under ${body.worldTitle}.`;
            const result = await generateWithFallback(ai, prompt, modelName);
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, text: result?.text?.trim(), model: result.modelUsed }));
          } catch {
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: false, fallback: true }));
          }
        }

        return next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), geminiServerPlugin()],
});
