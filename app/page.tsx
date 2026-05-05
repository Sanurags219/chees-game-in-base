'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Chess, type Square, type Move } from 'chess.js';
import { sdk } from '@farcaster/miniapp-sdk';
import { motion, AnimatePresence } from 'motion/react';
import { getBestMove } from '@/lib/chess';
import { 
  Trophy, 
  History, 
  RotateCcw, 
  Flag,
  CircleCheck,
  CircleAlert,
  Check,
  X,
  ShieldCheck,
  Clock,
  User,
  Cpu,
  Settings2
} from 'lucide-react';
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';

export default function ChessPage() {
  const { address, isConnected } = useAccount();
  const [game, setGame] = useState(new Chess());
  const [level, setLevel] = useState(5);
  const [moveHistory, setMoveHistory] = useState<{ san: string; from: string; to: string }[]>([]);
  const [status, setStatus] = useState<'playing' | 'checkmate' | 'draw' | 'resigned'>('playing');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingPromotionMove, setPendingPromotionMove] = useState<{ from: string; to: string } | null>(null);
  const [proposedAiMove, setProposedAiMove] = useState<string | null>(null);
  const [deniedAiMoves, setDeniedAiMoves] = useState<string[]>([]);
  const [capturedPiece, setCapturedPiece] = useState<{ type: string; color: string; square: string } | null>(null);
  const [legalMovesFromSelected, setLegalMovesFromSelected] = useState<Move[]>([]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    sdk.actions.ready().catch(console.error);
  }, []);

  const currentTurn = game.turn() === 'w' ? 'white' : 'black';
  const isPlayerTurn = currentTurn === 'white';

  const makeMove = useCallback((move: string | { from: string; to: string; promotion?: string }) => {
    try {
      const result = game.move(move);
      if (result) {
        if (result.captured) {
          setCapturedPiece({ 
            type: result.captured, 
            color: result.color === 'w' ? 'b' : 'w',
            square: result.to 
          });
          setTimeout(() => setCapturedPiece(null), 1000);
        }
        setGame(new Chess(game.fen()));
        setMoveHistory(prev => [...prev, { san: result.san, from: result.from, to: result.to }]);
        setErrorMessage(null);
        setDeniedAiMoves([]); 
        
        if (game.isCheckmate()) setStatus('checkmate');
        else if (game.isDraw()) setStatus('draw');
        
        return true;
      } else {
        setErrorMessage("Illegal move attempted.");
        return false;
      }
    } catch (e) {
      setErrorMessage("Invalid move format.");
      return false;
    }
  }, [game]);

  const handleAiMove = useCallback(() => {
    if (status !== 'playing' || proposedAiMove) return;
    
    setTimeout(() => {
      setIsAiThinking(true);
      setTimeout(() => {
        const bestMove = getBestMove(game.fen(), level, deniedAiMoves);
        if (bestMove) {
          setProposedAiMove(bestMove);
        } else if (deniedAiMoves.length > 0) {
          setErrorMessage("All proposals rejected. AI resetting...");
          setDeniedAiMoves([]);
        }
        setIsAiThinking(false);
      }, 800 + Math.random() * 1000);
    }, 100);
  }, [game, level, status, deniedAiMoves, proposedAiMove]);

  useEffect(() => {
    if (!isPlayerTurn && status === 'playing' && !proposedAiMove && !isAiThinking) {
      handleAiMove();
    }
  }, [isPlayerTurn, status, proposedAiMove, isAiThinking, handleAiMove]);

  const onSquareClick = (square: string) => {
    if (!isPlayerTurn || status !== 'playing' || proposedAiMove) return;

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMovesFromSelected([]);
        return;
      }

      const moves = game.moves({ square: selectedSquare as Square, verbose: true });
      const isValidMove = moves.some(m => m.to === square);

      if (!isValidMove) {
        const pieceAtDest = game.get(square as Square);
        if (pieceAtDest && pieceAtDest.color === 'w') {
          setSelectedSquare(square);
          setLegalMovesFromSelected(game.moves({ square: square as Square, verbose: true }));
          return;
        }

        const tempGame = new Chess(game.fen());
        const allPossibleMovesForPiece = tempGame.moves({ square: selectedSquare as Square, verbose: true });
        const canReachButLeavesInCheck = allPossibleMovesForPiece.some(m => m.to === square);

        if (canReachButLeavesInCheck) {
          setErrorMessage("Illegal: You cannot leave your King in check!");
        } else {
          setErrorMessage("Illegal move: That piece cannot move there.");
        }
        
        setSelectedSquare(null);
        setLegalMovesFromSelected([]);
        return;
      }

      const piece = game.get(selectedSquare as Square);
      const isPawn = piece?.type === 'p';
      const isPromotionRank = (piece?.color === 'w' && square[1] === '8') || (piece?.color === 'b' && square[1] === '1');
      
      if (isPawn && isPromotionRank) {
        setPendingPromotionMove({ from: selectedSquare, to: square });
        setSelectedSquare(null);
        setLegalMovesFromSelected([]);
        return;
      }

      makeMove({ from: selectedSquare, to: square, promotion: 'q' });
      setSelectedSquare(null);
      setLegalMovesFromSelected([]);
      return;
    }

    const piece = game.get(square as Square);
    if (piece && piece.color === 'w') {
      setSelectedSquare(square);
      setLegalMovesFromSelected(game.moves({ square: square as Square, verbose: true }));
    } else if (piece && piece.color === 'b') {
      setErrorMessage("Illegal: You cannot move your opponent's pieces.");
    }
  };

  const handlePromotion = (promotionPiece: string) => {
    if (pendingPromotionMove) {
      const validPromotionPieces = ['q', 'r', 'b', 'n'];
      if (!validPromotionPieces.includes(promotionPiece)) {
        setErrorMessage("Invalid promotion choice selected.");
        setPendingPromotionMove(null);
        return;
      }
      
      makeMove({ 
        from: pendingPromotionMove.from, 
        to: pendingPromotionMove.to, 
        promotion: promotionPiece 
      });
      setPendingPromotionMove(null);
      setSelectedSquare(null);
    }
  };

  const confirmAiMove = () => {
    if (proposedAiMove) {
      makeMove(proposedAiMove);
      setProposedAiMove(null);
    }
  };

  const denyAiMove = () => {
    if (proposedAiMove) {
      setDeniedAiMoves(prev => [...prev, proposedAiMove]);
    }
    setProposedAiMove(null);
    setErrorMessage("AI move rejected. Bot is reconsidering...");
  };

  const resetGame = () => {
    setGame(new Chess());
    setMoveHistory([]);
    setStatus('playing');
    setSelectedSquare(null);
    setProposedAiMove(null);
    setDeniedAiMoves([]);
    setErrorMessage(null);
  };

  const getPieceUnicode = (type: string, color: string) => {
    const pieces: any = {
      p: color === 'w' ? '♙' : '♟',
      r: color === 'w' ? '♖' : '♜',
      n: color === 'w' ? '♘' : '♞',
      b: color === 'w' ? '♗' : '♝',
      q: color === 'w' ? '♕' : '♛',
      k: color === 'w' ? '♔' : '♚'
    };
    return pieces[type];
  };

  const renderBoard = () => {
    const squares = [];
    const board = game.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const squareLabel = String.fromCharCode(97 + c) + (8 - r);
        const isDark = (r + c) % 2 === 1;
        const piece = board[r][c];
        const isSelected = selectedSquare === squareLabel;
        const lastMove = moveHistory[moveHistory.length - 1];
        const isLastMove = lastMove && (lastMove.from === squareLabel || lastMove.to === squareLabel);
        const isLegalTarget = legalMovesFromSelected.some(m => m.to === squareLabel);

        squares.push(
          <div
            key={squareLabel}
            id={`square-${squareLabel}`}
            onClick={() => onSquareClick(squareLabel)}
            className={cn(
              "w-full h-full flex items-center justify-center text-4xl cursor-pointer transition-all duration-200 relative",
              isDark ? "bg-slate-800" : "bg-slate-400",
              isSelected && "ring-4 ring-blue-500 ring-inset z-10",
              isLastMove && !isSelected && "bg-blue-500/30",
              isLegalTarget && "after:content-[''] after:w-3 after:h-3 after:bg-blue-500/40 after:rounded-full"
            )}
          >
            {piece && (
              <motion.span 
                layoutId={`piece-${squareLabel}-${piece.type}`}
                className={cn(
                  "select-none drop-shadow-md",
                  piece.color === 'w' ? "text-white" : "text-slate-900"
                )}
              >
                {getPieceUnicode(piece.type, piece.color)}
              </motion.span>
            )}
            
            <AnimatePresence>
              {capturedPiece?.square === squareLabel && (
                <motion.span
                  initial={{ opacity: 1, scale: 1, y: 0 }}
                  animate={{ opacity: 0, scale: 1.8, y: -40, rotate: 15 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className={cn(
                    "absolute pointer-events-none select-none text-4xl z-30 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]",
                    capturedPiece.color === 'w' ? "text-white" : "text-slate-900"
                  )}
                >
                  {getPieceUnicode(capturedPiece.type, capturedPiece.color)}
                </motion.span>
              )}
            </AnimatePresence>

            {c === 0 && <span className="absolute left-0.5 top-0.5 text-[8px] text-slate-500 font-bold uppercase">{8 - r}</span>}
            {r === 7 && <span className="absolute right-0.5 bottom-0.5 text-[8px] text-slate-500 font-bold uppercase">{String.fromCharCode(97 + c)}</span>}
          </div>
        );
      }
    }
    return squares;
  };

  return (
    <div className="w-full h-screen bg-[#0A0A0A] text-slate-200 font-sans overflow-hidden flex flex-col">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#111111] z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0052FF] rounded-full flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">BaseChess <span className="text-slate-500 font-normal ml-2">v1.2</span></h1>
        </div>
        
        <div className="flex items-center gap-6">
          <Wallet>
            <ConnectWallet className="bg-[#1A1A1A] border-slate-700 h-10 px-4 py-0 rounded-lg hover:bg-[#222]">
              <div className="text-xs font-mono text-slate-400">
                {isConnected ? address?.slice(0, 6) + '...' + address?.slice(-4) : 'Connect Wallet'}
              </div>
            </ConnectWallet>
            <WalletDropdown>
              <WalletDropdownDisconnect />
            </WalletDropdown>
          </Wallet>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r border-slate-800 bg-[#0D0D0D] p-6 flex flex-col">
          <div className="mb-6">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-6 flex items-center gap-2">
              <Settings2 className="w-3 h-3" /> AI Difficulty
            </h2>
            
            <div className="px-2">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-slate-400">Level</span>
                <span className="text-2xl font-black text-blue-500">{level}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                step="1"
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-600 mt-2 font-bold px-1">
                <span>NEWBIE</span>
                <span>GM</span>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1 bg-[#0A0A0A] flex flex-col items-center justify-center p-8 relative">
          <div className="mb-6 flex items-center justify-center w-full relative h-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={isPlayerTurn ? 'player' : 'ai'}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={cn(
                  "px-6 py-2 rounded-full border flex items-center gap-3 shadow-xl",
                  isPlayerTurn 
                    ? "bg-blue-500/10 border-blue-500 text-blue-400" 
                    : "bg-orange-500/10 border-orange-500 text-orange-400"
                )}
              >
                {isPlayerTurn ? <User className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                <span className="text-sm font-bold tracking-widest uppercase">
                  {isPlayerTurn ? "Your Turn" : "AI Thinking..."}
                </span>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.9 }}
                  className="absolute top-12 bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.2)] z-10"
                >
                  <CircleAlert className="w-3 h-3" />
                  {errorMessage}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative bg-[#1A1A1A] p-4 rounded-xl shadow-2xl border border-slate-800">
            <AnimatePresence>
              {proposedAiMove && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl"
                >
                  <div className="bg-[#1A1A1A] border border-orange-500/50 p-6 rounded-2xl flex flex-col items-center">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400 mb-1">AI Proposal</p>
                    <h3 className="text-2xl font-mono text-white mb-6">
                      Move <span className="text-orange-500">{proposedAiMove}</span>?
                    </h3>
                    
                    <div className="flex gap-3 w-full">
                      <button onClick={denyAiMove} className="flex-1 py-3 bg-slate-800 text-slate-300 border border-slate-700 rounded-xl flex items-center justify-center gap-2 font-bold">
                        <X className="w-4 h-4" /> Deny
                      </button>
                      <button onClick={confirmAiMove} className="flex-1 py-3 bg-orange-500 text-black rounded-xl flex items-center justify-center gap-2 font-bold shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                        <Check className="w-4 h-4" /> Approve
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {pendingPromotionMove && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl"
                >
                  <div className="bg-[#1A1A1A] border border-blue-500/50 p-6 rounded-2xl flex flex-col items-center">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400 mb-4">Choose Promotion</p>
                    <div className="flex gap-4">
                      {['q', 'r', 'b', 'n'].map((type) => (
                        <button
                          key={type}
                          onClick={() => handlePromotion(type)}
                          className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-4xl hover:bg-blue-500/20 hover:border-blue-500 transition-all font-bold"
                        >
                          {getPieceUnicode(type, 'w')}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {status !== 'playing' && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
                <div className="bg-[#1A1A1A] border border-slate-800 p-8 rounded-2xl flex flex-col items-center text-center shadow-2xl max-w-xs">
                  <h3 className="text-2xl font-bold text-white mb-2">Match Over</h3>
                  <p className="text-slate-400 mb-6">{status.toUpperCase()}</p>
                  <button onClick={resetGame} className="w-full py-3 bg-[#0052FF] text-white font-bold rounded-lg hover:bg-blue-600 transition-colors">
                    New Game
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-8 grid-rows-8 w-[520px] h-[520px] border-4 border-[#1A1A1A]">
              {renderBoard()}
            </div>
          </div>
        </section>

        <aside className="w-72 border-l border-slate-800 bg-[#0D0D0D] flex flex-col">
          <div className="p-6 flex-1 overflow-y-auto">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4 flex items-center gap-2">
              <History className="w-3 h-3" /> Activity
            </h2>
            <div className="space-y-3">
              {moveHistory.map((move, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">#{i + 1} Move</span>
                  <span className="text-white font-mono bg-[#1A1A1A] px-2 py-0.5 rounded border border-slate-800">
                    {move.from} → {move.to} <span className="text-blue-500 ml-1 font-bold">{move.san}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t border-slate-800 space-y-3">
             <button onClick={resetGame} className="w-full py-3 bg-transparent border border-slate-700 text-slate-400 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
              <RotateCcw className="w-4 h-4" /> Restart
            </button>
            <button onClick={() => setStatus('resigned')} className="w-full py-3 bg-transparent border border-slate-700 text-slate-400 rounded-lg flex items-center justify-center gap-2 hover:bg-red-500/5 hover:border-red-500/30 transition-colors">
              <Flag className="w-4 h-4" /> Resign
            </button>
          </div>
        </aside>
      </main>
      
      <footer className="h-10 bg-[#111111] border-t border-slate-800 px-8 flex items-center justify-between text-[10px] text-slate-500">
        <div>Network: <span className="text-white">Base Mainnet</span></div>
        <div>© 2024 Base Chess Labs</div>
      </footer>
    </div>
  );
}
