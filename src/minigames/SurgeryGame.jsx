import { useState, useEffect, useRef } from "react";
import { BadKing } from "../art/BadKing";
import { SURGERY_OPTIONS } from "../data/gameData";
import styles from "./SurgeryGame.module.css";

const STEPS = [
  { key: "eyes",  label: "눈",  question: "눈 수술 — 버튼을 눌러 멈추세요!" },
  { key: "nose",  label: "코",  question: "코 수술 — 버튼을 눌러 멈추세요!" },
  { key: "mouth", label: "입",  question: "입 수술 — 버튼을 눌러 멈추세요!" },
];

// 이상한 변종 옵션 (슬롯머신에서만 나올 수 있음)
const WEIRD_OPTIONS = {
  eyes:  [
    { id: "spiral",  label: "소용돌이눈", desc: "어지럽습니다" },
    { id: "xcross",  label: "X눈",        desc: "만화 캐릭터" },
    { id: "heart",   label: "하트눈",     desc: "사랑이 넘침" },
    { id: "noEyes",  label: "눈없음",     desc: "보이는 게 없음" },
  ],
  nose:  [
    { id: "pig",     label: "돼지코",     desc: "콧구멍 강조" },
    { id: "triple",  label: "삼코",       desc: "코가 세 개" },
    { id: "noNose",  label: "코없음",     desc: "숨은 어떻게?" },
  ],
  mouth: [
    { id: "zipper",  label: "지퍼입",     desc: "잠겼습니다" },
    { id: "clown",   label: "광대입",     desc: "웃음이 멈추지 않음" },
    { id: "noMouth", label: "입없음",     desc: "말을 못합니다" },
  ],
};

const ITEM_W = 132; // px (reel cell width; keep in sync with SurgeryGame.module.css .reelItem)

function buildReel(key) {
  // 일반 옵션 + 이상한 옵션 섞기
  const normal = SURGERY_OPTIONS[key];
  const weird  = WEIRD_OPTIONS[key];
  // 두 번 반복해서 무한 스크롤처럼 보이게
  return [...normal, ...weird, ...normal, ...weird];
}

export default function SurgeryGame({ onComplete }) {
  const [step, setStep] = useState(0);   // 0=눈, 1=코, 2=입, 3=결과
  const [face, setFace] = useState({ eyes: "normal", nose: "normal", mouth: "angry" });

  // 슬롯머신 상태
  const [offset, setOffset] = useState(0);        // translateX 값 (px)
  const [spinning, setSpinning] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [pickedItem, setPickedItem] = useState(null);

  const intervalRef = useRef(null);
  const offsetRef = useRef(0);
  const currentStep = STEPS[step];
  const reel = step < 3 ? buildReel(currentStep.key) : [];

  // 스텝 바뀌면 리셋
  useEffect(() => {
    if (step >= 3) return;
    offsetRef.current = 0;
    setOffset(0);
    setStopped(false);
    setPickedItem(null);
    setSpinning(false);
  }, [step]);

  function startSpin() {
    if (spinning || stopped) return;
    setSpinning(true);
    intervalRef.current = setInterval(() => {
      offsetRef.current -= 4;
      // 무한 루프: 리셀 절반 길이에서 리셋
      const halfLen = (SURGERY_OPTIONS[currentStep.key].length + WEIRD_OPTIONS[currentStep.key].length) * ITEM_W;
      if (Math.abs(offsetRef.current) >= halfLen) {
        offsetRef.current += halfLen;
      }
      setOffset(offsetRef.current);
    }, 30);
  }

  function stopSpin() {
    if (!spinning || stopped) return;
    clearInterval(intervalRef.current);
    setSpinning(false);
    setStopped(true);

    // 현재 중앙에 오는 아이템 찾기
    const viewCenter = 0; // relative to container, item in center
    // center of container = containerWidth/2, each item = ITEM_W wide
    // offset is negative (track moves left)
    // center item index = Math.round(-offset / ITEM_W)
    const rawIdx = Math.round(-offsetRef.current / ITEM_W);
    const item = reel[Math.abs(rawIdx) % reel.length] ?? reel[0];

    // 50% chance: if normal, override with weird
    let finalItem = item;
    const allWeird = WEIRD_OPTIONS[currentStep.key];
    if (Math.random() < 0.5) {
      finalItem = allWeird[Math.floor(Math.random() * allWeird.length)];
    }

    setPickedItem(finalItem);
    setFace((f) => ({ ...f, [currentStep.key]: finalItem.id }));

    // 스냅 오프셋 맞추기
    const snappedOffset = -rawIdx * ITEM_W;
    offsetRef.current = snappedOffset;
    setOffset(snappedOffset);
  }

  function goNext() {
    if (!stopped) return;
    clearInterval(intervalRef.current);
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      setStep(3);
    }
  }

  // 결과 화면
  if (step === 3) {
    const allOptions = { ...SURGERY_OPTIONS };
    Object.keys(WEIRD_OPTIONS).forEach((k) => {
      allOptions[k] = [...allOptions[k], ...WEIRD_OPTIONS[k]];
    });
    const eyeLabel   = allOptions.eyes.find(o => o.id === face.eyes)?.label ?? face.eyes;
    const noseLabel  = allOptions.nose.find(o => o.id === face.nose)?.label ?? face.nose;
    const mouthLabel = allOptions.mouth.find(o => o.id === face.mouth)?.label ?? face.mouth;
    return (
      <div className={styles.wrap}>
        <div className={styles.resultBox}>
          <div className={styles.resultTitle}>성형 완료!</div>
          <div className={styles.kingPreview}>
            <BadKing eyeStyle={face.eyes} noseStyle={face.nose} mouthStyle={face.mouth} size={192} />
          </div>
          <p className={styles.resultComment}>독특한 비주얼이 탄생했습니다.</p>
          <div className={styles.faceLabels}>
            <span>눈: {eyeLabel}</span>
            <span>코: {noseLabel}</span>
            <span>입: {mouthLabel}</span>
          </div>
          <button className={styles.nextBtn} onClick={() => onComplete(face)}>
            다음 단계로 ▶
          </button>
        </div>
      </div>
    );
  }

  // 현재 얼굴 미리보기
  const previewFace = { ...face };

  return (
    <div className={styles.wrap}>
      {/* 진행 표시 */}
      <div className={styles.stepIndicator}>
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={`${styles.stepDot} ${i < step ? styles.done : ""} ${i === step ? styles.active : ""}`}
          >
            {i < step ? "✓" : s.label}
          </div>
        ))}
      </div>

      {/* 미리보기 */}
      <div className={styles.previewCol}>
        <div className={styles.previewLabel}>현재 왕</div>
        <div className={styles.preview}>
          <BadKing eyeStyle={previewFace.eyes} noseStyle={previewFace.nose} mouthStyle={previewFace.mouth} size={156} />
        </div>
      </div>

      {/* 슬롯머신 */}
      <div className={styles.slotSection}>
        <div className={styles.slotQuestion}>{currentStep.question}</div>

        <div className={styles.reelWrap}>
          <div className={styles.centerMarker} />
          <div
            className={styles.reelTrack}
            style={{
              transform: `translateX(calc(50% - ${ITEM_W / 2}px + ${offset}px))`,
              transition: stopped ? "transform 0.15s steps(3)" : "none",
            }}
          >
            {reel.map((item, i) => (
              <div
                key={i}
                className={styles.reelItem}
              >
                <span className={styles.reelItemLabel}>{item.label}</span>
                <span className={styles.reelItemDesc}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {!spinning && !stopped && (
          <button className={styles.stopBtn} onClick={startSpin}>
            ▶ 돌리기!
          </button>
        )}
        {spinning && (
          <button className={styles.stopBtn} onClick={stopSpin}>
            ■ 멈춰!
          </button>
        )}
        {stopped && pickedItem && (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "0.7rem", marginBottom: 12 }}>
              {pickedItem.label} 선택됨!
            </p>
            <button className={styles.stopBtn} onClick={goNext}>
              {step < 2 ? "다음 ▶" : "성형 완료!"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
