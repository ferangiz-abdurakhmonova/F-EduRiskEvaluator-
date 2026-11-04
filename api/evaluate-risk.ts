import { GoogleGenAI, Type } from "@google/genai";

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

    // Initialize Google GenAI SDK with User-Agent header for telemetry
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
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
      }
    });

    const rawText = response.text || '{}';
    // Clean raw response text by stripping any markdown code fences
    const cleanedText = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    let auditResult: any;
    try {
      auditResult = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error('JSON parse error on Gemini response:', cleanedText);
      return res.status(500).json({
        success: false,
        error: 'AI evaluation response was not valid JSON format.'
      });
    }

    auditResult.evaluatedAt = new Date().toISOString();

    return res.status(200).json({ success: true, audit: auditResult });
  } catch (error: any) {
    console.error('Risk evaluation serverless error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
}
