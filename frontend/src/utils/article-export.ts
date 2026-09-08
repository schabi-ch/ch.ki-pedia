import MarkdownIt from 'markdown-it';
import { asBlob } from 'html-docx-js-typescript';

const md = new MarkdownIt({ html: true, linkify: true, breaks: true });

export function renderMarkdownToHtml (markdownText: string): string {
  return md.render(String(markdownText ?? ''));
}

function buildArticleHtml (title: string, markdownText: string): string {
  const body = renderMarkdownToHtml(markdownText);
  const safeTitle = escapeHtml(title);
  return `<h1>${safeTitle}</h1>\n${body}`;
}

function buildArticlePlainText (title: string, markdownText: string): string {
  return `${title}\n\n${markdownText}`;
}

function escapeHtml (input: string): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function copyTextToClipboard (plainText: string): Promise<void> {
  const clipboard = navigator.clipboard as Clipboard | undefined;
  if (clipboard?.writeText) {
    await clipboard.writeText(plainText);
    return;
  }

  const el = document.createElement('textarea');
  el.value = plainText;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

export async function copyArticleToClipboard (title: string, markdownText: string): Promise<void> {
  const htmlText = buildArticleHtml(title, markdownText);
  const plainText = buildArticlePlainText(title, markdownText);

  const typeHtml = 'text/html';
  const typePlain = 'text/plain';

  const clipboard = navigator.clipboard as Clipboard | undefined;
  if (clipboard?.write && typeof ClipboardItem !== 'undefined') {
    const blobHtml = new Blob([htmlText], { type: typeHtml });
    const blobPlain = new Blob([plainText], { type: typePlain });
    await clipboard.write([
      new ClipboardItem({
        [typeHtml]: blobHtml,
        [typePlain]: blobPlain,
      }),
    ]);
    return;
  }

  await copyTextToClipboard(plainText);
}

function sanitizeFileName (title: string): string {
  const cleaned = String(title ?? '')
    .replace(/[^A-Za-z0-9 _-]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  return cleaned || 'article';
}

const WORD_DOCUMENT_STYLES = `
    body {
      font-family: Aptos, Calibri, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
    }

    h1, h2, h3, h4, h5, h6,
    p, li, td, th, div, span {
      font-family: Aptos, Calibri, Arial, sans-serif;
    }

    h1 {
      font-size: 20pt;
      margin: 0 0 12pt;
    }
`;

async function downloadHtmlAsWord (title: string, bodyHtml: string, fileName: string): Promise<void> {
  const safeTitle = escapeHtml(title);
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${safeTitle}</title><style>${WORD_DOCUMENT_STYLES}</style></head><body>${bodyHtml}</body></html>`;

  const result = await asBlob(fullHtml);
  const blob = result instanceof Blob
    ? result
    : new Blob([result as unknown as ArrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadArticleAsWord (title: string, markdownText: string): Promise<void> {
  await downloadHtmlAsWord(title, buildArticleHtml(title, markdownText), `${sanitizeFileName(title)}.docx`);
}

export interface ChatExportMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatExportLabels {
  heading: string;
  user: string;
  assistant: string;
}

function buildChatHtml (messages: ChatExportMessage[], labels: ChatExportLabels): string {
  const blocks = messages
    .filter((message) => message.content.trim())
    .map((message) => {
      const speaker = escapeHtml(message.role === 'user' ? labels.user : labels.assistant);
      return `<h2>${speaker}</h2>\n${renderMarkdownToHtml(message.content)}`;
    });
  return `<h1>${escapeHtml(labels.heading)}</h1>\n${blocks.join('\n')}`;
}

export async function downloadChatAsWord (
  articleTitle: string,
  messages: ChatExportMessage[],
  labels: ChatExportLabels,
): Promise<void> {
  const fileName = `${sanitizeFileName(articleTitle)}_chat.docx`;
  await downloadHtmlAsWord(labels.heading, buildChatHtml(messages, labels), fileName);
}
