import { EmailConfig, ScheduleFrequency } from '../types';
import { sendDashboardReport } from '../services/emailService';
import { exportDashboardForEmail } from '../utils/export';

/**
 * 检查是否应该发送邮件
 */
export function shouldSendEmail(emailConfig: EmailConfig): boolean {
  console.log('🔍 检查是否应该发送邮件...', {
    enabled: emailConfig.enabled,
    frequency: emailConfig.frequency,
    scheduleTime: emailConfig.scheduleTime,
    lastSent: emailConfig.lastSent,
    now: new Date().toISOString()
  });

  if (!emailConfig.enabled) {
    console.log('❌ 邮件功能未启用');
    return false;
  }

  const now = new Date();
  const [hours, minutes] = emailConfig.scheduleTime.split(':').map(Number);

  // 创建今天的调度时间
  const scheduledTime = new Date(now);
  scheduledTime.setHours(hours, minutes, 0, 0);

  console.log('⏰ 时间检查:', {
    current: now.toLocaleTimeString('zh-CN'),
    scheduled: scheduledTime.toLocaleTimeString('zh-CN'),
    isAfter: now >= scheduledTime
  });

  // 如果当前时间早于调度时间，不发送
  if (now < scheduledTime) {
    console.log('❌ 当前时间早于调度时间');
    return false;
  }

  // 检查时间窗口：只在调度时间之后的5分钟内发送
  const timeDiff = now.getTime() - scheduledTime.getTime();
  const fiveMinutesInMs = 5 * 60 * 1000;

  if (timeDiff > fiveMinutesInMs) {
    // 超过时间窗口，可能已经发送过了
    console.log('❌ 超过时间窗口（5分钟）');
    return false;
  }

  // 如果今天已经发送过，不重复发送
  if (emailConfig.lastSent) {
    const lastSentDate = new Date(emailConfig.lastSent);
    const lastSentDay = lastSentDate.toDateString();
    const today = now.toDateString();

    console.log('📅 检查今天是否已发送:', {
      lastSent: lastSentDate.toLocaleString('zh-CN'),
      today: now.toLocaleDateString('zh-CN'),
      alreadySent: lastSentDay === today
    });

    if (lastSentDay === today) {
      console.log('❌ 今天已经发送过');
      return false;
    }
  }

  // 根据频率检查是否应该发送
  let shouldSend = false;

  switch (emailConfig.frequency) {
    case 'daily':
      console.log('✅ 每天发送模式 - 应该发送');
      shouldSend = true;
      break;

    case 'weekly':
      // 检查今天是否是指定的星期几
      const currentDayOfWeek = now.getDay();
      const targetDayOfWeek = emailConfig.scheduleDayOfWeek ?? 5;
      console.log('📆 每周发送模式:', {
        currentDay: currentDayOfWeek,
        targetDayOfWeek: targetDayOfWeek,
        match: currentDayOfWeek === targetDayOfWeek
      });
      shouldSend = currentDayOfWeek === targetDayOfWeek;
      break;

    case 'monthly':
      // 检查今天是否是指定的日期
      const currentDayOfMonth = now.getDate();
      const targetDayOfMonth = emailConfig.scheduleDayOfMonth ?? 1;
      console.log('📅 每月发送模式:', {
        currentDay: currentDayOfMonth,
        targetDayOfMonth: targetDayOfMonth,
        match: currentDayOfMonth === targetDayOfMonth
      });
      shouldSend = currentDayOfMonth === targetDayOfMonth;
      break;

    default:
      console.log('❌ 未知的发送频率');
      shouldSend = false;
  }

  if (shouldSend) {
    console.log('✅✅✅ 应该发送邮件！');
  } else {
    console.log('❌ 不满足发送条件');
  }

  return shouldSend;
}

/**
 * 获取下次发送时间描述
 */
export function getNextSendDescription(emailConfig: EmailConfig): string {
  if (!emailConfig.enabled) {
    return '邮件发送未启用';
  }

  const frequencyText = {
    daily: '每天',
    weekly: `每周${['周日', '周一', '周二', '周三', '周四', '周五', '周六'][emailConfig.scheduleDayOfWeek ?? 5]}`,
    monthly: `每月${emailConfig.scheduleDayOfMonth ?? 1}日`,
  }[emailConfig.frequency];

  return `${frequencyText} ${emailConfig.scheduleTime}`;
}

/**
 * 执行定时发送任务
 */
export async function executeScheduledSend(
  emailConfig: EmailConfig,
  onSendComplete?: (success: boolean) => void
): Promise<void> {
  if (!shouldSendEmail(emailConfig)) {
    return;
  }

  try {
    console.log('执行定时邮件发送任务...');

    // 导出数据看板
    const dashboardImage = await exportDashboardForEmail();

    // 收集收件人
    const recipients: string[] = [];

    // 从启用的成员获取邮箱
    emailConfig.recipients
      .filter(r => r.enabled)
      .forEach(r => {
        // 这里需要从 data.members 中获取邮箱，但这个函数没有访问 data
        // 所以我们需要修改函数签名或在调用时处理
      });

    // 添加自定义邮箱
    recipients.push(...emailConfig.customEmails);

    if (recipients.length === 0) {
      console.warn('没有配置收件人，跳过发送');
      onSendComplete?.(false);
      return;
    }

    // 发送邮件
    const result = await sendDashboardReport(recipients, dashboardImage, data);

    if (result.success) {
      console.log('定时邮件发送成功');
      onSendComplete?.(true);
    } else {
      console.error('定时邮件发送失败:', result.error);
      onSendComplete?.(false);
    }
  } catch (error) {
    console.error('定时发送任务执行失败:', error);
    onSendComplete?.(false);
  }
}

/**
 * 创建定时检查器（每分钟检查一次）
 */
export function createScheduler(
  emailConfig: EmailConfig,
  data: any, // AppData
  onUpdateEmailConfig: (config: EmailConfig) => void,
  getDashboardRef: () => React.RefObject<HTMLDivElement> | null
): () => void {
  let intervalId: number | null = null;

  const start = () => {
    // 清除已有的定时器
    if (intervalId !== null) {
      clearInterval(intervalId);
    }

    // 不再立即检查，而是等待第一个定时周期
    // 每分钟检查一次
    intervalId = window.setInterval(() => {
      checkAndSend();
    }, 60000); // 60秒
  };

  const checkAndSend = async () => {
    if (!shouldSendEmail(emailConfig)) {
      return;
    }

    try {
      console.log('触发定时发送...');

      // 尝试获取 Dashboard 引用
      const dashboardRef = getDashboardRef?.();

      let dashboardImage: string;

      if (dashboardRef?.current) {
        // 如果有 Dashboard 引用，使用它导出
        console.log('使用 Dashboard 引用导出图片...');

        // 等待一小段时间确保 Dashboard 完全渲染
        await new Promise(resolve => setTimeout(resolve, 500));

        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(dashboardRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: false,
        });
        dashboardImage = canvas.toDataURL('image/png');
      } else {
        // 如果没有 Dashboard 引用，尝试直接查找元素
        console.log('尝试直接查找 Dashboard 元素...');
        // 等待一小段时间确保页面加载完成
        await new Promise(resolve => setTimeout(resolve, 500));
        dashboardImage = await exportDashboardForEmail();
      }

      // 收集收件人邮箱
      const recipientEmails: string[] = [];

      // 从启用接收邮件的成员中获取邮箱
      emailConfig.recipients
        .filter(r => r.enabled)
        .forEach(r => {
          const member = data.members.find(m => m.id === r.memberId);
          if (member?.email) {
            recipientEmails.push(member.email);
          }
        });

      // 添加自定义邮箱
      recipientEmails.push(...emailConfig.customEmails);

      if (recipientEmails.length === 0) {
        console.warn('没有配置收件人，跳过发送');
        return;
      }

      console.log('准备发送到收件人:', recipientEmails);

      // 发送邮件
      const result = await sendDashboardReport(recipientEmails, dashboardImage, data);

      if (result.success) {
        console.log('✅ 定时邮件发送成功');
        // 更新最后发送时间
        onUpdateEmailConfig({
          ...emailConfig,
          lastSent: new Date().toISOString(),
        });
      } else {
        console.error('❌ 定时邮件发送失败:', result.error);
      }
    } catch (error) {
      console.error('定时发送检查失败:', error);
    }
  };

  const stop = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  start();

  return stop;
}
