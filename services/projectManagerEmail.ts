import { AppData, Member, Project, Allocation } from '../types';

/**
 * 获取本周和下周的具体日期列表
 */
function getWeekDates(): { currentWeek: string[], nextWeek: string[] } {
  const now = new Date();
  const currentDay = now.getDay();

  // 计算本周一
  const monday = new Date(now);
  monday.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

  // 本周日期（7天）
  const currentWeek: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    currentWeek.push(date.toISOString().split('T')[0]);
  }

  // 下周日期（7天）
  const nextWeek: string[] = [];
  for (let i = 7; i < 14; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    nextWeek.push(date.toISOString().split('T')[0]);
  }

  return { currentWeek, nextWeek };
}

/**
 * 按项目汇总人员分配情况
 */
interface ProjectAllocation {
  project: Project;
  thisWeekAllocations: {
    member: Member;
    totalAllocation: number;
    allocationPercentage: number; // 在该项目中的占比（相对于该成员的总投入）
    dailyBreakdown: { weekDate: string; value: number }[];
  }[];
}

function getProjectAllocations(data: AppData): ProjectAllocation[] {
  const { currentWeek } = getWeekDates();

  return data.projects
    .map(project => {
    // 本周分配
    const thisWeekMemberMap = new Map<string, {
      member: Member;
      totalAllocation: number;
      dailyBreakdown: { weekDate: string; value: number }[];
    }>();

    // 遍历所有分配记录
    data.allocations
      .filter(a => a.projectId === project.id)
      .forEach(allocation => {
        const member = data.members.find(m => m.id === allocation.memberId);
        if (!member) return;

        // 本周
        if (currentWeek.includes(allocation.weekDate)) {
          if (!thisWeekMemberMap.has(member.id)) {
            thisWeekMemberMap.set(member.id, {
              member,
              totalAllocation: 0,
              dailyBreakdown: []
            });
          }
          const entry = thisWeekMemberMap.get(member.id)!;
          entry.totalAllocation += allocation.value;
          entry.dailyBreakdown.push({
            weekDate: allocation.weekDate,
            value: allocation.value
          });
        }
      });

    const allocations = Array.from(thisWeekMemberMap.values())
      .map(entry => ({
        ...entry,
        dailyBreakdown: entry.dailyBreakdown.sort((a, b) => a.weekDate.localeCompare(b.weekDate))
      }))
      .filter(entry => entry.totalAllocation > 0) // 过滤掉投入为0的
      .map(entry => {
        // 计算该成员在本周所有项目中的总投入
        const memberTotalInAllProjects = data.allocations
          .filter(a => a.memberId === entry.member.id && currentWeek.includes(a.weekDate))
          .reduce((sum, a) => sum + a.value, 0);

        // 计算在该项目中的占比
        const allocationPercentage = memberTotalInAllProjects > 0
          ? (entry.totalAllocation / memberTotalInAllProjects) * 100
          : 0;

        return {
          ...entry,
          allocationPercentage
        };
      })
      .sort((a, b) => {
        // 先按成员名称排序
        const nameCompare = a.member.name.localeCompare(b.member.name, 'zh-CN');
        if (nameCompare !== 0) return nameCompare;
        // 如果成员名称相同，按投入量降序排序
        return b.totalAllocation - a.totalAllocation;
      });

    return {
      project,
      thisWeekAllocations: allocations
    };
  })
  .filter(pa => pa.thisWeekAllocations.length > 0) // 过滤掉没有分配的项目
  .sort((a, b) => {
    // 按项目名称排序
    return a.project.name.localeCompare(b.project.name, 'zh-CN');
  });
}

/**
 * 按人员计算可用性（按周汇总）
 */
interface MemberAvailability {
  member: Member;
  thisWeekAllocation: number; // 本周总投入（单位：周，1=100%一周）
  nextWeekAllocation: number; // 下周总投入
  thisWeekRemainingCapacity: number; // 本周剩余可用（单位：周）
  nextWeekRemainingCapacity: number; // 下周剩余可用
  thisWeekProjects: { projectName: string; allocation: number }[]; // 本周分配的项目
  nextWeekProjects: { projectName: string; allocation: number }[]; // 下周分配的项目
}

function getMembersAvailability(data: AppData): MemberAvailability[] {
  const { currentWeek, nextWeek } = getWeekDates();

  return data.members.map(member => {
    // 计算本周的总投入（所有项目分配之和）
    const thisWeekAllocations = data.allocations.filter(
      a => a.memberId === member.id && currentWeek.includes(a.weekDate)
    );

    // 一周内所有分配值相加，如果总和为1（100%），就是满负荷
    const thisWeekAllocation = thisWeekAllocations.reduce((sum, a) => sum + a.value, 0);

    // 本周分配的项目汇总
    const thisWeekProjectMap = new Map<string, number>();
    thisWeekAllocations.forEach(a => {
      const project = data.projects.find(p => p.id === a.projectId);
      if (project) {
        const current = thisWeekProjectMap.get(project.name) || 0;
        thisWeekProjectMap.set(project.name, current + a.value);
      }
    });

    const thisWeekProjects = Array.from(thisWeekProjectMap.entries()).map(([name, total]) => ({
      projectName: name,
      allocation: total
    }));

    // 计算下周的总投入
    const nextWeekAllocations = data.allocations.filter(
      a => a.memberId === member.id && nextWeek.includes(a.weekDate)
    );

    const nextWeekAllocation = nextWeekAllocations.reduce((sum, a) => sum + a.value, 0);

    // 下周分配的项目汇总
    const nextWeekProjectMap = new Map<string, number>();
    nextWeekAllocations.forEach(a => {
      const project = data.projects.find(p => p.id === a.projectId);
      if (project) {
        const current = nextWeekProjectMap.get(project.name) || 0;
        nextWeekProjectMap.set(project.name, current + a.value);
      }
    });

    const nextWeekProjects = Array.from(nextWeekProjectMap.entries()).map(([name, total]) => ({
      projectName: name,
      allocation: total
    }));

    // 计算剩余可用（1为满负荷一周）
    const thisWeekRemainingCapacity = Math.max(0, 1 - thisWeekAllocation);
    const nextWeekRemainingCapacity = Math.max(0, 1 - nextWeekAllocation);

    return {
      member,
      thisWeekAllocation,
      nextWeekAllocation,
      thisWeekRemainingCapacity,
      nextWeekRemainingCapacity,
      thisWeekProjects,
      nextWeekProjects
    };
  }).sort((a, b) => {
    // 按总剩余可用降序排列
    const totalA = a.thisWeekRemainingCapacity + a.nextWeekRemainingCapacity;
    const totalB = b.thisWeekRemainingCapacity + b.nextWeekRemainingCapacity;
    return totalB - totalA;
  });
}

/**
 * 按人员统计参与的项目
 */
interface MemberProjectSummary {
  member: Member;
  thisWeekAllocation: number; // 本周总投入
  thisWeekProjects: { projectName: string; allocation: number; percentage: number }[]; // 本周参与的项目
}

function getMemberProjectSummaries(data: AppData): MemberProjectSummary[] {
  const { currentWeek } = getWeekDates();

  return data.members.map(member => {
    // 计算本周的总投入
    const thisWeekAllocations = data.allocations.filter(
      a => a.memberId === member.id && currentWeek.includes(a.weekDate)
    );

    const thisWeekAllocation = thisWeekAllocations.reduce((sum, a) => sum + a.value, 0);

    // 本周参与的项目汇总
    const thisWeekProjectMap = new Map<string, number>();
    thisWeekAllocations.forEach(a => {
      const project = data.projects.find(p => p.id === a.projectId);
      if (project) {
        const current = thisWeekProjectMap.get(project.name) || 0;
        thisWeekProjectMap.set(project.name, current + a.value);
      }
    });

    const thisWeekProjects = Array.from(thisWeekProjectMap.entries())
      .map(([name, total]) => ({
        projectName: name,
        allocation: total,
        percentage: total * 100 // 直接转换：0.2 = 20%
      }))
      .sort((a, b) => b.allocation - a.allocation); // 按投入量降序排序

    return {
      member,
      thisWeekAllocation,
      thisWeekProjects
    };
  })
  .filter(summary => summary.thisWeekProjects.length > 0) // 过滤掉没有参与项目的成员
  .sort((a, b) => a.member.name.localeCompare(b.member.name, 'zh-CN')); // 按成员名称排序
}

/**
 * 构建项目经理邮件内容
 */
export function buildProjectManagerEmail(data: AppData): string {
  const projectAllocations = getProjectAllocations(data);
  const membersAvailability = getMembersAvailability(data);
  const memberProjectSummaries = getMemberProjectSummaries(data);

  const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>华北数据库团队资源规划报告</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0 0 10px 0;
          font-size: 28px;
        }
        .header p {
          margin: 0;
          font-size: 14px;
          opacity: 0.9;
        }
        .section {
          padding: 25px 30px;
          border-bottom: 1px solid #e9ecef;
        }
        .section:last-child {
          border-bottom: none;
        }
        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: #495057;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
        }
        .section-title .icon {
          margin-right: 10px;
          font-size: 24px;
        }
        .empty-state {
          text-align: center;
          padding: 40px;
          color: #6c757d;
        }
        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #6c757d;
          border-top: 1px solid #dee2e6;
        }
        .highlight-box {
          background: #e7f3ff;
          border-left: 4px solid #0056b3;
          padding: 12px 15px;
          margin-bottom: 15px;
          border-radius: 4px;
          font-size: 13px;
          color: #004085;
        }

        /* 表格样式 */
        .allocation-table,
        .availability-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          font-size: 14px;
        }

        .allocation-table th,
        .availability-table th {
          background: #f8f9fa;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          color: #495057;
          border-bottom: 2px solid #dee2e6;
        }

        .allocation-table td,
        .availability-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #dee2e6;
          color: #212529;
        }

        .allocation-table tr:hover,
        .availability-table tr:hover {
          background: #f8f9fa;
        }

        .allocation-table tr:last-child td,
        .availability-table tr:last-child td {
          border-bottom: none;
        }

        /* 可用性表格特殊样式 */
        .availability-table th {
          text-align: center;
        }

        .availability-table td {
          text-align: center;
        }

        .availability-table td:first-child {
          text-align: left;
          font-weight: 500;
        }

        .availability-table .available {
          color: #28a745;
          font-weight: 600;
        }

        .availability-table .unavailable {
          color: #dc3545;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>📊 华北数据库团队资源规划报告</h1>
          <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
        </div>

        <!-- Section 1: 项目资源分配 -->
        <div class="section">
          <div class="section-title">
            <span class="icon">🎯</span>
            本周项目资源分配
          </div>

          ${projectAllocations.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">📭</div>
              <p>当前暂无项目分配记录</p>
            </div>
          ` : `
            <table class="allocation-table">
              <thead>
                <tr>
                  <th>项目名称</th>
                  <th>成员</th>
                  <th>投入占比</th>
                </tr>
              </thead>
              <tbody>
                ${projectAllocations.map(project =>
                  project.thisWeekAllocations.map(allocation => `
                    <tr>
                      ${allocation === project.thisWeekAllocations[0] ? `
                        <td rowspan="${project.thisWeekAllocations.length}">${project.project.name}</td>
                      ` : ''}
                      <td>${allocation.member.name}</td>
                      <td>${allocation.allocationPercentage.toFixed(0)}%</td>
                    </tr>
                  `).join('')
                ).join('')}
              </tbody>
            </table>
          `}
        </div>

        <!-- Section 2: 资源可用性 -->
        <div class="section">
          <div class="section-title">
            <span class="icon">👥</span>
            团队成员可用性
          </div>

          <div class="highlight-box">
            💡 以下显示团队成员在未来两周内的可用情况（按周汇总），可用于新项目资源规划
          </div>

          <table class="availability-table">
            <thead>
              <tr>
                <th>成员</th>
                <th>本周投入</th>
                <th>本周剩余</th>
                <th>下周投入</th>
                <th>下周剩余</th>
              </tr>
            </thead>
            <tbody>
              ${membersAvailability.map(member => `
                <tr>
                  <td>${member.member.name}</td>
                  <td>${(member.thisWeekAllocation * 100).toFixed(0)}%</td>
                  <td class="${member.thisWeekRemainingCapacity > 0 ? 'available' : 'unavailable'}">
                    ${(member.thisWeekRemainingCapacity * 100).toFixed(0)}%
                  </td>
                  <td>${(member.nextWeekAllocation * 100).toFixed(0)}%</td>
                  <td class="${member.nextWeekRemainingCapacity > 0 ? 'available' : 'unavailable'}">
                    ${(member.nextWeekRemainingCapacity * 100).toFixed(0)}%
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Section 3: 人员项目参与统计 -->
        <div class="section">
          <div class="section-title">
            <span class="icon">👤</span>
            本周人员项目参与统计
          </div>

          <div class="highlight-box">
            💡 以下显示每位成员本周参与的项目及投入情况
          </div>

          ${memberProjectSummaries.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">📭</div>
              <p>当前暂无人员项目参与记录</p>
            </div>
          ` : `
            <table class="allocation-table">
              <thead>
                <tr>
                  <th>成员</th>
                  <th>总投入</th>
                  <th>参与项目及占比</th>
                </tr>
              </thead>
              <tbody>
                ${memberProjectSummaries.map(summary => `
                  <tr>
                    <td><strong>${summary.member.name}</strong></td>
                    <td>${(summary.thisWeekAllocation * 100).toFixed(0)}%</td>
                    <td>
                      ${summary.thisWeekProjects.map(p => `
                        <span style="display: inline-block; margin-right: 12px; margin-bottom: 4px;">
                          ${p.projectName} (${p.percentage.toFixed(0)}%)
                        </span>
                      `).join('')}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>📧 本邮件由团队资源管理系统自动发送</p>
          <p>如有疑问，请联系 <strong>潘大全</strong> (<a href="mailto:pandq@chinacscs.com">pandq@chinacscs.com</a>)</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return emailContent;
}
