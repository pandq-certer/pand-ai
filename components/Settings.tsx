import React, { useState, useRef } from 'react';
import { AppData, Member, Project, EmailConfig } from '../types';
import { generateId } from '../utils';
import { Trash2, Plus, User, Briefcase, Archive, Mail, Clock, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { sendDashboardReport } from '../services/emailService';
import { exportElementAsImage } from '../utils/export';
import { getNextSendDescription, shouldSendEmail } from '../utils/scheduler';
import Dashboard from './Dashboard';
import html2canvas from 'html2canvas';

interface SettingsProps {
  data: AppData;
  onUpdate: (data: AppData) => void;
}

const Settings: React.FC<SettingsProps> = ({ data, onUpdate }) => {
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectStatus, setNewProjectStatus] = useState<'ongoing' | 'completed'>('ongoing');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState('');
  const [editingEmail, setEditingEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newCustomEmail, setNewCustomEmail] = useState('');
  const [isExportingDashboard, setIsExportingDashboard] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // 确保邮件配置存在
  const emailConfig: EmailConfig = data.emailConfig || {
    enabled: false,
    recipients: [],
    customEmails: [],
    frequency: 'weekly',
    scheduleTime: '17:00',
    scheduleDayOfWeek: 5, // 默认周五
    lastSent: null,
  };

  const addMember = () => {
    if (!newMemberName.trim()) return;
    const member: Member = {
      id: generateId(),
      name: newMemberName,
      role: newMemberRole || 'Member',
      email: newMemberEmail.trim() || undefined,
    };
    onUpdate({ ...data, members: [...data.members, member] });
    setNewMemberName('');
    setNewMemberRole('');
    setNewMemberEmail('');
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

  const startEditingEmail = (memberId: string, currentEmail: string) => {
    setEditingMemberId(memberId);
    setEditingEmail(currentEmail || '');
  };

  const saveMemberEmail = (memberId: string) => {
    onUpdate({
      ...data,
      members: data.members.map((m) =>
        m.id === memberId ? { ...m, email: editingEmail.trim() || undefined } : m
      ),
    });
    setEditingMemberId(null);
    setEditingEmail('');
  };

  const cancelEditingEmail = () => {
    setEditingMemberId(null);
    setEditingEmail('');
  };

  const toggleEmailRecipient = (memberId: string) => {
    const existingRecipient = emailConfig.recipients.find(r => r.memberId === memberId);
    let newRecipients;

    if (existingRecipient) {
      // 切换 enabled 状态
      newRecipients = emailConfig.recipients.map(r =>
        r.memberId === memberId ? { ...r, enabled: !r.enabled } : r
      );
    } else {
      // 添加新的收件人
      newRecipients = [...emailConfig.recipients, { memberId, enabled: true }];
    }

    updateEmailConfig({ ...emailConfig, recipients: newRecipients });
  };

  const addCustomEmail = () => {
    if (!newCustomEmail.trim() || emailConfig.customEmails.includes(newCustomEmail.trim())) {
      setNewCustomEmail('');
      return;
    }
    updateEmailConfig({
      ...emailConfig,
      customEmails: [...emailConfig.customEmails, newCustomEmail.trim()],
    });
    setNewCustomEmail('');
  };

  const removeCustomEmail = (email: string) => {
    updateEmailConfig({
      ...emailConfig,
      customEmails: emailConfig.customEmails.filter(e => e !== email),
    });
  };

  const updateEmailConfig = (newConfig: EmailConfig) => {
    onUpdate({ ...data, emailConfig: newConfig });
  };

  const sendTestEmail = async () => {
    setSendingEmail(true);
    setEmailMessage(null);

    try {
      // 设置导出状态，这会渲染隐藏的 Dashboard
      setIsExportingDashboard(true);

      // 等待一小段时间确保 Dashboard 已经渲染
      await new Promise(resolve => setTimeout(resolve, 100));

      // 导出数据看板为图片
      let dashboardImage: string;
      if (dashboardRef.current) {
        const canvas = await html2canvas(dashboardRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: false,
        });
        dashboardImage = canvas.toDataURL('image/png');
      } else {
        throw new Error('无法导出数据看板');
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
        setEmailMessage({ type: 'error', text: '请先配置至少一个接收邮箱' });
        setIsExportingDashboard(false);
        return;
      }

      // 发送邮件
      const result = await sendDashboardReport(recipientEmails, dashboardImage, data);

      if (result.success) {
        setEmailMessage({ type: 'success', text: '邮件发送成功！' });
        // 更新最后发送时间
        updateEmailConfig({
          ...emailConfig,
          lastSent: new Date().toISOString(),
        });
      } else {
        setEmailMessage({ type: 'error', text: result.error || '发送失败，请重试' });
      }
    } catch (error: any) {
      console.error('发送邮件失败:', error);
      setEmailMessage({ type: 'error', text: error.message || '发送失败，请重试' });
    } finally {
      setIsExportingDashboard(false);
      setSendingEmail(false);
    }
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
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* Members Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold mb-4 flex items-center text-slate-800">
          <User className="w-5 h-5 mr-2 text-indigo-600" />
          成员管理
        </h2>

        <div className="mb-6 space-y-2">
          <div className="flex gap-2">
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
          </div>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="邮箱（可选）"
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
            />
            <button
              onClick={addMember}
              className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 transition"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <ul className="space-y-3">
          {data.members.map((member) => {
            const isEditingRole = editingMemberId === member.id && editingEmail === '';
            const isEditingEmail = editingMemberId === member.id && editingEmail !== '';
            const recipient = emailConfig.recipients.find(r => r.memberId === member.id);

            return (
              <li key={member.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-700">{member.name}</div>
                    {isEditingRole ? (
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
                </div>

                {/* 邮箱显示和编辑 */}
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
                  {isEditingEmail ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="email"
                        value={editingEmail}
                        onChange={(e) => setEditingEmail(e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="邮箱地址"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveMemberEmail(member.id);
                          if (e.key === 'Escape') cancelEditingEmail();
                        }}
                      />
                      <button
                        onClick={() => saveMemberEmail(member.id)}
                        className="text-emerald-600 hover:text-emerald-700 p-1"
                        title="保存"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={cancelEditingEmail}
                        className="text-slate-400 hover:text-slate-600 p-1"
                        title="取消"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      {member.email ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-600">{member.email}</span>
                          <button
                            onClick={() => startEditingEmail(member.id, member.email || '')}
                            className="text-xs text-indigo-600 hover:text-indigo-700 ml-auto"
                          >
                            编辑
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditingEmail(member.id, '')}
                          className="text-xs text-slate-400 hover:text-indigo-600"
                        >
                          + 添加邮箱
                        </button>
                      )}

                      {/* 邮件接收开关 */}
                      {member.email && (
                        <button
                          onClick={() => toggleEmailRecipient(member.id)}
                          className={`px-2 py-1 text-xs rounded transition ${
                            recipient?.enabled
                              ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                          title={recipient?.enabled ? '取消接收邮件' : '启用邮件接收'}
                        >
                          {recipient?.enabled ? '✓ 接收邮件' : '接收邮件'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </li>
            );
          })}
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

      {/* Email Configuration Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold mb-4 flex items-center text-slate-800">
          <Mail className="w-5 h-5 mr-2 text-blue-600" />
          邮件配置
        </h2>

        <div className="space-y-6">
          {/* 启用邮件 */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-700">启用邮件发送</h3>
              <p className="text-sm text-slate-500">自动发送数据看板报告到配置的邮箱</p>
            </div>
            <button
              onClick={() => updateEmailConfig({ ...emailConfig, enabled: !emailConfig.enabled })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                emailConfig.enabled ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  emailConfig.enabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* 定时发送频率 */}
          {emailConfig.enabled && (
            <div>
              <h3 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                发送频率
              </h3>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  onClick={() => updateEmailConfig({ ...emailConfig, frequency: 'daily' })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    emailConfig.frequency === 'daily'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  每天
                </button>
                <button
                  onClick={() => updateEmailConfig({ ...emailConfig, frequency: 'weekly' })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    emailConfig.frequency === 'weekly'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  每周
                </button>
                <button
                  onClick={() => updateEmailConfig({ ...emailConfig, frequency: 'monthly' })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    emailConfig.frequency === 'monthly'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  每月
                </button>
              </div>

              {/* 每周：选择星期几 */}
              {emailConfig.frequency === 'weekly' && (
                <div className="mt-3">
                  <label className="text-sm text-slate-600 mb-2 block">选择星期：</label>
                  <select
                    value={emailConfig.scheduleDayOfWeek ?? 5}
                    onChange={(e) => updateEmailConfig({ ...emailConfig, scheduleDayOfWeek: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value={0}>周日</option>
                    <option value={1}>周一</option>
                    <option value={2}>周二</option>
                    <option value={3}>周三</option>
                    <option value={4}>周四</option>
                    <option value={5}>周五</option>
                    <option value={6}>周六</option>
                  </select>
                </div>
              )}

              {/* 每月：选择日期 */}
              {emailConfig.frequency === 'monthly' && (
                <div className="mt-3">
                  <label className="text-sm text-slate-600 mb-2 block">选择日期：</label>
                  <select
                    value={emailConfig.scheduleDayOfMonth ?? 1}
                    onChange={(e) => updateEmailConfig({ ...emailConfig, scheduleDayOfMonth: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    {Array.from({ length: 31 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        每月 {i + 1} 日
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 发送时间 */}
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm text-slate-600">
                  {emailConfig.frequency === 'daily' && '每天'}
                  {emailConfig.frequency === 'weekly' && `每周${['周日', '周一', '周二', '周三', '周四', '周五', '周六'][emailConfig.scheduleDayOfWeek ?? 5]}`}
                  {emailConfig.frequency === 'monthly' && `每月${emailConfig.scheduleDayOfMonth ?? 1}日`}
                </span>
                <input
                  type="time"
                  value={emailConfig.scheduleTime}
                  onChange={(e) => updateEmailConfig({ ...emailConfig, scheduleTime: e.target.value })}
                  className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* 自定义邮箱 */}
          {emailConfig.enabled && (
            <div>
              <h3 className="font-medium text-slate-700 mb-2">自定义邮箱</h3>
              <div className="flex gap-2 mb-2">
                <input
                  type="email"
                  placeholder="添加其他邮箱地址"
                  className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={newCustomEmail}
                  onChange={(e) => setNewCustomEmail(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addCustomEmail();
                    }
                  }}
                />
                <button
                  onClick={addCustomEmail}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
                >
                  添加
                </button>
              </div>
              <ul className="space-y-1">
                {emailConfig.customEmails.map((email) => (
                  <li key={email} className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
                    <span className="text-slate-700">{email}</span>
                    <button
                      onClick={() => removeCustomEmail(email)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 手动发送按钮 */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-slate-700">手动发送</h3>
                <p className="text-sm text-slate-500">
                  {emailConfig.lastSent
                    ? `上次发送: ${new Date(emailConfig.lastSent).toLocaleString('zh-CN')}`
                    : '尚未发送过邮件'}
                </p>
                {emailConfig.enabled && (
                  <p className="text-xs text-blue-600 mt-1">
                    定时配置: {getNextSendDescription(emailConfig)}
                  </p>
                )}
              </div>
              <button
                onClick={sendTestEmail}
                disabled={sendingEmail}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {sendingEmail ? '发送中...' : '立即发送'}
              </button>
            </div>

            {/* 消息提示 */}
            {emailMessage && (
              <div
                className={`p-3 rounded-lg flex items-start gap-2 ${
                  emailMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {emailMessage.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <span className="text-sm">{emailMessage.text}</span>
              </div>
            )}

            {/* 测试定时发送按钮 */}
            {emailConfig.enabled && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <button
                  onClick={() => {
                    const result = shouldSendEmail(emailConfig);
                    alert(`定时发送检查结果：${result ? '✅ 应该发送' : '❌ 不满足发送条件'}\n\n请查看控制台了解详情`);
                  }}
                  className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
                >
                  🔍 检查定时发送状态
                </button>
                {emailConfig.lastSent && (
                  <button
                    onClick={() => {
                      if (confirm('确定要清除上次发送时间吗？这将允许今天再次发送邮件。')) {
                        updateEmailConfig({ ...emailConfig, lastSent: null });
                      }
                    }}
                    className="w-full px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition text-sm font-medium mt-2"
                  >
                    🔄 清除发送记录
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 隐藏的 Dashboard 用于导出 */}
      {isExportingDashboard && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '1200px' }}>
          <div ref={dashboardRef} id="dashboard-content">
            <Dashboard data={data} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;