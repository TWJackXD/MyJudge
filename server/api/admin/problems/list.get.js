import { supabase } from '~/server/utils/supabase';
import { parseAllowedLanguages } from '~/utils/languages';

export default defineEventHandler(async (event) => {
  try {
    if (!event.context.user) {
      throw createError({
        statusCode: 401,
        statusMessage: '未授權'
      });
    }

    if (event.context.user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: '需要管理員權限'
      });
    }

    const query = getQuery(event);
    const bankFolder = query.bank_folder || null;

    let problemsQuery = supabase
      .from('problems')
      .select('*, bank_folders(name)')
      .order('id', { ascending: false });

    if (bankFolder === 'uncategorized') {
      problemsQuery = problemsQuery.is('bank_folder', null);
    } else if (bankFolder) {
      problemsQuery = problemsQuery.eq('bank_folder', bankFolder);
    }

    const { data: problemsData, error } = await problemsQuery;

    if (error) throw error;

    const { data: links, error: linksError } = await supabase
      .from('folder_problems')
      .select('problem_uuid, folder, question_no, allowed_languages, folders(name)');

    if (linksError) throw linksError;

    const linksByProblem = new Map();
    for (const link of links || []) {
      const list = linksByProblem.get(link.problem_uuid) || [];
      list.push({
        folder: link.folder,
        folder_name: link.folders?.name || null,
        question_no: link.question_no,
        allowed_languages: parseAllowedLanguages(link.allowed_languages)
      });
      linksByProblem.set(link.problem_uuid, list);
    }

    const problems = (problemsData || []).map((p) => ({
      ...p,
      folder: null,
      folder_name: null,
      bank_folder_name: p.bank_folders?.name || null,
      bank_folders: undefined,
      contests: linksByProblem.get(p.uuid) || [],
      contest_count: (linksByProblem.get(p.uuid) || []).length
    }));

    return {
      status: 'success',
      data: problems
    };
  } catch (error) {
    console.error('獲取題目列表錯誤:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: '獲取題目列表過程發生錯誤'
    });
  }
});
