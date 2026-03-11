import React from 'react';

const Terminology: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-6">系统指标术语说明</h1>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">FTE（Full-Time Equivalent）- 全职当量</h2>
            <p className="mb-3 text-slate-700"><strong>定义：</strong>FTE 是衡量工作量的标准单位，表示一个全职员工的工作量。</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
              <li><strong>1.0 FTE</strong> = 1 个全职员工 100% 的工作时间</li>
              <li><strong>0.5 FTE</strong> = 半职员工 50% 的工作时间</li>
              <li><strong>2.0 FTE</strong> = 2 个全职员工的工作量</li>
            </ul>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-semibold text-blue-900 mb-2">系统中的应用：</p>
              <ul className="list-disc pl-6 space-y-1 text-blue-800">
                <li>周期：以<strong>周</strong>为单位</li>
                <li>1.0 FTE = 一个人全职工作一周（5个工作日）</li>
                <li>例如：某人在 A 项目投入 0.3 FTE，表示他每周有 30% 的时间用于该项目</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">投入占比（Allocation Percentage）</h2>
            <p className="mb-3 text-slate-700"><strong>定义：</strong>某成员在特定项目中的投入占其<strong>总工作时间</strong>的百分比。</p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
              <p className="font-semibold text-emerald-900 mb-2">计算公式：</p>
              <p className="font-mono text-emerald-800">投入占比 = (在该项目的投入量 ÷ 在所有项目的总投入量) × 100%</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="font-semibold text-slate-800 mb-2">示例：</p>
              <p className="text-slate-700 mb-3">李四本周在数据库迁移项目投入 0.3 FTE，在系统优化项目投入 0.7 FTE，总投入 1.0 FTE</p>
              <ul className="list-disc pl-6 space-y-1 text-slate-700">
                <li>数据库迁移项目：(0.3 ÷ 1.0) × 100% = <strong className="text-emerald-700">30%</strong></li>
                <li>系统优化项目：(0.7 ÷ 1.0) × 100% = <strong className="text-emerald-700">70%</strong></li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">本周投入 / 本周剩余</h2>
            <p className="mb-2 text-slate-700"><strong>本周投入：</strong>成员本周在所有项目中已分配的工作总量（单位：FTE）</p>
            <p className="mb-3 text-slate-700"><strong>本周剩余：</strong>成员本周还有多少可用时间（单位：FTE）</p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="font-semibold text-amber-900 mb-2">计算公式：</p>
              <p className="font-mono text-amber-800">本周剩余 = 1.0 - 本周投入</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="font-semibold text-green-800 mb-2">✓ 剩余 &gt; 0</p>
                <p className="text-sm text-green-700">成员本周有空闲时间，可以接收新任务</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-semibold text-red-800 mb-2">✗ 剩余 = 0</p>
                <p className="text-sm text-red-700">成员本周已满负荷，无法接收新任务</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">项目负载分布</h2>
            <p className="mb-3 text-slate-700"><strong>定义：</strong>展示某个项目在整个团队中的资源分配情况。</p>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="font-semibold text-slate-800 mb-2">统计维度：</p>
              <ul className="list-disc pl-6 space-y-1 text-slate-700">
                <li><strong>项目总投入：</strong>所有成员在该项目的投入之和</li>
                <li><strong>成员数量：</strong>参与该项目的成员人数</li>
                <li><strong>平均投入：</strong>每个成员的平均投入量</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">常见问题</h2>
            <div className="space-y-4">
              <details className="group bg-slate-50 rounded-lg">
                <summary className="cursor-pointer font-semibold text-slate-800 p-4 hover:bg-slate-100 transition">
                  为什么用 1.0 表示 100%？
                </summary>
                <div className="px-4 pb-4 text-slate-700">
                  <p>这是国际标准的人力资源计量单位。1.0 FTE 代表一个全职员工的标准工作时间，便于计算和比较工作量。</p>
                </div>
              </details>

              <details className="group bg-slate-50 rounded-lg">
                <summary className="cursor-pointer font-semibold text-slate-800 p-4 hover:bg-slate-100 transition">
                  投入量可以是小数吗？
                </summary>
                <div className="px-4 pb-4 text-slate-700">
                  <p>可以。例如 0.5 FTE 表示半职工作，0.25 FTE 表示每周 1 天的工作量。</p>
                </div>
              </details>

              <details className="group bg-slate-50 rounded-lg">
                <summary className="cursor-pointer font-semibold text-slate-800 p-4 hover:bg-slate-100 transition">
                  为什么总和不等于 1.0？
                </summary>
                <div className="px-4 pb-4 text-slate-700">
                  <p>理论上每个人的周投入总和应该等于 1.0（100%）。如果小于 1.0，说明还有空闲时间；如果大于 1.0，说明过度分配（需要调整）。</p>
                </div>
              </details>

              <details className="group bg-slate-50 rounded-lg">
                <summary className="cursor-pointer font-semibold text-slate-800 p-4 hover:bg-slate-100 transition">
                  邮件中的百分比和 FTE 是什么关系？
                </summary>
                <div className="px-4 pb-4 text-slate-700">
                  <p>邮件中显示的百分比 = FTE × 100%。例如：0.3 FTE = 30%，1.0 FTE = 100%</p>
                </div>
              </details>

              <details className="group bg-slate-50 rounded-lg">
                <summary className="cursor-pointer font-semibold text-slate-800 p-4 hover:bg-slate-100 transition">
                  "4 周总计 FTE" 是什么意思？
                </summary>
                <div className="px-4 pb-4 text-slate-700">
                  <p>表示某成员在 4 周规划周期内的总投入量。例如 3.2 FTE 相当于 3.2 个全职工作周的工作量。</p>
                </div>
              </details>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">指标使用建议</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">对于项目经理</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-blue-800">
                  <li>关注投入占比：确保核心成员不会被过度分散在多个项目</li>
                  <li>监控可用性：提前识别资源瓶颈，合理安排新项目</li>
                  <li>平衡负载：避免某些成员过度分配而其他成员闲置</li>
                </ul>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2">对于团队负责人</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-purple-800">
                  <li>总体利用率：团队整体投入率应该接近 1.0 FTE（100%）</li>
                  <li>长期规划：查看 4 周趋势，提前进行人员调配</li>
                  <li>特殊情况：保留一些 buffer（剩余容量）应对紧急任务</li>
                </ul>
              </div>
            </div>
          </section>

          <div className="bg-slate-100 rounded-lg p-6 text-center">
            <p className="text-slate-600 mb-2">
              如有疑问，请联系系统管理员
            </p>
            <p className="text-slate-700 font-semibold">
              <a href="mailto:pandq@chinacscs.com" className="text-blue-600 hover:underline">
                潘大全 &lt;pandq@chinacscs.com&gt;
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terminology;
