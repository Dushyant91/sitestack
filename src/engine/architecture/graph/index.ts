/**
 * SiteStack Architecture Intelligence Module - Graph Engine
 * Location: src/engine/architecture/graph/index.ts
 *
 * Public entrypoint for the deterministic architecture graph engine:
 * - Graph data model and inference provenance types
 * - Pure graph builder (buildArchitectureGraph)
 * - Deterministic graph validator (validateArchitectureGraph)
 * - Dynamic layout preparation (prepareGraphLayout)
 */

export * from './types';
export * from './build-graph';
export * from './validate-graph';
export * from './layout';
