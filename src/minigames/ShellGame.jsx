import { useState, useEffect, useRef } from "react";
import { Cup } from "../art/BadKing";
import styles from "./ShellGame.module.css";

const TOTAL_ROUNDS = 3;

/** 삼단 슬라이드: 5칸 중 가운데(2)에 맞추면 선택 가능 */
const PUZZLE_SLOTS = 5;
const PUZZLE_CENTER = 2;

function randomPuzzleRows() {
  const rows = [
    Math.floor(Math.random() * PUZZLE_SLOTS),
    Math.floor(Math.random() * PUZZLE_SLOTS),
    Math.floor(Math.random() * PUZZLE_SLOTS),
  ];
  while (rows.every((p) => p === PUZZLE_CENTER)) {
    const k = Math.floor(Math.random() * 3);
    rows[k] = (PUZZLE_CENTER + 1 + Math.floor(Math.random() * (PUZZLE_SLOTS - 1))) % PUZZLE_SLOTS;
  }
  return rows;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 삼각형 꼭짓점 위치 (각도, 반지름)
// 0: 위, 1: 왼쪽 아래, 2: 오른쪽 아래
const BASE_ANGLES = [270, 30, 150]; // 도(degree)
const ORBIT_R = 108;
const CENTER_X = 156;
const CENTER_Y = 144;
const CUP_W = 96;

function getCupPos(slotIdx, extraDeg) {
  const deg = BASE_ANGLES[slotIdx] + extraDeg;
  const rad = (deg * Math.PI) / 180;
  return {
    x: CENTER_X + ORBIT_R * Math.cos(rad) - CUP_W / 2,
    y: CENTER_Y + ORBIT_R * Math.sin(rad) - 48,
  };
}

/** 라운드2 난무: 속도 벡터로 사방·대각 이동 + 경계 튕김 + 가끔 방향 전환 */
const CHAOS_TICK_MS = 14;
const CHAOS_DURATION_MS = 2400;
const CHAOS_SPEED = 6.4;
const CHAOS_STEER = 0.13;
const FLOAT_MAX = 64;

function randomChaosVelocity() {
  const theta = Math.random() * Math.PI * 2;
  const mag = CHAOS_SPEED * (0.82 + Math.random() * 0.55);
  return { vx: Math.cos(theta) * mag, vy: Math.sin(theta) * mag };
}

const RESULT_MSGS = {
  win:  ["충신입니다! 역시 안목이 있으십니다!", "정답! 이 충신이 그대를 믿습니다!", "맞혔습니다! 호오... 제법이네요."],
  lose: ["간신이었습니다. 이 표정 보이시죠?", "틀렸습니다. 간신이 싱글벙글 웃고 있습니다.", "아 하필 이놈이... 간신이네요 ㅎ"],
};

export default function ShellGame({ onComplete }) {
  const [slots, setSlots] = useState(() => shuffle(["loyal", "traitor", "traitor"]));
  const [phase, setPhase] = useState("intro");
  const [openSlots, setOpenSlots] = useState([false, false, false]);
  const [chosenSlot, setChosenSlot] = useState(null);
  const [round, setRound] = useState(1);
  const [wins, setWins] = useState(0);
  const [resultMsg, setResultMsg] = useState("");
  // 삼각형 회전 각도 (0 = 정방향)
  const [spinDeg, setSpinDeg] = useState(0);
  const [puzzleRows, setPuzzleRows] = useState(() => randomPuzzleRows());
  /** 라운드2: 컵별 2D 난무 오프셋 */
  const [cupFloat, setCupFloat] = useState(() => [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ]);
  const timerRef = useRef(null);
  const spinRef = useRef(null);
  const chaosIntervalRef = useRef(null);
  const chaosEndRef = useRef(null);
  const chaosVelRef = useRef([
    { vx: 0, vy: 0 },
    { vx: 0, vy: 0 },
    { vx: 0, vy: 0 },
  ]);
  const scanTimersRef = useRef([]);

  function clearAllTimers() {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (spinRef.current) clearInterval(spinRef.current);
    if (chaosIntervalRef.current) clearInterval(chaosIntervalRef.current);
    if (chaosEndRef.current) clearTimeout(chaosEndRef.current);
    chaosIntervalRef.current = null;
    chaosEndRef.current = null;
    scanTimersRef.current.forEach(clearTimeout);
    scanTimersRef.current = [];
  }

  // 스핀 시작
  function startSpin() {
    if (spinRef.current) clearInterval(spinRef.current);
    spinRef.current = setInterval(() => {
      setSpinDeg((d) => d + 14);
    }, 11);
  }

  // 스핀 정지
  function stopSpin() {
    if (spinRef.current) clearInterval(spinRef.current);
    spinRef.current = null;
  }

  function startRound(activeRound) {
    const r = activeRound;
    setCupFloat([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ]);
    const newSlots = shuffle(["loyal", "traitor", "traitor"]);
    setSlots(newSlots);
    setOpenSlots([true, true, true]);
    setChosenSlot(null);
    setSpinDeg(0);
    setPhase("peek");

    // 짧게만 공개 — 위치·표정 따라가기 거의 불가
    timerRef.current = setTimeout(() => {
      setOpenSlots([false, false, false]);
      timerRef.current = setTimeout(() => doShuffle(newSlots, r), 90);
    }, 280);
  }

  function doShuffle(currentSlots, activeRound) {
    setPhase("shuffle");
    startSpin();

    let cur = [...currentSlots];
    const swapCount = 14 + Math.floor(Math.random() * 9);
    let done = 0;

    function doSwap() {
      if (done >= swapCount) {
        stopSpin();
        setSlots([...cur]);
        if (activeRound === 1) {
          setPuzzleRows(randomPuzzleRows());
          setPhase("puzzle");
        } else {
          setSpinDeg(0);
          if (activeRound === 2) {
            setCupFloat([
              { x: 0, y: 0 },
              { x: 0, y: 0 },
              { x: 0, y: 0 },
            ]);
            setPhase("chaos");
          } else {
            setPhase("scan");
          }
        }
        return;
      }
      let i = Math.floor(Math.random() * 3);
      let j = Math.floor(Math.random() * 2);
      if (j >= i) j++;
      [cur[i], cur[j]] = [cur[j], cur[i]];
      setSlots([...cur]);
      done++;
      timerRef.current = setTimeout(doSwap, 68);
    }
    timerRef.current = setTimeout(doSwap, 40);
  }

  function movePuzzleRow(rowIdx, delta) {
    if (phase !== "puzzle") return;
    setPuzzleRows((prev) => {
      const next = [...prev];
      const v = next[rowIdx] + delta;
      next[rowIdx] = Math.max(0, Math.min(PUZZLE_SLOTS - 1, v));
      return next;
    });
  }

  useEffect(() => {
    if (phase !== "puzzle") return;
    if (puzzleRows.every((p) => p === PUZZLE_CENTER)) {
      const t = setTimeout(() => setPhase("choose"), 220);
      return () => clearTimeout(t);
    }
  }, [phase, puzzleRows]);

  // 라운드2: 속도로 사방팔방 이동 → 경계에서 튕김 → 가끔 새 방향
  useEffect(() => {
    if (phase !== "chaos") return;
    chaosVelRef.current = [
      randomChaosVelocity(),
      randomChaosVelocity(),
      randomChaosVelocity(),
    ];
    chaosIntervalRef.current = setInterval(() => {
      setCupFloat((prev) => {
        const vel = chaosVelRef.current;
        return prev.map((o, i) => {
          if (Math.random() < CHAOS_STEER) {
            const nv = randomChaosVelocity();
            vel[i].vx = nv.vx;
            vel[i].vy = nv.vy;
          }
          let nx = o.x + vel[i].vx;
          let ny = o.y + vel[i].vy;
          if (nx >= FLOAT_MAX) {
            nx = FLOAT_MAX;
            vel[i].vx = -Math.abs(vel[i].vx) * (0.72 + Math.random() * 0.38);
          } else if (nx <= -FLOAT_MAX) {
            nx = -FLOAT_MAX;
            vel[i].vx = Math.abs(vel[i].vx) * (0.72 + Math.random() * 0.38);
          }
          if (ny >= FLOAT_MAX) {
            ny = FLOAT_MAX;
            vel[i].vy = -Math.abs(vel[i].vy) * (0.72 + Math.random() * 0.38);
          } else if (ny <= -FLOAT_MAX) {
            ny = -FLOAT_MAX;
            vel[i].vy = Math.abs(vel[i].vy) * (0.72 + Math.random() * 0.38);
          }
          return { x: nx, y: ny };
        });
      });
    }, CHAOS_TICK_MS);
    chaosEndRef.current = setTimeout(() => {
      if (chaosIntervalRef.current) clearInterval(chaosIntervalRef.current);
      chaosIntervalRef.current = null;
      chaosEndRef.current = null;
      setPhase("choose");
    }, CHAOS_DURATION_MS);
    return () => {
      if (chaosIntervalRef.current) clearInterval(chaosIntervalRef.current);
      if (chaosEndRef.current) clearTimeout(chaosEndRef.current);
      chaosIntervalRef.current = null;
      chaosEndRef.current = null;
    };
  }, [phase]);

  // 라운드3: 순차 플래시를 극단적으로 짧게 (거의 식별 불가)
  useEffect(() => {
    if (phase !== "scan") return;
    const ids = [];
    const order = shuffle([0, 1, 2]);
    const openMs = 26;
    const gapMs = 10;
    const startDelay = 35;

    const schedule = (fn, ms) => {
      const id = setTimeout(fn, ms);
      ids.push(id);
    };

    let t = startDelay;
    order.forEach((slotIdx) => {
      schedule(() => {
        setOpenSlots([false, false, false].map((_, j) => j === slotIdx));
      }, t);
      t += openMs;
      schedule(() => {
        setOpenSlots([false, false, false]);
      }, t);
      t += gapMs;
    });
    schedule(() => setPhase("choose"), t + 18);

    scanTimersRef.current = ids;
    return () => {
      ids.forEach(clearTimeout);
      scanTimersRef.current = [];
    };
  }, [phase]);

  function handleChoose(idx) {
    if (phase !== "choose") return;
    clearAllTimers();
    const isWin = slots[idx] === "loyal";
    const newWins = wins + (isWin ? 1 : 0);
    setWins(newWins);
    setChosenSlot(idx);
    setOpenSlots((prev) => prev.map((_, i) => i === idx));
    const msgs = isWin ? RESULT_MSGS.win : RESULT_MSGS.lose;
    setResultMsg(msgs[Math.floor(Math.random() * msgs.length)]);
    setPhase("result");

    timerRef.current = setTimeout(() => {
      setOpenSlots([true, true, true]);
      setPhase("roundresult");
    }, 1200);
  }

  function handleNextRound() {
    clearAllTimers();
    if (round < TOTAL_ROUNDS) {
      const nr = round + 1;
      setRound(nr);
      startRound(nr);
    } else {
      setPhase("done");
    }
  }

  useEffect(() => () => clearAllTimers(), []);

  // 인트로
  if (phase === "intro") {
    return (
      <div className={styles.wrap}>
        <div className={styles.introBox}>
          <div className={styles.introTitle}>야바위 충신 고르기</div>
          <p className={styles.introDesc}>
            세 명 중 한 명만 충신입니다.<br />
            <b>1라운드</b> — 섞인 뒤 <b>삼단 자물쇠</b>를 가운데로 맞추면 선택.<br />
            <b>2라운드</b> — 자물쇠 없음. 컵이 <b>사방으로 난무</b>하다 멈추면 그 자리에서 선택.<br />
            <b>3라운드</b> — 컵이 <b>순식간에</b> 잠깐씩 열립니다. 눈이 따라가기엔 너무 빠릅니다…
            <span className={styles.introSub}>총 {TOTAL_ROUNDS}라운드 · 매판 규칙이 다릅니다</span>
          </p>
          <button className={styles.btn} onClick={() => startRound(1)}>시작!</button>
        </div>
      </div>
    );
  }

  // 완료
  if (phase === "done") {
    return (
      <div className={styles.wrap}>
        <div className={styles.introBox}>
          <div className={styles.introTitle}>결과</div>
          <p className={styles.resultSummary}>
            {TOTAL_ROUNDS}라운드 중 <b style={{ color: "#cc2200" }}>{wins}번</b> 충신을 찾았습니다.
          </p>
          <p className={styles.resultFlavor}>
            {wins === 3 && "완벽합니다! 당신의 안목은 타의 추종을 불허합니다."}
            {wins === 2 && "제법입니다. 충신이 두 명이나 있으니 든든하네요."}
            {wins === 1 && "음... 그나마 한 명은 있네요. 위험합니다."}
            {wins === 0 && "간신들만 남았습니다. 이제 망했습니다."}
          </p>
          <button className={styles.btn} onClick={() => onComplete(wins)}>
            다음 단계로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {/* 상단 정보 */}
      <div className={styles.header}>
        <span className={styles.roundBadge}>{round} / {TOTAL_ROUNDS} 라운드</span>
        <span className={styles.winsText}>충신 발견: {wins}명</span>
        <span className={styles.phaseHint}>
          {phase === "peek" && "순간 포착!"}
          {phase === "shuffle" && "섞는 중!!"}
          {phase === "puzzle" && round === 1 && "1단계: 삼단 자물쇠 → 가운데 정렬"}
          {phase === "chaos" && "2단계: 사방 난무! 멈추면 클릭"}
          {phase === "scan" && "3단계: 초고속 플래시!!"}
          {phase === "choose" && round === 1 && "자물쇠 해제! 충신을 고르세요"}
          {phase === "choose" && round === 2 && "멈춤! 지금 위치에서 충신을 고르세요"}
          {phase === "choose" && round === 3 && "직감으로 충신을 고르세요"}
          {(phase === "result" || phase === "roundresult") && (slots[chosenSlot] === "loyal" ? "충신!" : "간신!")}
        </span>
      </div>

      {phase === "puzzle" && round === 1 && (
        <div className={styles.puzzleGate}>
          <p className={styles.puzzleHint}>
            세 줄의 막대를 ◀▶로 움직여<br />
            <b>모두 가운데 칸</b>에 오면 선택이 열립니다.
          </p>
          {[0, 1, 2].map((rowIdx) => (
            <div key={rowIdx} className={styles.puzzleRow}>
              <span className={styles.puzzleTier}>{rowIdx + 1}단</span>
              <button
                type="button"
                className={styles.puzzleArrow}
                onClick={() => movePuzzleRow(rowIdx, -1)}
                disabled={puzzleRows[rowIdx] <= 0}
                aria-label={`${rowIdx + 1}단 왼쪽`}
              >
                ◀
              </button>
              <div className={styles.puzzleTrack}>
                {Array.from({ length: PUZZLE_SLOTS }, (_, i) => (
                  <div
                    key={i}
                    className={`${styles.puzzleCell} ${i === PUZZLE_CENTER ? styles.puzzleGoal : ""}`}
                  >
                    {puzzleRows[rowIdx] === i ? <span className={styles.puzzleBlock} /> : null}
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={styles.puzzleArrow}
                onClick={() => movePuzzleRow(rowIdx, 1)}
                disabled={puzzleRows[rowIdx] >= PUZZLE_SLOTS - 1}
                aria-label={`${rowIdx + 1}단 오른쪽`}
              >
                ▶
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 삼각형 컵 배치 */}
      <div
        className={`${styles.triangleWrap} ${phase === "puzzle" && round === 1 ? styles.triangleLocked : ""}`}
        style={{ width: CENTER_X * 2, height: CENTER_Y * 2 + 40 }}
      >
        {[0, 1, 2].map((idx) => {
          const pos = getCupPos(idx, spinDeg);
          const fx = phase === "chaos" ? cupFloat[idx].x : 0;
          const fy = phase === "chaos" ? cupFloat[idx].y : 0;
          return (
            <button
              key={idx}
              className={`${styles.cupBtn} ${chosenSlot === idx ? styles.chosen : ""} ${phase === "chaos" ? styles.cupChaos : ""}`}
              style={{ left: pos.x + fx, top: pos.y + fy, width: CUP_W }}
              onClick={() => handleChoose(idx)}
              disabled={phase !== "choose"}
            >
              <Cup
                isOpen={openSlots[idx]}
                content={openSlots[idx] ? slots[idx] : null}
                isHighlighted={false}
                size={84}
              />
              <div className={styles.slotLabel} />
            </button>
          );
        })}
      </div>

      {/* 결과 텍스트 */}
      {(phase === "result" || phase === "roundresult") && (
        <div className={`${styles.resultBox} ${slots[chosenSlot] === "loyal" ? styles.win : styles.lose}`}>
          <p>{resultMsg}</p>
        </div>
      )}

      {/* 다음 라운드 버튼 */}
      {phase === "roundresult" && (
        <button className={styles.btn} onClick={handleNextRound}>
          {round < TOTAL_ROUNDS ? `${round + 1}라운드 시작` : "결과 보기"}
        </button>
      )}
    </div>
  );
}
