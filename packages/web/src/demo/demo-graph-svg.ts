/**
 * SiteStack Interactive Product Demo — Vector Architecture Graph SVG Generator
 *
 * Generates an accessible, responsive, interactive vector SVG graph illustrating
 * the architectural relationships of the selected sample website.
 */

import { DemoWebsiteArchetype, DemoTechnology } from './demo-types';

interface NodeLayout {
  tech: DemoTechnology;
  x: number;
  y: number;
  width: number;
  height: number;
  tier: number;
}

export function renderDemoGraphSvg(archetype: DemoWebsiteArchetype): string {
  const width = 840;
  const height = 400;

  // 1. Layout nodes in 3 horizontal topological tiers
  // Tier 0 (x ~ 60): Foundation (Framework, CMS)
  // Tier 1 (x ~ 330): Libraries & UI Components
  // Tier 2 (x ~ 600): Edge, Analytics, Infrastructure, Payments
  const tier0: DemoTechnology[] = [];
  const tier1: DemoTechnology[] = [];
  const tier2: DemoTechnology[] = [];

  for (const tech of archetype.technologies) {
    if (tech.category === 'framework' || (tech.category === 'cms' && !archetype.technologies.some(t => t.category === 'framework'))) {
      tier0.push(tech);
    } else if (tech.category === 'library') {
      tier1.push(tech);
    } else {
      tier2.push(tech);
    }
  }

  // Fallback if tier0 is empty
  if (tier0.length === 0 && tier1.length > 0) {
    tier0.push(tier1.shift()!);
  }

  const nodeWidth = 190;
  const nodeHeight = 64;

  const calculateYPositions = (count: number, totalHeight: number): number[] => {
    if (count === 1) return [totalHeight / 2 - nodeHeight / 2];
    const spacing = (totalHeight - 80) / (count - 1);
    return Array.from({ length: count }, (_, i) => 40 + i * spacing - nodeHeight / 2);
  };

  const y0 = calculateYPositions(tier0.length, height);
  const y1 = calculateYPositions(tier1.length, height);
  const y2 = calculateYPositions(tier2.length, height);

  const nodeMap = new Map<string, NodeLayout>();

  tier0.forEach((tech, i) => {
    nodeMap.set(tech.id, { tech, x: 40, y: Math.max(30, y0[i]), width: nodeWidth, height: nodeHeight, tier: 0 });
  });

  tier1.forEach((tech, i) => {
    nodeMap.set(tech.id, { tech, x: 325, y: Math.max(30, y1[i]), width: nodeWidth, height: nodeHeight, tier: 1 });
  });

  tier2.forEach((tech, i) => {
    nodeMap.set(tech.id, { tech, x: 610, y: Math.max(30, y2[i]), width: nodeWidth, height: nodeHeight, tier: 2 });
  });

  // 2. Render connecting dependency edges
  const edgesSvg = archetype.relationships.map((rel) => {
    const src = nodeMap.get(rel.sourceId);
    const tgt = nodeMap.get(rel.targetId);
    if (!src || !tgt) return '';

    // If source is to the left of target:
    const isLeftToRight = src.x < tgt.x;
    const startX = isLeftToRight ? src.x + src.width : src.x;
    const startY = src.y + src.height / 2;
    const endX = isLeftToRight ? tgt.x : tgt.x + tgt.width;
    const endY = tgt.y + tgt.height / 2;

    const dx = Math.abs(endX - startX) * 0.5;
    const cp1x = isLeftToRight ? startX + dx : startX - dx;
    const cp2x = isLeftToRight ? endX - dx : endX + dx;

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    return `
      <g class="demo-graph-edge group cursor-pointer" data-edge="${rel.sourceId}->${rel.targetId}" data-source="${rel.sourceId}" data-target="${rel.targetId}">
        <path
          d="M ${startX} ${startY} C ${cp1x} ${startY}, ${cp2x} ${endY}, ${endX} ${endY}"
          fill="none"
          stroke="currentColor"
          class="text-indigo-400/40 dark:text-indigo-500/40 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:stroke-[2.5px] transition-all"
          stroke-width="1.75"
          marker-end="url(#demo-arrow-marker)"
        />
        <!-- Relationship Type Label Pill on Edge -->
        <rect
          x="${midX - 38}"
          y="${midY - 10}"
          width="76"
          height="20"
          rx="10"
          class="fill-slate-900/90 dark:fill-slate-800/95 stroke-indigo-500/30 dark:stroke-indigo-400/30"
          stroke-width="1"
        />
        <text
          x="${midX}"
          y="${midY + 3.5}"
          text-anchor="middle"
          class="text-[9px] font-mono font-bold fill-indigo-300 dark:fill-indigo-300 tracking-wider uppercase select-none pointer-events-none"
        >
          ${rel.typeLabel}
        </text>
      </g>
    `;
  }).join('');

  // 3. Render Nodes
  const nodesSvg = Array.from(nodeMap.values()).map((node) => {
    return `
      <g
        class="demo-graph-node cursor-pointer group"
        data-node-id="${node.tech.id}"
        transform="translate(${node.x}, ${node.y})"
        role="button"
        tabindex="0"
        aria-label="Inspect ${node.tech.name}"
      >
        <!-- Node Card Base -->
        <rect
          x="0"
          y="0"
          width="${node.width}"
          height="${node.height}"
          rx="14"
          class="demo-node-rect fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-800 group-hover:stroke-indigo-500 dark:group-hover:stroke-indigo-400 group-hover:shadow-lg transition-all"
          stroke-width="1.5"
        />
        <!-- Node Left Accent Stripe -->
        <rect
          x="0"
          y="0"
          width="4"
          height="${node.height}"
          rx="2"
          class="fill-indigo-600 dark:fill-indigo-400"
        />
        <!-- Node Title -->
        <text
          x="16"
          y="26"
          class="text-xs font-black fill-slate-900 dark:fill-white group-hover:fill-indigo-600 dark:group-hover:fill-indigo-400 transition-colors font-sans select-none"
        >
          ${node.tech.name}
        </text>
        ${node.tech.version ? `
          <text
            x="${16 + node.tech.name.length * 7.5 + 8}"
            y="26"
            class="text-[10px] font-mono font-medium fill-slate-400 dark:fill-slate-500 select-none"
          >
            v${node.tech.version}
          </text>
        ` : ''}
        <!-- Category & Tier -->
        <text
          x="16"
          y="46"
          class="text-[10px] font-mono font-bold uppercase fill-indigo-600 dark:fill-indigo-400 tracking-wider select-none"
        >
          ${node.tech.categoryLabel}
        </text>
        <circle cx="${node.width - 20}" cy="32" r="5" class="fill-emerald-500" />
      </g>
    `;
  }).join('');

  return `
    <svg
      viewBox="0 0 ${width} ${height}"
      class="w-full h-auto max-h-[460px] select-none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Simulated Architecture Dependency Graph for ${archetype.name}"
    >
      <defs>
        <!-- Arrowhead Marker -->
        <marker
          id="demo-arrow-marker"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#6366f1" />
        </marker>
        <!-- Background Pattern -->
        <pattern id="demo-graph-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" class="fill-slate-200/50 dark:fill-slate-800/50" />
        </pattern>
      </defs>

      <!-- Grid Background -->
      <rect width="100%" height="100%" fill="url(#demo-graph-grid)" />

      <!-- Dependency Links Layer -->
      <g id="demo-edges-layer">
        ${edgesSvg}
      </g>

      <!-- Technology Nodes Layer -->
      <g id="demo-nodes-layer">
        ${nodesSvg}
      </g>
    </svg>
  `;
}
