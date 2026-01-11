// 测试 Supabase 连接的简单脚本
// 在浏览器控制台中运行此代码来测试连接

const testSupabaseConnection = async () => {
  console.log('🔍 开始测试 Supabase 连接...\n');

  try {
    // 1. 测试连接
    console.log('1️⃣ 测试成员表...');
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*');

    if (membersError) {
      console.error('❌ 成员表错误:', membersError);
    } else {
      console.log('✅ 成员表正常，找到', members?.length || 0, '条记录');
      console.table(members);
    }

    // 2. 测试项目表
    console.log('\n2️⃣ 测试项目表...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*');

    if (projectsError) {
      console.error('❌ 项目表错误:', projectsError);
    } else {
      console.log('✅ 项目表正常，找到', projects?.length || 0, '条记录');
      console.table(projects);
    }

    // 3. 测试分配表
    console.log('\n3️⃣ 测试分配表...');
    const { data: allocations, error: allocationsError } = await supabase
      .from('allocations')
      .select('*');

    if (allocationsError) {
      console.error('❌ 分配表错误:', allocationsError);
    } else {
      console.log('✅ 分配表正常，找到', allocations?.length || 0, '条记录');
      if (allocations && allocations.length > 0) {
        console.table(allocations);
      }
    }

    // 4. 测试插入数据
    console.log('\n4️⃣ 测试插入数据...');
    const testData = {
      member_id: 'test-member',
      project_id: 'test-project',
      week_date: '2025-01-11',
      value: 0.5
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('allocations')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ 插入测试失败:', insertError);
    } else {
      console.log('✅ 插入测试成功');
      console.table(insertResult);

      // 清理测试数据
      await supabase
        .from('allocations')
        .delete()
        .eq('member_id', 'test-member');
      console.log('🧹 测试数据已清理');
    }

    console.log('\n✨ 所有测试完成！');

  } catch (error) {
    console.error('💥 测试过程中发生错误:', error);
  }
};

// 运行测试
testSupabaseConnection();
