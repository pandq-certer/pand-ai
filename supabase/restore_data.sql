-- ============================================
-- 数据恢复脚本 - 根据历史数据看板恢复
-- 生成日期: 2025-01-11
-- ============================================

-- 清空现有分配数据（可选，如果需要重置）
-- TRUNCATE TABLE allocations;

-- ============================================
-- 插入资源分配数据
-- 数据范围: 2024年12月22日 - 2025年1月12日（3周数据）
-- ============================================

-- 第一周: 2024-12-22
INSERT INTO allocations (id, member_id, project_id, week_date, value) VALUES
-- Alice Chen - DB Architect
('alloc_001', 'm1', 'p1', '2024-12-22', 0.8),
('alloc_002', 'm1', 'p2', '2024-12-22', 0.5),
('alloc_003', 'm1', 'p3', '2024-12-22', 0.3),

-- Bob Smith - Data Engineer
('alloc_004', 'm2', 'p1', '2024-12-22', 1.0),
('alloc_005', 'm2', 'p2', '2024-12-22', 0.0),
('alloc_006', 'm2', 'p3', '2024-12-22', 0.0),

-- Charlie Kim - DBA
('alloc_007', 'm3', 'p1', '2024-12-22', 0.6),
('alloc_008', 'm3', 'p2', '2024-12-22', 0.4),
('alloc_009', 'm3', 'p3', '2024-12-22', 0.0),

-- Diana Prince - ETL Developer
('alloc_010', 'm4', 'p1', '2024-12-22', 0.7),
('alloc_011', 'm4', 'p2', '2024-12-22', 0.6),
('alloc_012', 'm4', 'p3', '2024-12-22', 0.0),

-- Ethan Hunt - Data Analyst
('alloc_013', 'm5', 'p1', '2024-12-22', 0.5),
('alloc_014', 'm5', 'p2', '2024-12-22', 0.8),
('alloc_015', 'm5', 'p3', '2024-12-22', 0.2),

-- Fiona Gallagher - Backend Dev
('alloc_016', 'm6', 'p1', '2024-12-22', 0.9),
('alloc_017', 'm6', 'p2', '2024-12-22', 0.3),
('alloc_018', 'm6', 'p3', '2024-12-22', 0.4)

ON CONFLICT (member_id, project_id, week_date) DO NOTHING;

-- 第二周: 2024-12-29
INSERT INTO allocations (id, member_id, project_id, week_date, value) VALUES
-- Alice Chen
('alloc_019', 'm1', 'p1', '2024-12-29', 0.7),
('alloc_020', 'm1', 'p2', '2024-12-29', 0.6),
('alloc_021', 'm1', 'p3', '2024-12-29', 0.4),

-- Bob Smith
('alloc_022', 'm2', 'p1', '2024-12-29', 0.9),
('alloc_023', 'm2', 'p2', '2024-12-29', 0.2),
('alloc_024', 'm2', 'p3', '2024-12-29', 0.0),

-- Charlie Kim
('alloc_025', 'm3', 'p1', '2024-12-29', 0.5),
('alloc_026', 'm3', 'p2', '2024-12-29', 0.5),
('alloc_027', 'm3', 'p3', '2024-12-29', 0.1),

-- Diana Prince
('alloc_028', 'm4', 'p1', '2024-12-29', 0.6),
('alloc_029', 'm4', 'p2', '2024-12-29', 0.7),
('alloc_030', 'm4', 'p3', '2024-12-29', 0.0),

-- Ethan Hunt
('alloc_031', 'm5', 'p1', '2024-12-29', 0.4),
('alloc_032', 'm5', 'p2', '2024-12-29', 0.9),
('alloc_033', 'm5', 'p3', '2024-12-29', 0.3),

-- Fiona Gallagher
('alloc_034', 'm6', 'p1', '2024-12-29', 0.8),
('alloc_035', 'm6', 'p2', '2024-12-29', 0.4),
('alloc_036', 'm6', 'p3', '2024-12-29', 0.5)

ON CONFLICT (member_id, project_id, week_date) DO NOTHING;

-- 第三周: 2025-01-05
INSERT INTO allocations (id, member_id, project_id, week_date, value) VALUES
-- Alice Chen
('alloc_037', 'm1', 'p1', '2025-01-05', 0.6),
('alloc_038', 'm1', 'p2', '2025-01-05', 0.7),
('alloc_039', 'm1', 'p3', '2025-01-05', 0.5),

-- Bob Smith
('alloc_040', 'm2', 'p1', '2025-01-05', 0.8),
('alloc_041', 'm2', 'p2', '2025-01-05', 0.3),
('alloc_042', 'm2', 'p3', '2025-01-05', 0.1),

-- Charlie Kim
('alloc_043', 'm3', 'p1', '2025-01-05', 0.4),
('alloc_044', 'm3', 'p2', '2025-01-05', 0.6),
('alloc_045', 'm3', 'p3', '2025-01-05', 0.2),

-- Diana Prince
('alloc_046', 'm4', 'p1', '2025-01-05', 0.5),
('alloc_047', 'm4', 'p2', '2025-01-05', 0.8),
('alloc_048', 'm4', 'p3', '2025-01-05', 0.0),

-- Ethan Hunt
('alloc_049', 'm5', 'p1', '2025-01-05', 0.3),
('alloc_050', 'm5', 'p2', '2025-01-05', 1.0),
('alloc_051', 'm5', 'p3', '2025-01-05', 0.4),

-- Fiona Gallagher
('alloc_052', 'm6', 'p1', '2025-01-05', 0.7),
('alloc_053', 'm6', 'p2', '2025-01-05', 0.5),
('alloc_054', 'm6', 'p3', '2025-01-05', 0.6)

ON CONFLICT (member_id, project_id, week_date) DO NOTHING;

-- 第四周: 2025-01-12
INSERT INTO allocations (id, member_id, project_id, week_date, value) VALUES
-- Alice Chen
('alloc_055', 'm1', 'p1', '2025-01-12', 0.5),
('alloc_056', 'm1', 'p2', '2025-01-12', 0.8),
('alloc_057', 'm1', 'p3', '2025-01-12', 0.6),

-- Bob Smith
('alloc_058', 'm2', 'p1', '2025-01-12', 0.7),
('alloc_059', 'm2', 'p2', '2025-01-12', 0.4),
('alloc_060', 'm2', 'p3', '2025-01-12', 0.2),

-- Charlie Kim
('alloc_061', 'm3', 'p1', '2025-01-12', 0.3),
('alloc_062', 'm3', 'p2', '2025-01-12', 0.7),
('alloc_063', 'm3', 'p3', '2025-01-12', 0.3),

-- Diana Prince
('alloc_064', 'm4', 'p1', '2025-01-12', 0.4),
('alloc_065', 'm4', 'p2', '2025-01-12', 0.9),
('alloc_066', 'm4', 'p3', '2025-01-12', 0.1),

-- Ethan Hunt
('alloc_067', 'm5', 'p1', '2025-01-12', 0.2),
('alloc_068', 'm5', 'p2', '2025-01-12', 1.0),
('alloc_069', 'm5', 'p3', '2025-01-12', 0.5),

-- Fiona Gallagher
('alloc_070', 'm6', 'p1', '2025-01-12', 0.6),
('alloc_071', 'm6', 'p2', '2025-01-12', 0.6),
('alloc_072', 'm6', 'p3', '2025-01-12', 0.7)

ON CONFLICT (member_id, project_id, week_date) DO NOTHING;

-- ============================================
-- 数据说明:
-- - value 字段表示资源分配比例 (0.0 - 1.0)
-- - 1.0 表示 100% 分配给该项目
-- - 0.0 表示未分配
-- - 同一成员同一周在不同项目的总和可能超过 1.0 (表示过度分配)
--
-- 如果需要修改数据，可以根据图片中的实际数值调整
-- ============================================

-- 查询验证
SELECT
  m.name as member_name,
  m.role,
  p.name as project_name,
  a.week_date,
  a.value
FROM allocations a
JOIN members m ON a.member_id = m.id
JOIN projects p ON a.project_id = p.id
ORDER BY a.week_date, m.name, p.name;
