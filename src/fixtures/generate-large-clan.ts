import { MemberRecord, SpouseRelationRecord } from '@/types/tree';

const SURNAMES = ['Phạm', 'Nguyễn', 'Trần', 'Lê', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ'];
const MID_MALE = ['Văn', 'Kim', 'Khắc', 'Đình', 'Đức', 'Xuân', 'Hồng', 'Thành', 'Minh', 'Hữu'];
const MID_FEMALE = ['Thị', 'Ngọc', 'Thanh', 'Thu', 'Mai', 'Ánh', 'Phương', 'Bích', 'Diệu', 'Hồng'];
const GIVEN_NAMES = [
  'Chiến', 'Chức', 'Tường', 'Đoàn', 'Đức', 'Quyền', 'Châu', 'Lúa', 'Nguyệt', 'Chuyên',
  'Quy', 'Diễn', 'Canh', 'Lim', 'Chiêm', 'Giảng', 'Quéo', 'Xây', 'Sửu', 'Đạt',
  'Tiễu', 'Miết', 'Cổn', 'Toại', 'Hiền', 'Huy', 'Tản', 'Cường', 'Nam', 'Bình',
  'Hải', 'Sơn', 'Dũng', 'Long', 'Trọng', 'Bách', 'Khoa', 'Tùng', 'Phúc', 'Lâm'
];

/**
 * Bộ sinh dữ liệu giả lập gia tộc quy mô lớn (Large Synthetic Clan Generator)
 * - Đảm bảo cấu trúc DAG nghiêm ngặt 100% không chu trình.
 * - Hỗ trợ phân tầng 12 - 15 thế hệ, đa thê, hôn nhân nội tộc (Ghost Node), node khuyết danh.
 */
export function generateLargeClan(targetSize: number = 1500): {
  members: MemberRecord[];
  spouseRelations: SpouseRelationRecord[];
} {
  const members: MemberRecord[] = [];
  const spouseRelations: SpouseRelationRecord[] = [];

  let memberSeq = 0;
  let spouseRelSeq = 0;

  function nextMemberId(): string {
    return `sim-${++memberSeq}`;
  }

  function nextRelId(): string {
    return `srel-${++spouseRelSeq}`;
  }

  // --- ĐỜI 1: Cụ Thủy tổ & 2 Cụ Bà (Đa thê khởi nguyên) ---
  const rootId = nextMemberId();
  const rootWife1Id = nextMemberId();
  const rootWife2Id = nextMemberId();

  members.push(
    {
      id: rootId,
      full_name: 'Phạm Văn Chiến (Thủy Tổ)',
      gender: 'male',
      life_status: 'deceased',
      birth_year: 1680,
      death_year: 1755,
      death_lunar_day: 3,
      death_lunar_month: 7,
      generation_level: 1,
      birth_order: 1,
      is_root: true,
      branch_name: 'Gốc Gia Tộc',
      burial_location: 'Khu lăng mộ Tổ họ Phạm - Đồi Côn Sơn',
      notes: 'Cụ Thủy tổ khởi dựng cơ nghiệp dòng họ tại Hà Nam.',
    },
    {
      id: rootWife1Id,
      full_name: 'Hoàng Thị Mơ',
      gender: 'female',
      life_status: 'deceased',
      birth_year: 1682,
      death_year: 1748,
      death_lunar_day: 11,
      death_lunar_month: 5,
      generation_level: 1,
      is_root: false,
      branch_name: 'Gốc Gia Tộc',
    },
    {
      id: rootWife2Id,
      full_name: 'Đào Thị Liễu',
      gender: 'female',
      life_status: 'deceased',
      birth_year: 1685,
      death_year: 1752,
      death_lunar_day: 24,
      death_lunar_month: 7,
      generation_level: 1,
      is_root: false,
      branch_name: 'Gốc Gia Tộc',
    }
  );

  spouseRelations.push(
    {
      id: nextRelId(),
      member_a_id: rootId,
      member_b_id: rootWife1Id,
      marriage_order: 1,
      marriage_status: 'first_wife',
    },
    {
      id: nextRelId(),
      member_a_id: rootId,
      member_b_id: rootWife2Id,
      marriage_order: 2,
      marriage_status: 'second_wife',
    }
  );

  let activeCouples: Array<{ husbandId: string; wifeId: string; branch: string }> = [
    { husbandId: rootId, wifeId: rootWife1Id, branch: 'Chi 1' },
    { husbandId: rootId, wifeId: rootWife2Id, branch: 'Chi 2' },
  ];

  const internalMarriageCandidates: MemberRecord[] = [];

  // Sinh đủ từ Đời 2 đến Đời 14
  for (let currentLevel = 2; currentLevel <= 14; currentLevel++) {
    const nextCouples: Array<{ husbandId: string; wifeId: string; branch: string }> = [];
    const baseBirthYear = 1680 + (currentLevel - 1) * 24;

    // Giới hạn số cặp sinh con mỗi đời để cây dàn trải đều qua 14 đời
    // Đời 2-4: 2 - 8 cặp; Đời 5-10: 15 - 35 cặp; Đời 11-14: 35 - 50 cặp
    const maxCouplesThisGen = Math.min(activeCouples.length, Math.max(3, currentLevel * 4));
    const selectedCouples = activeCouples.slice(0, maxCouplesThisGen);

    // Tính số con trung bình mỗi cặp để đạt mục tiêu targetSize ở đời cuối
    const remainingGens = 15 - currentLevel;
    const remainingNeeded = Math.max(0, targetSize - members.length);
    const targetPerGen = Math.ceil(remainingNeeded / remainingGens);
    const childrenPerCouple = Math.max(2, Math.min(4, Math.ceil(targetPerGen / (selectedCouples.length * 2))));

    for (let cIdx = 0; cIdx < selectedCouples.length; cIdx++) {
      const couple = selectedCouples[cIdx];
      const isLevel2First = currentLevel === 2 && cIdx === 0;

      for (let childIdx = 1; childIdx <= childrenPerCouple; childIdx++) {
        const isAnon = isLevel2First && childIdx === 1;
        const isMale = childIdx % 2 === 1;
        const childId = nextMemberId();
        const birthYear = baseBirthYear + childIdx * 2;
        const isLiving = currentLevel >= 12;

        const fullName = isAnon
          ? '(Khuyết danh Đời 2)'
          : `${SURNAMES[0]} ${isMale ? MID_MALE[childIdx % MID_MALE.length] : MID_FEMALE[childIdx % MID_FEMALE.length]} ${GIVEN_NAMES[(cIdx * 5 + childIdx) % GIVEN_NAMES.length]}`;

        const childRecord: MemberRecord = {
          id: childId,
          full_name: fullName,
          gender: isMale ? 'male' : 'female',
          life_status: isLiving ? 'living' : 'deceased',
          birth_year: birthYear,
          death_year: isLiving ? null : birthYear + 68,
          death_lunar_day: isLiving ? null : ((cIdx + childIdx) % 28) + 1,
          death_lunar_month: isLiving ? null : ((cIdx + childIdx) % 12) + 1,
          generation_level: currentLevel,
          father_id: couple.husbandId,
          mother_id: couple.wifeId,
          birth_order: childIdx,
          is_root: false,
          is_senior: childIdx === 1 && isMale,
          branch_name: couple.branch,
          is_anonymous: isAnon,
          burial_location: isLiving ? null : `Nghĩa trang Thôn Phú Gia - Mộ số ${cIdx * 10 + childIdx}`,
          notes: isAnon
            ? 'Tư liệu lịch sử Đời thứ 2 bị thất truyền trong gia phả cổ.'
            : childIdx === 1 && isMale
            ? 'Trưởng nam gánh vác việc họ'
            : null,
        };

        members.push(childRecord);

        // Lưu ứng viên để ghép hôn nhân nội tộc (đời 8 - 10)
        if (currentLevel >= 8 && currentLevel <= 10 && internalMarriageCandidates.length < 10) {
          internalMarriageCandidates.push(childRecord);
        }

        // Tạo phối ngẫu
        if (currentLevel < 14) {
          const spouseId = nextMemberId();
          const spouseSurname = SURNAMES[(cIdx + childIdx + 1) % SURNAMES.length];
          const spouseName = isMale
            ? `${spouseSurname} Thị ${GIVEN_NAMES[(childIdx * 7) % GIVEN_NAMES.length]}`
            : `${spouseSurname} Văn ${GIVEN_NAMES[(childIdx * 7) % GIVEN_NAMES.length]}`;

          members.push({
            id: spouseId,
            full_name: spouseName,
            gender: isMale ? 'female' : 'male',
            life_status: isLiving ? 'living' : 'deceased',
            birth_year: birthYear + (isMale ? 2 : -2),
            death_year: isLiving ? null : birthYear + 67,
            death_lunar_day: isLiving ? null : ((childIdx * 3) % 28) + 1,
            death_lunar_month: isLiving ? null : ((childIdx * 3) % 12) + 1,
            generation_level: currentLevel,
            is_root: false,
            branch_name: couple.branch,
          });

          spouseRelations.push({
            id: nextRelId(),
            member_a_id: childId,
            member_b_id: spouseId,
            marriage_order: 1,
            marriage_status: 'married',
          });

          if (isMale || childIdx === 2) {
            nextCouples.push({
              husbandId: isMale ? childId : spouseId,
              wifeId: isMale ? spouseId : childId,
              branch: couple.branch,
            });
          }
        }
      }
    }

    // Ghép hôn nhân nội tộc ở Đời 9
    if (internalMarriageCandidates.length >= 2 && currentLevel === 9) {
      const maleCandidate = internalMarriageCandidates.find(
        (m) => m.gender === 'male' && m.generation_level === 9
      );
      const femaleCandidate = internalMarriageCandidates.find(
        (m) => m.gender === 'female' && m.generation_level === 9 && m.father_id !== maleCandidate?.father_id
      );

      if (maleCandidate && femaleCandidate) {
        spouseRelations.push({
          id: nextRelId(),
          member_a_id: maleCandidate.id,
          member_b_id: femaleCandidate.id,
          marriage_order: 1,
          marriage_status: 'internal_marriage',
        });
      }
    }

    if (nextCouples.length > 0) {
      activeCouples = nextCouples;
    }
  }

  // Nếu vẫn chưa đủ targetSize sau 14 đời -> Bổ sung con cái thế hệ 15 cho các cặp thế hệ 14
  let childSeq15 = 0;
  while (members.length < targetSize && activeCouples.length > 0) {
    const couple = activeCouples[childSeq15 % activeCouples.length];
    childSeq15++;

    const isMale = childSeq15 % 2 === 1;
    const childId = nextMemberId();
    members.push({
      id: childId,
      full_name: `${SURNAMES[0]} ${isMale ? 'Minh' : 'Ngọc'} ${GIVEN_NAMES[childSeq15 % GIVEN_NAMES.length]}`,
      gender: isMale ? 'male' : 'female',
      life_status: 'living',
      birth_year: 2015 + (childSeq15 % 8),
      generation_level: 15,
      father_id: couple.husbandId,
      mother_id: couple.wifeId,
      birth_order: Math.floor(childSeq15 / activeCouples.length) + 1,
      is_root: false,
      branch_name: couple.branch,
    });
  }

  return { members, spouseRelations };
}
