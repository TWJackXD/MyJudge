import { supabase } from '~/server/utils/supabase';
import { hashPassword } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  try {
    // 檢查認證和管理員權限
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

    const { username, password, role = 'user' } = await readBody(event);

    if (!username || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: '請提供使用者名稱和密碼'
      });
    }

    if (password.length < 6) {
      throw createError({
        statusCode: 400,
        statusMessage: '密碼長度至少需要 6 個字元'
      });
    }

    // 檢查用戶名是否已存在
    const { data: existing, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username);

    if (existing && existing.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '使用者名稱已存在'
      });
    }

    // 雜湊密碼
    const hashedPassword = await hashPassword(password);

    // 創建用戶
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({ username, password: hashedPassword, role })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }
    const result = { insertId: newUser.id };

    return {
      status: 'success',
      message: '用戶創建成功',
      userId: result.insertId
    };

  } catch (error) {
    console.error('創建用戶錯誤:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: '創建用戶過程發生錯誤'
    });
  }
});

