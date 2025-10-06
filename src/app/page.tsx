'use client'
import { EchoSignIn } from '@merit-systems/echo-next-sdk/client'
import { useState } from 'react'

type Medication = { name: string; dosage: string; duration: string }
type Diagnosis = {
  condition: string
  severity: string
  confidence: string
  symptoms_analyzed?: string[]
  medications?: Medication[]
  recommendations?: string[]
  precautions?: string
  follow_up?: string
  estimated_recovery_days?: number
}

export default function Page() {
  const [symptoms, setSymptoms] = useState('headache, mild fever, feeling tired')
  const [age, setAge] = useState('adult')
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('mild')
  const [duration, setDuration] = useState('2-3 days')
  const [history, setHistory] = useState('none')
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string>('')

  async function generate() {
    try {
      setLoading(true)
      setErr('')
      setDiagnoses([])

      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms, age, severity, duration, medicalHistory: history }),
      })

      if (!res.ok) {
        const t = await res.text().catch(() => '')
        throw new Error(t || 'Failed to generate diagnosis')
      }

      const data: { diagnoses?: Diagnosis[] } = await res.json()
      setDiagnoses(Array.isArray(data.diagnoses) ? data.diagnoses : [])
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong'
      setErr(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="medical-diagnosis-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent-blue)' }}>
          AI Medical Diagnosis 🏥
        </h1>
        <EchoSignIn />
      </header>

      <p style={{ opacity: 0.8, margin: '12px 0 24px', fontSize: 16 }}>
        Describe your symptoms and get 3–5 possible diagnoses with treatment recommendations.
      </p>

      <div style={{ display: 'grid', gap: 14 }}>
        <div className="input-wrapper">
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Your Symptoms & Condition
          </label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows={3}
            placeholder="e.g., persistent headache, high fever, chest pain, difficulty breathing..."
            style={{
              background: 'var(--input-bg)',
              border: '2px solid var(--border-color)',
              borderRadius: 12,
              padding: 14,
              width: '100%',
              transition: 'all 0.3s ease',
              color: 'var(--text-primary)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent-blue)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="input-wrapper">
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Age Group
            </label>
            <select
              value={age}
              onChange={(e) => setAge(e.target.value)}
              style={{
                background: 'var(--input-bg)',
                border: '2px solid var(--border-color)',
                borderRadius: 10,
                padding: 12,
                width: '100%',
                color: 'var(--text-primary)'
              }}
            >
              <option value="child">Child (0-12) 👶</option>
              <option value="teen">Teen (13-19) 👦</option>
              <option value="adult">Adult (20-64) 👨</option>
              <option value="senior">Senior (65+) 👴</option>
            </select>
          </div>

          <div className="input-wrapper">
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Severity
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as 'mild' | 'moderate' | 'severe')}
              style={{
                background: 'var(--input-bg)',
                border: '2px solid var(--border-color)',
                borderRadius: 10,
                padding: 12,
                width: '100%',
                color: 'var(--text-primary)'
              }}
            >
              <option value="mild">Mild 🟢</option>
              <option value="moderate">Moderate 🟡</option>
              <option value="severe">Severe 🔴</option>
            </select>
          </div>
        </div>

        <div className="input-wrapper">
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Duration
          </label>
          <input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="1 day, 3 days, 1 week, 2 weeks..."
            style={{
              background: 'var(--input-bg)',
              border: '2px solid var(--border-color)',
              borderRadius: 10,
              padding: 12,
              width: '100%',
              color: 'var(--text-primary)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent-blue)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
          />
        </div>

        <div className="input-wrapper">
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Medical History & Allergies
          </label>
          <input
            value={history}
            onChange={(e) => setHistory(e.target.value)}
            placeholder="diabetes, hypertension, penicillin allergy..."
            style={{
              background: 'var(--input-bg)',
              border: '2px solid var(--border-color)',
              borderRadius: 10,
              padding: 12,
              width: '100%',
              color: 'var(--text-primary)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent-blue)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
          />
        </div>

        <button
          onClick={generate}
          disabled={loading || !symptoms.trim()}
          className="generate-button"
          style={{
            background: loading ? 'var(--accent-dark)' : 'linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-dark) 100%)',
            color: '#ffffff',
            padding: '14px 20px',
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 16,
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            opacity: loading ? 0.6 : 1,
            boxShadow: loading ? 'none' : '0 4px 12px var(--shadow)'
          }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {loading ? 'Analyzing... 🔍' : 'Get Diagnosis 🏥'}
        </button>

        {err && (
          <div style={{
            color: '#dc2626',
            background: '#fee2e2',
            padding: 12,
            borderRadius: 10,
            border: '2px solid #fecaca'
          }}>
            {err}
          </div>
        )}
      </div>

      <section style={{ marginTop: 32, display: 'grid', gap: 20 }}>
        {diagnoses.map((d, i) => (
          <div
            key={i}
            className="diagnosis-card"
            style={{
              border: '2px solid var(--border-color)',
              borderRadius: 20,
              padding: 24,
              background: 'var(--card-bg)',
              boxShadow: '0 8px 24px var(--shadow)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 12px 32px var(--shadow)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 24px var(--shadow)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
              <h3 style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                {d.condition} 🏥
              </h3>
              <span style={{
                opacity: 0.8,
                background: 'var(--input-bg)',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 14,
                border: '1px solid var(--border-color)'
              }}>
                {d.severity}
              </span>
            </div>

            {d.confidence && (
              <p style={{
                opacity: 0.85,
                marginBottom: 12,
                fontStyle: 'italic',
                color: 'var(--text-secondary)'
              }}>
                Confidence Level: {d.confidence}
              </p>
            )}

            <div style={{
              background: 'var(--input-bg)',
              padding: 16,
              borderRadius: 12,
              marginBottom: 12,
              border: '1px solid var(--border-color)'
            }}>
              <h4 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--accent-blue)' }}>Recommended Medications:</h4>
              <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                {d.medications?.map((med: Medication, idx: number) => (
                  <li key={idx} style={{ color: 'var(--text-primary)' }}>
                    <strong>{med.name}</strong> - {med.dosage} for {med.duration}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{
              background: 'var(--input-bg)',
              padding: 16,
              borderRadius: 12,
              marginBottom: 12,
              border: '1px solid var(--border-color)'
            }}>
              <h4 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--accent-blue)' }}>Care Instructions:</h4>
              <ol style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                {d.recommendations?.map((rec: string, idx: number) => (
                  <li key={idx} style={{ marginBottom: 6, color: 'var(--text-primary)' }}>{rec}</li>
                ))}
              </ol>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              opacity: 0.85,
              fontSize: 14
            }}>
              <span>
                <strong>⚠️ Precautions:</strong> {d.precautions}
              </span>
              <span>
                <strong>Recovery:</strong> ~{d.estimated_recovery_days} days ⏱️
              </span>
              {d.follow_up && (
                <span>
                  <strong>Follow-up:</strong> {d.follow_up}
                </span>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
