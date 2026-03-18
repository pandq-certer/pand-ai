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
    // 确保图表和 SVG 正确渲染
    onclone: (clonedDoc) => {
      // 确保克隆的文档中的 SVG 元素完全渲染
      const svgs = clonedDoc.querySelectorAll('svg');
      svgs.forEach(svg => {
        svg.style.display = 'block';
        // 确保 SVG 有正确的尺寸
        if (!svg.getAttribute('width') || !svg.getAttribute('height')) {
          const rect = svg.getBoundingClientRect();
          svg.setAttribute('width', String(rect.width));
          svg.setAttribute('height', String(rect.height));
        }
      });
    },
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
    console.log('🎨 开始导出数据看板...');

    // 等待图表完全渲染 - 增加等待时间
    console.log('⏳ 等待图表渲染（5秒）...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const element = document.getElementById('dashboard-content');
    if (!element) {
      throw new Error('找不到 dashboard-content 元素');
    }

    console.log('📊 找到 dashboard-content 元素');

    // 配置 html2canvas
    const options: html2canvas.Options = {
      backgroundColor: '#ffffff',
      scale: 1, // 使用标准分辨率
      logging: true,
      useCORS: true,
      allowTaint: false,
      // 等待所有资源加载
      onclone: (clonedDoc) => {
        console.log('🔧 处理克隆的 DOM...');

        // 处理所有 SVG 元素
        const svgs = clonedDoc.querySelectorAll('svg');
        console.log(`📊 找到 ${svgs.length} 个 SVG 元素`);

        svgs.forEach((svg, index) => {
          const svgElement = svg as SVGElement;

          console.log(`处理 SVG ${index}...`);

          // 强制设置样式
          svgElement.style.display = 'block';
          svgElement.style.visibility = 'visible';
          svgElement.style.opacity = '1';
          svgElement.style.position = 'relative';

          // 获取计算后的尺寸
          const computedStyle = window.getComputedStyle(svg);
          const width = parseFloat(computedStyle.width) || 600;
          const height = parseFloat(computedStyle.height) || 350;

          // 设置明确的尺寸属性
          svgElement.setAttribute('width', String(width));
          svgElement.setAttribute('height', String(height));

          // 确保 viewBox 存在
          if (!svgElement.getAttribute('viewBox')) {
            const viewBox = `0 0 ${width} ${height}`;
            svgElement.setAttribute('viewBox', viewBox);
          }

          console.log(`SVG ${index}: ${width}x${height}`);

          // 处理 Recharts 特定元素
          const wrappers = svgElement.querySelectorAll('.recharts-wrapper, .recharts-surface');
          console.log(`  找到 ${wrappers.length} 个 wrapper 元素`);
          wrappers.forEach(wrapper => {
            (wrapper as HTMLElement).style.display = 'block';
            (wrapper as HTMLElement).style.visibility = 'visible';
            (wrapper as HTMLElement).style.opacity = '1';
          });

          // 重点：确保所有路径元素（柱状图）都可见
          const paths = svgElement.querySelectorAll('path');
          console.log(`  找到 ${paths.length} 个 path 元素`);
          paths.forEach((path, i) => {
            const elem = path as HTMLElement;
            elem.style.visibility = 'visible';
            elem.style.opacity = '1';

            // 确保 fill 属性存在
            if (!elem.getAttribute('fill')) {
              elem.setAttribute('fill', '#6366f1');
            }

            // 确保其他必要属性
            if (!elem.getAttribute('stroke')) {
              elem.setAttribute('stroke', 'none');
            }

            // 记录路径数据用于调试
            if (i < 3) {
              console.log(`  Path ${i}: d="${(elem.getAttribute('d') || '').substring(0, 50)}..."`);
            }
          });

          // 处理其他图形元素
          const shapes = svgElement.querySelectorAll('rect, circle, line, g');
          shapes.forEach(shape => {
            const elem = shape as HTMLElement;
            elem.style.visibility = 'visible';
            elem.style.opacity = '1';
          });
        });

        console.log('✅ DOM 处理完成');
      }
    };

    console.log('📸 开始生成图片...');
    const canvas = await html2canvas(element, options);
    console.log('✅ 图片生成成功，尺寸:', canvas.width, 'x', canvas.height);

    // 转换为 PNG（保持图表质量）
    const dataUrl = canvas.toDataURL('image/png');
    console.log('📦 图片长度:', dataUrl.length);

    return dataUrl;
  } catch (error) {
    console.error('❌ 导出数据看板失败:', error);
    throw error;
  }
}
