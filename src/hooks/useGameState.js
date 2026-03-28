import { useReducer } from "react";
import { STAGES, ENDINGS } from "../data/gameData";

const initialState = {
  screen: "title",
  name: "",
  face: { eyes: null, nose: null, mouth: null },
  score: 0,       // 숨겨진 점수
  shellWins: 0,
  stageIdx: 0,
  eventIdx: 0,
  lastChoiceResult: null,
  pendingEventIdx: null,
  ending: null,
};

function goNextStage(state) {
  const nextIdx = state.stageIdx + 1;
  if (nextIdx < STAGES.length) {
    return { ...state, stageIdx: nextIdx, eventIdx: 0, lastChoiceResult: null, pendingEventIdx: null };
  }
  const ending = ENDINGS.find((e) => e.condition(state.score, state.shellWins));
  return { ...state, screen: "ending", ending };
}

function reducer(state, action) {
  switch (action.type) {

    case "GO_CREATE":
      return { ...initialState, screen: "create" };

    case "SET_NAME":
      return { ...state, name: action.payload };

    case "START_GAME":
      return { ...state, screen: "stage", stageIdx: 0, eventIdx: 0 };

    // 야바위 완료
    case "COMPLETE_SHELLGAME":
      return goNextStage({ ...state, shellWins: action.payload });

    // 성형 완료
    case "COMPLETE_SURGERY":
      return goNextStage({ ...state, face: action.payload });

    // 사냥 완료
    case "COMPLETE_RUNNER":
      return goNextStage({ ...state, score: state.score + (action.payload ?? 0) });

    // 활쏘기 완료
    case "COMPLETE_ARCHERY":
      return goNextStage({ ...state, score: state.score + (action.payload ?? 0) });

    // 궁문 탈출 완료
    case "COMPLETE_PALACE":
      return goNextStage({ ...state, score: state.score + (action.payload ?? 0) });

    // 선택지 선택
    case "CHOOSE": {
      const stage = STAGES[state.stageIdx];
      const choice = stage.events[state.eventIdx].choices[action.payload];
      const newScore = state.score + (choice.score ?? 0);

      if (choice.result) {
        return {
          ...state,
          score: newScore,
          lastChoiceResult: choice.result,
          pendingEventIdx: state.eventIdx + 1,
        };
      }

      const nextEventIdx = state.eventIdx + 1;
      if (nextEventIdx < stage.events.length) {
        return { ...state, score: newScore, eventIdx: nextEventIdx };
      }
      return goNextStage({ ...state, score: newScore });
    }

    // 결과 확인 후 다음으로
    case "NEXT_EVENT": {
      const stage = STAGES[state.stageIdx];
      const nextEventIdx = state.pendingEventIdx;
      if (nextEventIdx < stage.events.length) {
        return { ...state, eventIdx: nextEventIdx, lastChoiceResult: null, pendingEventIdx: null };
      }
      return goNextStage({ ...state, lastChoiceResult: null, pendingEventIdx: null });
    }

    case "RESTART":
      return { ...initialState };

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(reducer, initialState);
  return {
    state,
    goCreate:          ()        => dispatch({ type: "GO_CREATE" }),
    setName:           (v)       => dispatch({ type: "SET_NAME", payload: v }),
    startGame:         ()        => dispatch({ type: "START_GAME" }),
    choose:            (i)       => dispatch({ type: "CHOOSE", payload: i }),
    nextEvent:         ()        => dispatch({ type: "NEXT_EVENT" }),
    completeShellGame: (wins)    => dispatch({ type: "COMPLETE_SHELLGAME", payload: wins }),
    completeSurgery:   (face)    => dispatch({ type: "COMPLETE_SURGERY", payload: face }),
    completeRunner:    (bonus)   => dispatch({ type: "COMPLETE_RUNNER",   payload: bonus }),
    completeArchery:   (bonus)   => dispatch({ type: "COMPLETE_ARCHERY",  payload: bonus }),
    completePalace:    (bonus)   => dispatch({ type: "COMPLETE_PALACE",   payload: bonus }),
    restart:           ()        => dispatch({ type: "RESTART" }),
  };
}
