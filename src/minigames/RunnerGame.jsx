import { useState, useEffect, useRef, useCallback } from "react";
import { BadKing } from "../art/BadKing";
import styles from "./RunnerGame.module.css";

// ── 게임 상수
const GW       = 600;
const GROUND_Y = 196;   // 땅 표면 y (from top, px)
const KING_X   = 80;
const KING_W   = 50;    // sprite width
const KING_H   = 75;    // sprite height  (size=50 → 75)
const COL_X    = 8;     // 충돌박스 좌측 오프셋
const COL_W    = 34;    // 충돌박스 너비
const COL_H    = 68;    // 충돌박스 높이

// 왕 발 y = GROUND_Y = 196
// 왕 머리 y (on ground) = GROUND_Y - COL_H = 128
// ➜ 하늘 장애물 bottom 이 128 미만이면 땅에 서 있을 때 충돌 없음

const JUMP_V   = 12;
const GRAVITY  = 0.65;
const GOAL     = 220;

// ── 장애물 정의
//   sky:false  → 땅 위에 놓임   (oTop = GROUND_Y - h, oBottom = GROUND_Y)
//   sky:true   → 공중에 떠 있음 (oTop = skyTop,        oBottom = skyTop + h)
//
// 하늘 장애물 조건: skyTop + h  <  128  →  땅에서 맞지 않음
//                   kingY > 128 - (skyTop+h) 일 때 맞음
const OBS_GROUND = [
  { id: "min_bow",    label: "엎드린신하", sky: false, w: 52, h: 26, bg: "#003399", bd: "#001166" },
  { id: "min_stand",  label: "서있는신하", sky: false, w: 24, h: 66, bg: "#0055cc", bd: "#003388" },
  { id: "min_kneel",  label: "무릎신하",   sky: false, w: 32, h: 44, bg: "#224488", bd: "#112244" },
  { id: "min_two",    label: "신하둘",     sky: false, w: 56, h: 66, bg: "#1a3a77", bd: "#0d1e3d" },
];

const OBS_SKY = [
  // skyTop + h < 128 → 땅에 서 있을 때 충돌 없음
  { id: "bird_low",  label: "새", sky: true, w: 40, h: 20, skyTop: 100, bg: "#333333", bd: "#000000" },
  { id: "bird_mid",  label: "새", sky: true, w: 44, h: 22, skyTop: 76,  bg: "#444444", bd: "#111111" },
  { id: "bird_high", label: "새", sky: true, w: 38, h: 20, skyTop: 52,  bg: "#222222", bd: "#000000" },
  { id: "bird_flock",label: "새떼",sky: true, w: 72, h: 18, skyTop: 88,  bg: "#333333", bd: "#000000" },
];

let _id = 0;

export default function RunnerGame({ face, onComplete }) {
  const [phase, setPhase] = useState("idle");
  const [disp,  setDisp]  = useState({
    kingY: 0, isJumping: false,
    obstacles: [],
    lives: 3, score: 0,
    flashHit: false,
  });

  const gs = useRef({
    phase: "idle",
    kingY: 0, kingVY: 0, isJumping: false,
    obstacles: [],
    lives: 3, score: 0,
    speed: 7, frameCount: 0, nextSpawn: 80,
    animId: null, flashTimer: 0,
    lastWasSky: false,
  });

  // ── 점프
  const jump = useCallback(() => {
    const s = gs.current;
    if (s.phase !== "playing" || s.kingY > 2) return;
    s.kingVY = JUMP_V;
    s.isJumping = true;
  }, []);

  // ── 게임 시작/재시작
  function startGame() {
    const s = gs.current;
    Object.assign(s, {
      phase: "playing",
      kingY: 0, kingVY: 0, isJumping: false,
      obstacles: [], lives: 3, score: 0,
      speed: 7, frameCount: 0, nextSpawn: 80,
      flashTimer: 0, lastWasSky: false,
    });
    setPhase("playing");
    setDisp({ kingY: 0, isJumping: false, obstacles: [], lives: 3, score: 0, flashHit: false });
  }

  // ── 게임 루프
  useEffect(() => {
    if (phase !== "playing") return;
    const s = gs.current;

    function tick() {
      if (s.phase !== "playing") return;

      s.frameCount++;
      s.score = Math.floor(s.frameCount / 5);
      s.speed = 7 + s.frameCount * 0.004;
      if (s.flashTimer > 0) s.flashTimer--;

      // ── 물리
      s.kingVY -= GRAVITY;
      s.kingY  += s.kingVY;
      if (s.kingY <= 0) { s.kingY = 0; s.kingVY = 0; s.isJumping = false; }

      // ── 장애물 생성
      s.nextSpawn--;
      if (s.nextSpawn <= 0) {
        // 직전이 하늘 장애물이면 반드시 땅 장애물을 냄 (불가능 콤보 방지)
        let type;
        if (s.lastWasSky) {
          type = OBS_GROUND[Math.floor(Math.random() * OBS_GROUND.length)];
        } else {
          const wantSky = Math.random() < 0.38;
          const pool = wantSky ? OBS_SKY : OBS_GROUND;
          type = pool[Math.floor(Math.random() * pool.length)];
        }
        s.obstacles.push({ id: _id++, x: GW + 20, type });
        s.lastWasSky = type.sky;

        const interval = Math.max(55, 95 - Math.floor(s.frameCount * 0.04));
        s.nextSpawn = interval + Math.floor(Math.random() * 35);
      }

      // ── 이동 + 제거
      for (const o of s.obstacles) o.x -= s.speed;
      s.obstacles = s.obstacles.filter(o => o.x + o.type.w > -20);

      // ── 충돌 감지
      const kL = KING_X + COL_X + 4;
      const kR = KING_X + COL_X + COL_W - 4;
      const kB = GROUND_Y - s.kingY;
      const kT = kB - COL_H;

      let gotHit = false;
      if (s.flashTimer === 0) {
        s.obstacles = s.obstacles.filter(o => {
          if (gotHit) return true;
          const oL = o.x + 4;
          const oR = o.x + o.type.w - 4;
          // 하늘 vs 땅 장애물에 따라 oTop/oBottom 다르게 계산
          const oT = o.type.sky ? o.type.skyTop          : GROUND_Y - o.type.h;
          const oB = o.type.sky ? o.type.skyTop + o.type.h : GROUND_Y;
          const hit = kR > oL && kL < oR && kB > oT && kT < oB;
          if (hit) { gotHit = true; return false; }
          return true;
        });
      }

      if (gotHit) {
        s.lives--;
        s.flashTimer = 60;
        if (s.lives <= 0) {
          s.phase = "dead";
          setPhase("dead");
          sync();
          return;
        }
      }

      if (s.score >= GOAL) {
        s.phase = "cleared";
        setPhase("cleared");
        sync();
        return;
      }

      sync();
      s.animId = requestAnimationFrame(tick);
    }

    function sync() {
      const s = gs.current;
      setDisp({
        kingY:     s.kingY,
        isJumping: s.isJumping,
        obstacles: s.obstacles.map(o => ({ ...o })),
        lives:     s.lives,
        score:     s.score,
        flashHit:  s.flashTimer > 0,
      });
    }

    s.animId = requestAnimationFrame(tick);
    return () => { if (s.animId) cancelAnimationFrame(s.animId); };
  }, [phase]);

  // ── 키보드
  useEffect(() => {
    const onKey = e => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); jump(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump]);

  function calcBonus() {
    const lives = gs.current.lives;
    if (phase === "cleared") return Math.min(5, 1 + lives * 2);
    return Math.max(0, lives - 1);
  }

  const kingTop = GROUND_Y - KING_H - disp.kingY;
  const kingProps = {
    eyeStyle:   face?.eyes  ?? "normal",
    noseStyle:  face?.nose  ?? "normal",
    mouthStyle: disp.isJumping ? "open" : (face?.mouth ?? "angry"),
    size: KING_W,
  };

  return (
    <div className={styles.wrap}>
      {/* ── HUD */}
      <div className={styles.hud}>
        <div className={styles.lives}>
          {[0,1,2].map(i => (
            <span key={i} className={i < disp.lives ? styles.lifeOn : styles.lifeOff}>♛</span>
          ))}
        </div>
        <div className={styles.progressWrap}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${Math.min(100, (disp.score / GOAL) * 100)}%` }} />
          </div>
          <span className={styles.progressLabel}>🏹 {disp.score} / {GOAL}</span>
        </div>
      </div>

      {/* ── 게임 영역 */}
      <div className={styles.gameArea} onClick={jump}>

        {/* 구름 */}
        <div className={`${styles.cloud} ${styles.cloud1}`} />
        <div className={`${styles.cloud} ${styles.cloud2}`} />
        <div className={`${styles.cloud} ${styles.cloud3}`} />

        {/* 땅 */}
        <div className={styles.groundStrip} />

        {/* 하늘 장애물 지면 그림자 (먼저 렌더, 왕 뒤에) */}
        {disp.obstacles.filter(o => o.type.sky).map(o => (
          <div
            key={`sh-${o.id}`}
            className={styles.skyShadow}
            style={{ left: `${o.x + o.type.w / 2 - 18}px` }}
          />
        ))}

        {/* 왕 */}
        <div
          className={[
            styles.king,
            phase === "playing" && !disp.isJumping ? styles.kingRun : "",
            disp.flashHit ? styles.kingFlash : "",
          ].join(" ")}
          style={{ left: `${KING_X}px`, top: `${kingTop}px` }}
        >
          <BadKing {...kingProps} />
        </div>

        {/* 장애물 */}
        {disp.obstacles.map(o => {
          const topPx = o.type.sky
            ? o.type.skyTop
            : GROUND_Y - o.type.h;
          return (
            <div
              key={o.id}
              className={`${styles.obstacle} ${o.type.sky ? styles.obsFlying : styles.obsGround}`}
              style={{
                left:        `${o.x}px`,
                top:         `${topPx}px`,
                width:       `${o.type.w}px`,
                height:      `${o.type.h}px`,
                background:  o.type.sky ? "transparent" : o.type.bg,
                borderColor: o.type.sky ? "transparent"  : o.type.bd,
              }}
            >
              {o.type.sky && <div className={styles.birdBody} />}
              {o.type.sky && <span className={styles.flyIndicator}>↓ 숙여!</span>}
            </div>
          );
        })}

        {/* ── 오버레이 */}
        {phase === "idle" && (
          <div className={styles.overlay}>
            <div className={styles.olTitle}>왕의 사냥길!</div>
            <p className={styles.olDesc}>{"돌 → 점프!\n새 → 점프 금지! (그냥 달려)"}</p>
            <p className={styles.olHint}>스페이스 · 위방향키 · 클릭 = 점프</p>
            <button className={styles.btnStart} onClick={e => { e.stopPropagation(); startGame(); }}>
              출발! ▶
            </button>
          </div>
        )}

        {phase === "dead" && (
          <div className={styles.overlay}>
            <div className={styles.olTitle}>왕이 쓰러졌다!</div>
            <p className={styles.olDesc}>{`점수: ${disp.score} / ${GOAL}`}</p>
            <div className={styles.olBtns}>
              <button className={styles.btnStart} onClick={e => { e.stopPropagation(); startGame(); }}>
                다시 도전!
              </button>
              <button className={styles.btnNext} onClick={e => { e.stopPropagation(); onComplete(calcBonus()); }}>
                그냥 진행 ▶
              </button>
            </div>
          </div>
        )}

        {phase === "cleared" && (
          <div className={styles.overlay}>
            <div className={styles.olTitle}>사냥 성공!</div>
            <p className={styles.olDesc}>{`목숨 ${disp.lives}개 남음 · 점수 ${disp.score}`}</p>
            <button className={styles.btnNext} onClick={e => { e.stopPropagation(); onComplete(calcBonus()); }}>
              다음 단계로 ▶
            </button>
          </div>
        )}
      </div>

      <p className={styles.hint}>
        돌 → 점프 &nbsp;|&nbsp; 새(↓ 숙여!) → 점프 금지
      </p>
    </div>
  );
}
