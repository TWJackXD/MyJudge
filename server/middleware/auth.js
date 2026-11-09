import { getTokenFromRequest, verifyToken } from '../utils/auth.js';
import { supabase } from '../utils/supabase.js';
import { createError } from 'h3';

/**
 * 認證中間件 (Authentication Middleware)
 * 功能: 檢查用戶是否已登入，並將用戶信息附加到 event.context
 * 運作方式:
 * 1. 公開路徑 → 嘗試設置用戶信息（如有 token），但不強制要求登入
 * 2. 私有路徑 → 必須提供有效的 token，否則返回 401 錯誤
 * 3. 用戶信息儲存在資料庫（持久化）中
 * 4. Material API 內網訪問時跳過認證（避免 501 錯誤）
 */
export default defineEventHandler(async (event) => {
  const url = event.node.req.url;

  // 定義公開路由清單（不需要強制認證的路徑）
  const publicPaths = [
    '/api/auth/login',      // 登入 API
    '/api/auth/logout',     // 登出 API
    '/api/folder/getFolders',           // 獲取題目集
    '/api/problem/getProblemDetail',    // 獲取題目詳情
    '/api/problem/getProblemFolder',    // 獲取題目集資訊
    '/api/problem/getFolderProblems',   // 獲取題目集下的題目列表
    '/api/record/getSubmitRecord',       // 獲取提交記錄（由 API 內部判斷）
    '/api/materials/list',               // 課程教材列表（依可見性過濾）
    '/api/announcements/list',           // 最新公告（公開）
  ];

  // 檢查當前請求是否為公開路徑
  const isPublicPath = publicPaths.some(path => url?.startsWith(path));

  // 【公開路徑處理】即使不需要認證，也要嘗試設置用戶信息
  if (isPublicPath) {
    const token = getTokenFromRequest(event);

    if (token) {
      try {
        // 從資料庫查詢（持久化）
        const { data: tokens } = await supabase
          .from('tokens')
          .select('*')
          .eq('token', token)
          .gt('expires_at', new Date().toISOString());

        if (tokens && tokens.length > 0) {
          // Token 有效，查詢用戶資訊
          const tokenRecord = tokens[0];
          const { data: users } = await supabase
            .from('users')
            .select('id, username, role')
            .eq('id', tokenRecord.user_id);

          if (users && users.length > 0) {
            // 設置用戶資訊到 context
            const user = users[0];
            event.context.user = user;
            event.context.token = token;
          }
        }
      } catch (error) {
        // 公開路徑的認證失敗不拋出錯誤，繼續處理
      }
    }
    return; // 公開路徑不需要強制認證，直接返回
  }

  // 檢查是否為前端路由（頁面路由不需要認證檢查）
  if (!url?.startsWith('/api/')) {
    return;
  }

  // 【私有路徑處理】必須提供有效的 token

  // 1. 取得請求中的 token
  const token = getTokenFromRequest(event);

  // 2. 驗證 token 是否存在
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: '未授權，請先登入'
    });
  }

  // 3. 從資料庫查詢 Token 及用戶資訊
  const { data: tokens, error: tokenError } = await supabase
    .from('tokens')
    .select('*')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString());

  // 驗證 token 是否有效且未過期
  if (!tokens || tokens.length === 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token 無效或已過期'
    });
  }

  const tokenRecord = tokens[0];

  // 根據 token 取得用戶資訊
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, username, role')
    .eq('id', tokenRecord.user_id);

  // 驗證用戶是否存在
  if (!users || users.length === 0) {
    throw createError({
      statusCode: 401,
      statusMessage: '用戶不存在'
    });
  }

  // 設置用戶資訊到 context
  const user = users[0];
  event.context.user = user;
  event.context.token = token;
});

