import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export default defineEventHandler(async (event) => {
  try {
    // 驗證用戶權限
    const user = event.context.user;
    
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: '請先登入'
      });
    }

    if (user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: '權限不足，需要管理員權限'
      });
    }

    // 讀取上傳的檔案
    const form = await readMultipartFormData(event);
    
    if (!form || form.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '未找到上傳的檔案'
      });
    }

    const fileData = form.find(item => item.name === 'file');
    
    if (!fileData || !fileData.data || !fileData.filename) {
      throw createError({
        statusCode: 400,
        statusMessage: '無效的檔案數據'
      });
    }

    // 驗證檔案類型
    const allowedExtensions = ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.txt', '.md'];
    const fileExtension = fileData.filename.substring(fileData.filename.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      throw createError({
        statusCode: 400,
        statusMessage: `不支援的檔案類型：${fileExtension}。允許的類型：${allowedExtensions.join(', ')}`
      });
    }

    // 驗證檔案大小（最大 50MB）
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (fileData.data.length > maxSize) {
      throw createError({
        statusCode: 400,
        statusMessage: `檔案過大（最大 50MB），當前大小：${(fileData.data.length / 1024 / 1024).toFixed(2)}MB`
      });
    }

    // 建立上傳目錄
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'materials');
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 生成唯一檔案名稱
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const filePath = join(uploadDir, uniqueFilename);
    const publicPath = `/uploads/materials/${uniqueFilename}`;

    // 寫入檔案
    await writeFile(filePath, fileData.data);

    // 返回檔案路徑
    return {
      success: true,
      message: '檔案上傳成功',
      data: {
        filename: fileData.filename,
        path: publicPath,
        size: fileData.data.length,
        extension: fileExtension,
        uploadedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
});

