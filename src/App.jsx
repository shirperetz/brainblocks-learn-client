import AppRouter from "./AppRouter";
import SoundToggle from "./components/SoundToggle";
import Companion from "./components/Companion";

export default function App() {
  return (
    <>
      <AppRouter />
      <SoundToggle />
      <Companion />
    </>
  );
}
