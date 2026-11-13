export type TechCategory =
  | 'cms'
  | 'framework'
  | 'library'
  | 'analytics'
  | 'marketing'
  | 'ecommerce'
  | 'payment'
  | 'infrastructure';

export type ConfidenceTier = 'high' | 'medium' | 'low';

export type SignalType = 'global' | 'meta' | 'dom' | 'resource' | 'header' | 'inferred';

export interface SignalEvidence {
  type: SignalType;
  source: string;
  matchedValue?: string;
  weight: number;
}

export interface MetaRuleSignal {
  name?: string;
  property?: string;
  contentRegex?: RegExp;
  weight: number;
}

export interface DomRuleSignal {
  selector: string;
  attribute?: string;
  valueRegex?: RegExp;
  weight: number;
}

export interface GlobalRuleSignal {
  path: string;
  valueRegex?: RegExp;
  weight: number;
}

export interface ResourceRuleSignal {
  urlRegex: RegExp;
  weight: number;
}

export interface HeaderRuleSignal {
  name: string;
  valueRegex: RegExp;
  weight: number;
}

export interface VersionExtractor {
  fromGlobal?: string;
  fromMeta?: { name: string; regex: RegExp };
  fromResource?: { urlRegex: RegExp; captureGroup: number };
  fromDom?: { selector: string; attribute?: string; regex: RegExp };
}

export interface TechRule {
  id: string;
  name: string;
  category: TechCategory;
  website: string;
  icon: string;
  description: string;
  implies?: string[];
  signals: {
    meta?: MetaRuleSignal[];
    dom?: DomRuleSignal[];
    globals?: GlobalRuleSignal[];
    resources?: ResourceRuleSignal[];
    headers?: HeaderRuleSignal[];
  };
  versionExtraction?: VersionExtractor;
}

export interface HarvestedMeta {
  name?: string;
  property?: string;
  content: string;
}

export interface HarvestedDomElement {
  selector: string;
  attribute?: string;
  value?: string;
}

export interface HarvestedSignals {
  url: string;
  meta: HarvestedMeta[];
  dom: HarvestedDomElement[];
  globals: Record<string, unknown>;
  resources: string[];
  headers?: Record<string, string>;
}

export interface DetectedTechnology {
  id: string;
  name: string;
  category: TechCategory;
  version?: string;
  confidenceScore: number; // 0 - 100
  confidenceTier: ConfidenceTier;
  detectionType: 'direct' | 'inferred';
  parentDependency?: string; // If inferred, the parent technology that implied it (e.g. 'Next.js')
  dependentTechnologies?: string[]; // If parent, list of technologies inferred from this one (e.g. ['React'])
  confidenceReason?: string; // Explainable human-readable justification of the confidence score and detection tier
  isInferred?: boolean; // Convenience flag: true when detectionType === 'inferred'
  evidence: SignalEvidence[];
  website: string;
  icon: string;
  description: string;
}

export interface ScanResult {
  id?: string; // Optional unique identifier (e.g. domain_timestamp)
  url: string;
  domain: string;
  timestamp: number;
  technologies: DetectedTechnology[];
  stats: {
    total: number;
    high: number;
    medium: number;
    low: number;
  };
  scanDurationMs: number;
}
