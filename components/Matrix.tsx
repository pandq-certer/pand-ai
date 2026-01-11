import React, { useState, useEffect } from 'react';
import { AppData, Member, Project, Allocation } from '../types';
import { getNext13Weeks, formatDateShort } from '../utils';
import { Plus, X, Trash2 } from 'lucide-react';

interface MatrixProps {
  data: AppData;
  onUpdateAllocation: (memberId: string, projectId: string, week: string, val: number) => void;
  onDeleteProjectRow: (memberId: string, projectId: string) => void;
}

const Matrix: React.FC<MatrixProps> = ({ data, onUpdateAllocation }) => {
  const weeks = getNext13Weeks();

  // We want to group rows by member.
  // For each member, we list projects they are assigned to, plus an option to add more.
  
  // Helper to find existing allocation value
  const getVal = (mId: string, pId: string, week: string) => {
    const alloc = data.allocations.find(a => a.memberId === mId && a.projectId === pId && a.weekDate === week);
    return alloc ? alloc.value : 0;
  };

  const handleInputChange = (mId: string, pId: string, week: string, valStr: string) => {
    const val = parseFloat(valStr);
    if (!isNaN(val) && val >= 0) {
      onUpdateAllocation(mId, pId, week, val);
    }
  };

  // Keep track of which projects are visible for each member in the UI
  // Default to showing projects that have > 0 allocation anywhere
  const getActiveProjectIds = (mId: string): string[] => {
    const allocatedPIds = new Set(
      data.allocations
        .filter(a => a.memberId === mId && a.value > 0)
        .map(a => a.projectId)
    );
    return Array.from(allocatedPIds);
  };

  // We need local state to manage "temporarily added rows" before they have data
  const [tempRows, setTempRows] = useState<{ mId: string, pId: string }[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [showDropdownForMember, setShowDropdownForMember] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is outside any dropdown
      const dropdowns = document.querySelectorAll('[data-dropdown]');
      let clickedOutside = true;
      dropdowns.forEach(dropdown => {
        if (dropdown.contains(target)) {
          clickedOutside = false;
        }
      });

      if (clickedOutside && showDropdownForMember) {
        setShowDropdownForMember(null);
      }
    };

    if (showDropdownForMember) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdownForMember]);

  const addProjectRow = (mId: string, pId: string) => {
    if (!tempRows.some(r => r.mId === mId && r.pId === pId)) {
      setTempRows([...tempRows, { mId, pId }]);
    }
  };

  const addMultipleProjectRows = (mId: string, projectIds: string[]) => {
    const newRows = projectIds
      .filter(pId => !tempRows.some(r => r.mId === mId && r.pId === pId))
      .map(pId => ({ mId, pId }));
    if (newRows.length > 0) {
      setTempRows([...tempRows, ...newRows]);
    }
    setSelectedProjects(new Set());
  };

  const toggleProjectSelection = (projectId: string) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
  };

  const toggleDropdown = (memberId: string) => {
    if (showDropdownForMember === memberId) {
      setShowDropdownForMember(null);
    } else {
      setShowDropdownForMember(memberId);
      setSelectedProjects(new Set());
    }
  };

  const removeProjectRow = (mId: string, pId: string) => {
    // Remove from temp rows
    setTempRows(tempRows.filter(r => !(r.mId === mId && r.pId === pId)));
    // Also delete all allocations for this member-project pair
    onDeleteProjectRow(mId, pId);
  };

  const getProjectStatusBadge = (project: Project) => {
    if (!project.projectStatus || project.projectStatus === 'ongoing') {
      return (
        <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium">
          进行中
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200 text-slate-600 font-medium">
        已结项
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full max-h-[85vh]">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h2 className="text-lg font-bold text-slate-800">资源分配矩阵</h2>
        <div className="text-xs text-slate-500">数值：0.1 = 10% 工时 | 显示未来 4 周</div>
      </div>
      
      <div className="overflow-auto flex-1 hide-scrollbar">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3 text-left w-64 min-w-[200px] border-b border-slate-200 font-semibold text-slate-600 bg-slate-50 sticky left-0 z-20">
                成员 / 项目
              </th>
              {weeks.map(week => (
                <th key={week} className="p-2 w-20 min-w-[80px] text-center border-b border-slate-200 font-medium text-slate-500 bg-slate-50">
                  <div className="text-xs uppercase">{formatDateShort(week)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.members.map(member => {
              const activeProjects = data.projects.filter(p => {
                const hasAlloc = getActiveProjectIds(member.id).includes(p.id);
                const isTemp = tempRows.some(tr => tr.mId === member.id && tr.pId === p.id);
                return (hasAlloc || isTemp) && p.status === 'active';
              });

              // Available projects to add
              const availableProjects = data.projects.filter(p => 
                !activeProjects.find(ap => ap.id === p.id) && p.status === 'active'
              );

              return (
                <React.Fragment key={member.id}>
                  {/* Member Header Row */}
                  <tr className="bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-800 border-r border-slate-100 sticky left-0 bg-slate-50/95 z-10">
                      {member.name}
                      <span className="ml-2 text-xs font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {member.role}
                      </span>
                    </td>
                    <td colSpan={weeks.length} className="p-1 bg-slate-50/30">
                      {availableProjects.length > 0 && (
                        <div className="relative inline-block">
                          <button
                            onClick={() => toggleDropdown(member.id)}
                            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition"
                          >
                            <Plus className="w-3 h-3" /> 添加项目
                          </button>
                          {showDropdownForMember === member.id && (
                            <div
                              className="absolute left-0 top-full mt-1 w-56 bg-white shadow-xl rounded-lg border border-slate-200 z-50"
                              data-dropdown
                            >
                              <div className="p-2 border-b border-slate-100">
                                <div className="text-xs text-slate-500 mb-2">选择要添加的项目</div>
                                {availableProjects.length > 0 && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => addMultipleProjectRows(member.id, availableProjects.map(p => p.id))}
                                      className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 transition"
                                    >
                                      全选
                                    </button>
                                    <button
                                      onClick={() => setSelectedProjects(new Set())}
                                      className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded hover:bg-slate-300 transition"
                                    >
                                      清空
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                {availableProjects.map(p => (
                                  <label
                                    key={p.id}
                                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedProjects.has(p.id)}
                                      onChange={() => toggleProjectSelection(p.id)}
                                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm text-slate-700 truncate">{p.name}</div>
                                      {getProjectStatusBadge(p)}
                                    </div>
                                  </label>
                                ))}
                              </div>
                              {selectedProjects.size > 0 && (
                                <div className="p-2 border-t border-slate-100">
                                  <button
                                    onClick={() => {
                                      addMultipleProjectRows(member.id, Array.from(selectedProjects));
                                      setShowDropdownForMember(null);
                                    }}
                                    className="w-full text-sm bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-700 transition font-medium"
                                  >
                                    添加已选项目 ({selectedProjects.size})
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Project Rows */}
                  {activeProjects.map(project => (
                    <tr key={`${member.id}-${project.id}`} className="hover:bg-slate-50/50 group">
                      <td className="p-3 pl-8 text-slate-600 border-r border-slate-100 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="truncate font-medium" title={project.name}>{project.name}</span>
                            {getProjectStatusBadge(project)}
                          </div>
                          <button
                            onClick={() => removeProjectRow(member.id, project.id)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                            title="删除此项目行"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      {weeks.map(week => {
                        const val = getVal(member.id, project.id, week);
                        return (
                          <td key={week} className="p-1 text-center border-r border-slate-50 last:border-0">
                            <input
                              type="number"
                              min="0"
                              max="2"
                              step="0.1"
                              value={val === 0 ? '' : val}
                              placeholder="-"
                              onChange={(e) => handleInputChange(member.id, project.id, week, e.target.value)}
                              className={`w-full text-center p-1 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-colors
                                ${val > 1 ? 'text-red-600 font-bold bg-red-50' : 
                                  val > 0 ? 'text-slate-700 bg-slate-50 focus:bg-white' : 'text-slate-400'}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  
                  {activeProjects.length === 0 && (
                     <tr>
                        <td className="p-3 pl-8 text-slate-400 italic text-xs border-r border-slate-100 sticky left-0 bg-white">
                           暂无活跃项目
                        </td>
                        <td colSpan={weeks.length} className="bg-slate-50/10"></td>
                     </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Matrix;