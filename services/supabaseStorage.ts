import { supabase } from '../supabaseClient';
import { AppData, Member, Project, Allocation } from '../types';
import { generateId, getNext13Weeks } from '../utils';

// 从数据库加载所有数据
export const loadData = async (): Promise<AppData> => {
  try {
    // 并行加载所有数据
    const [membersResult, projectsResult, allocationsResult] = await Promise.all([
      supabase.from('members').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('allocations').select('*')
    ]);

    if (membersResult.error) throw membersResult.error;
    if (projectsResult.error) throw projectsResult.error;
    if (allocationsResult.error) throw allocationsResult.error;

    const members: Member[] = membersResult.data || [];
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

    // 如果数据库为空，初始化数据
    if (members.length === 0 || projects.length === 0) {
      return await initializeData();
    }

    return { members, projects, allocations };
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
    // 更新成员
    await Promise.all(
      data.members.map(member =>
        supabase
          .from('members')
          .upsert({ id: member.id, name: member.name, role: member.role })
      )
    );

    // 更新项目
    await Promise.all(
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
    );
  } catch (error) {
    console.error('保存数据失败:', error);
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

// 删除项目的某个成员的所有分配（乐观更新版本）
export const deleteProjectRow = async (
  currentData: AppData,
  memberId: string,
  projectId: string
): Promise<AppData> => {
  // 先在本地更新（乐观更新）
  const optimisticData = {
    ...currentData,
    allocations: currentData.allocations.filter(
      a => !(a.memberId === memberId && a.projectId === projectId)
    )
  };

  // 在后台异步保存到数据库（不等待完成）
  supabase
    .from('allocations')
    .delete()
    .eq('member_id', memberId)
    .eq('project_id', projectId)
    .then(({ error }) => {
      if (error) {
        console.error('删除分配失败:', error);
      }
    })
    .catch(error => {
      console.error('删除分配失败:', error);
    });

  // 立即返回更新后的数据
  return optimisticData;
};
