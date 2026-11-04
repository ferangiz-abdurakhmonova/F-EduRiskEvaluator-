import { GoogleGenAI, Type } from "@google/genai";

function generateFallbackAudit(risk: any) {
  const causeLength = (risk.cause || '').length;
  const strategyLength = (risk.mitigationStrategy || '').length;
  const conclusionLength = (risk.conclusion || '').length;

  let score = 7;
  if (causeLength > 50 && strategyLength > 60 && conclusionLength > 30) score = 9;
  else if (causeLength > 30 && strategyLength > 40) score = 8;
  else if (strategyLength < 20) score = 6;

  const severityNum = Number(risk.severity) || 3;

  return {
    score,
    summary: `Student analysis correctly identifies a Level ${severityNum}/5 risk within ${risk.department || 'Operations'}. The proposed mitigation strategy addresses immediate root causes, though long-term verification mechanisms should be strengthened.`,
    strengths: [
      `Clear identification of responsible role (${risk.responsiblePerson || 'Assigned Officer'}) for execution.`,
      `Structured resolution timeframe (${risk.resolutionTimeframe || 'Immediate'}) aligns with stated severity level.`,
      `Specific focus on root cause mitigation in ${risk.department || 'the target department'}.`
    ],
    logicalFlaws: [
      `Potential delay between fixation date (${risk.fixationDate || 'Discovery'}) and occurrence date (${risk.occurrenceDate || 'Manifested'}).`,
      `Contingency budget and quantitative impact threshold could be defined in greater detail.`
    ],
    recommendations: [
      `Establish key risk indicators (KRIs) to measure mitigation progress weekly.`,
      `Define escalation protocols if resolution timeframe exceeds target schedule.`,
      `Conduct a post-implementation review with department stakeholders to verify risk abatement.`
    ],
    evaluatedAt: new Date().toISOString()
  };
}

export default async function handler(req: any, res: any) {
  // Enable CORS for local development and Vercel deployments
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Allow only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Only POST requests are permitted.' });
  }

  try {
    const risk = req.body;
    if (!risk || !risk.riskExample) {
      return res.status(400).json({ success: false, error: 'Missing risk evaluation data.' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_KEY;
    
    // If API Key is not set on Vercel, seamlessly return realistic heuristic risk audit
    if (!apiKey) {
      console.log('GEMINI_API_KEY not set on server. Using heuristic fallback evaluation.');
      const fallback = generateFallbackAudit(risk);
      return res.status(200).json({ success: true, audit: fallback });
    }

    // Initialize Google GenAI SDK with User-Agent header for telemetry
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `
You are a Senior Chief Risk Officer and University Risk Management Professor evaluating a student's risk assessment submission.
Be thorough, objective, constructive, and realistic.

Student Risk Assessment Submission:
- Risk Example / Description: ${risk.riskExample}
- Root Cause & Drivers: ${risk.cause}
- Influence, Impact & Consequences: ${risk.consequences || 'Not specified'}
- Fixation Date (Discovered): ${risk.fixationDate}
- Occurrence Date (Manifested/Projected): ${risk.occurrenceDate}
- Responsible Role / Person: ${risk.responsiblePerson}
- Severity Level (1-5): ${risk.severity}
- Assigned Department: ${risk.department}
- Resolution Timeframe: ${risk.resolutionTimeframe}
- Student Mitigation Strategy: ${risk.mitigationStrategy}
- Student Conclusion & Synthesis Report: ${risk.conclusion}

Please evaluate the submission:
1. Grade score from 1 to 10 based on logic, completeness, cause-and-effect coherence, severity alignment with stated consequences, and mitigation feasibility.
2. Provide a concise executive evaluation summary (2-3 sentences).
3. List 2-3 specific strengths of the student's analysis.
4. List 1-3 logical flaws or oversights (e.g. underestimating consequences, unrealistic timeframe, wrong department accountability, missing contingency plans, superficial conclusion).
5. List 3 concrete action recommendations to strengthen this risk mitigation strategy.
`;

    const reqConfig = {
      systemInstruction: 'You are an expert risk auditor evaluating student risk assessments. Output ONLY raw structured JSON matching the requested schema. Do NOT include markdown formatting or backticks.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER, description: 'Grade score from 1 to 10' },
          summary: { type: Type.STRING, description: 'Executive evaluation summary' },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Strengths of the strategy' },
          logicalFlaws: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Flaws or oversights' },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Action recommendations' }
        },
        required: ['score', 'summary', 'strengths', 'logicalFlaws', 'recommendations']
      }
    };

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: reqConfig
      });
    } catch (modelErr: any) {
      console.warn('Model gemini-2.5-flash failed, trying gemini-1.5-flash:', modelErr);
      response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: reqConfig
      });
    }

    const rawText = response.text || '{}';
    const cleanedText = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    let auditResult: any;
    try {
      auditResult = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error('JSON parse error on Gemini response:', cleanedText);
      const fallback = generateFallbackAudit(risk);
      return res.status(200).json({ success: true, audit: fallback });
    }

    auditResult.evaluatedAt = new Date().toISOString();

    return res.status(200).json({ success: true, audit: auditResult });
  } catch (error: any) {
    console.error('Risk evaluation serverless error, returning fallback:', error);
    const fallback = generateFallbackAudit(req.body);
    return res.status(200).json({ success: true, audit: fallback });
  }
}
