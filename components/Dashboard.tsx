import React, { useState, useRef } from 'react';
import { AppData, Member, Project, WEEK_COUNT } from '../types';
import { getNext13Weeks, calculateMemberLoad, findFreeDate, formatDateShort, getWeeksAroundDate } from '../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AlertCircle, CheckCircle, TrendingUp, Users, ChevronLeft, ChevronRight, Calendar, Download, Image } from 'lucide-react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

interface DashboardProps {
  data: AppData;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const weeks = getWeeksAroundDate(selectedDate, WEEK_COUNT);

  // 1. Prepare Data for Heatmap (Saturation)
  // We'll render this as a grid div since it's simpler than a chart library for a heatmap table
  const renderHeatmap = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left text-slate-500 font-normal">Member</th>
              {weeks.map(w => (
                <th key={w} className="p-2 text-center text-xs text-slate-400 font-normal">{formatDateShort(w)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.members.map(m => (
              <tr key={m.id} className="border-b border-slate-100 last:border-0">
                <td className="p-2 font-medium text-slate-700 whitespace-nowrap">{m.name}</td>
                {weeks.map(w => {
                  const load = calculateMemberLoad(m.id, w, data.allocations);
                  let bgClass = 'bg-slate-100'; // < 0.8 (Under)
                  let textClass = 'text-slate-400';
                  
                  if (load === 0) {
                      bgClass = 'bg-slate-50';
                  } else if (load < 0.8) {
                    bgClass = 'bg-blue-50';
                    textClass = 'text-blue-600';
                  } else if (load <= 1.0) {
                    bgClass = 'bg-emerald-100'; // Healthy
                    textClass = 'text-emerald-700 font-bold';
                  } else {
                    bgClass = 'bg-red-100'; // Over
                    textClass = 'text-red-700 font-bold';
                  }

                  return (
                    <td key={w} className="p-1">
                      <div className={`w-full h-8 rounded flex items-center justify-center text-xs ${bgClass} ${textClass}`}>
                        {load > 0 ? load.toFixed(1) : '-'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // 2. Prepare Data for Stacked Bar Chart (Project Consumption)
  const chartData = weeks.map(week => {
    const point: any = { name: formatDateShort(week) };
    data.projects.forEach(p => {
      // Sum allocations for this project in this week
      const total = data.allocations
        .filter(a => a.projectId === p.id && a.weekDate === week)
        .reduce((sum, a) => sum + a.value, 0);
      if (total > 0) point[p.name] = parseFloat(total.toFixed(1));
    });
    return point;
  });

  const projectColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  // 3. Bench / Free Resources Logic
  const freeResources = data.members.map(m => {
    const freeDate = findFreeDate(m.id, data.allocations, weeks);
    return { member: m, date: freeDate };
  }).filter(item => item.date !== null);

  freeResources.sort((a, b) => (a.date! > b.date! ? 1 : -1));

  // Handle date navigation
  const goToPreviousWeeks = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const goToNextWeeks = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const goToCurrentWeeks = () => {
    setSelectedDate(new Date());
  };

  const getDateRangeText = () => {
    if (weeks.length === 0) return '';
    const start = new Date(weeks[0]);
    const end = new Date(weeks[weeks.length - 1]);
    const startStr = start.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  // Export to image
  const exportToImage = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `华北数据库团队资源规划_${getDateRangeText()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('导出图片失败:', error);
      alert('导出图片失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: 团队饱和度数据
      const saturationData = data.members.map(m => ({
        '成员姓名': m.name,
        '职位': m.role,
        ...weeks.reduce((acc, w) => {
          const load = calculateMemberLoad(m.id, w, data.allocations);
          acc[formatDateShort(w)] = load.toFixed(2);
          return acc;
        }, {} as Record<string, string>)
      }));

      const ws1 = XLSX.utils.json_to_sheet(saturationData);
      XLSX.utils.book_append_sheet(wb, ws1, '团队饱和度');

      // Sheet 2: 资源可用性
      const freeResourcesData = freeResources.map(item => ({
        '成员姓名': item.member.name,
        '职位': item.member.role,
        '可用时间': formatDateShort(item.date!)
      }));

      if (freeResourcesData.length > 0) {
        const ws2 = XLSX.utils.json_to_sheet(freeResourcesData);
        XLSX.utils.book_append_sheet(wb, ws2, '资源可用性');
      }

      // Sheet 3: 项目负载分布
      const chartData = weeks.map(week => {
        const point: any = { '周': formatDateShort(week) };
        data.projects.forEach(p => {
          const total = data.allocations
            .filter(a => a.projectId === p.id && a.weekDate === week)
            .reduce((sum, a) => sum + a.value, 0);
          if (total > 0) point[p.name] = parseFloat(total.toFixed(2));
        });
        return point;
      });

      const ws3 = XLSX.utils.json_to_sheet(chartData);
      XLSX.utils.book_append_sheet(wb, ws3, '项目负载分布');

      // Sheet 4: 人员项目投入统计
      const memberProjectData: any[] = [];
      data.members.forEach(member => {
        const projectStats = data.projects
          .filter(p => p.status === 'active')
          .map(project => {
            const totalAllocation = weeks.reduce((sum, week) => {
              const allocation = data.allocations.find(
                a => a.memberId === member.id && a.projectId === project.id && a.weekDate === week
              );
              return sum + (allocation ? allocation.value : 0);
            }, 0);

            if (totalAllocation > 0) {
              return {
                '成员姓名': member.name,
                '职位': member.role,
                '项目名称': project.name,
                '项目状态': project.projectStatus === 'ongoing' ? '进行中' : '已结项',
                '4周总计FTE': totalAllocation.toFixed(2),
                '平均每周FTE': (totalAllocation / weeks.length).toFixed(2)
              };
            }
            return null;
          })
          .filter((stat): stat is any => stat !== null);

        memberProjectData.push(...projectStats);
      });

      if (memberProjectData.length > 0) {
        const ws4 = XLSX.utils.json_to_sheet(memberProjectData);
        XLSX.utils.book_append_sheet(wb, ws4, '人员项目投入');
      }

      // 生成文件
      XLSX.writeFile(wb, `华北数据库团队资源规划_${getDateRangeText()}.xlsx`);
    } catch (error) {
      console.error('导出Excel失败:', error);
      alert('导出Excel失败，请重试');
    }
  };

  // 4. Member Project Allocation Statistics - Stacked bar for each member
  const renderMemberProjectStats = () => {
    return (
      <div className="space-y-4">
        {data.members.map(member => {
          // Calculate total allocation per project for this member across all weeks
          const projectStats = data.projects
            .filter(p => p.status === 'active')
            .map(project => {
              const totalAllocation = weeks.reduce((sum, week) => {
                const allocation = data.allocations.find(
                  a => a.memberId === member.id && a.projectId === project.id && a.weekDate === week
                );
                return sum + (allocation ? allocation.value : 0);
              }, 0);
              return {
                project,
                total: totalAllocation,
                avgPerWeek: totalAllocation / weeks.length
              };
            })
            .filter(stat => stat.total > 0)
            .sort((a, b) => b.total - a.total);

          const totalAllocation = projectStats.reduce((sum, stat) => sum + stat.total, 0);
          const avgWeeklyLoad = totalAllocation / weeks.length;

          if (projectStats.length === 0) return null;

          return (
            <div key={member.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow">
              {/* Member Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-sm font-bold shadow-md">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{member.name}</div>
                    <div className="text-xs text-slate-500">{member.role}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">平均周工时</div>
                  <div className={`text-lg font-bold ${avgWeeklyLoad > 1 ? 'text-red-600' : avgWeeklyLoad >= 0.8 ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {avgWeeklyLoad.toFixed(2)} FTE
                  </div>
                </div>
              </div>

              {/* Project Allocation Bars */}
              <div className="space-y-2">
                {projectStats.map((stat, idx) => {
                  const percentage = (stat.total / totalAllocation) * 100;
                  const colors = [
                    'from-indigo-500 to-indigo-600',
                    'from-emerald-500 to-emerald-600',
                    'from-amber-500 to-amber-600',
                    'from-rose-500 to-rose-600',
                    'from-cyan-500 to-cyan-600',
                    'from-purple-500 to-purple-600',
                    'from-pink-500 to-pink-600'
                  ];
                  const colorClass = colors[idx % colors.length];

                  return (
                    <div key={stat.project.id} className="flex items-center gap-2">
                      <div className="w-36 text-xs text-slate-600 font-medium flex-shrink-0" title={stat.project.name}>
                        {stat.project.name}
                      </div>
                      <div className="flex-1 bg-slate-200 rounded-full h-6 overflow-hidden relative min-w-0">
                        <div
                          className={`h-full bg-gradient-to-r ${colorClass} transition-all duration-500 rounded-full flex items-center justify-end pr-2`}
                          style={{ width: `${percentage}%` }}
                        >
                          {percentage > 15 && (
                            <span className="text-xs font-bold text-white drop-shadow">{percentage.toFixed(0)}%</span>
                          )}
                        </div>
                      </div>
                      <div className="w-20 text-right flex-shrink-0">
                        <div className="text-xs font-semibold text-slate-700">{stat.avgPerWeek.toFixed(2)} FTE</div>
                        <div className="text-xs text-slate-500">平均/周</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Summary */}
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>共 {projectStats.length} 个项目</span>
                <span>4 周总计: {totalAllocation.toFixed(1)} FTE</span>
              </div>
            </div>
          );
        })}
        {data.members.every(m => {
          const stats = data.projects.filter(p => p.status === 'active').some(project =>
            weeks.some(week =>
              data.allocations.some(a => a.memberId === m.id && a.projectId === project.id && a.weekDate === week && a.value > 0)
            )
          );
          return !stats;
        }) && (
          <div className="text-center py-8 text-slate-400">
            暂无项目分配数据
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6" ref={dashboardRef}>
      {/* Header with Export Buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">数据看板</h2>
          <p className="text-slate-500 mt-1">查看团队的资源分配情况和工作负载</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToImage}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Image className="w-4 h-4" />
            {isExporting ? '导出中...' : '导出图片'}
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Download className="w-4 h-4" />
            导出Excel
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="text-sm font-semibold text-slate-700">时间周期选择</h3>
              <p className="text-xs text-slate-500">选择要查看的历史周数据</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeeks}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              title="前一周"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 py-2 bg-indigo-50 rounded-lg border border-indigo-200">
              <span className="text-sm font-semibold text-indigo-700">{getDateRangeText()}</span>
            </div>
            <button
              onClick={goToNextWeeks}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              title="后一周"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={goToCurrentWeeks}
              className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              回到本周
            </button>
          </div>
        </div>
      </div>

      {/* Top Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Heatmap Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <Users className="w-5 h-5 mr-2 text-indigo-500" />
                团队饱和度
              </h3>
              <div className="flex gap-2 text-xs">
                 <span className="px-2 py-1 rounded bg-blue-50 text-blue-600">{'< 0.8'}</span>
                 <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700">0.8 - 1.0</span>
                 <span className="px-2 py-1 rounded bg-red-100 text-red-700">{'> 1.0'}</span>
              </div>
           </div>
           {renderHeatmap()}
        </div>

        {/* Bench / Ready List */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4">
              <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" />
              资源可用性预测
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-auto pr-2 custom-scrollbar">
               {freeResources.length === 0 ? (
                 <p className="text-slate-400 text-sm">未来 4 周所有人都已满负荷。</p>
               ) : (
                 freeResources.map((item, idx) => (
                   <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                            {item.member.name.charAt(0)}
                         </div>
                         <div>
                            <div className="font-semibold text-slate-700 text-sm">{item.member.name}</div>
                            <div className="text-xs text-slate-500">{item.member.role}</div>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-xs text-slate-400">可用时间</div>
                         <div className="text-sm font-bold text-emerald-600">{formatDateShort(item.date!)}</div>
                      </div>
                   </div>
                 ))
               )}
            </div>
        </div>
      </div>

      {/* Member Project Allocation Statistics */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-5 h-5 text-purple-500" />
          <div>
            <h3 className="text-lg font-bold text-slate-800">人员项目投入统计</h3>
            <p className="text-sm text-slate-500 mt-0.5">展示每个成员在各个项目上的时间分配情况（4周总计）</p>
          </div>
        </div>
        {renderMemberProjectStats()}
      </div>

      {/* Chart Card */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
         <h3 className="text-lg font-bold text-slate-800 flex items-center mb-6">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
            项目负载分布（FTE）
         </h3>
         <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                  {data.projects.filter(p => p.status === 'active').map((p, idx) => (
                    <Bar 
                      key={p.id} 
                      dataKey={p.name} 
                      stackId="a" 
                      fill={projectColors[idx % projectColors.length]} 
                      radius={idx === data.projects.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;