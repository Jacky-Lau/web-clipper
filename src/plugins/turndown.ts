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
  ]);
}
