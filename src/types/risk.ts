export type SeverityLevel = 1 | 2 | 3 | 4 | 5;

export type Department = 
  | 'IT & Cyber' 
  | 'Finance' 
  | 'Operations' 
  | 'HR' 
  | 'Legal & Compliance' 
  | 'R&D';

export type ResolutionTimeframe = 
  | 'Immediate (<24h)' 
  | '1 Week' 
  | '1 Month' 
  | '1 Quarter' 
  | 'Long Term';

export interface AIAuditFeedback {
  score: number;
  summary: string;
  strengths: string[];
  logicalFlaws: string[];
  recommendations: string[];
  evaluatedAt: string;
}

export interface RiskAssessment {
  id: string;
  riskExample: string;
  cause: string;
  consequences: string; // New field for Risk Influence, Impact & Consequences
  fixationDate: string;
  occurrenceDate: string;
  responsiblePerson: string;
  severity: SeverityLevel;
  department: Department;
  resolutionTimeframe: ResolutionTimeframe;
  mitigationStrategy: string;
  conclusion: string;
  aiAudit?: AIAuditFeedback;
  createdAt: string;
  updatedAt: string;
  studentName?: string;
  studentGroup?: string;
}

export interface ScenarioTemplate {
  title: string;
  category: string;
  description: string;
  data: Omit<RiskAssessment, 'id' | 'createdAt' | 'updatedAt'>;
}

export const PRESET_SCENARIOS: ScenarioTemplate[] = [
  {
    title: "Unencrypted Cloud Database Exposure",
    category: "IT & Cyber Security",
    description: "A production database containing 50,000 sensitive customer records was exposed to the public internet due to misconfigured AWS security groups.",
    data: {
      riskExample: "Unencrypted Cloud Database Exposure via Misconfigured Security Group",
      cause: "Engineers bypassed security group review during an urgent Friday evening deployment patch.",
      consequences: "Potential GDPR fines up to 4% of global revenue (€20M), severe customer trust damage, and mandatory public data breach notification.",
      fixationDate: new Date().toISOString().split('T')[0],
      occurrenceDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      responsiblePerson: "Head of Infrastructure & SecOps",
      severity: 5,
      department: "IT & Cyber",
      resolutionTimeframe: "Immediate (<24h)",
      mitigationStrategy: "Immediately restrict database security group ingress rules to internal VPC subnet. Rotate all database master credentials and database access keys. Enable KMS encryption at rest and audit CloudTrail logs to confirm whether unauthorized IPs accessed the data. Implement automated Terraform compliance scanning in the CI/CD pipeline to block unencrypted storage resources.",
      conclusion: "This incident highlighted a gap between release velocity and security policy enforcement. By combining immediate network isolation with long-term automated Terraform guards in CI/CD, we prevent future human bypasses while meeting regulatory GDPR requirements."
    }
  },
  {
    title: "Key Supplier Factory Shutdown & Supply Chain Delay",
    category: "Operations & Procurement",
    description: "A sole-source microchip supplier in East Asia suffered a major fire, halting deliveries for 6 weeks and threatening product manufacturing.",
    data: {
      riskExample: "Single-Source Microchip Supply Chain Stoppage Due to Supplier Factory Fire",
      cause: "Over-reliance on a single geographic supplier without secondary qualified manufacturing vendors.",
      consequences: "Complete product assembly stoppage for 6 weeks, $4.5M lost Q3 manufacturing revenue, and breach of delivery SLAs for key enterprise contracts.",
      fixationDate: new Date().toISOString().split('T')[0],
      occurrenceDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      responsiblePerson: "VP of Global Procurement & Supply Chain",
      severity: 4,
      department: "Operations",
      resolutionTimeframe: "1 Month",
      mitigationStrategy: "Re-allocate current buffer stock to high-priority customer orders. Fast-track secondary vendor qualification with European component fabricators under emergency SLA guidelines. Negotiate air-freight transport for secondary stock once qualified. Revise product BOMs to support multi-vendor pin-compatible alternatives.",
      conclusion: "Single-source procurement poses existential operational risks. Our multi-vendor qualification plan resolves immediate delivery bottlenecks and establishes a resilient dual-sourcing framework for future production."
    }
  },
  {
    title: "Interest Rate Surge & Short-Term Liquidity Strain",
    category: "Financial Risk",
    description: "Rapid increase in benchmark interest rates increased variable rate debt payments by 18%, squeezing cash flow for upcoming payroll.",
    data: {
      riskExample: "Cash Flow Compression from Variable Interest Rate Escalation",
      cause: "High exposure to unhedged floating-rate debt instruments during an aggressive central bank tightening cycle.",
      consequences: "Potential payroll funding shortfall in month 3, credit rating downgrade by ratings agencies, and increased borrowing spreads.",
      fixationDate: new Date().toISOString().split('T')[0],
      occurrenceDate: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
      responsiblePerson: "Chief Financial Officer & Treasurer",
      severity: 4,
      department: "Finance",
      resolutionTimeframe: "1 Quarter",
      mitigationStrategy: "Refinance 60% of outstanding floating debt into fixed-rate long-term notes via an interest rate swap (IRS) contract. Monetize short-term receivables through selective invoice factoring. Defer non-critical capital expenditures for Q3 to preserve operational working capital buffer.",
      conclusion: "Mitigating interest rate volatility requires active hedging rather than passive monitoring. Restructuring our debt profile secures predictable debt service costs and restores cash flow stability."
    }
  },
  {
    title: "Non-Compliance with European AI Act Directives",
    category: "Legal & Regulatory",
    description: "New AI regulatory guidelines categorize the company's automated hiring screening model as 'High Risk', creating potential compliance fines.",
    data: {
      riskExample: "High-Risk AI Model Categorization Under EU AI Act Directives",
      cause: "Deployment of algorithmic candidate screening tools without formal bias testing or human oversight audit trails.",
      consequences: "Regulatory shutdown orders on recruitment products, regulatory fines up to €35M, and class-action discrimination litigation.",
      fixationDate: new Date().toISOString().split('T')[0],
      occurrenceDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      responsiblePerson: "Chief Legal Officer & Head of AI Governance",
      severity: 3,
      department: "Legal & Compliance",
      resolutionTimeframe: "1 Month",
      mitigationStrategy: "Pause automated score filtering on HR recruitment systems and institute mandatory human review for all candidate shortlists. Engage an independent third-party auditor to conduct bias and transparency risk assessments. Publish model documentation, training data lineage, and risk mitigation procedures to satisfy EU compliance mandates.",
      conclusion: "Regulatory compliance in AI is mandatory for operational continuity. Implementing human-in-the-loop oversight eliminates immediate liability and aligns our HR AI products with global legal standards."
    }
  }
];
