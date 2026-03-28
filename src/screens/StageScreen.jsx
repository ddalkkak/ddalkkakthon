import { STAGES } from "../data/gameData";
import { BadKing } from "../art/BadKing";
import ShellGame from "../minigames/ShellGame";
import SurgeryGame from "../minigames/SurgeryGame";
import styles from "./StageScreen.module.css";

export default function StageScreen({
  state,
  onChoose,
  onNextEvent,
  onCompleteShellGame,
  onCompleteSurgery,
}) {
  const { name, face, stageIdx, eventIdx, lastChoiceResult } = state;
  const stage = STAGES[stageIdx];

  // 공통 상단 헤더 (스탯바 없음)
  function Header() {
    const totalEvents = STAGES.reduce(
      (s, st) => s + (st.events?.length ?? 1),
      0,
    );
    const passedEvents =
      STAGES.slice(0, stageIdx).reduce(
        (s, st) => s + (st.events?.length ?? 1),
        0,
      ) + eventIdx;
    const progress = Math.round((passedEvents / totalEvents) * 100);
    return (
      <header className={styles.header}>
        <div className={styles.stageRow}>
          <span className={styles.stageBadge}>{stage.label}</span>
          <span className={styles.stageTitle}>{stage.title}</span>
          <span className={styles.charName}>{name}</span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>
    );
  }

  // ── 야바위
  if (stage.type === "shellgame") {
    return (
      <div className={`${styles.wrap} screen-enter`}>
        <Header />
        <ShellGame onComplete={onCompleteShellGame} />
      </div>
    );
  }

  // ── 성형
  if (stage.type === "surgery") {
    return (
      <div className={`${styles.wrap} screen-enter`}>
        <Header />
        <SurgeryGame onComplete={onCompleteSurgery} />
      </div>
    );
  }

  // ── 일반 선택지
  const event = stage.events[eventIdx];
  const kingProps = {
    eyeStyle: face?.eyes ?? "normal",
    noseStyle: face?.nose ?? "normal",
    mouthStyle: face?.mouth ?? "angry",
  };

  // 결과 표시
  if (lastChoiceResult) {
    return (
      <div className={`${styles.wrap} screen-enter`}>
        <Header />
        <main className={styles.body}>
          <div className={styles.resultRow}>
            <div className={styles.charBox}>
              <BadKing {...kingProps} mouthStyle="open" size={144} />
            </div>
            <div className={styles.resultCard}>
              <div className={styles.resultLabel}>▶ 결과</div>
              <p className={styles.resultText}>{lastChoiceResult}</p>
            </div>
          </div>
          <button className={styles.nextBtn} onClick={onNextEvent}>
            계속하기 ▶
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className={`${styles.wrap} screen-enter`}>
      <Header />
      <main className={styles.body}>
        <div className={styles.eventRow}>
          <div className={styles.charBox}>
            <BadKing {...kingProps} size={144} />
          </div>
          <div className={styles.eventBox}>
            <p className={styles.eventText}>{event.desc}</p>
          </div>
        </div>
        <div className={styles.choices}>
          {event.choices.map((choice, i) => (
            <button
              key={i}
              className={styles.choiceBtn}
              onClick={() => onChoose(i)}
            >
              <span className={styles.choiceText}>{choice.text}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
