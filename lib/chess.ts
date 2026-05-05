import { Chess } from 'chess.js';

export function getBestMove(fen: string, level: number, excludedMoves: string[] = []) {
  const game = new Chess(fen);
  let moves = game.moves();
  
  // Filter out excluded moves
  moves = moves.filter(m => !excludedMoves.includes(m));
  
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
