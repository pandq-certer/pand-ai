import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { loadData, saveData, updateAllocation, deleteProjectRow } from './services/supabaseStorage';
import { AppData, ViewState } from './types';
import Dashboard from './components/Dashboard';
import Matrix from './components/Matrix';
import Settings from './components/Settings';
import Login from './components/Login';
import Terminology from './components/Terminology';
import { LayoutDashboard, Grid, Settings as SettingsIcon, Database, LogOut, User, HelpCircle } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { createScheduler, getNextSendDescription } from './utils/scheduler';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Main Application Component
const MainApp: React.FC = () => {
  const { user, signOut } = useAuth();
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('matrix');
  const schedulerDashboardRef = useRef<HTMLDivElement>(null);
  const schedulerStopRef = useRef<(() => void) | null>(null);

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

  // 初始化或更新定时调度器
  useEffect(() => {
    if (data && data.emailConfig?.enabled) {
      console.log('初始化邮件定时调度器...');

      // 停止之前的调度器
      if (schedulerStopRef.current) {
        schedulerStopRef.current();
        schedulerStopRef.current = null;
      }

      // 创建新的调度器
      const stopScheduler = createScheduler(
        data.emailConfig,
        data,
        (newConfig) => {
          setData({ ...data, emailConfig: newConfig });
        },
        () => schedulerDashboardRef
      );

      schedulerStopRef.current = stopScheduler;

      console.log('定时调度器已启动:', getNextSendDescription(data.emailConfig));
    }

    // 清理函数
    return () => {
      if (schedulerStopRef.current) {
        schedulerStopRef.current();
        schedulerStopRef.current = null;
      }
    };
  }, [data]);

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

          <button
            onClick={() => setCurrentView('terminology')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === 'terminology'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <HelpCircle className="w-5 h-5" />
            <span className="font-medium">术语说明</span>
          </button>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-800/50">
            <div className="bg-indigo-500 p-2 rounded-lg">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.email}</p>
              <p className="text-xs text-slate-400">已登录</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">退出登录</span>
          </button>
        </div>

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
            {currentView === 'terminology' && <Terminology />}
          </div>
        </div>
      </main>

      {/* 隐藏的 Dashboard 用于定时发送 */}
      {data?.emailConfig?.enabled && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '1200px', height: '800px', overflow: 'auto' }}>
          <div ref={schedulerDashboardRef} id="dashboard-content-scheduler">
            <Dashboard data={data} />
          </div>
        </div>
      )}
    </div>
  );
};

// Root App Component with Router
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainApp />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;