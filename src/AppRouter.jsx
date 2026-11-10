import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CharacterPage from "./pages/CharacterPage";
import GradePage from "./pages/GradePage";
import TopicsPage from "./pages/TopicsPage";
import StageMapPage from "./pages/StageMapPage";
import PlayPage from "./pages/PlayPage";
import SummaryPage from "./pages/SummaryPage";
import Placeholder from "./pages/Placeholder";
import IslandPage from "./pages/IslandPage";
import GameLevelsPage from "./pages/GameLevelsPage";
import GamePlayPage from "./pages/GamePlayPage";
import DailyPage from "./pages/DailyPage";
import TimedPage from "./pages/TimedPage";
import ReviewPage from "./pages/ReviewPage";

// All routes for עולם החשבון. Real pages replace the Placeholders milestone by milestone.
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/character" element={<CharacterPage />} />
      <Route path="/grade" element={<GradePage />} />
      <Route path="/topics" element={<TopicsPage />} />
      <Route path="/map/:topic" element={<StageMapPage />} />
      <Route path="/play/:topic/:stage" element={<PlayPage />} />
      <Route path="/summary/:topic/:stage" element={<SummaryPage />} />
      <Route path="/island" element={<IslandPage />} />
      <Route path="/island/:game" element={<GameLevelsPage />} />
      <Route path="/island/:game/:level" element={<GamePlayPage />} />
      <Route path="/review" element={<ReviewPage />} />
      <Route path="/rewards" element={<Placeholder title="פרסים והישגים" />} />
      <Route path="/daily" element={<DailyPage />} />
      <Route path="/timed" element={<TimedPage />} />
      <Route path="/parent" element={<Placeholder title="להורים ולמורים" />} />
      <Route path="/settings" element={<Placeholder title="הגדרות" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
