import { useState } from "react";
import { RoomState, User } from "../types";
import { Share, Eye, RotateCcw, Trash2 } from "lucide-react";

interface RoomProps {
  roomState: RoomState | null;
  currentUser: User;
  onVote: (vote: number) => void;
  onReveal: () => void;
  onReset: () => void;
  onDelete: () => void;
  onCalculationChange: (method: "average" | "sumByRole") => void;
  onSelectManualMode: (role: string, vote: number) => void;
}

const VOTING_OPTIONS = Array.from({ length: 26 }, (_, i) => (i + 1) * 0.5);

export function Room({ roomState, currentUser, onVote, onReveal, onReset, onDelete, onCalculationChange, onSelectManualMode }: RoomProps) {
  const [copied, setCopied] = useState(false);

  if (!roomState) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 px-4 text-center">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <div className="text-cyan-400 font-bold tracking-widest uppercase text-sm animate-pulse">Estabelecendo Conexão...</div>
        <p className="text-slate-500 text-xs mt-4 max-w-xs">
          O servidor pode levar até 50 segundos para "acordar" caso seja o primeiro acesso do dia.
        </p>
      </div>
    );
  }

  const handleShare = () => {
    const shareUrl = window.location.origin + window.location.pathname + `?name=${encodeURIComponent(roomState.name)}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const users = Object.values(roomState.users).filter(u => u.role !== "ScrumMaster");
  const isRevealed = roomState.status === "revealed";
  const method = roomState.calculationMethod || "average";
  const manualSelections = roomState.manualModeSelections || {};

  // Helper to get vote distribution and modes
  const getVoteStats = (votes: number[]) => {
    if (votes.length === 0) return { distribution: {}, modes: [], autoMode: 0 };
    const counts: Record<number, number> = {};
    let maxCount = 0;

    votes.forEach(v => {
      counts[v] = (counts[v] || 0) + 1;
      if (counts[v] > maxCount) {
        maxCount = counts[v];
      }
    });

    const modes = Object.keys(counts)
      .map(Number)
      .filter(v => counts[v] === maxCount);

    return { 
      distribution: counts, 
      modes, 
      autoMode: Math.max(...modes) // Default to highest if tie
    };
  };

  // Calculate values
  const qaVotes = users.filter((u) => u.role === "QA" && u.vote !== null).map(u => u.vote as number);
  const devVotes = users.filter((u) => u.role === "Dev" && u.vote !== null).map(u => u.vote as number);

  const qaStats = getVoteStats(qaVotes);
  const devStats = getVoteStats(devVotes);

  let qaResult = 0;
  let devResult = 0;

  if (method === "average") {
    qaResult = qaVotes.length ? qaVotes.reduce((a, b) => a + b, 0) / qaVotes.length : 0;
    devResult = devVotes.length ? devVotes.reduce((a, b) => a + b, 0) / devVotes.length : 0;
  } else {
    qaResult = manualSelections["QA"] !== undefined ? manualSelections["QA"] : qaStats.autoMode;
    devResult = manualSelections["Dev"] !== undefined ? manualSelections["Dev"] : devStats.autoMode;
  }

  const totalSum = qaResult + devResult;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/50 p-4 sm:p-6 rounded-3xl border border-white/10 backdrop-blur-sm shadow-[0_0_30px_-15px_rgba(168,85,247,0.3)]">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            {roomState.name}
          </h2>
          <div className="flex items-center justify-center sm:justify-start gap-4 mt-1">
            <p className="text-slate-400 text-xs sm:text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {users.length} usuário{users.length !== 1 ? "s" : ""} online
            </p>
            <div className="h-4 w-[1px] bg-white/10"></div>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              Método: <span className="text-cyan-400">{method === "average" ? "Média Simples" : "Mais Votado por Função"}</span>
            </p>
          </div>
        </div>
        <div className="flex w-full sm:w-auto gap-3">
          <button
            onClick={handleShare}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl font-bold transition-all border border-cyan-500/30 hover:border-cyan-500/60 text-xs sm:text-sm"
          >
            <Share size={16} />
            {copied ? "COPIADO" : "COMPARTILHAR"}
          </button>
        </div>
      </div>

      {/* Calculation Method Toggle (Scrum Master only) */}
      {currentUser.role === "ScrumMaster" && (
        <div className="flex justify-center">
          <div className="bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 flex gap-2">
            <button
              onClick={() => onCalculationChange("average")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                method === "average" 
                  ? "bg-cyan-500 text-white shadow-[0_0_15px_rgba(34,211,238,0.4)]" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              MÉDIA SIMPLES
            </button>
            <button
              onClick={() => onCalculationChange("sumByRole")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                method === "sumByRole" 
                  ? "bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              MAIS VOTADO POR FUNÇÃO
            </button>
          </div>
        </div>
      )}

      {/* Voting Options */}
      {!isRevealed && currentUser.role !== "ScrumMaster" && (
        <div className="bg-slate-900/50 p-4 sm:p-8 rounded-3xl border border-white/10 backdrop-blur-sm shadow-[0_0_30px_-15px_rgba(34,211,238,0.2)]">
          <h3 className="text-xs sm:text-sm font-bold text-slate-400 mb-4 sm:mb-6 text-center uppercase tracking-widest">Selecione a Estimativa</h3>
          <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-2 sm:gap-3 justify-center">
            {VOTING_OPTIONS.map((option) => {
              const isSelected = currentUser.vote === option;
              return (
                <button
                  key={option}
                  onClick={() => onVote(option)}
                  className={`h-14 sm:w-14 sm:h-16 rounded-xl font-bold text-base sm:text-lg transition-all flex items-center justify-center border ${
                    isSelected
                      ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-transparent shadow-[0_0_20px_rgba(34,211,238,0.5)] scale-105 sm:scale-110"
                      : "bg-slate-950 text-slate-300 border-white/10 hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-slate-900"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Results */}
      {isRevealed && currentUser.role === "ScrumMaster" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-slate-900/50 p-4 sm:p-6 rounded-3xl border border-purple-500/30 backdrop-blur-sm shadow-[0_0_30px_-10px_rgba(168,85,247,0.2)] flex flex-col items-center justify-center relative overflow-hidden">
              <span className="text-purple-400 font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-1 sm:mb-2 relative z-10">
                {method === "average" ? "Média QA" : "Resultado QA"}
              </span>
              <span className="text-3xl sm:text-5xl font-bold text-white relative z-10">{qaResult > 0 ? qaResult.toFixed(method === "average" ? 2 : 1) : "-"}</span>
            </div>
            <div className="bg-slate-900/50 p-4 sm:p-6 rounded-3xl border border-cyan-500/30 backdrop-blur-sm shadow-[0_0_30px_-10px_rgba(34,211,238,0.2)] flex flex-col items-center justify-center relative overflow-hidden">
              <span className="text-cyan-400 font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-1 sm:mb-2 relative z-10">
                {method === "average" ? "Média Dev" : "Resultado Dev"}
              </span>
              <span className="text-3xl sm:text-5xl font-bold text-white relative z-10">{devResult > 0 ? devResult.toFixed(method === "average" ? 2 : 1) : "-"}</span>
            </div>
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-4 sm:p-6 rounded-3xl border border-indigo-500/50 shadow-[0_0_40px_-10px_rgba(99,102,241,0.4)] flex flex-col items-center justify-center relative overflow-hidden">
              <span className="text-indigo-300 font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-1 sm:mb-2 relative z-10">Soma Total</span>
              <span className="text-3xl sm:text-5xl font-bold text-white relative z-10">{totalSum > 0 ? totalSum.toFixed(method === "average" ? 2 : 1) : "-"}</span>
            </div>
          </div>

          {/* Tie Breaker / Distribution UI */}
          {method === "sumByRole" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* QA Distribution */}
              <div className="bg-slate-900/40 p-5 rounded-3xl border border-purple-500/20">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">Distribuição de Votos QA</h4>
                <div className="space-y-3">
                  {Object.entries(qaStats.distribution).sort((a, b) => Number(b[0]) - Number(a[0])).map(([vote, count]) => {
                    const isMode = qaStats.modes.includes(Number(vote));
                    const isSelected = qaResult === Number(vote);
                    return (
                      <button
                        key={vote}
                        disabled={!isMode || qaStats.modes.length <= 1}
                        onClick={() => onSelectManualMode("QA", Number(vote))}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isSelected 
                            ? "bg-purple-500/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]" 
                            : isMode 
                              ? "bg-slate-800 border-purple-500/30 hover:border-purple-500/60" 
                              : "bg-slate-950/50 border-white/5 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-black text-white">{vote}</span>
                          {isMode && qaStats.modes.length > 1 && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase">Empate</span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-slate-400">{count} voto{count !== 1 ? "s" : ""}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dev Distribution */}
              <div className="bg-slate-900/40 p-5 rounded-3xl border border-cyan-500/20">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4">Distribuição de Votos Dev</h4>
                <div className="space-y-3">
                  {Object.entries(devStats.distribution).sort((a, b) => Number(b[0]) - Number(a[0])).map(([vote, count]) => {
                    const isMode = devStats.modes.includes(Number(vote));
                    const isSelected = devResult === Number(vote);
                    return (
                      <button
                        key={vote}
                        disabled={!isMode || devStats.modes.length <= 1}
                        onClick={() => onSelectManualMode("Dev", Number(vote))}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isSelected 
                            ? "bg-cyan-500/20 border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.2)]" 
                            : isMode 
                              ? "bg-slate-800 border-cyan-500/30 hover:border-cyan-500/60" 
                              : "bg-slate-950/50 border-white/5 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-black text-white">{vote}</span>
                          {isMode && devStats.modes.length > 1 && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase">Empate</span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-slate-400">{count} voto{count !== 1 ? "s" : ""}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Grid */}
      <div className="bg-slate-900/30 p-4 sm:p-8 rounded-3xl border border-white/5 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
          <h3 className="text-lg sm:text-xl font-bold text-slate-200 uppercase tracking-widest">
            {currentUser.role === "ScrumMaster" ? `PARTICIPANTES - ${users.length}` : "Seu Voto"}
          </h3>
          {currentUser.role === "ScrumMaster" && (
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3">
              <button
                onClick={onDelete}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-bold transition-all border border-red-500/30 text-xs sm:text-sm"
              >
                <Trash2 size={16} />
                EXCLUIR SALA
              </button>
              
              {!isRevealed ? (
                <button
                  onClick={onReveal}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold transition-all text-xs sm:text-sm shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                >
                  <Eye size={16} />
                  REVELAR VOTOS
                </button>
              ) : (
                <button
                  onClick={onReset}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-white/10 text-xs sm:text-sm"
                >
                  <RotateCcw size={16} />
                  REINICIAR
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {users
            .filter((user) => currentUser.role === "ScrumMaster" || user.id === currentUser.id)
            .map((user) => (
            <div
              key={user.id}
              className={`flex flex-col items-center p-4 sm:p-6 rounded-2xl border transition-all duration-500 ${
                user.vote !== null
                  ? "bg-slate-800/80 border-cyan-500/50"
                  : "bg-slate-900/50 border-white/10 border-dashed opacity-70"
              }`}
            >
              <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold text-base sm:text-xl mb-3 sm:mb-4 border-2 ${
                user.role === "QA" 
                  ? "bg-purple-500/10 border-purple-500/50 text-purple-400" 
                  : "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
              }`}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-bold text-slate-200 truncate w-full text-center mb-1 text-sm sm:text-base">
                {user.name}
              </span>
              <span
                className={`text-[8px] sm:text-[10px] font-bold px-2 py-0.5 sm:py-1 rounded-md mb-3 sm:mb-5 uppercase tracking-widest ${
                  user.role === "QA" ? "bg-purple-500/20 text-purple-300" : "bg-cyan-500/20 text-cyan-300"
                }`}
              >
                {user.role}
              </span>

              <div
                className={`w-12 h-16 sm:w-16 sm:h-20 rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-black border-2 transition-all duration-500 ${
                  user.vote !== null
                    ? (isRevealed && currentUser.role === "ScrumMaster") || user.id === currentUser.id
                      ? "bg-gradient-to-br from-slate-700 to-slate-800 border-white/20 text-white"
                      : "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                    : "bg-slate-950 border-white/5 text-slate-700"
                }`}
              >
                {user.vote !== null ? ((isRevealed && currentUser.role === "ScrumMaster") || user.id === currentUser.id ? user.vote : "✓") : "?"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
