import { generateObject } from 'ai'
import type { LanguageModel } from 'ai'
import { z } from 'zod'
import { openai } from '../../../echo'

export const runtime = 'edge'

// ---- Echo provider typing ----
type ModelFactory = (id: string) => LanguageModel
type BindableProvider = ModelFactory & { bind?: (opts: { request: Request }) => BindableProvider }

// ---- Input: khớp đúng UI page.tsx ----
const InputSchema = z.object({
  symptoms: z.string().min(1),                                // textarea
  age: z.enum(['child', 'teen', 'adult', 'senior']),          // select
  severity: z.enum(['mild', 'moderate', 'severe']),           // select
  duration: z.string().default(''),                           // input
  medicalHistory: z.string().default('')                      // input
})

// ---- Output: ----
const Medication = z.object({
  name: z.string(),
  dosage: z.string(),     
  duration: z.string()    
})

const Diagnosis = z.object({
  condition: z.string(),
  severity: z.string(),   
  confidence: z.string(), 
  symptoms_analyzed: z.array(z.string()).optional(),
  medications: z.array(Medication).optional(),
  recommendations: z.array(z.string()).optional(),
  precautions: z.string().optional(),
  follow_up: z.string().optional(),
  estimated_recovery_days: z.number().int().optional()
})

const OutputSchema = z.object({
  diagnoses: z.array(Diagnosis).min(3).max(5)
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const input = InputSchema.parse(body)

    // Bind provider (Echo session-aware)
    const maybeBindable = openai as unknown as BindableProvider
    const provider: BindableProvider =
      typeof maybeBindable.bind === 'function'
        ? maybeBindable.bind({ request: req })
        : maybeBindable

    // -------- Safety-first system prompt --------
    const system = [
      'You are an “AI Medical Advice Assistant.”',
      'Goal: produce 3–5 POSSIBLE causes (non-diagnostic) with safe self-care and OTC advice.',
      'Return ONLY valid JSON that matches the schema. No markdown, no extra text.',
      'DO NOT suggest prescription-only drugs or antibiotics.',
      'OTC guidance must be generic and safe (e.g., "as directed on the label"); avoid specific dosing for children unless clearly safe.',
      'Respect allergies/medical history; avoid contraindications (e.g., avoid NSAIDs if peptic ulcer/CKD/anticoagulants; avoid loperamide if bloody diarrhea/fever).',
      'Include precautions and when follow-up is appropriate; keep language concise.',
      'Prefer common conditions unless red flags strongly suggest otherwise.'
    ].join(' ')

    // -------- User payload to the model --------
    const user = JSON.stringify({
      SYMPTOMS_TEXT: input.symptoms,
      AGE_GROUP: input.age,            // child | teen | adult | senior
      SEVERITY: input.severity,        // mild | moderate | severe
      DURATION: input.duration,
      HISTORY_ALLERGIES: input.medicalHistory
    })

    // Small in-prompt schema/example to improve adherence
    const prompt = [
      'Output JSON schema (informal): { "diagnoses":[{',
      ' "condition": string,',
      ' "severity": string,',
      ' "confidence": string,',
      ' "symptoms_analyzed": [string],',
      ' "medications": [{ "name": string, "dosage": string, "duration": string }],',
      ' "recommendations": [string],',
      ' "precautions": string,',
      ' "follow_up": string,',
      ' "estimated_recovery_days": number',
      '}] }',
      'Rules:',
      '- Use only OTC options when listing medications; phrase dosing broadly (e.g., "as directed on the label").',
      '- Always include recommendations (hydration, rest, diet, local care, etc.) and precautions.',
      '- If symptoms are potentially serious, reflect that in precautions and follow_up.',
      'Patient input JSON:'
    ].join('\n')

    const modelIds: ReadonlyArray<string> = ['gpt-4o-mini', 'gpt-4o']
    let lastError: unknown = null

    for (const id of modelIds) {
      try {
        const { object } = await generateObject({
          model: provider(id),
          system,
          prompt: `${prompt}\n${user}`,
          schema: OutputSchema,
          temperature: 0.25,
          maxOutputTokens: 900
        })

        // Trả đúng shape client đang parse { diagnoses?: Diagnosis[] }
        return new Response(JSON.stringify(object), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (e) {
        lastError = e
      }
    }

    const detail =
      lastError instanceof Error ? lastError.message
      : typeof lastError === 'string' ? lastError
      : 'Unknown model error'

    console.error('diagnose route model error:', lastError)
    return new Response(JSON.stringify({ error: 'Model did not return valid JSON', detail }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown error'
    console.error('diagnose route error:', err)
    return new Response(JSON.stringify({ error: 'Bad request or server error', detail: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

