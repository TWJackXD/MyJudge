import { supabase } from '~/server/utils/supabase';
import { verifyPassword, hashPassword } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  try {
    // 檢查認證（需要登入）
    if (!event.context.user) {
      throw createError({
        statusCode: 401,
        statusMessage: '未授權'
      });
    }

    const { currentPassword, newPassword } = await readBody(event);

    if (!currentPassword || !newPassword) {
      throw createError({
        statusCode: 400,
        statusMessage: '請提供當前密碼和新密碼'
      });
    }

    if (newPassword.length < 6) {
      throw createError({
        statusCode: 400,
        statusMessage: '新密碼長度至少需要 6 個字元'
      });
    }

    // 查詢用戶
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', event.context.user.id)
      .limit(1);

    if (userError || !users || users.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: '找不到用戶'
      });
    }

    const user = users[0];

    // 驗證當前密碼
    const isValid = await verifyPassword(currentPassword, user.password);

    if (!isValid) {
      throw createError({
        statusCode: 401,
        statusMessage: '當前密碼錯誤'
      });
    }

    // 雜湊新密碼
    const hashedPassword = await hashPassword(newPassword);

    // 更新密碼
    await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', user.id);

    return {
      status: 'success',
      message: '密碼更改成功'
    };

  } catch (error) {
    console.error('更改密碼錯誤:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: '更改密碼過程發生錯誤'
    });
  }
});

