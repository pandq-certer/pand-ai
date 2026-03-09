import html2canvas from 'html2canvas';

/**
 * 导出 DOM 元素为图片（Base64 格式）
 * @param elementId - 要导出的 DOM 元素 ID
 * @param options - html2canvas 配置选项
 * @returns Promise<string> - 返回 Base64 编码的图片数据
 */
export async function exportElementAsImage(
  elementId: string,
  options: Partial<html2canvas.Options> = {}
): Promise<string> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`找不到 ID 为 ${elementId} 的元素`);
  }

  // 默认配置
  const defaultOptions: html2canvas.Options = {
    backgroundColor: '#ffffff',
    scale: 2, // 提高图片质量
    logging: false,
    useCORS: true,
    allowTaint: false,
    ...options,
  };

  try {
    const canvas = await html2canvas(element, defaultOptions);
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('导出图片失败:', error);
    throw new Error('导出图片失败，请重试');
  }
}

/**
 * 下载图片到本地
 * @param dataUrl - Base64 图片数据
 * @param filename - 文件名
 */
export function downloadImage(dataUrl: string, filename: string = 'dashboard.png'): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 导出数据看板为图片并下载
 * @param filename - 文件名（可选）
 */
export async function exportDashboardAsImage(filename?: string): Promise<void> {
  try {
    const dataUrl = await exportElementAsImage('dashboard-content');
    downloadImage(dataUrl, filename);
  } catch (error) {
    console.error('导出数据看板失败:', error);
    throw error;
  }
}

/**
 * 导出数据看板为图片 Base64 格式（用于邮件发送）
 * @returns Promise<string> - Base64 编码的图片数据
 */
export async function exportDashboardForEmail(): Promise<string> {
  try {
    return await exportElementAsImage('dashboard-content');
  } catch (error) {
    console.error('导出数据看板失败:', error);
    throw error;
  }
}
