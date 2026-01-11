import React, { useEffect, useState } from 'react';
import { loadData, saveData, updateAllocation, deleteProjectRow } from './services/supabaseStorage';
import { AppData, ViewState } from './types';
import Dashboard from './components/Dashboard';
import Matrix from './components/Matrix';
import Settings from './components/Settings';
import { LayoutDashboard, Grid, Settings as SettingsIcon, Database } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('matrix');

  useEffect(() => {
    // 从 Supabase 加载数据
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const loaded = await loadData();
        setData(loaded);
      } catch (err) {
        console.error('加载数据失败:', err);
        setError('无法连接到数据库，请检查网络连接');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAllocationUpdate = async (memberId: string, projectId: string, week: string, val: number) => {
    if (!data) return;
    // 乐观更新，立即返回，无需等待
    const newData = await updateAllocation(data, memberId, projectId, week, val);
    setData(newData);
  };

  const handleSettingsUpdate = async (newData: AppData) => {
    try {
      await saveData(newData);
      setData(newData);
    } catch (err) {
      console.error('保存设置失败:', err);
      // 只在设置页面保存失败时提示
      alert('保存设置失败，请重试');
    }
  };

  const handleDeleteProjectRow = async (memberId: string, projectId: string) => {
    if (!data) return;
    // 乐观更新，立即返回，无需等待
    const newData = await deleteProjectRow(data, memberId, projectId);
    setData(newData);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">正在连接数据库...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">连接失败</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">华北数据库团队资源规划</h1>
            <p className="text-xs text-slate-400">资源管理系统</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setCurrentView('matrix')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === 'matrix'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Grid className="w-5 h-5" />
            <span className="font-medium">资源分配矩阵</span>
          </button>

          <button
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">数据看板</span>
          </button>

          <button
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === 'settings'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            <span className="font-medium">系统配置</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          云端数据库 (Supabase) <br/>
          v2.0.0
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          <header className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">
              {currentView === 'matrix' && '资源分配'}
              {currentView === 'dashboard' && '团队洞察'}
              {currentView === 'settings' && '系统配置'}
            </h2>
          </header>

          <div className="flex-1 min-h-0">
            {currentView === 'matrix' && (
              <Matrix
                data={data}
                onUpdateAllocation={handleAllocationUpdate}
                onDeleteProjectRow={handleDeleteProjectRow}
              />
            )}
            {currentView === 'dashboard' && <Dashboard data={data} />}
            {currentView === 'settings' && <Settings data={data} onUpdate={handleSettingsUpdate} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;