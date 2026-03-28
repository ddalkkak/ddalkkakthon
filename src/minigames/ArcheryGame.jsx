import { useState, useEffect, useRef, useCallback } from "react";
import { BadKing } from "../art/BadKing";
import styles from "./ArcheryGame.module.css";

const GH        = 300;
const AIM_Y     = GH / 2;      // 150
const TARGET_CX = 480;
const ARROW_X0  = 130;
const TOTAL_ROUNDS = 3;

const ZONES = [
  { r: 18,       pts: 5, label: "정중앙!!",   color: "#ffcc00" },
  { r: 40,       pts: 3, label: "잘 맞혔다!", color: "#ff6600" },
  { r: 68,       pts: 1, label: "맞긴 했다.", color: "#44aaff" },
  { r: Infinity, pts: 0, label: "빗나갔다!",  color: "#888888" },
];

const ROUND_CFG = [
  { speed: 1.8, chaos: 0    },
  { speed: 3.4, chaos: 0.18 },
  { speed: 5.8, chaos: 0.45 },
];

// 웨이브 화살 설정
const WAVE_AMP    = 40;   // 진폭 px
const WAVE_CYCLES = 3;    // 왕복 횟수 (정수 → 항상 AIM_Y로 복귀)

export default function ArcheryGame({ face, onComplete }) {
  const [phase,   setPhase]   = useState("idle");
  const [round,   setRound]   = useState(0);
  const [targetY, setTargetY] = useState(AIM_Y);
  const [arrowX,  setArrowX]  = useState(ARROW_X0);
  const [arrowY,  setArrowY]  = useState(AIM_Y);    // 웨이브 지원
  const [shotY,   setShotY]   = useState(null);
  const [hits,    setHits]    = useState([]);
  const [lastHit, setLastHit] = useState(null);

  const tRef        = useRef({ y: AIM_Y, vy: 2, animId: null, chaosTimer: 0 });
  const phaseRef    = useRef(phase);
  phaseRef.current  = phase;
  const roundRef    = useRef(round);
  roundRef.current  = round;
  // 3발 중 하나를 랜덤으로 웨이브 발로 지정 (마운트 시 한 번만 결정)
  const waveRound   = useRef(Math.floor(Math.random() * TOTAL_ROUNDS));

  // ── 과녁 이동 루프
  useEffect(() => {
    if (phase !== "aiming") return;
    const cfg = ROUND_CFG[round];
    const t   = tRef.current;
    t.vy = cfg.speed * (t.vy >= 0 ? 1 : -1);

    function tick() {
      t.chaosTimer--;
      if (t.chaosTimer <= 0) {
        t.chaosTimer = 30 + Math.floor(Math.random() * 40);
        if (cfg.chaos > 0) {
          t.vy += (Math.random() - 0.5) * cfg.chaos * 10;
          const cap = cfg.speed * 1.6;
          if (Math.abs(t.vy) > cap) t.vy = Math.sign(t.vy) * cap;
          if (Math.abs(t.vy) < cfg.speed * 0.4) t.vy = Math.sign(t.vy) * cfg.speed * 0.4;
        }
      }
      t.y += t.vy;
      if (t.y <= 45)      { t.y = 45;      t.vy =  Math.abs(t.vy); }
      if (t.y >= GH - 45) { t.y = GH - 45; t.vy = -Math.abs(t.vy); }
      setTargetY(t.y);
      t.animId = requestAnimationFrame(tick);
    }

    t.animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(t.animId);
  }, [phase, round]);

  // ── 발사
  const shoot = useCallback(() => {
    if (phaseRef.current !== "aiming") return;

    const ty          = tRef.current.y;
    const curRound    = roundRef.current;
    const isWave      = curRound === waveRound.current;
    const totalDist   = TARGET_CX - ARROW_X0;

    setShotY(ty);
    setArrowX(ARROW_X0);
    setArrowY(AIM_Y);
    setPhase("shooting");

    let x = ARROW_X0;
    function flyArrow() {
      x += 22;
      const cx       = Math.min(x, TARGET_CX);
      const progress = (cx - ARROW_X0) / totalDist;
      const wy       = isWave
        ? AIM_Y + WAVE_AMP * Math.sin(2 * Math.PI * WAVE_CYCLES * progress)
        : AIM_Y;

      setArrowX(cx);
      setArrowY(wy);

      if (x < TARGET_CX - 10) {
        requestAnimationFrame(flyArrow);
      } else {
        // 웨이브도 정수 사이클 → 마지막엔 AIM_Y로 복귀
        setArrowX(TARGET_CX);
        setArrowY(AIM_Y);
        const dy   = Math.abs(ty - AIM_Y);
        const zone = ZONES.find(z => dy <= z.r);
        const hit  = { pts: zone.pts, label: zone.label, color: zone.color, dy, ty };
        setHits(prev => [...prev, hit]);
        setLastHit(hit);
        setPhase("result");
      }
    }
    requestAnimationFrame(flyArrow);
  }, []);

  // ── 키보드
  useEffect(() => {
    const onKey = e => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); shoot(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shoot]);

  function startRound(r) {
    tRef.current.chaosTimer = 0;
    tRef.current.y = AIM_Y + (Math.random() > 0.5 ? 60 : -60);
    setShotY(null);
    setArrowX(ARROW_X0);
    setArrowY(AIM_Y);
    setLastHit(null);
    setRound(r);
    setPhase("aiming");
  }

  function nextRound() {
    const nextR = round + 1;
    if (nextR >= TOTAL_ROUNDS) setPhase("done");
    else startRound(nextR);
  }

  const totalPts = hits.reduce((s, h) => s + h.pts, 0);

  const kingProps = {
    eyeStyle:   face?.eyes  ?? "normal",
    noseStyle:  face?.nose  ?? "normal",
    mouthStyle: phase === "shooting" ? "open" : (face?.mouth ?? "angry"),
    size: 52,
  };

  const TR = 68;

  return (
    <div className={styles.wrap}>

      {/* ── 점수판 */}
      <div className={styles.scoreboard}>
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
          const h = hits[i];
          const isWaveRound = i === waveRound.current;
          return (
            <div
              key={i}
              className={`${styles.roundCell} ${round === i && phase !== "idle" && phase !== "done" ? styles.roundActive : ""}`}
            >
              <span className={styles.roundLabel}>
                {i + 1}발 {isWaveRound && <span className={styles.waveMark}>〜</span>}
              </span>
              {h
                ? <span className={styles.roundPts} style={{ color: h.color }}>{h.pts}pt</span>
                : <span className={styles.roundEmpty}>—</span>
              }
            </div>
          );
        })}
        <div className={styles.totalCell}>합계 <strong>{totalPts}</strong>pt</div>
      </div>

      {/* ── 게임 영역 */}
      <div className={styles.gameArea} onClick={shoot}>

        {/* 조준선 */}
        <div className={styles.aimLine} />
        <span className={styles.aimTag}>조준선</span>

        {/* 웨이브 라운드 경고 */}
        {phase === "aiming" && round === waveRound.current && (
          <div className={styles.waveWarning}>〜 구불구불 화살 〜</div>
        )}

        {/* 왕 */}
        <div className={styles.king} style={{ top: AIM_Y - 39 }}>
          <BadKing {...kingProps} />
        </div>

        {/* 화살 (웨이브 포함) */}
        {(phase === "shooting" || phase === "result") && (
          <div
            className={`${styles.arrow} ${round === waveRound.current ? styles.arrowWave : ""} ${phase === "shooting" ? styles.arrowFlying : ""}`}
            style={{ left: arrowX, top: arrowY - 3 }}
          />
        )}

        {/* 과녁 */}
        <div className={styles.target} style={{ left: TARGET_CX - TR, top: targetY - TR }}>
          <svg width={TR * 2} height={TR * 2} viewBox={`${-TR} ${-TR} ${TR * 2} ${TR * 2}`}
            style={{ display: "block" }}>
            <circle r={TR}     fill="#ffffff" stroke="#000" strokeWidth="2" />
            <circle r={TR - 4} fill="#4488cc" stroke="#000" strokeWidth="1.5" />
            <circle r={40}     fill="#cc2200" stroke="#000" strokeWidth="1.5" />
            <circle r={18}     fill="#ffcc00" stroke="#000" strokeWidth="1.5" />
            <circle r={4}      fill="#000000" />
            <line x1={-TR} y1={0} x2={TR} y2={0} stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
            <line x1={0} y1={-TR} x2={0} y2={TR} stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
          </svg>
        </div>

        {/* 명중 마커 */}
        {phase === "result" && shotY !== null && (
          <div className={styles.hitMarker} style={{ left: TARGET_CX - 6, top: AIM_Y - 6 }} />
        )}

        {/* 결과 팝업 */}
        {phase === "result" && lastHit && (
          <div className={styles.resultPopup} style={{ color: lastHit.color }}>
            {lastHit.label}
            {lastHit.pts > 0 && <span className={styles.popupPts}> +{lastHit.pts}pt</span>}
          </div>
        )}

        {/* 오버레이 */}
        {phase === "idle" && (
          <div className={styles.overlay}>
            <div className={styles.olTitle}>왕의 활쏘기!</div>
            <p className={styles.olDesc}>{"조준선에 과녁 중앙이 오는 순간 발사!\n총 3발, 라운드마다 과녁이 빨라진다.\n〜 표시 발은 화살이 구불구불 날아간다."}</p>
            <p className={styles.olHint}>스페이스 · 클릭 = 발사</p>
            <button className={styles.btnStart}
              onClick={e => { e.stopPropagation(); startRound(0); }}>
              활 시위 당기기 ▶
            </button>
          </div>
        )}

        {phase === "result" && (
          <div className={styles.nextBar}>
            <button className={styles.btnNext}
              onClick={e => { e.stopPropagation(); nextRound(); }}>
              {round + 1 < TOTAL_ROUNDS ? `${round + 2}번째 발 ▶` : "결과 보기 ▶"}
            </button>
          </div>
        )}

        {phase === "done" && (
          <div className={styles.overlay}>
            <div className={styles.olTitle}>활쏘기 완료!</div>
            <div className={styles.hitList}>
              {hits.map((h, i) => (
                <div key={i} className={styles.hitRow} style={{ color: h.color }}>
                  {i + 1}발{i === waveRound.current ? "〜" : ""}: {h.label} &nbsp;<strong>{h.pts}pt</strong>
                </div>
              ))}
            </div>
            <p className={styles.olDesc}>합계 {totalPts}pt / {TOTAL_ROUNDS * 5}pt</p>
            <button className={styles.btnFinish}
              onClick={e => { e.stopPropagation(); onComplete(Math.min(5, Math.round(totalPts / 3))); }}>
              다음 단계로 ▶
            </button>
          </div>
        )}
      </div>

      <p className={styles.hint}>과녁 중앙이 조준선에 오면 스페이스 또는 클릭!</p>
    </div>
  );
}
