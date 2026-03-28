import { useState, useEffect, useRef, useCallback } from "react";
import { BadKing } from "../art/BadKing";
import styles from "./PalaceGame.module.css";

const GW      = 600;
const GH      = 340;
const KING_R  = 16;   // 충돌 반지름
const GATE_X  = 552;  // 궁문 x (이 선 넘으면 클리어)
const GATE_Y1 = 95;   // 궁문 열린 구간 위
const GATE_Y2 = 245;  // 궁문 열린 구간 아래

// 장애물 초기 상태
const INIT_OBS = [
  { id:1, x:210, y:70,  vx:0,    vy: 3.0, r:26, label:"순찰병", bg:"#cc2200", bd:"#880000" },
  { id:2, x:350, y:270, vx:0,    vy:-2.7, r:26, label:"순찰병", bg:"#cc2200", bd:"#880000" },
  { id:3, x:460, y:140, vx:0,    vy: 2.9, r:24, label:"간신",   bg:"#550088", bd:"#330055" },
  { id:4, x:160, y:170, vx: 2.4, vy:0,    r:22, label:"화살",   bg:"#884400", bd:"#552200" },
  { id:5, x:395, y:90,  vx:-3.1, vy:0,    r:22, label:"화살",   bg:"#884400", bd:"#552200" },
  { id:6, x:280, y:220, vx: 2.0, vy:1.8,  r:24, label:"순찰병", bg:"#004499", bd:"#002266" },
];
function freshObs() { return INIT_OBS.map(o => ({ ...o })); }

export default function PalaceGame({ face, onComplete }) {
  const [phase,      setPhase]      = useState("idle");
  const [kingPos,    setKingPos]    = useState({ x: 80, y: GH / 2 });
  const [obsDisp,    setObsDisp]    = useState(freshObs());
  const [lives,      setLives]      = useState(3);
  const [flashing,   setFlashing]   = useState(false);

  const gs          = useRef(null);
  const gameAreaRef = useRef(null);

  function initGs() {
    return {
      phase:       "playing",
      king:        { x: 80, y: GH / 2 },
      target:      { x: 80, y: GH / 2 },
      obs:         freshObs(),
      lives:       3,
      flashTimer:  0,
      animId:      null,
    };
  }

  function startGame() {
    gs.current = initGs();
    setPhase("playing");
    setKingPos({ x: 80, y: GH / 2 });
    setObsDisp(freshObs());
    setLives(3);
    setFlashing(false);
  }

  // ── 게임 루프
  useEffect(() => {
    if (phase !== "playing") return;
    const s = gs.current;
    s.phase = "playing";

    function tick() {
      if (s.phase !== "playing") return;

      if (s.flashTimer > 0) s.flashTimer--;

      // 왕 → 마우스 부드럽게 추적
      s.king.x += (s.target.x - s.king.x) * 0.2;
      s.king.y += (s.target.y - s.king.y) * 0.2;
      s.king.x = Math.max(20, Math.min(GW - 20, s.king.x));
      s.king.y = Math.max(20, Math.min(GH - 20, s.king.y));

      // 장애물 이동 + 반사
      for (const o of s.obs) {
        o.x += o.vx;
        o.y += o.vy;
        if (o.x - o.r < 108)          { o.x = 108 + o.r;       o.vx =  Math.abs(o.vx); }
        if (o.x + o.r > GATE_X - 20)  { o.x = GATE_X - 20 - o.r; o.vx = -Math.abs(o.vx); }
        if (o.y - o.r < 18)            { o.y = 18 + o.r;        o.vy =  Math.abs(o.vy); }
        if (o.y + o.r > GH - 18)       { o.y = GH - 18 - o.r;  o.vy = -Math.abs(o.vy); }
      }

      // 충돌 감지
      if (s.flashTimer === 0) {
        for (const o of s.obs) {
          const dx   = s.king.x - o.x;
          const dy   = s.king.y - o.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < KING_R + o.r - 5) {
            s.lives--;
            s.flashTimer = 90;
            // 시작 지점으로 리스폰
            s.king  = { x: 80, y: GH / 2 };
            s.target = { x: 80, y: GH / 2 };
            if (s.lives <= 0) {
              s.phase = "gameover";
              setPhase("gameover");
              sync();
              return;
            }
            setLives(s.lives);
            break;
          }
        }
      }

      // 궁문 도착 판정
      if (
        s.king.x + KING_R >= GATE_X &&
        s.king.y >= GATE_Y1 &&
        s.king.y <= GATE_Y2
      ) {
        s.phase = "cleared";
        setPhase("cleared");
        sync();
        return;
      }

      sync();
      s.animId = requestAnimationFrame(tick);
    }

    function sync() {
      setKingPos({ x: s.king.x, y: s.king.y });
      setObsDisp(s.obs.map(o => ({ ...o })));
      setFlashing(s.flashTimer > 0);
      setLives(s.lives);
    }

    s.animId = requestAnimationFrame(tick);
    return () => { if (s.animId) cancelAnimationFrame(s.animId); };
  }, [phase]);

  // ── 마우스 추적
  const onMouseMove = useCallback(e => {
    if (!gs.current || gs.current.phase !== "playing") return;
    const rect = gameAreaRef.current?.getBoundingClientRect();
    if (!rect) return;
    gs.current.target.x = e.clientX - rect.left;
    gs.current.target.y = e.clientY - rect.top;
  }, []);

  // ── 터치 추적
  const onTouchMove = useCallback(e => {
    e.preventDefault();
    if (!gs.current || gs.current.phase !== "playing") return;
    const rect = gameAreaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const t = e.touches[0];
    gs.current.target.x = t.clientX - rect.left;
    gs.current.target.y = t.clientY - rect.top;
  }, []);

  function calcBonus() {
    const l = gs.current?.lives ?? 0;
    return phase === "cleared" ? Math.min(5, 1 + l * 2) : 0;
  }

  const kingProps = {
    eyeStyle:   face?.eyes  ?? "normal",
    noseStyle:  face?.nose  ?? "normal",
    mouthStyle: face?.mouth ?? "angry",
    size: 44,
  };

  return (
    <div className={styles.wrap}>

      {/* HUD */}
      <div className={styles.hud}>
        <div className={styles.lives}>
          {[0,1,2].map(i => (
            <span key={i} className={i < lives ? styles.lifeOn : styles.lifeOff}>♛</span>
          ))}
        </div>
        <div className={styles.hudDesc}>마우스로 왕을 이동 → 궁문 도착!</div>
      </div>

      {/* 게임 영역 */}
      <div
        ref={gameAreaRef}
        className={styles.gameArea}
        onMouseMove={onMouseMove}
        onTouchMove={onTouchMove}
        style={{ cursor: phase === "playing" ? "none" : "default" }}
      >
        {/* 타일 바닥 */}
        <div className={styles.floor} />

        {/* 좌측 시작 구역 */}
        <div className={styles.startZone}>출발</div>

        {/* 우측 궁문 */}
        {/* 벽 위쪽 */}
        <div className={styles.wallTop} />
        {/* 문 열린 구간 */}
        <div className={styles.gateOpen}>
          <span className={styles.gateLabel}>궁문</span>
        </div>
        {/* 벽 아래쪽 */}
        <div className={styles.wallBot} />

        {/* 장애물 */}
        {obsDisp.map(o => (
          <div
            key={o.id}
            className={styles.obstacle}
            style={{
              left:        o.x - o.r,
              top:         o.y - o.r,
              width:       o.r * 2,
              height:      o.r * 2,
              background:  o.bg,
              borderColor: o.bd,
            }}
          >
            <span className={styles.obsLabel}>{o.label}</span>
          </div>
        ))}

        {/* 왕 */}
        {phase !== "idle" && (
          <div
            className={`${styles.king} ${flashing ? styles.kingFlash : ""}`}
            style={{ left: kingPos.x - 22, top: kingPos.y - 37 }}
          >
            <BadKing {...kingProps} />
          </div>
        )}

        {/* 오버레이 */}
        {phase === "idle" && (
          <div className={styles.overlay}>
            <div className={styles.olTitle}>궁문 탈출!</div>
            <p className={styles.olDesc}>{"마우스로 왕을 이동해\n장애물을 피해 오른쪽 궁문까지!"}</p>
            <p className={styles.olHint}>마우스 이동 = 왕 이동</p>
            <button className={styles.btnStart} onClick={startGame}>출발! ▶</button>
          </div>
        )}

        {phase === "gameover" && (
          <div className={styles.overlay}>
            <div className={styles.olTitle}>왕이 붙잡혔다!</div>
            <div className={styles.olBtns}>
              <button className={styles.btnStart} onClick={startGame}>다시 도전!</button>
              <button className={styles.btnNext} onClick={() => onComplete(0)}>포기하고 진행 ▶</button>
            </div>
          </div>
        )}

        {phase === "cleared" && (
          <div className={styles.overlay}>
            <div className={styles.olTitle}>궁문 도착!</div>
            <p className={styles.olDesc}>{`목숨 ${lives}개 남음`}</p>
            <button className={styles.btnNext} onClick={() => onComplete(calcBonus())}>
              다음 단계로 ▶
            </button>
          </div>
        )}
      </div>

      <p className={styles.hint}>마우스를 움직여 왕을 이동 — 장애물에 닿으면 처음부터!</p>
    </div>
  );
}
