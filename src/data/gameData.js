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
    type: "choices",
    label: "3단계",
    title: "활 타면서 말 쏘기",
    events: [
      {
        desc: "장군이 벌떡 일어나 외친다:\n\n「전하! 지금 당장\n활을 타면서 말을 쏘셔야 합니다!」\n\n...활을 탄다? 말을 쏜다?",
        choices: [
          { text: "일단 활 위에 올라탐",     score: -2, result: "활이 뒤집히면서 얼굴에 시위가 박힘. 코피." },
          { text: "말한테 활을 쏨",           score: -3, result: "말이 도망감. 적군도 도망감. 아군도 도망감." },
          { text: "\"그 명령 이상한 거 아닙니까\"", score: 5,  result: "장군: 「아 맞다 제가 거꾸로 말했네요 ㅎ」" },
        ],
      },
      {
        desc: "이번엔 참모가 외친다:\n\n「전하! 지금 즉시\n물에서 불을 피우시고\n불 위에서 수영하셔야 합니다!」",
        choices: [
          { text: "일단 해봄",              score: -2, result: "익사 직전 구조됨. 어찌어찌 불은 붙음." },
          { text: "\"그게 말이 돼요??\" 폭발", score: 3,  result: "참모: 「저도 뭔 말인지 모르겠어요」" },
          { text: "조용히 참모를 해고함",     score: 4,  result: "후임 참모: 「전하! 앉아서 서고 서서...」" },
        ],
      },
    ],
  },
  {
    id: 4,
    type: "runner",
    label: "4단계",
    title: "왕의 사냥길",
  },
  {
    id: 5,
    type: "choices",
    label: "5단계",
    title: "왕의 도장 대소동",
    events: [
      {
        desc: "국새가 사라졌다!\n\n상서: 「도장 없이는 밥도 못 먹고\n잠도 못 자고 숨도 못 쉬어요!」\n\n숨도 못 쉰다고?",
        choices: [
          { text: "삼족을 멸하겠다고 엄포",       score: -3, result: "모두 뒤지다 보니 왕의 주머니에 있었음." },
          { text: "직접 온 궁궐을 뒤짐",           score: 2,  result: "숟가락 17개 발견. 도장은 없음." },
          { text: "\"손도장 안 되나요?\"",          score: 6,  result: "상서가 3초 멈추더니 조용히 손도장 처리함." },
        ],
      },
      {
        desc: "세금 장부 보고:\n\n「전하, 올해 세금 수입이\n마이너스 1,200냥입니다.」\n\n마이너스?",
        choices: [
          { text: "\"어떻게 마이너스가 나와?!\"",    score: -1, result: "징수 비용이 세금보다 많이 든다고 함." },
          { text: "징수 비용 절감 연구",              score: 5,  result: "3개월 후 '그냥 덜 걷기'가 최고 효율임을 발견." },
          { text: "왕실 예산 삭감으로 메꿈",          score: 3,  result: "왕 밥상 반찬이 3가지 줄었다. 눈물이 난다." },
        ],
      },
    ],
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
    desc: "충신을 잘 골라내고 현명한 판단을 내리며 왕위에 올랐습니다.\n\n역사서에 기록됨:\n「그분은 진정한 왕이었다. 활도 타지 않았고\n말도 쏘지 않았으며, 손도장도 적극 활용하셨다.」",
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
    desc: "중간 중간 실수가 있었지만\n결과적으로 왕이 되었습니다.\n\n이게 어딘가 싶었지만\n백성들도 딱히 반대는 안 했습니다.",
    color: "#44aaff",
  },
  {
    condition: (score) => score >= 0,
    title: "새벽의 왕",
    grade: "B",
    desc: "코피 나고, 익사할 뻔 하고,\n숟가락 17개 발견하고,\n그래도 왕이 됐습니다.\n\n그게 왕 재목이라는 증거입니다.",
    color: "#88aaff",
  },
  {
    condition: () => true,
    title: "망한 왕",
    grade: "C",
    desc: "간신만 골라 뽑고, 말을 활로 쏘고,\n세금도 마이너스인 채로 왕위에 올랐습니다.\n\n괜찮습니다. 역사는 승자가 씁니다.\n지금이라도 승자가 되세요.",
    color: "#aa4444",
  },
];
