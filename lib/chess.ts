import { Chess } from 'chess.js';

export function getBestMove(fen: string, level: number) {
  // Simple "AI" for demonstration since we can't run Stockfish easily in-browser without a worker
  // Higher level means slightly better move selection
  const game = new Chess(fen);
  const moves = game.moves();
  if (moves.length === 0) return null;

  // Level 1: Random
  if (level === 1) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // Level 10: Prefer captures and checks
  const captureMoves = moves.filter(m => m.includes('x'));
  const checkMoves = moves.filter(m => m.includes('+'));
  
  const priorityMoves = [...checkMoves, ...captureMoves];
  if (priorityMoves.length > 0 && Math.random() < (level / 10)) {
    return priorityMoves[Math.floor(Math.random() * priorityMoves.length)];
  }

  return moves[Math.floor(Math.random() * moves.length)];
}
