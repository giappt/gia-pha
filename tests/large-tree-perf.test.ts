import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateLargeClan } from '../src/fixtures/generate-large-clan';
import { calculateTreeLayout } from '../src/lib/tree-layout/genealogy-layout';

describe('Large Tree Stress Testing & Performance Benchmark (1.500 Nodes)', () => {
  // TC_UT_PERF_01: Sinh dữ liệu giả lập 1.500 nodes hợp lệ
  it('TC_UT_PERF_01: Bộ sinh dữ liệu tạo thành công >= 1.500 nhân khẩu, cấu trúc DAG 0 chu trình, đủ 12-15 thế hệ', () => {
    const target = 1500;
    const { members, spouseRelations } = generateLargeClan(target);

    // Kiểm tra quy mô
    assert.ok(
      members.length >= target,
      `Số lượng nhân khẩu (${members.length}) phải >= mục tiêu ${target}`
    );
    assert.ok(
      spouseRelations.length > 0,
      'Phải có danh sách quan hệ hôn phối'
    );

    // Kiểm tra số lượng thế hệ
    const generations = new Set(members.map((m) => m.generation_level));
    assert.ok(
      generations.size >= 12,
      `Gia tộc mẫu phải có ít nhất 12 thế hệ (thực tế: ${generations.size} thế hệ)`
    );

    // Kiểm tra tính đơn hướng DAG (không chu trình, cha mẹ luôn ở thế hệ trước)
    const memberMap = new Map(members.map((m) => [m.id, m]));
    members.forEach((m) => {
      if (m.father_id) {
        const father = memberMap.get(m.father_id);
        assert.ok(father, `Phải tìm thấy cha ${m.father_id} của ${m.id}`);
        assert.ok(
          father.generation_level < m.generation_level,
          `Cha (Đời ${father.generation_level}) phải ở thế hệ trước con (Đời ${m.generation_level})`
        );
      }
      if (m.mother_id) {
        const mother = memberMap.get(m.mother_id);
        assert.ok(mother, `Phải tìm thấy mẹ ${m.mother_id} của ${m.id}`);
        assert.ok(
          mother.generation_level < m.generation_level,
          `Mẹ (Đời ${mother.generation_level}) phải ở thế hệ trước con (Đời ${m.generation_level})`
        );
      }
    });

    // Kiểm tra có Node Khuyết danh ở Đời 2
    const anonNode = members.find((m) => m.is_anonymous);
    assert.ok(anonNode, 'Phải có ít nhất 1 Node Khuyết danh được sinh ra');
    assert.strictEqual(anonNode.generation_level, 2, 'Node khuyết danh phải ở Đời 2');
  });

  // TC_UT_PERF_02: SLA Benchmark tính toán dàn trang với 1.500 nodes < 100ms
  it('TC_UT_PERF_02: Thuật toán calculateTreeLayout xử lý toàn bộ 1.500 nodes với thời gian < 100ms', () => {
    const { members, spouseRelations } = generateLargeClan(1500);

    // Chạy thử 1 lần làm ấm (warm-up JIT)
    calculateTreeLayout(members.slice(0, 50), spouseRelations.slice(0, 20));

    // Bắt đầu đo lường hiệu năng
    const startTime = performance.now();
    const result = calculateTreeLayout(members, spouseRelations, {
      showMaternalBranches: true,
      showInternalHusbands: true,
    });
    const endTime = performance.now();
    const durationMs = endTime - startTime;

    console.log(`\n[PERF BENCHMARK] calculateTreeLayout với ${members.length} nodes: ${durationMs.toFixed(2)} ms`);

    assert.ok(
      result.nodes.length >= 1000,
      `Phải sinh ra layout nodes đầy đủ (thực tế: ${result.nodes.length})`
    );
    assert.ok(
      result.edges.length > 0,
      `Phải sinh ra layout edges đầy đủ (thực tế: ${result.edges.length})`
    );

    // SLA cam kết: Thời gian tính toán phải < 100ms
    assert.ok(
      durationMs < 100,
      `Thời gian tính toán dàn trang cho 1.500 nodes phải < 100ms (thực tế: ${durationMs.toFixed(2)}ms)`
    );
  });
});
