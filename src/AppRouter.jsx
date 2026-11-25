import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import TopicsPage from "./pages/TopicsPage";
import StageMapPage from "./pages/StageMapPage";
import SeaPage from "./pages/SeaPage";
import PlayPage from "./pages/PlayPage";
import SummaryPage from "./pages/SummaryPage";
import IslandPage from "./pages/IslandPage";
import GameLevelsPage from "./pages/GameLevelsPage";
import GamePlayPage from "./pages/GamePlayPage";
import GenIslePage from "./pages/GenIslePage";
// 2026-11-25 (speed check): screens a child doesn't need on the way in (staff, admin, room, info pages)
// load only when opened - the first file a phone downloads is smaller.
const AdminPage = lazy(() => import("./pages/AdminPage"));
const CharacterPage = lazy(() => import("./pages/CharacterPage"));
const GradePage = lazy(() => import("./pages/GradePage"));
const DailyPage = lazy(() => import("./pages/DailyPage"));
const TimedPage = lazy(() => import("./pages/TimedPage"));
const ReviewPage = lazy(() => import("./pages/ReviewPage"));
const StaffPage = lazy(() => import("./pages/StaffPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const MyIslandPage = lazy(() => import("./pages/MyIslandPage"));
const ChildReportPage = lazy(() => import("./pages/ChildReportPage"));
const ParentsPage = lazy(() => import("./pages/ParentsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const AccessibilityPage = lazy(() => import("./pages/AccessibilityPage"));
const StaffRoomNewPage = lazy(() => import("./pages/StaffRoomNewPage"));
const StaffRoomPage = lazy(() => import("./pages/StaffRoomPage"));
const RoomBoardPage = lazy(() => import("./pages/RoomBoardPage"));
const RoomJoinPage = lazy(() => import("./pages/RoomJoinPage"));
const JoinClassPage = lazy(() => import("./pages/JoinClassPage"));
const RoomPlayPage = lazy(() => import("./pages/RoomPlayPage"));
const TeacherSignupPage = lazy(() => import("./pages/TeacherSignupPage"));
// 2026-11-13: the 3D island loads three.js only on its own page
const Island3DPage = lazy(() => import("./pages/Island3DPage"));
const ClassIslandPage = lazy(() => import("./pages/ClassIslandPage"));
import WhoPage from "./pages/WhoPage";

// All routes for עולם החשבון. Real pages replace the Placeholders milestone by milestone.
export default function AppRouter() {
  return (
    <Suspense fallback={<div className="page-loading" role="status" aria-live="polite">רגע...</div>}>
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
      <Route path="/class-island" element={<Suspense fallback={null}><ClassIslandPage /></Suspense>} />
      <Route path="/staff/class/:id/island" element={<Suspense fallback={null}><ClassIslandPage /></Suspense>} />
      <Route path="/staff/child/:id/island" element={<MyIslandPage />} />
      <Route path="/daily" element={<DailyPage />} />
      <Route path="/timed" element={<TimedPage />} />
      <Route path="/parent" element={<ParentsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/accessibility" element={<AccessibilityPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/staff" element={<StaffPage />} />
      {/* 2026-11-12: the live game room */}
      <Route path="/staff/room/new" element={<StaffRoomNewPage />} />
      <Route path="/staff/room/:id" element={<StaffRoomPage />} />
      <Route path="/staff/room/:id/board" element={<RoomBoardPage />} />
      <Route path="/room" element={<RoomJoinPage />} />
      <Route path="/join-class" element={<JoinClassPage />} />
      <Route path="/who" element={<WhoPage />} />
      <Route path="/teacher-signup" element={<TeacherSignupPage />} />
      <Route path="/room/:code" element={<RoomPlayPage />} />
      <Route path="/staff/child/:id" element={<ChildReportPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  );
}
