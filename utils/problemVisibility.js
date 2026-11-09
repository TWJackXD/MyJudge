export const VISIBILITY_OPTIONS = [
  {
    value: 'public',
    label: '公開',
    hint: '所有登入使用者皆可見'
  },
  {
    value: 'public_except',
    label: '公開，除了⋯⋯',
    hint: '預設公開；下方下拉清單勾選要排除的使用者（可複選）'
  },
  {
    value: 'private_except',
    label: '私密，除了⋯⋯',
    hint: '預設隱藏；下方下拉清單勾選可例外存取的使用者（可複選）'
  },
  {
    value: 'private',
    label: '私密',
    hint: '僅管理員可見'
  }
];

export const VISIBILITY_VALUES = VISIBILITY_OPTIONS.map((option) => option.value);

export function normalizeVisibilityUsers(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
  }

  if (typeof value === 'string') {
    return [...new Set(
      value
        .split(/[\n,，]/)
        .map((item) => item.trim())
        .filter(Boolean)
    )];
  }

  return [];
}

export function normalizeVisibility(value, fallback = 'public') {
  return VISIBILITY_VALUES.includes(value) ? value : fallback;
}

/**
 * 判斷指定使用者是否可見該資源（競賽 / 題目）
 * 管理員永遠可見
 */
export function canUserSeeResource(resource, user) {
  const visibility = resource?.visibility || 'public';
  const listedUsers = normalizeVisibilityUsers(resource?.visibility_users);
  const username = user?.username;
  const isAdmin = user?.role === 'admin';

  if (isAdmin) return true;

  switch (visibility) {
    case 'public':
      return true;
    case 'public_except':
      return !username || !listedUsers.includes(username);
    case 'private_except':
      return !!username && listedUsers.includes(username);
    case 'private':
      return false;
    default:
      return true;
  }
}

/** @deprecated 使用 canUserSeeResource */
export function canUserSeeProblem(problem, user) {
  return canUserSeeResource(problem, user);
}

export function canUserSeeFolder(folder, user) {
  return canUserSeeResource(folder, user);
}

/**
 * 題目可見性 = 競賽可見 ∩ 題目可見
 * 例：競賽公開 + 題目私密 => 看不到
 * 例：競賽私密 + 題目公開 => 看不到（非管理員）
 */
export function canAccessProblem(problem, folder, user) {
  if (!canUserSeeResource(folder, user)) return false;
  if (!canUserSeeResource(problem, user)) return false;
  return true;
}

export function visibilityLabel(value) {
  return VISIBILITY_OPTIONS.find((option) => option.value === value)?.label || value || '公開';
}

export function assertVisibilityPayload(visibility, visibilityUsers) {
  const resolvedVisibility = normalizeVisibility(visibility);
  const resolvedUsers = normalizeVisibilityUsers(visibilityUsers);

  if ((resolvedVisibility === 'public_except' || resolvedVisibility === 'private_except') && resolvedUsers.length === 0) {
    const error = new Error('此可見性模式需要至少指定一位使用者');
    error.statusCode = 400;
    throw error;
  }

  return {
    visibility: resolvedVisibility,
    visibility_users: resolvedUsers
  };
}
