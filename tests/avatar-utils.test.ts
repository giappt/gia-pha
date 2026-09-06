import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getMemberInitials } from '../src/lib/tree-layout/avatar-utils';

describe('Avatar Initials Unit Test Suite (Milestone 5 Enhancement)', () => {
  // TC_UT_AVATAR_MULTI_WORD: Trích xuất 2 chữ cái initials (Đệm + Tên) cho tên tiếng Việt >= 2 từ
  it('TC_UT_AVATAR_MULTI_WORD: Trích xuất 2 chữ cái initials (Đệm + Tên) cho tên tiếng Việt >= 2 từ', () => {
    assert.strictEqual(getMemberInitials('Nguyễn Văn Trưởng'), 'VT');
    assert.strictEqual(getMemberInitials('Lê Thị Hoa'), 'TH');
    assert.strictEqual(getMemberInitials('Phạm Chiến'), 'PC');
    assert.strictEqual(getMemberInitials('Nguyễn Văn Thứ'), 'VT');
    assert.strictEqual(getMemberInitials('Trần Thị Tổ'), 'TT');
    assert.strictEqual(getMemberInitials('Nguyễn Văn Khởi'), 'VK');
  });

  // TC_UT_AVATAR_EDGE_CASES: Xử lý tên 1 từ, Khuyết danh và fallback chuỗi rỗng
  it('TC_UT_AVATAR_EDGE_CASES: Xử lý tên 1 từ, Khuyết danh và fallback chuỗi rỗng', () => {
    // 1 từ: lấy 2 ký tự đầu in hoa
    assert.strictEqual(getMemberInitials('Trưởng'), 'TR');
    assert.strictEqual(getMemberInitials('An'), 'AN');
    assert.strictEqual(getMemberInitials('Á'), 'Á');

    // Khuyết danh: KD
    assert.strictEqual(getMemberInitials('(Khuyết danh Đời 2)', true), 'KD');
    assert.strictEqual(getMemberInitials(null, true), 'KD');

    // Fallback: TV
    assert.strictEqual(getMemberInitials(''), 'TV');
    assert.strictEqual(getMemberInitials('   '), 'TV');
    assert.strictEqual(getMemberInitials(null), 'TV');
    assert.strictEqual(getMemberInitials(undefined), 'TV');
  });
});
