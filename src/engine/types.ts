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
  isInferred?: boolean; // True if inferred from parent dependency (e.g. Next.js -> React) rather than direct detection
  evidence: SignalEvidence[];
  website: string;
  icon: string;
  description: string;
}

export interface ScanResult {
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
