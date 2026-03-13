import { supabase } from '../supabaseClient';
import { AppData, Member, Project, Allocation, EmailConfig, EmailRecipient } from '../types';
import { generateId, getNext13Weeks } from '../utils';

// 从数据库加载所有数据
export const loadData = async (): Promise<AppData> => {
  try {
    // 并行加载所有数据
    const [membersResult, projectsResult, allocationsResult, emailConfigResult, customEmailsResult, emailRecipientsResult] = await Promise.all([
      supabase.from('members').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('allocations').select('*'),
      supabase.from('email_configs').select('*').single(),
      supabase.from('custom_emails').select('*'),
      supabase.from('email_recipients').select('*')
    ]);

    if (membersResult.error) throw membersResult.error;
    if (projectsResult.error) throw projectsResult.error;
    if (allocationsResult.error) throw allocationsResult.error;

    const members: Member[] = (membersResult.data || [])
      .filter(m => m.status !== 'deleted') // 过滤已删除的成员
      .map(m => ({
        id: m.id,
        name: m.name,
        role: m.role,
        email: m.email,
        status: m.status || 'active'
      }));
    const projects: Project[] = (projectsResult.data || []).map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      projectStatus: p.project_status
    }));
    const allocations: Allocation[] = (allocationsResult.data || []).map(a => ({
      id: a.id,
      memberId: a.member_id,
      projectId: a.project_id,
      weekDate: a.week_date,
      value: a.value
    }));

    // 加载邮件配置
    let emailConfig: EmailConfig | undefined = undefined;
    if (emailConfigResult.data) {
      const recipients: EmailRecipient[] = (emailRecipientsResult.data || []).map(r => ({
        memberId: r.member_id,
        enabled: r.enabled
      }));

      const customEmails: string[] = (customEmailsResult.data || []).map(e => e.email);

      emailConfig = {
        enabled: emailConfigResult.data.enabled,
        recipients,
        customEmails,
        frequency: emailConfigResult.data.frequency || 'weekly',
        scheduleTime: emailConfigResult.data.schedule_time,
        scheduleDayOfWeek: emailConfigResult.data.schedule_day_of_week,
        scheduleDayOfMonth: emailConfigResult.data.schedule_day_of_month,
        lastSent: emailConfigResult.data.last_sent
      };
    }

    // 不再自动初始化数据 - 用户可以完全控制数据
    // 如果数据库为空，返回空数据，由用户自行添加
    return { members, projects, allocations, emailConfig };
  } catch (error) {
    console.error('加载数据失败:', error);
    throw error;
  }
};

// 初始化数据（仅在首次使用时调用）
const initializeData = async (): Promise<AppData> => {
  const initialMembers: Member[] = [
    { id: 'm1', name: 'Alice Chen', role: 'DB Architect' },
    { id: 'm2', name: 'Bob Smith', role: 'Data Engineer' },
    { id: 'm3', name: 'Charlie Kim', role: 'DBA' },
    { id: 'm4', name: 'Diana Prince', role: 'ETL Developer' },
    { id: 'm5', name: 'Ethan Hunt', role: 'Data Analyst' },
    { id: 'm6', name: 'Fiona Gallagher', role: 'Backend Dev' },
  ];

  const initialProjects: Project[] = [
    { id: 'p1', name: 'FinTech Migration', status: 'active', projectStatus: 'ongoing' },
    { id: 'p2', name: 'Real-time Ledger', status: 'active', projectStatus: 'ongoing' },
    { id: 'p3', name: 'Audit Logs 2.0', status: 'active', projectStatus: 'ongoing' },
  ];

  // 插入初始数据
  await Promise.all([
    supabase.from('members').insert(
      initialMembers.map(m => ({ id: m.id, name: m.name, role: m.role }))
    ),
    supabase.from('projects').insert(
      initialProjects.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        project_status: p.projectStatus
      }))
    )
  ]);

  return {
    members: initialMembers,
    projects: initialProjects,
    allocations: []
  };
};

// 保存成员和项目（仅在设置页面修改时使用）
export const saveData = async (data: AppData): Promise<void> => {
  try {
    // 1. 获取数据库中现有的成员和项目
    const [existingMembers, existingProjects] = await Promise.all([
      supabase.from('members').select('id'),
      supabase.from('projects').select('id')
    ]);

    if (existingMembers.error) throw existingMembers.error;
    if (existingProjects.error) throw existingProjects.error;

    const existingMemberIds = new Set(existingMembers.data?.map(m => m.id) || []);
    const existingProjectIds = new Set(existingProjects.data?.map(p => p.id) || []);
    const newMemberIds = new Set(data.members.map(m => m.id));
    const newProjectIds = new Set(data.projects.map(p => p.id));

    // 2. 逻辑删除数据库中存在但新数据中不存在的成员（更新状态为 deleted）
    const membersToDelete = [...existingMemberIds].filter(id => !newMemberIds.has(id));
    if (membersToDelete.length > 0) {
      const { error: deleteMembersError } = await supabase
        .from('members')
        .update({ status: 'deleted' })
        .in('id', membersToDelete);
      if (deleteMembersError) throw deleteMembersError;
    }

    // 3. 删除数据库中存在但新数据中不存在的项目
    const projectsToDelete = [...existingProjectIds].filter(id => !newProjectIds.has(id));
    if (projectsToDelete.length > 0) {
      const { error: deleteProjectsError } = await supabase
        .from('projects')
        .delete()
        .in('id', projectsToDelete);
      if (deleteProjectsError) throw deleteProjectsError;
    }

    // 4. Upsert 新的成员和项目
    await Promise.all([
      // 更新成员
      Promise.all(
        data.members.map(member =>
          supabase
            .from('members')
            .upsert({ id: member.id, name: member.name, role: member.role })
        )
      ),
      // 更新项目
      Promise.all(
        data.projects.map(project =>
          supabase
            .from('projects')
            .upsert({
              id: project.id,
              name: project.name,
              status: project.status,
              project_status: project.projectStatus
            })
        )
      )
    ]);

    // 5. 保存邮件配置
    if (data.emailConfig) {
      await saveEmailConfig(data.emailConfig);
    }
  } catch (error) {
    console.error('保存数据失败:', error);
    throw error;
  }
};

// 恢复已删除的成员（管理员功能）
export const restoreDeletedMembers = async (memberIds: string[]): Promise<void> => {
  try {
    const { error } = await supabase
      .from('members')
      .update({ status: 'active' })
      .in('id', memberIds);

    if (error) throw error;
    console.log(`成功恢复 ${memberIds.length} 个成员`);
  } catch (error) {
    console.error('恢复成员失败:', error);
    throw error;
  }
};

// 获取所有已删除的成员（管理员功能）
export const getDeletedMembers = async (): Promise<Member[]> => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('status', 'deleted');

    if (error) throw error;

    return (data || []).map(m => ({
      id: m.id,
      name: m.name,
      role: m.role,
      email: m.email,
      status: m.status || 'deleted'
    }));
  } catch (error) {
    console.error('获取已删除成员失败:', error);
    throw error;
  }
};

// 保存邮件配置
const saveEmailConfig = async (emailConfig: EmailConfig): Promise<void> => {
  try {
    // 保存主配置（包括新的频率字段）
    await supabase
      .from('email_configs')
      .upsert({
        id: 'default',
        enabled: emailConfig.enabled,
        frequency: emailConfig.frequency,
        schedule_time: emailConfig.scheduleTime,
        schedule_day_of_week: emailConfig.scheduleDayOfWeek,
        schedule_day_of_month: emailConfig.scheduleDayOfMonth,
        last_sent: emailConfig.lastSent
      });

    // 获取现有的自定义邮箱
    const { data: existingCustomEmails } = await supabase
      .from('custom_emails')
      .select('*');

    const existingEmailSet = new Set(existingCustomEmails?.map(e => e.email) || []);

    // 删除不再存在的邮箱
    const emailsToDelete = existingCustomEmails
      ?.filter(e => !emailConfig.customEmails.includes(e.email))
      .map(e => e.id) || [];

    if (emailsToDelete.length > 0) {
      await supabase
        .from('custom_emails')
        .delete()
        .in('id', emailsToDelete);
    }

    // 添加新的自定义邮箱
    const newEmails = emailConfig.customEmails.filter(email => !existingEmailSet.has(email));
    for (const email of newEmails) {
      await supabase
        .from('custom_emails')
        .insert({
          id: generateId(),
          email: email
        });
    }

    // 获取现有的收件人配置
    const { data: existingRecipients } = await supabase
      .from('email_recipients')
      .select('*');

    const existingRecipientMap = new Map(
      existingRecipients?.map(r => [r.member_id, r]) || []
    );

    // 更新或插入收件人配置
    for (const recipient of emailConfig.recipients) {
      await supabase
        .from('email_recipients')
        .upsert({
          id: existingRecipientMap.get(recipient.memberId)?.id || generateId(),
          member_id: recipient.memberId,
          enabled: recipient.enabled
        });
    }

    // 删除不再存在的收件人配置
    const recipientsToDelete = existingRecipients
      ?.filter(r => !emailConfig.recipients.find(rec => rec.memberId === r.member_id))
      .map(r => r.id) || [];

    if (recipientsToDelete.length > 0) {
      await supabase
        .from('email_recipients')
        .delete()
        .in('id', recipientsToDelete);
    }
  } catch (error) {
    console.error('保存邮件配置失败:', error);
    throw error;
  }
};

// 更新或插入单个分配记录（乐观更新版本）
export const updateAllocation = async (
  currentData: AppData,
  memberId: string,
  projectId: string,
  weekDate: string,
  value: number
): Promise<AppData> => {
  // 先在本地更新（乐观更新）
  const existingIndex = currentData.allocations.findIndex(
    a => a.memberId === memberId && a.projectId === projectId && a.weekDate === weekDate
  );

  let newAllocations = [...currentData.allocations];

  if (value <= 0) {
    if (existingIndex >= 0) {
      newAllocations.splice(existingIndex, 1);
    }
  } else {
    if (existingIndex >= 0) {
      newAllocations[existingIndex] = { ...newAllocations[existingIndex], value };
    } else {
      newAllocations.push({
        id: generateId(),
        memberId,
        projectId,
        weekDate,
        value
      });
    }
  }

  const optimisticData = { ...currentData, allocations: newAllocations };

  // 在后台异步保存到数据库（不等待完成）
  saveAllocationToDatabase(memberId, projectId, weekDate, value).catch(error => {
    console.error('保存到数据库失败:', error);
    // 可以在这里添加错误处理逻辑，比如显示通知
  });

  // 立即返回更新后的数据
  return optimisticData;
};

// 辅助函数：保存分配记录到数据库
const saveAllocationToDatabase = async (
  memberId: string,
  projectId: string,
  weekDate: string,
  value: number
): Promise<void> => {
  try {
    // 检查是否已存在
    const { data: existing } = await supabase
      .from('allocations')
      .select('id')
      .eq('member_id', memberId)
      .eq('project_id', projectId)
      .eq('week_date', weekDate)
      .maybeSingle();

    if (value <= 0) {
      // 删除记录
      if (existing) {
        await supabase
          .from('allocations')
          .delete()
          .eq('member_id', memberId)
          .eq('project_id', projectId)
          .eq('week_date', weekDate);
      }
    } else {
      // 插入或更新记录
      const record = {
        member_id: memberId,
        project_id: projectId,
        week_date: weekDate,
        value: value
      };

      await supabase
        .from('allocations')
        .upsert(existing ? { ...record, id: existing.id } : { ...record, id: generateId() });
    }
  } catch (error) {
    console.error('保存到数据库失败:', error);
    throw error;
  }
};

// 删除项目的某个成员的所有分配（同步版本，确保数据库删除成功）
export const deleteProjectRow = async (
  currentData: AppData,
  memberId: string,
  projectId: string
): Promise<AppData> => {
  try {
    // 先删除数据库中的数据（等待完成）
    const { error } = await supabase
      .from('allocations')
      .delete()
      .eq('member_id', memberId)
      .eq('project_id', projectId);

    if (error) {
      console.error('删除分配失败:', error);
      throw error;
    }

    // 数据库删除成功后，更新本地数据
    return {
      ...currentData,
      allocations: currentData.allocations.filter(
        a => !(a.memberId === memberId && a.projectId === projectId)
      )
    };
  } catch (error) {
    console.error('删除分配失败:', error);
    throw error;
  }
};
