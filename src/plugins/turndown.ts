/**
 * Turndown plugins for web-clipper.
 *
 * Inlined from @web-clipper/turndown@0.4.8 and converted to TypeScript.
 * GFM support provided by @joplin/turndown-plugin-gfm.
 */
import { gfm } from '@joplin/turndown-plugin-gfm';
import TurndownService from 'turndown';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fixUrl(url: string | null): string | undefined {
  if (!url) {
    return undefined;
  }
  if (url.startsWith('//')) {
    return `${window.location.protocol}${url}`;
  }
  if (url.startsWith('/')) {
    return `${window.location.origin}${url}`;
  }
  return url;
}

function codeBlock(code: string | null, language?: string | null): string {
  const lang = typeof language === 'string' ? language : '';
  if (typeof code !== 'string' || !code) {
    return '';
  }
  return `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
}

// ---------------------------------------------------------------------------
// Image plugins
// ---------------------------------------------------------------------------

function lazyLoadImage(turndownService: TurndownService) {
  turndownService.addRule('lazyLoadImage', {
    filter: ['img'],
    replacement(_content: string, node: Node) {
      const el = node as HTMLElement;
      const attributes = ['data-src', 'data-original-src'];
      for (const attribute of attributes) {
        const dataSrc = el.getAttribute(attribute);
        if (dataSrc) {
          return `![](${fixUrl(dataSrc)})\n`;
        }
      }
      const src = el.getAttribute('src');
      if (src) {
        return `![](${fixUrl(src)})\n`;
      }
      return '';
    },
  });
}

function mediumImage(turndownService: TurndownService) {
  turndownService.addRule('mediumImage', {
    filter(node: Node) {
      if (!(node instanceof HTMLElement)) return false;
      if (node.tagName !== 'IMG') return false;
      if (!node.getAttribute('src') || !node.getAttribute('height') || !node.getAttribute('width'))
        return false;
      const src = node.getAttribute('src')!;
      return src.startsWith('https://miro.medium.com/max/');
    },
    replacement(content: string, node: Node) {
      if (!(node instanceof HTMLElement)) return content;
      const src = node.getAttribute('src')!;
      const width = node.getAttribute('width')!;
      const result = src.replace(
        /https:\/\/miro.medium.com\/max\/(\d*)\//,
        `https://miro.medium.com/max/${Number(width) * 2}/`,
      );
      return `![](${result})`;
    },
  });
}

function zhihuGif(turndownService: TurndownService) {
  turndownService.addRule('zhihuGif', {
    filter(node: Node) {
      if (!(node instanceof HTMLElement)) return false;
      if (node.tagName !== 'IMG') return false;
      if (!node.getAttribute('class') || !node.getAttribute('data-thumbnail')) return false;
      return node.getAttribute('class') === 'ztext-gif';
    },
    replacement(_content: string, node: Node) {
      const el = node as HTMLElement;
      let src = el.getAttribute('data-thumbnail');
      if (src) {
        const index = src.lastIndexOf('.');
        src = src.slice(0, index).concat('.gif');
        return `![](${fixUrl(src)})\n`;
      }
      return '';
    },
  });
}

// ---------------------------------------------------------------------------
// Code block plugins
// ---------------------------------------------------------------------------

function hexoCodeBlock(turndownService: TurndownService) {
  turndownService.addRule('hexoCodeBlock', {
    filter: ['figure', 'table'],
    replacement(content: string, node: Node) {
      if (!(node instanceof HTMLElement)) return content;
      let language = '';
      if (node.tagName === 'FIGURE') {
        const className = node.getAttribute('class');
        if (className) {
          const match = className.match(/highlight (.*)/);
          if (match) language = match[1];
        }
      }
      const gutter = node.querySelector('.gutter');
      const code = node.querySelector('td.code');
      if (!code || !gutter) return content;
      const codeArray = Array.from(code.querySelectorAll('.line'));
      if (!Array.isArray(codeArray)) return content;
      const finalCode = codeArray.map((o) => o.textContent).join('\n');
      return `\`\`\`${language}\n${finalCode}\n\`\`\`\n\n`;
    },
  });
}

function wechatCodeBlock(turndownService: TurndownService) {
  turndownService.addRule('wechatCodeBlock', {
    filter(node: Node) {
      if (!(node instanceof HTMLElement)) return false;
      if (node.tagName !== 'SECTION') return false;
      if (!node.className || !node.className.includes('code-snippet__js')) return false;
      const pre = node.querySelector('pre.code-snippet__js');
      if (!pre) return false;
      return !!pre.getAttribute('data-lang');
    },
    replacement(content: string, node: Node) {
      if (!(node instanceof HTMLElement)) return content;
      const pre = node.querySelector('pre.code-snippet__js')!;
      const language = pre.getAttribute('data-lang');
      const finalCode = Array.from(pre.querySelectorAll('code'))
        .map((o) => o.textContent)
        .join('\n');
      return `\`\`\`${language}\n${finalCode}\n\`\`\`\n\n`;
    },
  });
}

function wechatCodeBlock_02(turndownService: TurndownService) {
  turndownService.addRule('wechatCodeBlock_02', {
    filter(node: Node) {
      if (!(node instanceof HTMLElement)) return false;
      if (node.tagName !== 'SECTION') return false;
      if (!node.className.includes('code-snippet__github')) return false;
      if (!node.querySelector('pre') || node.querySelectorAll('code').length === 0) return false;
      return true;
    },
    replacement(content: string, node: Node) {
      if (!(node instanceof HTMLElement)) return content;
      const pre = node.querySelector('pre');
      const language = pre?.getAttribute('data-lang');
      const finalCode = Array.from(node.querySelectorAll('code'))
        .map((o) => o.textContent)
        .join('\n');
      if (language) {
        return `\`\`\`${language}\n${finalCode}\n\`\`\`\n\n`;
      }
      return `\`\`\`\n${finalCode}\n\`\`\`\n\n`;
    },
  });
}

function ibmCodeBlock(turndownService: TurndownService) {
  turndownService.addRule('ibmCodeBlock', {
    filter(node: Node) {
      if (!(node instanceof HTMLElement)) return false;
      if (node.tagName !== 'DIV') return false;
      if (!node.className || !node.className.includes('syntaxhighlighter')) return false;
      return !!node.querySelector('div.container');
    },
    replacement(content: string, node: Node) {
      if (!(node instanceof HTMLElement)) return content;
      const codeNode = node.querySelector('div.container')!;
      const finalCode = Array.from(codeNode.querySelectorAll('.line'))
        .map((o) => o.textContent)
        .join('\n');
      return `\`\`\`\n${finalCode}\n\`\`\`\n\n`;
    },
  });
}

function mediumCodeBlock(turndownService: TurndownService) {
  turndownService.addRule('mediumCodeBlock', {
    filter(node: Node) {
      if (!(node instanceof HTMLElement)) return false;
      if (node.tagName !== 'PRE') return false;
      if (!node.className) return false;
      return !!node.querySelectorAll('span[data-selectable-paragraph]');
    },
    replacement(content: string, node: Node) {
      if (!(node instanceof HTMLElement)) return content;
      return `\`\`\`\n${content}\n\`\`\`\n\n`;
    },
  });
}

function csdnCodeBlock(turndownService: TurndownService) {
  turndownService.addRule('csdnCodeBlock', {
    filter(node: Node) {
      if (!(node instanceof HTMLElement)) return false;
      if (node.tagName !== 'PRE') return false;
      if (node.className !== 'prettyprint') return false;
      return !!node.querySelectorAll('code');
    },
    replacement(content: string, node: Node) {
      if (!(node instanceof HTMLElement)) return content;
      node.querySelector('.pre-numbering')?.remove();
      const codeEl = node.querySelector('code')!;
      const code = codeEl.textContent;
      let language = '';
      const languageMatchResult = codeEl.className.match(/language-(.*) /);
      if (languageMatchResult) {
        language = languageMatchResult[1];
      }
      language = language.split(' ')[0];
      return `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    },
  });
}

function typoraCodeBlock(turndownService: TurndownService) {
  turndownService.addRule('typoraCodeBlock', {
    filter(node: Node) {
      if (!(node instanceof HTMLElement)) return false;
      if (node.tagName !== 'PRE') return false;
      if (!node.className.includes('contain-cm')) return false;
      const firstChild = node.firstChild;
      if (!(firstChild instanceof HTMLElement)) return false;
      return firstChild.className.includes('CodeMirror');
    },
    replacement(content: string, node: Node) {
      if (!(node instanceof HTMLElement)) return content;
      const codeMirrorLines = node.querySelectorAll('.CodeMirror-line');
      if (!codeMirrorLines || codeMirrorLines.length === 0) return '';
      const code = Array.from(codeMirrorLines)
        .map((o) => o.textContent)
        .join('\n');
      const lang = node.getAttribute('lang');
      return codeBlock(code, lang);
    },
  });
}

function juejinCodeBlock(turndownService: TurndownService) {
  turndownService.addRule('juejinCodeBlock', {
    filter(node: Node) {
      if (!(node instanceof HTMLElement)) return false;
      if (node.tagName !== 'PRE') return false;
      if (node.className === 'prettyprint') return false;
      const child = node.firstChild as HTMLElement | null;
      if (!child) return false;
      if (child.tagName !== 'CODE') return false;
      return child.className.includes('hljs');
    },
    replacement(content: string, node: Node) {
      if (!(node instanceof HTMLElement)) return content;
      node.querySelector('.copy-code-btn')?.remove();
      const firstChild = node.firstChild as HTMLElement;
      return `\`\`\`${firstChild?.getAttribute('lang')}\n${firstChild?.textContent}\n\`\`\`\n\n`;
    },
  });
}

function syntaxhighlighter(turndownService: TurndownService) {
  turndownService.addRule('syntaxhighlighter', {
    filter(node: Node) {
      if (!(node instanceof HTMLElement)) return false;
      if (node.tagName !== 'TABLE') return false;
      if (!node.className?.includes('syntaxhighlighter')) return false;
      if (!node.querySelector('.code') || !node.querySelector('.container')) return false;
      return true;
    },
    replacement(content: string, node: Node) {
      if (!(node instanceof HTMLElement)) return content;
      const lines = node.querySelector('.container')?.querySelectorAll('line') || [];
      const finalCode = Array.from(lines)
        .map((o) => o.textContent)
        .join('\n');
      return `\`\`\`\n${finalCode}\n\`\`\`\n\n`;
    },
  });
}

function infoq_code(turndownService: TurndownService) {
  turndownService.addRule('infoq_code', {
    filter(node: Node) {
      if (!(node instanceof HTMLElement)) return false;
      if (node.tagName !== 'DIV') return false;
      if (node.getAttribute('data-type') !== 'codeblock') return false;
      if (!node.querySelector('.simplebar') || !node.querySelector('[data-origin=pm_code_preview]'))
        return false;
      return true;
    },
    replacement(content: string, node: Node) {
      if (!(node instanceof HTMLElement)) return content;
      const lines = node.querySelectorAll('[data-type=codeline]') ?? [];
      const finalCode = Array.from(lines)
        .map((o) => o.textContent)
        .join('\n')
        .trim();
      return `\`\`\`\n${finalCode}\n\`\`\`\n\n`;
    },
  });
}

// ---------------------------------------------------------------------------
// Mermaid diagram plugin
// ---------------------------------------------------------------------------

/**
 * Extract mermaid source text from an element that still contains the
 * un-rendered source code (patterns 1-3).
 */
function extractMermaidText(el: HTMLElement): string | null {
  // Pattern 3: <pre><code class="language-mermaid">...</code>
  const codeLangMermaid = el.querySelector('code.language-mermaid');
  if (codeLangMermaid?.textContent?.trim()) return codeLangMermaid.textContent.trim();

  // Also try a plain <code> child (e.g. GitHub)
  const code = el.querySelector('code');
  if (code?.textContent?.trim()) return code.textContent.trim();

  // Pattern 1/2: direct text nodes (skip SVG children)
  let text = '';
  el.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) text += n.textContent;
  });
  if (text.trim()) return text.trim();

  return null;
}

/**
 * Attempt to reconstruct a mermaid flowchart definition from a rendered SVG.
 * Only supports flowchart type (detected via aria-roledescription).
 */
function reconstructFlowchartFromSvg(svg: SVGElement): string | null {
  // Only handle flowcharts
  const roleDesc = svg.getAttribute('aria-roledescription') || '';
  if (!roleDesc.includes('flowchart') && !roleDesc.includes('graph')) {
    // Fallback: check if there are flowchart-style node groups
    const hasFlowchartNodes = svg.querySelector('[id^="flowchart-"]');
    if (!hasFlowchartNodes) return null;
  }

  // 1. Determine direction – Mermaid encodes it in the aria-roledescription
  //    e.g. "flowchart-v2" for TD, or we look at the layout
  let direction = 'TD';
  const ariaLabel = svg.getAttribute('aria-label') || svg.getAttribute('aria-roledescription') || '';
  // Try to detect from class or embedded metadata
  const svgClasses = svg.getAttribute('class') || '';
  if (svgClasses.includes('flowchart-LR') || ariaLabel.includes('LR')) direction = 'LR';
  else if (svgClasses.includes('flowchart-RL') || ariaLabel.includes('RL')) direction = 'RL';
  else if (svgClasses.includes('flowchart-BT') || ariaLabel.includes('BT')) direction = 'BT';

  // 2. Extract subgraphs: <g class="cluster"> elements
  interface Subgraph {
    id: string;
    label: string;
    nodeIds: string[];
    element: Element;
  }
  const subgraphs: Subgraph[] = [];
  const clusterGroups = svg.querySelectorAll('g.cluster');
  clusterGroups.forEach((cluster) => {
    const labelEl =
      cluster.querySelector('.cluster-label .nodeLabel') ||
      cluster.querySelector('.cluster-label') ||
      cluster.querySelector('text');
    const label = labelEl?.textContent?.trim() || '';
    const clusterId = cluster.getAttribute('id') || `subgraph_${subgraphs.length}`;
    subgraphs.push({ id: clusterId, label, nodeIds: [], element: cluster });
  });

  // 3. Extract nodes: <g id="flowchart-X-NN"> with nodeLabel text
  interface FlowNode {
    id: string;
    rawId: string;
    label: string;
    shape: string; // [], (), {}, (()) etc.
    element: Element;
  }
  const nodes: FlowNode[] = [];
  const nodeMap = new Map<string, FlowNode>();
  const nodeGroups = svg.querySelectorAll('[id^="flowchart-"]');
  nodeGroups.forEach((g) => {
    const fullId = g.getAttribute('id') || '';
    // id format: flowchart-<nodeId>-<number>
    const match = fullId.match(/^flowchart-(.+)-\d+$/);
    if (!match) return;
    const nodeId = match[1];
    if (nodeMap.has(nodeId)) return; // skip duplicates

    const labelEl = g.querySelector('.nodeLabel');
    const label = labelEl?.textContent?.trim() || nodeId;

    // Determine shape from child element type
    let shape = '[]'; // default: rectangle
    if (g.querySelector('circle') || g.querySelector('ellipse')) {
      shape = '(())';
    } else if (g.querySelector('polygon')) {
      // Diamond shape (rhombus) for decisions
      shape = '{}';
    } else if (g.querySelector('.label-container')) {
      // Check the shape of the container
      const rect = g.querySelector('rect');
      if (rect) {
        const rx = parseFloat(rect.getAttribute('rx') || '0');
        if (rx > 5) shape = '()'; // rounded = stadium shape
      }
    } else {
      // Check for rounded rect
      const rect = g.querySelector('rect');
      if (rect) {
        const rx = parseFloat(rect.getAttribute('rx') || '0');
        if (rx > 5) shape = '()';
      }
    }

    const node: FlowNode = { id: nodeId, rawId: fullId, label, shape, element: g };
    nodes.push(node);
    nodeMap.set(nodeId, node);
  });

  if (nodes.length === 0) return null;

  // 4. Assign nodes to subgraphs based on DOM containment
  for (const sg of subgraphs) {
    for (const node of nodes) {
      if (sg.element.contains(node.element)) {
        sg.nodeIds.push(node.id);
      }
    }
  }

  // Remove nodes claimed by inner (more specific) subgraphs from outer ones
  // Sort subgraphs from innermost to outermost
  for (let i = 0; i < subgraphs.length; i++) {
    for (let j = 0; j < subgraphs.length; j++) {
      if (i !== j && subgraphs[j].element.contains(subgraphs[i].element)) {
        // j is an ancestor of i; remove i's nodes from j
        subgraphs[j].nodeIds = subgraphs[j].nodeIds.filter(
          (nid) => !subgraphs[i].nodeIds.includes(nid),
        );
      }
    }
  }

  // 5. Extract edges: <path> or <line> elements with id like "L-X-Y-0"
  interface FlowEdge {
    from: string;
    to: string;
    label: string;
  }
  const edges: FlowEdge[] = [];
  const edgePaths = svg.querySelectorAll('[id^="L-"]');
  edgePaths.forEach((path) => {
    const pathId = path.getAttribute('id') || '';
    const edgeMatch = pathId.match(/^L-(.+)-(.+)-\d+$/);
    if (!edgeMatch) return;
    const from = edgeMatch[1];
    const to = edgeMatch[2];
    // Verify both nodes exist
    if (!nodeMap.has(from) || !nodeMap.has(to)) return;
    edges.push({ from, to, label: '' });
  });

  // Also try to find edges from marker-based paths (alternative Mermaid rendering)
  if (edges.length === 0) {
    const allPaths = svg.querySelectorAll('path.flowchart-link, path[class*="edge-pattern"]');
    allPaths.forEach((path) => {
      const id = path.getAttribute('id') || '';
      const edgeMatch = id.match(/^L-(.+)-(.+)-\d+$/);
      if (edgeMatch) {
        const from = edgeMatch[1];
        const to = edgeMatch[2];
        if (nodeMap.has(from) && nodeMap.has(to)) {
          edges.push({ from, to, label: '' });
        }
      }
    });
  }

  // 6. Extract edge labels: <span class="edgeLabel"> in order
  const edgeLabels: string[] = [];
  const edgeLabelEls = svg.querySelectorAll('.edgeLabel .edgeLabel, .edgeLabel');
  const seenLabels = new Set<Element>();
  edgeLabelEls.forEach((el) => {
    // Only pick the most specific (innermost) edgeLabel
    if (seenLabels.has(el)) return;
    // Skip parent edgeLabel if it has a child edgeLabel
    const inner = el.querySelector('.edgeLabel');
    if (inner && inner !== el) {
      seenLabels.add(el);
      return;
    }
    const text = el.textContent?.trim() || '';
    edgeLabels.push(text);
    seenLabels.add(el);
  });

  // Match edge labels to edges by order
  for (let i = 0; i < edges.length && i < edgeLabels.length; i++) {
    edges[i].label = edgeLabels[i];
  }

  // 7. Assemble output
  const lines: string[] = [`flowchart ${direction}`];
  const indent = '    ';

  // Helper to format node definition
  function formatNode(node: FlowNode): string {
    const label = node.label;
    const needsQuotes = label !== node.id;
    switch (node.shape) {
      case '()':
        return needsQuotes ? `${node.id}["${label}"]` : node.id;
      case '(())':
        return needsQuotes ? `${node.id}(("${label}"))` : `${node.id}((${node.id}))`;
      case '{}':
        return needsQuotes ? `${node.id}{"${label}"}` : `${node.id}{${node.id}}`;
      default: // []
        return needsQuotes ? `${node.id}["${label}"]` : node.id;
    }
  }

  // Track which nodes are in subgraphs
  const nodesInSubgraphs = new Set<string>();
  for (const sg of subgraphs) {
    for (const nid of sg.nodeIds) {
      nodesInSubgraphs.add(nid);
    }
  }

  // Output subgraphs with their nodes
  for (const sg of subgraphs) {
    if (sg.nodeIds.length === 0) continue;
    const sgLabel = sg.label ? `["${sg.label}"]` : '';
    // Use a simplified subgraph id
    const sgId = sg.id.replace(/^subgraph_/, 'SG');
    lines.push(`${indent}subgraph ${sgId}${sgLabel}`);
    for (const nid of sg.nodeIds) {
      const node = nodeMap.get(nid);
      if (node) {
        lines.push(`${indent}${indent}${formatNode(node)}`);
      }
    }
    lines.push(`${indent}end`);
  }

  // Output standalone nodes (not in any subgraph)
  for (const node of nodes) {
    if (!nodesInSubgraphs.has(node.id)) {
      lines.push(`${indent}${formatNode(node)}`);
    }
  }

  // Output edges
  for (const edge of edges) {
    if (edge.label) {
      lines.push(`${indent}${edge.from} -->|"${edge.label}"| ${edge.to}`);
    } else {
      lines.push(`${indent}${edge.from} --> ${edge.to}`);
    }
  }

  return lines.join('\n');
}

/**
 * Check whether an element is a mermaid container (rendered or un-rendered).
 */
function isMermaidElement(node: Node): node is HTMLElement {
  if (!(node instanceof HTMLElement)) return false;
  const tag = node.tagName;
  const cls = node.className || '';
  const clsStr = typeof cls === 'string' ? cls : '';

  // Pattern 1: <pre class="mermaid"> / <div class="mermaid">
  if ((tag === 'PRE' || tag === 'DIV') && clsStr.includes('mermaid')) return true;

  // Pattern 2: <pre lang="mermaid">
  if (tag === 'PRE' && node.getAttribute('lang') === 'mermaid') return true;

  // Pattern 3: parent <pre> of <code class="language-mermaid">
  if (tag === 'PRE' && node.querySelector('code.language-mermaid')) return true;

  // Pattern 4: <figure data-type="mermaid">
  if (tag === 'FIGURE' && node.getAttribute('data-type') === 'mermaid') return true;

  // Pattern 5: container with svg[aria-roledescription*="flowchart"] and class contains mermaid
  if (clsStr.includes('mermaid') && node.querySelector('svg[aria-roledescription]')) return true;

  // Pattern 6: direct parent of svg[id^="mermaid"]
  if (node.querySelector(':scope > svg[id^="mermaid"]')) return true;

  return false;
}

function mermaidDiagram(turndownService: TurndownService) {
  turndownService.addRule('mermaidDiagram', {
    filter(node: Node) {
      return isMermaidElement(node);
    },
    replacement(_content: string, node: Node) {
      const el = node as HTMLElement;

      // Try to extract un-rendered source text first (patterns 1-3)
      const sourceText = extractMermaidText(el);
      if (sourceText) {
        return `\`\`\`mermaid\n${sourceText}\n\`\`\`\n\n`;
      }

      // Try SVG reverse-engineering for rendered diagrams (patterns 4-6)
      const svg = el.querySelector('svg');
      if (svg) {
        const reconstructed = reconstructFlowchartFromSvg(svg as SVGElement);
        if (reconstructed) {
          return `\`\`\`mermaid\n${reconstructed}\n\`\`\`\n\n`;
        }
      }

      // Fallback: placeholder
      return '[mermaid diagram]\n\n';
    },
  });
}

// ---------------------------------------------------------------------------
// Content plugins
// ---------------------------------------------------------------------------

function noScript(turndownService: TurndownService) {
  turndownService.addRule('noscript', {
    filter: ['noscript'],
    replacement() {
      return '';
    },
  });
}

function findNotEmpty(data: any[], index: number): number {
  let expect = index;
  let start = 0;
  while (expect >= 0) {
    if (typeof data[start] === 'undefined') {
      expect--;
      if (expect < 0) {
        return start;
      }
    }
    start++;
  }
  return start;
}

function yuqueTableCard(turndownService: TurndownService) {
  turndownService.addRule('yuqueTableCard', {
    filter(node: Node) {
      if (!(node instanceof HTMLElement)) return false;
      if (node.tagName !== 'TABLE') return false;
      return node.getAttribute('class') === 'lake-table';
    },
    replacement(content: string, node: Node) {
      if (!(node instanceof HTMLElement)) return content;
      const lines = node.querySelectorAll('tr');
      const jsonNodes: Array<Array<{ colSpan: number; rowSpan: number; content: string }>> = [];

      for (const line of Array.from(lines)) {
        const nodes = line.querySelectorAll('td');
        const nodesValue = Array.from(nodes).map((td) => ({
          colSpan: Number(td.getAttribute('colspan')) || 1,
          rowSpan: Number(td.getAttribute('rowspan')) || 1,
          content: Array.from(td.querySelectorAll('p'))
            .map((o) => o.textContent)
            .join('<br />'),
        }));
        jsonNodes.push(nodesValue);
      }

      const result: string[][] = jsonNodes.map(() => []);
      jsonNodes.forEach((row, rowIndex) => {
        row.forEach((o) => {
          const expectIndex = findNotEmpty(result[rowIndex], 0);
          for (let i = 0; i < o.colSpan; i++) {
            for (let j = 0; j < o.rowSpan; j++) {
              const first = i === 0 && j === 0;
              result[rowIndex + j][expectIndex + i] = first ? o.content : '';
            }
          }
        });
      });

      const divider = result[0].map(() => '-');
      result.splice(1, 0, divider);
      return `${result.map((row) => `|${row.join('|')}|`).join('\n')}\n\n`;
    },
  });
}

function gcoresGallery(turndownService: TurndownService) {
  turndownService.addRule('gcoresGallery', {
    filter(node: Node) {
      if (!(node instanceof HTMLElement)) return false;
      if (node.tagName !== 'FIGURE') return false;
      const className = node.className;
      return typeof className === 'string' && className.includes('story_block-atomic-gallery');
    },
    replacement(content: string, node: Node) {
      if (!(node instanceof HTMLElement)) return content;
      const galleryItem = node.querySelectorAll('.gallery_item');
      if (!galleryItem || galleryItem.length <= 0) return content;

      let imageCount = galleryItem.length;
      const galleryIndex = node
        .querySelector('.gallery_indexOf')
        ?.querySelectorAll('span');
      if (galleryIndex && galleryIndex[1]) {
        imageCount = parseInt(galleryIndex[1].textContent || '', 10) || galleryItem.length;
      }

      const title = node.querySelector('.story_caption')?.textContent;
      const code = Array.from(galleryItem)
        .slice(0, imageCount)
        .map((o) => {
          const href = o.getAttribute('href');
          const caption = o.querySelector('.gallery_imageCaption')?.textContent;
          return `![${caption ?? title ?? ''}](${href})`;
        })
        .join('\n');
      return `${code}\n`;
    },
  });
}

// ---------------------------------------------------------------------------
// Formatting plugins
// ---------------------------------------------------------------------------

function strong(turndownService: TurndownService) {
  turndownService.addRule('tag_string', {
    filter: ['b', 'strong'],
    replacement(content: string) {
      if (typeof content !== 'string' || !content.trim()) return '';
      const result = content.trim();
      if (['：', '】', '▐', '。'].some((o) => result.endsWith(o))) {
        return `**${result}** `;
      }
      return `**${result}**`;
    },
  });
}

// ---------------------------------------------------------------------------
// Aggregated plugin registration
// ---------------------------------------------------------------------------

export default function plugins(turndownService: TurndownService) {
  turndownService.use([
    gfm,
    lazyLoadImage,
    hexoCodeBlock,
    noScript,
    wechatCodeBlock,
    wechatCodeBlock_02,
    ibmCodeBlock,
    mediumCodeBlock,
    csdnCodeBlock,
    yuqueTableCard,
    mediumImage,
    zhihuGif,
    gcoresGallery,
    typoraCodeBlock,
    juejinCodeBlock,
    strong,
    syntaxhighlighter,
    infoq_code,
    // Must be LAST: addRule uses unshift(), so the last-registered rule
    // has the highest priority. This ensures mermaid detection runs before
    // hexoCodeBlock (which matches all <figure>/<table> elements).
    mermaidDiagram,
  ]);
}
