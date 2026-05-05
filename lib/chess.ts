import { Chess } from 'chess.js';

const PIECE_VALUES: Record<string, number> = {
  p: 10,
  n: 30,
  b: 30,
  r: 50,
  q: 90,
  k: 900
};

const CENTER_SQUARES = ['d4', 'e4', 'd5', 'e5'];

function evaluatePosition(game: Chess): number {
  let score = 0;
  const board = game.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const val = PIECE_VALUES[piece.type] || 0;
        const square = String.fromCharCode(97 + c) + (8 - r);
        const isCenter = CENTER_SQUARES.includes(square);
        
        const pieceScore = val + (isCenter ? 2 : 0);
        
        if (piece.color === 'w') {
          score += pieceScore;
        } else {
          score -= pieceScore;
        }
      }
    }
  }

  // Basic king safety check (very simple)
  if (game.hasOwnProperty('has_castle_rights')) {
    // Note: chess.js v1 beta has different types, accessing carefully
    // Using a simplified version for now
  }

  return score;
}

export function getBestMove(fen: string, level: number, excludedMoves: string[] = []) {
  const game = new Chess(fen);
  const moves = game.moves({ verbose: true });
  const turn = game.turn();
  
  // Filter out excluded moves
  const validMoves = moves.filter(m => !excludedMoves.includes(m.san));
  
  if (validMoves.length === 0) return null;

  // Level 1: Random
  if (level === 1) {
    return validMoves[Math.floor(Math.random() * validMoves.length)].san;
  }

  // Score each move
  const scoredMoves = validMoves.map(move => {
    const tempGame = new Chess(fen);
    tempGame.move(move);
    
    let score = evaluatePosition(tempGame);

    // Bonus for checks
    if (tempGame.isCheck()) {
      score += turn === 'w' ? 10 : -10;
    }

    // Bonus for castling
    if (move.flags.includes('k') || move.flags.includes('q')) {
      score += turn === 'w' ? 15 : -15;
    }

    // Bonus for development
    if (move.piece !== 'p' && (move.from[1] === '1' || move.from[1] === '8')) {
      score += turn === 'w' ? 5 : -5;
    }

    // Penalty for moving king (unless castling or late game)
    if (move.piece === 'k' && !move.flags.includes('k') && !move.flags.includes('q')) {
      // Check piece count to estimate game phase
      const pieceCount = tempGame.board().flat().filter(p => p !== null).length;
      if (pieceCount > 20) {
        score += turn === 'w' ? -10 : 10;
      }
    }

    return { san: move.san, score };
  });

  // Sort moves based on the side's perspective
  scoredMoves.sort((a, b) => {
    return turn === 'w' ? b.score - a.score : a.score - b.score;
  });

  // selectionPoolSize decreases as level increases
  const selectionPoolSize = Math.max(1, Math.floor(6 - (level / 2)));
  const pool = scoredMoves.slice(0, selectionPoolSize);
  
  return pool[Math.floor(Math.random() * pool.length)].san;
}
