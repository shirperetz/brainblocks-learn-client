import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import CharacterPage from "./pages/CharacterPage";
import GradePage from "./pages/GradePage";
import TopicsPage from "./pages/TopicsPage";
import StageMapPage from "./pages/StageMapPage";
import SeaPage from "./pages/SeaPage";
import PlayPage from "./pages/PlayPage";
import SummaryPage from "./pages/SummaryPage";
import IslandPage from "./pages/IslandPage";
import GameLevelsPage from "./pages/GameLevelsPage";
import GamePlayPage from "./pages/GamePlayPage";
import GenIslePage from "./pages/GenIslePage";
import DailyPage from "./pages/DailyPage";
import TimedPage from "./pages/TimedPage";
import ReviewPage from "./pages/ReviewPage";
import StaffPage from "./pages/StaffPage";
import SettingsPage from "./pages/SettingsPage";
import MyIslandPage from "./pages/MyIslandPage";
// 2026-11-13: the 3D island loads three.js only on its own page
const Island3DPage = lazy(() => import("./pages/Island3DPage"));
import ChildReportPage from "./pages/ChildReportPage";
import ParentsPage from "./pages/ParentsPage";
import StaffRoomNewPage from "./pages/StaffRoomNewPage";
import StaffRoomPage from "./pages/StaffRoomPage";
import RoomBoardPage from "./pages/RoomBoardPage";
import RoomJoinPage from "./pages/RoomJoinPage";
import RoomPlayPage from "./pages/RoomPlayPage";
import WhoPage from "./pages/WhoPage";
import TeacherSignupPage from "./pages/TeacherSignupPage";

// All routes for עולם החשבון. Real pages replace the Placeholders milestone by milestone.
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/character" element={<CharacterPage />} />
      <Route path="/grade" element={<GradePage />} />
      <Route path="/topics" element={<TopicsPage />} />
      <Route path="/map/:topic" element={<StageMapPage />} />
      <Route path="/play/:topic/:stage" element={<PlayPage />} />
      <Route path="/summary/:topic/:stage" element={<SummaryPage />} />
      <Route path="/island" element={<SeaPage />} />
      <Route path="/isle/:isle" element={<IslandPage />} />
      <Route path="/island/:game" element={<GameLevelsPage />} />
      <Route path="/island/:game/:level" element={<GamePlayPage />} />
      {/* 2026-11-13: generated islands (gen-N): the same games at a higher tier */}
      <Route path="/sea/:isleKey" element={<GenIslePage />} />
      <Route path="/sea/:isleKey/q/:topic/:stage" element={<PlayPage />} />
      <Route path="/sea/:isleKey/:game/:level" element={<GamePlayPage />} />
      <Route path="/review" element={<ReviewPage />} />
      <Route path="/rewards" element={<Navigate to="/my-island" replace />} />
      <Route path="/my-island" element={<Suspense fallback={null}><Island3DPage /></Suspense>} />
      <Route path="/staff/child/:id/island" element={<MyIslandPage />} />
      <Route path="/daily" element={<DailyPage />} />
      <Route path="/timed" element={<TimedPage />} />
      <Route path="/parent" element={<ParentsPage />} />
      <Route path="/staff" element={<StaffPage />} />
      {/* 2026-11-12: the live game room */}
      <Route path="/staff/room/new" element={<StaffRoomNewPage />} />
      <Route path="/staff/room/:id" element={<StaffRoomPage />} />
      <Route path="/staff/room/:id/board" element={<RoomBoardPage />} />
      <Route path="/room" element={<RoomJoinPage />} />
      <Route path="/who" element={<WhoPage />} />
      <Route path="/teacher-signup" element={<TeacherSignupPage />} />
      <Route path="/room/:code" element={<RoomPlayPage />} />
      <Route path="/staff/child/:id" element={<ChildReportPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
