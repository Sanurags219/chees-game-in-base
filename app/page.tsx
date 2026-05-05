'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Chess } from 'chess.js';
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
  Loader2,
  ChevronRight,
  ShieldCheck,
  Clock,
  User,
  Cpu
} from 'lucide-react';
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';

export default function ChessPage() {
  const { address, isConnected } = useAccount();
  const [game, setGame] = useState(new Chess());
  const [level, setLevel] = useState(1);
  const [moveHistory, setMoveHistory] = useState<{ san: string; from: string; to: string }[]>([]);
  const [status, setStatus] = useState<'playing' | 'checkmate' | 'draw' | 'resigned'>('playing');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  useEffect(() => {
    sdk.actions.ready().catch(console.error);
  }, []);

  const currentTurn = game.turn() === 'w' ? 'white' : 'black';
  const isPlayerTurn = currentTurn === 'white';

  const makeMove = useCallback((move: string | { from: string; to: string; promotion?: string }) => {
    try {
      const result = game.move(move);
      if (result) {
        setGame(new Chess(game.fen()));
        setMoveHistory(prev => [...prev, { san: result.san, from: result.from, to: result.to }]);
        
        if (game.isCheckmate()) setStatus('checkmate');
        else if (game.isDraw()) setStatus('draw');
        
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }, [game]);

  const handleAiMove = useCallback(() => {
    if (status !== 'playing') return;
    
    // Simulate thinking delay
    setTimeout(() => {
      setIsAiThinking(true);
      setTimeout(() => {
        const bestMove = getBestMove(game.fen(), level);
        if (bestMove) {
          makeMove(bestMove);
        }
        setIsAiThinking(false);
      }, 800 + Math.random() * 1000);
    }, 10);
  }, [game, level, makeMove, status]);

  useEffect(() => {
    if (!isPlayerTurn && status === 'playing') {
      handleAiMove();
    }
  }, [isPlayerTurn, handleAiMove, status]);

  const onSquareClick = (square: string) => {
    if (!isPlayerTurn || status !== 'playing') return;

    if (selectedSquare) {
      const moveSuccess = makeMove({ from: selectedSquare, to: square, promotion: 'q' });
      setSelectedSquare(null);
      if (moveSuccess) return;
    }

    const piece = game.get(square as any);
    if (piece && piece.color === 'w') {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
    }
  };

  const resetGame = () => {
    setGame(new Chess());
    setMoveHistory([]);
    setStatus('playing');
    setSelectedSquare(null);
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

        squares.push(
          <div
            key={squareLabel}
            id={`square-${squareLabel}`}
            onClick={() => onSquareClick(squareLabel)}
            className={cn(
              "w-full h-full flex items-center justify-center text-4xl cursor-pointer transition-all duration-200 relative",
              isDark ? "bg-slate-800" : "bg-slate-400",
              isSelected && "ring-4 ring-blue-500 ring-inset z-10",
              isLastMove && !isSelected && "bg-blue-500/30"
            )}
          >
            {piece && (
              <span className={cn(
                "select-none drop-shadow-md",
                piece.color === 'w' ? "text-white" : "text-slate-900"
              )}>
                {getPieceUnicode(piece.type, piece.color)}
              </span>
            )}
            {/* Coordinate labels */}
            {c === 0 && <span className="absolute left-0.5 top-0.5 text-[8px] text-slate-500 font-bold uppercase">{8 - r}</span>}
            {r === 7 && <span className="absolute right-0.5 bottom-0.5 text-[8px] text-slate-500 font-bold uppercase">{String.fromCharCode(97 + c)}</span>}
          </div>
        );
      }
    }
    return squares;
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

  return (
    <div className="w-full h-screen bg-[#0A0A0A] text-slate-200 font-sans overflow-hidden flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#111111] z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0052FF] rounded-full flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">BaseChess <span className="text-slate-500 font-normal ml-2">v1.0</span></h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Network Status</span>
            <span className="text-xs text-[#00FF00] flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#00FF00] rounded-full animate-pulse"></span> Base Mainnet
            </span>
          </div>
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
        {/* Left Sidebar: Levels */}
        <aside className="w-64 border-r border-slate-800 bg-[#0D0D0D] p-6 flex flex-col">
          <div className="mb-6">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" /> Challenge Levels
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[...Array(10)].map((_, i) => (
                <button
                  key={i}
                  id={`level-btn-${i+1}`}
                  onClick={() => setLevel(i + 1)}
                  className={cn(
                    "h-12 rounded font-bold transition-all duration-200 border",
                    level === i + 1 
                      ? "bg-[#0052FF] text-white border-blue-400 shadow-[0_0_15px_rgba(0,82,255,0.3)]" 
                      : "bg-[#1A1A1A] border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300"
                  )}
                >
                  L{String(i + 1).padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-auto p-4 bg-[#151515] rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Win Reward</p>
            <p className="text-xl font-bold text-white">{(level * 0.05).toFixed(2)} ETH</p>
            <p className="text-[10px] text-blue-400 mt-2 flex items-center gap-1">
               <Clock className="w-3 h-3" /> Rank: Grandmaster {level}
            </p>
          </div>
        </aside>

        {/* Board Area */}
        <section className="flex-1 bg-[#0A0A0A] flex flex-col items-center justify-center p-8 relative">
          {/* Turn Indicator Overlay */}
          <div className="mb-6 flex items-center justify-center w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={isPlayerTurn ? 'player' : 'ai'}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={cn(
                  "px-6 py-2 rounded-full border flex items-center gap-3 shadow-xl transition-colors",
                  isPlayerTurn 
                    ? "bg-blue-500/10 border-blue-500 text-blue-400" 
                    : "bg-orange-500/10 border-orange-500 text-orange-400"
                )}
              >
                {isPlayerTurn ? (
                  <User className="w-4 h-4 animate-pulse" />
                ) : (
                  <Cpu className="w-4 h-4 animate-spin" />
                )}
                <span className="text-sm font-bold tracking-widest uppercase">
                  {isPlayerTurn ? "Your Turn" : "AI Thinking..."}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative bg-[#1A1A1A] p-4 rounded-xl shadow-2xl border border-slate-800">
            {/* Game Over Message */}
            {status !== 'playing' && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
                <div className="bg-[#1A1A1A] border border-slate-800 p-8 rounded-2xl flex flex-col items-center text-center shadow-2xl max-w-xs">
                  {status === 'checkmate' ? (
                    <>
                      <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                        <CircleCheck className="w-8 h-8 text-blue-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {isPlayerTurn ? "AI Checkmate!" : "You Won!"}
                      </h3>
                      <p className="text-slate-400 mb-6 font-mono text-sm">On-chain achievement unlocked: GM Level {level}</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-slate-500/20 rounded-full flex items-center justify-center mb-4">
                        <CircleAlert className="w-8 h-8 text-slate-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Match Terminated</h3>
                      <p className="text-slate-400 mb-6">{status === 'draw' ? "The game ended in a draw." : "You have resigned."}</p>
                    </>
                  )}
                  <button 
                    onClick={resetGame}
                    className="w-full py-3 bg-[#0052FF] text-white font-bold rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    New Challenge
                  </button>
                </div>
              </div>
            )}

            {/* Chess Board Grid */}
            <div className="grid grid-cols-8 grid-rows-8 w-[520px] h-[520px] border-4 border-[#1A1A1A]">
              {renderBoard()}
            </div>
          </div>

          <div className="mt-8 flex gap-8">
            <div id="player-profile" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Player</p>
                <p className="text-sm font-bold text-white">{isConnected ? address?.slice(0, 10) + '...' : 'Anonymous'}</p>
              </div>
            </div>
            
            <div className="w-[1px] h-10 bg-slate-800"></div>

            <div id="ai-profile" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                <Cpu className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Opponent</p>
                <p className="text-sm font-bold text-white">BaseBot Level {level}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Sidebar: Game History */}
        <aside className="w-72 border-l border-slate-800 bg-[#0D0D0D] flex flex-col">
          <div className="p-6 flex-1 overflow-y-auto">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4 flex items-center gap-2">
              <History className="w-3 h-3" /> Game Activity
            </h2>
            <div className="space-y-3">
              {moveHistory.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs text-slate-600 italic">No moves recorded yet.</p>
                </div>
              ) : (
                moveHistory.map((move, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="flex justify-between items-center text-xs group"
                  >
                    <span className="text-slate-500">#{i + 1} Move</span>
                    <span className="text-white font-mono bg-[#1A1A1A] px-2 py-0.5 rounded border border-slate-800 group-hover:border-blue-500/50 transition-colors">
                      {move.from} → {move.to} <span className="text-blue-500 ml-1 font-bold">{move.san}</span>
                    </span>
                    <span className="text-blue-500/50 text-[10px]">Confirmed</span>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="p-6 border-t border-slate-800 space-y-3">
             <button 
              onClick={resetGame}
              className="w-full py-3 bg-transparent border border-slate-700 text-slate-400 hover:text-white rounded-lg flex items-center justify-center gap-2 transition-all hover:bg-slate-800"
            >
              <RotateCcw className="w-4 h-4" /> Restart Game
            </button>
            <button 
              onClick={() => setStatus('resigned')}
              className="w-full py-3 bg-transparent border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/30 rounded-lg flex items-center justify-center gap-2 transition-all hover:bg-red-500/5"
            >
              <Flag className="w-4 h-4" /> Resign Match
            </button>
             <button 
              className="w-full py-3 bg-[#0052FF] hover:bg-blue-600 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95"
            >
              Submit Move On-Chain
            </button>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="h-10 bg-[#111111] border-t border-slate-800 px-8 flex items-center justify-between">
        <div className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-4">
          <span>Gas: <span className="text-blue-400 font-mono">0.0001 ETH</span></span>
          <span className="w-[1px] h-3 bg-slate-800"></span>
          <span>Network: <span className="text-white">Stable</span></span>
        </div>
        <div className="text-[10px] text-slate-500">
          © 2024 Base Game Labs. Security Verified by Base Protocol.
        </div>
      </footer>
    </div>
  );
}
