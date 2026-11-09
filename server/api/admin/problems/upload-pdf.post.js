import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

export default defineEventHandler(async (event) => {
  try {
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
        statusMessage: '需要管理員權限'
      });
    }

    const form = await readMultipartFormData(event);

    if (!form || form.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '未找到上傳的檔案'
      });
    }

    const fileData = form.find((item) => item.name === 'file');

    if (!fileData || !fileData.data || !fileData.filename) {
      throw createError({
        statusCode: 400,
        statusMessage: '無效的檔案數據'
      });
    }

    const fileExtension = fileData.filename.substring(fileData.filename.lastIndexOf('.')).toLowerCase();

    if (fileExtension !== '.pdf') {
      throw createError({
        statusCode: 400,
        statusMessage: '僅支援 PDF 檔案'
      });
    }

    const maxSize = 50 * 1024 * 1024;
    if (fileData.data.length > maxSize) {
      throw createError({
        statusCode: 400,
        statusMessage: `檔案過大（最大 50MB），當前大小：${(fileData.data.length / 1024 / 1024).toFixed(2)}MB`
      });
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'problems');

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uniqueFilename = `${randomUUID()}.pdf`;
    const filePath = join(uploadDir, uniqueFilename);
    const publicPath = `/uploads/problems/${uniqueFilename}`;

    await writeFile(filePath, fileData.data);

    return {
      status: 'success',
      message: 'PDF 上傳成功',
      data: {
        filename: fileData.filename,
        path: publicPath,
        size: fileData.data.length
      }
    };
  } catch (error) {
    console.error('Upload problem PDF error:', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: 'PDF 上傳失敗'
    });
  }
});
