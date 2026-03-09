import { supabase } from '../supabaseClient';
import { AppData } from '../types';
import { buildProjectManagerEmail } from './projectManagerEmail';

export interface EmailPayload {
  to: string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    encoding: 'base64';
  }>;
}

/**
 * 发送邮件（通过 Supabase Edge Function）
 * 需要在 Supabase 项目中部署 Edge Function 来处理邮件发送
 */
export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('=== 发送邮件请求 ===');
    console.log('Payload:', {
      to: payload.to,
      subject: payload.subject,
      hasHtml: !!payload.html,
      hasAttachments: !!payload.attachments,
      attachmentCount: payload.attachments?.length || 0
    });

    // 调用 Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('resend-email', {
      body: payload,
    });

    console.log('Edge Function 响应:');
    console.log('Data:', data);
    console.log('Error:', error);

    // 详细检查错误对象
    if (error) {
      console.error('错误详情:', {
        message: error.message,
        name: error.name,
        status: (error as any).status,
        context: (error as any).context,
        fullError: JSON.stringify(error, null, 2)
      });

      // 尝试从 context 中获取更多错误信息
      const errorContext = (error as any).context;
      if (errorContext && typeof errorContext.text === 'function') {
        try {
          const errorText = await errorContext.text();
          console.error('错误响应文本:', errorText);

          try {
            const errorBody = JSON.parse(errorText);
            console.error('解析后的错误:', errorBody);

            if (errorBody.error) {
              return { success: false, error: `${errorBody.error}${errorBody.details ? `: ${errorBody.details}` : ''}` };
            }
          } catch (parseError) {
            console.error('无法解析为JSON，原始文本:', errorText);
            return { success: false, error: errorText };
          }
        } catch (e) {
          console.error('无法读取错误响应:', e);
        }
      }

      return { success: false, error: error.message || JSON.stringify(error) };
    }

    // 检查响应数据
    if (data && typeof data === 'object') {
      if (data.error) {
        console.error('Edge Function 返回错误:', data.error);
        return { success: false, error: data.error };
      }
    }

    console.log('✅ 邮件发送成功');
    return { success: true };
  } catch (error: any) {
    console.error('❌ 邮件发送异常:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return { success: false, error: error.message || '发送失败' };
  }
}

/**
 * 构建邮件内容
 */
export function buildEmailContent(): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #4f46e5;
        }
        .header h1 {
          color: #1e293b;
          margin: 0;
          font-size: 24px;
        }
        .date {
          color: #64748b;
          font-size: 14px;
          margin-top: 10px;
        }
        .content {
          margin: 20px 0;
        }
        .attachment-notice {
          background-color: #f0f9ff;
          border-left: 4px solid #4f46e5;
          padding: 15px 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .attachment-notice p {
          margin: 5px 0;
          color: #1e293b;
        }
        .attachment-notice strong {
          color: #4f46e5;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #64748b;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>华北数据库团队资源规划 - 数据看板报告</h1>
          <div class="date">报告日期：${dateStr}</div>
        </div>
        <div class="content">
          <p>您好，</p>
          <p>本期团队资源规划的数据看板报告已生成，请查收附件中的详细报告。</p>

          <div class="attachment-notice">
            <p><strong>📎 附件说明</strong></p>
            <p>数据看板已作为附件发送，文件名为 <strong>dashboard.png</strong></p>
            <p>请下载附件查看完整的团队资源规划报告。</p>
          </div>

          <p>如有任何问题，请随时联系团队管理员。</p>
        </div>
        <div class="footer">
          <p>此邮件由华北数据库团队资源规划系统自动发送</p>
          <p>${dateStr}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * 从列表中提取有效的邮箱地址
 */
export function extractValidEmails(emails: string[]): string[] {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emails.filter(email => emailRegex.test(email.trim()));
}

/**
 * 发送数据看板报告邮件（项目经理版本）
 */
export async function sendDashboardReport(
  recipients: string[],
  dashboardImageBase64: string,
  data: AppData
): Promise<{ success: boolean; error?: string }> {
  // 验证邮箱地址
  const validEmails = extractValidEmails(recipients);
  if (validEmails.length === 0) {
    return { success: false, error: '没有有效的收件人邮箱地址' };
  }

  // 使用新的项目经理邮件模板
  const htmlContent = buildProjectManagerEmail(data);

  // 准备邮件负载 - 图片作为附件发送
  const payload: EmailPayload = {
    to: validEmails,
    subject: `团队资源规划报告 - ${new Date().toLocaleDateString('zh-CN')}`,
    html: htmlContent,
    attachments: [
      {
        filename: 'dashboard.png',
        content: dashboardImageBase64.split(',')[1], // 移除 data:image/png;base64, 前缀
        encoding: 'base64',
      },
    ],
  };

  return sendEmail(payload);
}
