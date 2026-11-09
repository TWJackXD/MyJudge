export function normalizeMaterialPath(path) {
  return String(path || '')
    .split(/[/\\]+/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('/');
}

/**
 * 將平坦教材列表轉成樹狀結構
 * path 例：Java/基礎 ；空字串代表根目錄
 */
export function buildMaterialTree(materials = []) {
  const root = {
    name: '',
    path: '',
    children: [],
    files: []
  };

  const folderMap = new Map([['', root]]);

  const ensureFolder = (folderPath) => {
    if (folderMap.has(folderPath)) return folderMap.get(folderPath);

    const parts = folderPath.split('/');
    const parentPath = parts.slice(0, -1).join('/');
    const name = parts[parts.length - 1];
    const parent = ensureFolder(parentPath);

    const folder = {
      name,
      path: folderPath,
      children: [],
      files: []
    };

    parent.children.push(folder);
    folderMap.set(folderPath, folder);
    return folder;
  };

  for (const material of materials) {
    const folderPath = normalizeMaterialPath(material.path);
    const folder = ensureFolder(folderPath);
    folder.files.push(material);
  }

  const sortNode = (node) => {
    node.children.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
    node.files.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hant'));
    node.children.forEach(sortNode);
  };

  sortNode(root);
  return root;
}
