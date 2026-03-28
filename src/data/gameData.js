// 스테이지 타입: 'shellgame' | 'surgery' | 'choices'
export const STAGES = [
  {
    id: 1,
    type: "shellgame",
    label: "1단계",
    title: "충신? 간신? 야바위!",
    intro: "세 명 중 충신이 누군지 맞혀라!\n다들 똑같이 생겨서 모르겠다.",
    rounds: 3,
  },
  {
    id: 2,
    type: "surgery",
    label: "2단계",
    title: "왕 성형 클리닉",
  },
  {
    id: 3,
    type: "runner",
    label: "3단계",
    title: "왕의 사냥길",
  },
  {
    id: 4,
    type: "archery",
    label: "4단계",
    title: "왕의 활쏘기",
  },
  {
    id: 5,
    type: "palace",
    label: "5단계",
    title: "궁문 탈출",
  },
];

// 성형 옵션 데이터
export const SURGERY_OPTIONS = {
  eyes: [
    { id: "normal",   label: "보통눈",  desc: "평범하고 건강한 눈" },
    { id: "big",      label: "왕왕눈",  desc: "충격과 공포의 왕눈" },
    { id: "slit",     label: "실눈",    desc: "반쯤 감은 포스" },
    { id: "horror",   label: "공포눈",  desc: "빨간 눈동자 (야간 시야 향상)" },
  ],
  nose: [
    { id: "normal",   label: "보통코",  desc: "적당히 생긴 코" },
    { id: "big",      label: "큰코",    desc: "존재감 있는 코" },
    { id: "flat",     label: "납작코",  desc: "눌린 듯한 코" },
    { id: "tiny",     label: "점코",    desc: "있는지 없는지 모를 코" },
  ],
  mouth: [
    { id: "angry",    label: "화난입",  desc: "항상 화난 왕의 입" },
    { id: "open",     label: "벌린입",  desc: "항상 벌려진 입 (파리 주의)" },
    { id: "duck",     label: "오리입",  desc: "삐죽 나온 입술" },
    { id: "smug",     label: "비릿한입", desc: "왠지 모를 여유" },
  ],
};

// 얼굴 조합 → 별명
export function getFaceName(face) {
  if (!face.eyes) return "무명왕";
  const map = {
    "horror-big-open":  "공포 대왕",
    "big-big-open":     "과장 전문왕",
    "slit-tiny-smug":   "포커페이스왕",
    "normal-normal-angry": "평범한 왕",
    "big-flat-duck":    "오리 왕",
  };
  const key = `${face.eyes}-${face.nose}-${face.mouth}`;
  return map[key] ?? "알 수 없는 왕";
}

// 점수 기반 엔딩 (스탯 없음)
export const ENDINGS = [
  {
    condition: (score, shellWins) => score >= 18 && shellWins >= 2,
    title: "성군 탄생",
    grade: "S+",
    desc: "충신을 잘 골라내고 현명한 판단을 내리며 왕위에 올랐습니다.\n\n역사서에 기록됨:\n「그분은 진정한 왕이었다.」",
    color: "#f5c400",
  },
  {
    condition: (score) => score >= 12,
    title: "철의 군주",
    grade: "S",
    desc: "흔들림 없는 판단력으로 모든 혼란을 수습하고\n왕위에 올랐습니다.\n\n주변 나라들도 함부로 건드리지 못하는\n강국을 이루었습니다.",
    color: "#ff6644",
  },
  {
    condition: (score) => score >= 6,
    title: "어쨌든 왕",
    grade: "A",
    desc: "중간 중간 실수가 있었지만\n결과적으로 왕이 되었습니다.\n\n백성들도 이상하다 느꼈지만\n딱히 반대는 안 했습니다~\n\n왕이 될 자질이 있었는지도 모르죠.",
    color: "#44aaff",
  },
  {
    condition: (score) => score >= 0,
    title: "너가 왕?",
    grade: "B",
    desc: "우여곡절이 있었지만 \n그래도 왕이 됐습니다.\n\n그게 왕 재목이라는 증거입니다.",
    color: "#88aaff",
  },
  {
    condition: () => true,
    title: "망한 왕",
    grade: "C",
    desc: "모든 실패를 겪고 왕위에 올랐습니다.\n\n백성들은 당신이 왕이 된 이유를 모르겠다고 합니다.\n\n역사서에도 기록되지 않을 것입니다.",
    color: "#aa4444",
  },
];
