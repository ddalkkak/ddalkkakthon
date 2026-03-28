import { useState, useEffect, useRef } from "react";
import { BadKing } from "../art/BadKing";
import { getFaceName, SURGERY_OPTIONS } from "../data/gameData";
import { playSfx } from "../utils/playSfx";
import styles from "./EndingScreen.module.css";

const ASCEND_STEPS = [
  { label: "왕위에 오르다",       delay: 0 },
  { label: "몸에서 빛이 난다!",   delay: 1400 },
  { label: "몸이 변하기 시작한다...", delay: 2800 },
  { label: "王!!!",               delay: 4200 },
  { label: "하늘로 올라간다!!",   delay: 5600 },
];

export default function EndingScreen({ state, onRestart }) {
  const { name, face, ending } = state;
  const [step, setStep]       = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const playedKingSfx = useRef(false);

  useEffect(() => {
    const timers = ASCEND_STEPS.map((s, i) => setTimeout(() => setStep(i + 1), s.delay));
    const t = setTimeout(() => setShowInfo(true), 7200);
    return () => { timers.forEach(clearTimeout); clearTimeout(t); };
  }, []);

  // 「王」 큰 글자가 나올 때(왕 즉위 연출 정점) 엉뚱 효과음 1회
  useEffect(() => {
    if (step !== 4 || playedKingSfx.current) return;
    playedKingSfx.current = true;
    playSfx("king", 0.92);
  }, [step]);

  const phase = step;
  const kingFace = face ?? { eyes: "normal", nose: "normal", mouth: "angry" };
  const faceName = getFaceName(kingFace);

  const eyesLabel  = SURGERY_OPTIONS.eyes.find(o => o.id === kingFace.eyes)?.label  ?? "?";
  const noseLabel  = SURGERY_OPTIONS.nose.find(o => o.id === kingFace.nose)?.label  ?? "?";
  const mouthLabel = SURGERY_OPTIONS.mouth.find(o => o.id === kingFace.mouth)?.label ?? "?";

  return (
    <div className={`${styles.wrap} screen-enter`}>
      <div className={styles.starField}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className={styles.star}
            style={{ left: `${Math.random()*100}%`, top: `${Math.random()*100}%`,
              '--dur': `${1.5 + Math.random() * 2}s`,
              opacity: phase >= 2 ? 1 : 0 }} />
        ))}
      </div>

      <div className={styles.inner}>
        {phase >= 1 && (
          <div className={styles.grade} style={{ color: ending.color }}>
            {ending.grade}
          </div>
        )}

        <div className={styles.characterArea}>
          {phase < 4 && (
            <div className={`${styles.kingFigure}
              ${phase >= 2 ? styles.glowing : ""}
              ${phase >= 3 ? styles.transforming : ""}`}>
              <BadKing
                eyeStyle={kingFace.eyes}
                noseStyle={kingFace.nose}
                mouthStyle="smug"
                size={160}
              />
              {phase === 2 && <div className={styles.glowRing} />}
            </div>
          )}
          {phase === 4 && (
            <div className={styles.wangChar} style={{ color: ending.color }}>王</div>
          )}
          {phase >= 5 && (
            <div className={`${styles.wangChar} ${styles.ascending}`} style={{ color: ending.color }}>
              王<div className={styles.ascendTrail} />
            </div>
          )}
        </div>

        {phase >= 1 && phase <= 5 && (
          <div className={styles.stepMsg} key={phase}>
            {ASCEND_STEPS[phase - 1]?.label}
          </div>
        )}

        {showInfo && (
          <div className={`${styles.endingInfo} screen-enter`}>
            <h2 className={styles.endingTitle} style={{ color: ending.color }}>
              {name}<br />&lt;{faceName}&gt;<br />{ending.title}
            </h2>
            <p className={styles.endingDesc}>{ending.desc}</p>

            <button className={styles.restartBtn} onClick={onRestart}>
              처음으로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
