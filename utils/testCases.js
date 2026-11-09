function normalizeNewlines(raw) {
  return String(raw ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

// 編輯器顯示：一行一組。沒有換行的舊資料仍依逗號切開。
export function toEditorTestCases(raw) {
  if (raw == null || String(raw).trim() === '') return '';
  const text = normalizeNewlines(raw);
  if (text.includes('\n')) return text.replace(/\n+$/g, '');
  if (text.includes(',')) {
    return text.split(',').map((part) => part.trim()).filter(Boolean).join('\n');
  }
  return text.trim();
}

// 存檔時保留編輯器裡的每一行，並以換行結尾。
// 這樣只有一組、內容含逗號的測資不會被當成舊的逗號格式。
export function normalizeTestCaseField(raw) {
  const text = normalizeNewlines(raw).replace(/^\n+|\n+$/g, '');
  if (!text.trim()) return '';
  return `${text}\n`;
}

export function splitTestCases(raw) {
  if (raw == null || String(raw).trim() === '') return [];
  const text = normalizeNewlines(raw);
  const parts = text.includes('\n')
    ? text.split('\n')
    : text.split(',');
  return parts
    .map((part) => part.replace(/\\n/g, '\n').trim())
    .filter((part) => part.length > 0);
}
