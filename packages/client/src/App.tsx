import { Navigate, Route, Routes } from 'react-router-dom';
import { PondDefs } from './components/PondArt';
import { PlayerProvider } from './lib/player';
import { Cipher } from './pages/Cipher';
import { GameMap } from './pages/GameMap';
import { Home } from './pages/Home';
import { MazeRunner } from './pages/MazeRunner';
import { PadFall } from './pages/PadFall';
import { Play } from './pages/Play';

export default function App() {
  return (
    <PlayerProvider>
      <PondDefs />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game/:gameId" element={<GameMap />} />
        <Route path="/play/:gameId/:levelId" element={<Play />} />
        <Route path="/cipher" element={<Cipher />} />
        <Route path="/games" element={<PadFall />} />
        <Route path="/games/:mode" element={<Navigate to="/games" replace />} />
        <Route path="/maze" element={<MazeRunner />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PlayerProvider>
  );
}
