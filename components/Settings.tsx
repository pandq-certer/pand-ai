import React, { useState } from 'react';
import { AppData, Member, Project } from '../types';
import { generateId } from '../utils';
import { Trash2, Plus, User, Briefcase, Archive } from 'lucide-react';

interface SettingsProps {
  data: AppData;
  onUpdate: (data: AppData) => void;
}

const Settings: React.FC<SettingsProps> = ({ data, onUpdate }) => {
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectStatus, setNewProjectStatus] = useState<'ongoing' | 'completed'>('ongoing');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState('');

  const addMember = () => {
    if (!newMemberName.trim()) return;
    const member: Member = {
      id: generateId(),
      name: newMemberName,
      role: newMemberRole || 'Member',
    };
    onUpdate({ ...data, members: [...data.members, member] });
    setNewMemberName('');
    setNewMemberRole('');
  };

  const removeMember = (id: string) => {
    if (confirm('确定要删除该成员吗？所有相关分配数据将会丢失。')) {
      onUpdate({
        ...data,
        members: data.members.filter((m) => m.id !== id),
        allocations: data.allocations.filter((a) => a.memberId !== id),
      });
    }
  };

  const startEditingRole = (memberId: string, currentRole: string) => {
    setEditingMemberId(memberId);
    setEditingRole(currentRole);
  };

  const saveMemberRole = (memberId: string) => {
    if (!editingRole.trim()) return;
    onUpdate({
      ...data,
      members: data.members.map((m) =>
        m.id === memberId ? { ...m, role: editingRole } : m
      ),
    });
    setEditingMemberId(null);
    setEditingRole('');
  };

  const cancelEditingRole = () => {
    setEditingMemberId(null);
    setEditingRole('');
  };

  const addProject = () => {
    if (!newProjectName.trim()) return;
    const project: Project = {
      id: generateId(),
      name: newProjectName,
      status: 'active',
      projectStatus: newProjectStatus,
    };
    onUpdate({ ...data, projects: [...data.projects, project] });
    setNewProjectName('');
    setNewProjectStatus('ongoing');
  };

  const updateProjectStatus = (id: string, projectStatus: 'ongoing' | 'completed') => {
    onUpdate({
      ...data,
      projects: data.projects.map((p) =>
        p.id === id ? { ...p, projectStatus } : p
      ),
    });
  };

  const toggleProjectStatus = (id: string) => {
    onUpdate({
      ...data,
      projects: data.projects.map((p) =>
        p.id === id ? { ...p, status: p.status === 'active' ? 'archived' : 'active' } : p
      ),
    });
  };

  const removeProject = (id: string) => {
    if (confirm('确定要删除该项目吗？所有相关分配数据将会丢失。')) {
      onUpdate({
        ...data,
        projects: data.projects.filter((p) => p.id !== id),
        allocations: data.allocations.filter((a) => a.projectId !== id),
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Members Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold mb-4 flex items-center text-slate-800">
          <User className="w-5 h-5 mr-2 text-indigo-600" />
          成员管理
        </h2>

        <div className="mb-6 flex gap-2">
          <input
            type="text"
            placeholder="姓名"
            className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
          />
          <input
            type="text"
            placeholder="职位"
            className="w-1/3 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
            value={newMemberRole}
            onChange={(e) => setNewMemberRole(e.target.value)}
          />
          <button
            onClick={addMember}
            className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 transition"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <ul className="space-y-3">
          {data.members.map((member) => (
            <li key={member.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-700">{member.name}</div>
                {editingMemberId === member.id ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={editingRole}
                      onChange={(e) => setEditingRole(e.target.value)}
                      className="flex-1 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveMemberRole(member.id);
                        if (e.key === 'Escape') cancelEditingRole();
                      }}
                    />
                    <button
                      onClick={() => saveMemberRole(member.id)}
                      className="text-emerald-600 hover:text-emerald-700 p-1"
                      title="保存"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={cancelEditingRole}
                      className="text-slate-400 hover:text-slate-600 p-1"
                      title="取消"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div
                    className="text-xs text-slate-500 cursor-pointer hover:text-indigo-600 inline-block"
                    onClick={() => startEditingRole(member.id, member.role)}
                    title="点击编辑职位"
                  >
                    {member.role}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeMember(member.id)}
                className="text-red-400 hover:text-red-600 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
          {data.members.length === 0 && <p className="text-slate-400 text-sm italic">暂无成员。</p>}
        </ul>
      </div>

      {/* Projects Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold mb-4 flex items-center text-slate-800">
          <Briefcase className="w-5 h-5 mr-2 text-emerald-600" />
          项目管理
        </h2>

        <div className="mb-6 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="新项目名称"
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 outline-none"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
            <select
              className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
              value={newProjectStatus}
              onChange={(e) => setNewProjectStatus(e.target.value as 'ongoing' | 'completed')}
            >
              <option value="ongoing">进行中</option>
              <option value="completed">已结项</option>
            </select>
            <button
              onClick={addProject}
              className="bg-emerald-600 text-white p-2 rounded-md hover:bg-emerald-700 transition"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <ul className="space-y-3">
          {data.projects.map((project) => (
            <li key={project.id} className={`flex justify-between items-center p-3 rounded-lg border ${project.status === 'archived' ? 'bg-slate-100 border-slate-200 opacity-75' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-2 h-2 rounded-full ${project.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold truncate ${project.status === 'archived' ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
                    {project.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${(!project.projectStatus || project.projectStatus === 'ongoing') ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'} font-medium`}>
                      {(!project.projectStatus || project.projectStatus === 'ongoing') ? '进行中' : '已结项'}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${project.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'} font-medium`}>
                      {project.status === 'active' ? '活跃' : '归档'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <select
                  className="px-2 py-1 text-xs border rounded-md focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  value={project.projectStatus || 'ongoing'}
                  onChange={(e) => updateProjectStatus(project.id, e.target.value as 'ongoing' | 'completed')}
                  title="更改项目状态"
                >
                  <option value="ongoing">进行中</option>
                  <option value="completed">已结项</option>
                </select>
                <button
                  onClick={() => toggleProjectStatus(project.id)}
                  className="text-slate-400 hover:text-indigo-600 p-1"
                  title={project.status === 'active' ? '归档' : '激活'}
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeProject(project.id)}
                  className="text-slate-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
          {data.projects.length === 0 && <p className="text-slate-400 text-sm italic">暂无项目。</p>}
        </ul>
      </div>
    </div>
  );
};

export default Settings;