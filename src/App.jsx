import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGameState } from "./hooks/useGameState";
import TitleScreen   from "./screens/TitleScreen";
import CreateScreen  from "./screens/CreateScreen";
import StageScreen   from "./screens/StageScreen";
import EndingScreen  from "./screens/EndingScreen";

function screenToPath(state) {
  if (state.screen === "create") return "/create";
  if (state.screen === "stage")  return `/stage/${state.stageIdx + 1}`;
  if (state.screen === "ending") return "/ending";
  return "/";
}

export default function App() {
  const navigate = useNavigate();
  const {
    state,
    goCreate, setName, startGame,
    choose, nextEvent,
    completeShellGame, completeSurgery, completeRunner,
    restart,
  } = useGameState();

  useEffect(() => {
    navigate(screenToPath(state), { replace: true });
  }, [state.screen, state.stageIdx]);

  switch (state.screen) {
    case "title":
      return <TitleScreen onStart={goCreate} />;
    case "create":
      return (
        <CreateScreen
          state={state}
          onSetName={setName}
          onConfirm={startGame}
        />
      );
    case "stage":
      return (
        <StageScreen
          state={state}
          onChoose={choose}
          onNextEvent={nextEvent}
          onCompleteShellGame={completeShellGame}
          onCompleteSurgery={completeSurgery}
          onCompleteRunner={completeRunner}
        />
      );
    case "ending":
      return <EndingScreen state={state} onRestart={restart} />;
    default:
      return null;
  }
}
