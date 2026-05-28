import { useState, useEffect, useCallback } from "react";

const ROWS = 6, COLS = 7;

const quotes = [
  { text: "Ты страдаешь не от событий, а от мыслей о них.", author: "Марк Аврелий", color: "#c9a84c" },
  { text: "Мы не можем контролировать события, но можем контролировать реакцию.", author: "Эпиктет", color: "#8eb4d4" },
  { text: "Сначала подумай. Потом доверяй.", author: "Сенека", color: "#b4c4a8" },
  { text: "Простота — это высшая степень изощрённости.", author: "Леонардо да Винчи", color: "#d4a8b4" },
  { text: "Инновация — это называть вещи иначе.", author: "Стив Джобс", color: "#a8b4d4" },
  { text: "Разум — это всё. Ты становишься тем, о чём думаешь.", author: "Будда", color: "#c9a84c" },
  { text: "Твой следующий шаг важнее всех прошлых.", author: "Naval Ravikant", color: "#8eb4d4" },
  { text: "Спокойствие — высшее достижение.", author: "Марк Аврелий", color: "#b4c4a8" },
  { text: "Думай медленно, действуй быстро.", author: "Naval Ravikant", color: "#d4a8b4" },
  { text: "Ясность мысли — начало правильного действия.", author: "Лао-цзы", color: "#c9a84c" },
  { text: "Победа любит подготовку.", author: "Сенека", color: "#a8b4d4" },
  { text: "Счастье — это качество твоих мыслей.", author: "Марк Аврелий", color: "#8eb4d4" },
];

const hintQuotes = [
  { text: "Сделай паузу. Посмотри глубже. Ответ уже здесь.", author: "Сенека" },
  { text: "Наблюдай центр. Кто контролирует центр — контролирует игру.", author: "Марк Аврелий" },
  { text: "Думай на два хода вперёд — и ты всегда будешь на шаг впереди.", author: "Naval Ravikant" },
  { text: "Лучшая защита — это атака. Но сначала защити себя.", author: "Эпиктет" },
];

const coachTips = [
  "Ты хорошо контролировал центр доски — это основа победы.",
  "Попробуй создавать двойные угрозы — соперник не сможет заблокировать обе сразу.",
  "Замечай паттерны: три фишки в ряд уже требуют блокировки.",
  "Центральные колонки дают больше возможностей для победных линий.",
  "Следующий раз попробуй строить 'вилку' — угрозу с двух сторон одновременно.",
];

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function getLowestEmpty(board, col) {
  for (let r = ROWS - 1; r >= 0; r--) if (!board[r][col]) return r;
  return -1;
}

function checkWin(board, row, col, player) {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [dr, dc] of dirs) {
    const cells = [[row, col]];
    for (let i = 1; i < 4; i++) {
      const nr = row + dr * i, nc = col + dc * i;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === player) cells.push([nr, nc]);
      else break;
    }
    for (let i = 1; i < 4; i++) {
      const nr = row - dr * i, nc = col - dc * i;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === player) cells.push([nr, nc]);
      else break;
    }
    if (cells.length >= 4) return cells.slice(0, 4);
  }
  return null;
}

function getBestMove(board, difficulty) {
  const available = [];
  for (let c = 0; c < COLS; c++) if (getLowestEmpty(board, c) !== -1) available.push(c);

  // Win
  for (const c of available) {
    const r = getLowestEmpty(board, c);
    board[r][c] = 'ai';
    const win = checkWin(board, r, c, 'ai');
    board[r][c] = null;
    if (win) return c;
  }
  // Block
  for (const c of available) {
    const r = getLowestEmpty(board, c);
    board[r][c] = 'player';
    const win = checkWin(board, r, c, 'player');
    board[r][c] = null;
    if (win) return c;
  }
  if (difficulty === 'easy') return available[Math.floor(Math.random() * available.length)];
  if (getLowestEmpty(board, 3) !== -1) return 3;
  return available[Math.floor(Math.random() * available.length)];
}

export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [playerName, setPlayerName] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [board, setBoard] = useState(emptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState('player');
  const [gameOver, setGameOver] = useState(false);
  const [winCells, setWinCells] = useState([]);
  const [winner, setWinner] = useState(null);
  const [scores, setScores] = useState({ player: 0, ai: 0 });
  const [moveHistory, setMoveHistory] = useState([]);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [clarityScore, setClarityScore] = useState(null);
  const [showPro, setShowPro] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [hintCol, setHintCol] = useState(-1);
  const [hintQuote, setHintQuote] = useState(hintQuotes[0]);
  const [showWin, setShowWin] = useState(false);
  const [hoveredCol, setHoveredCol] = useState(-1);

  const currentQuote = quotes[quoteIdx % quotes.length];

  const advanceQuote = useCallback(() => {
    setQuoteIdx(i => i + 1);
  }, []);

  const startGame = () => {
    setScreen('game');
    resetGame();
  };

  const resetGame = () => {
    setBoard(emptyBoard());
    setCurrentPlayer('player');
    setGameOver(false);
    setWinCells([]);
    setWinner(null);
    setMoveHistory([]);
    setClarityScore(null);
    setShowWin(false);
    setHintCol(-1);
    setQuoteIdx(Math.floor(Math.random() * quotes.length));
  };

  const handleDrop = useCallback((col) => {
    if (gameOver || currentPlayer !== 'player') return;
    const newBoard = board.map(r => [...r]);
    const row = getLowestEmpty(newBoard, col);
    if (row === -1) return;

    newBoard[row][col] = 'player';
    setBoard(newBoard);
    setHintCol(-1);
    advanceQuote();

    const name = playerName || 'Ты';
    setMoveHistory(h => [{ who: 'player', col: col + 1, name }, ...h]);

    const win = checkWin(newBoard, row, col, 'player');
    if (win) {
      setWinCells(win);
      setWinner('player');
      setGameOver(true);
      const cs = Math.round(55 + Math.random() * 35);
      setClarityScore(cs);
      setScores(s => ({ ...s, player: s.player + 1 }));
      setTimeout(() => setShowWin(true), 700);
      return;
    }
    if (newBoard[0].every(c => c !== null)) {
      setWinner('draw');
      setGameOver(true);
      setTimeout(() => setShowWin(true), 700);
      return;
    }
    setCurrentPlayer('ai');
  }, [board, gameOver, currentPlayer, playerName, advanceQuote]);

  useEffect(() => {
    if (currentPlayer !== 'ai' || gameOver) return;
    const timer = setTimeout(() => {
      const newBoard = board.map(r => [...r]);
      const col = getBestMove(newBoard, difficulty);
      const row = getLowestEmpty(newBoard, col);
      if (row === -1) return;
      newBoard[row][col] = 'ai';
      setBoard(newBoard);
      advanceQuote();
      setMoveHistory(h => [{ who: 'ai', col: col + 1, name: 'ИИ' }, ...h]);

      const win = checkWin(newBoard, row, col, 'ai');
      if (win) {
        setWinCells(win);
        setWinner('ai');
        setGameOver(true);
        const cs = Math.round(25 + Math.random() * 30);
        setClarityScore(cs);
        setScores(s => ({ ...s, ai: s.ai + 1 }));
        setTimeout(() => setShowWin(true), 700);
        return;
      }
      if (newBoard[0].every(c => c !== null)) {
        setWinner('draw');
        setGameOver(true);
        setTimeout(() => setShowWin(true), 700);
        return;
      }
      setCurrentPlayer('player');
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPlayer, gameOver, board, difficulty, advanceQuote]);

  const showHint = () => {
    const b = board.map(r => [...r]);
    // Try win
    for (let c = 0; c < COLS; c++) {
      const r = getLowestEmpty(b, c);
      if (r === -1) continue;
      b[r][c] = 'player';
      if (checkWin(b, r, c, 'player')) { b[r][c] = null; setHintCol(c); break; }
      b[r][c] = null;
    }
    if (hintCol === -1) {
      for (let c = 0; c < COLS; c++) {
        const r = getLowestEmpty(b, c);
        if (r === -1) continue;
        b[r][c] = 'ai';
        if (checkWin(b, r, c, 'ai')) { b[r][c] = null; setHintCol(c); break; }
        b[r][c] = null;
      }
    }
    if (hintCol === -1) setHintCol(getLowestEmpty(b, 3) !== -1 ? 3 : 0);
    setHintQuote(hintQuotes[Math.floor(Math.random() * hintQuotes.length)]);
    setShowHintModal(true);
  };

  const isWinCell = (r, c) => winCells.some(([wr, wc]) => wr === r && wc === c);

  const winText = winner === 'player'
    ? { title: 'Точки соединились', sub: 'Ясность достигнута. Твои мысли выстроились в ряд.' }
    : winner === 'ai'
    ? { title: 'Мысли рассеялись', sub: 'Каждая партия — это урок на пути к ясности.' }
    : { title: 'Ничья', sub: 'Равный поединок умов.' };

  if (screen === 'welcome') return (
    <div style={{ background:'#0a0a0f', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem', fontFamily:"'Georgia', serif" }}>
      <div style={{ fontSize:'clamp(2rem,6vw,3.5rem)', fontWeight:300, color:'#e8e4dc', textAlign:'center', lineHeight:1.1, marginBottom:'0.5rem', fontStyle:'italic' }}>
        Connecting <span style={{ color:'#c9a84c' }}>the Dots</span>
      </div>
      <div style={{ fontSize:'0.8rem', color:'rgba(232,228,220,0.5)', textAlign:'center', maxWidth:380, lineHeight:1.8, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'2.5rem', fontFamily:'sans-serif', fontWeight:300 }}>
        Место где твои мысли дают результат —<br/>где точки соединяются и всё становится ясным
      </div>
      <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'2.5rem', width:'100%', maxWidth:400 }}>
        <div style={{ fontSize:'0.65rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(232,228,220,0.5)', marginBottom:'0.6rem', fontFamily:'sans-serif' }}>Твоё имя</div>
        <input
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && startGame()}
          placeholder="Введи имя..."
          style={{ width:'100%', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'0.9rem 1.2rem', color:'#e8e4dc', fontFamily:'sans-serif', fontSize:'0.95rem', outline:'none', marginBottom:'1.8rem', boxSizing:'border-box' }}
        />
        <div style={{ fontSize:'0.65rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(232,228,220,0.5)', marginBottom:'0.6rem', fontFamily:'sans-serif' }}>Уровень</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.6rem', marginBottom:'2rem' }}>
          {[['easy','Лёгкий','Свободный ум'],['medium','Средний','Фокус'],['hard','Сложный','Ясность']].map(([d,label,sub]) => (
            <button key={d} onClick={() => setDifficulty(d)} style={{ background: difficulty===d ? 'rgba(201,168,76,0.1)':'rgba(255,255,255,0.04)', border: `1px solid ${difficulty===d?'#c9a84c':'rgba(255,255,255,0.08)'}`, borderRadius:8, padding:'0.8rem 0.4rem', color: difficulty===d?'#c9a84c':'rgba(232,228,220,0.5)', fontFamily:'sans-serif', fontSize:'0.75rem', cursor:'pointer', textAlign:'center' }}>
              {label}<br/><span style={{ fontSize:'0.6rem', color:'rgba(232,228,220,0.4)' }}>{sub}</span>
            </button>
          ))}
        </div>
        <button onClick={startGame} style={{ width:'100%', background:'linear-gradient(135deg,rgba(201,168,76,0.15),rgba(201,168,76,0.25))', border:'1px solid rgba(201,168,76,0.4)', borderRadius:8, padding:'1rem', color:'#c9a84c', fontFamily:'sans-serif', fontSize:'0.85rem', letterSpacing:'0.15em', textTransform:'uppercase', cursor:'pointer' }}>
          Начать путь →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ background:'#0a0a0f', minHeight:'100vh', display:'flex', flexDirection:'column', fontFamily:'sans-serif', position:'relative' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.5rem', borderBottom:'1px solid rgba(255,255,255,0.08)', background:'rgba(10,10,15,0.9)', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontFamily:'Georgia,serif', fontSize:'1.2rem', fontWeight:300, color:'#e8e4dc', fontStyle:'italic' }}>
          Connecting <span style={{ color:'#c9a84c' }}>the Dots</span>
        </div>
        <div style={{ display:'flex', gap:'1.2rem', alignItems:'center' }}>
          {[{ label: playerName||'Ты', val: scores.player }, { label: 'ИИ', val: scores.ai }].map((s,i) => (
            <div key={i} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'Georgia,serif', fontSize:'1.4rem', fontWeight:300, color:'#c9a84c' }}>{s.val}</div>
              <div style={{ fontSize:'0.6rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(232,228,220,0.4)' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <button onClick={() => setShowPro(true)} style={{ background:'transparent', border:'1px solid rgba(201,168,76,0.3)', borderRadius:6, padding:'0.4rem 0.9rem', color:'#c9a84c', fontSize:'0.65rem', letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer' }}>✦ Pro</button>
      </div>

      {/* Turn status */}
      <div style={{ textAlign:'center', padding:'0.8rem', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontFamily:'Georgia,serif', fontSize:'1rem', color:'#e8e4dc', fontStyle:'italic' }}>
          {gameOver ? '— Игра завершена —' : currentPlayer === 'player' ? `${playerName||'Ты'}, твой ход` : 'ИИ думает...'}
        </div>
      </div>

      {/* Board */}
      <div style={{ display:'flex', flex:1, gap:'1rem', padding:'1rem', alignItems:'flex-start', justifyContent:'center' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem' }}>
          {/* Column hover arrows */}
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${COLS},1fr)`, gap:5, width:'100%' }}>
            {Array.from({length:COLS},(_,c) => (
              <div key={c} style={{ height:20, display:'flex', alignItems:'center', justifyContent:'center', color: hintCol===c?'#c9a84c':hoveredCol===c?'rgba(232,228,220,0.4)':'transparent', fontSize:'0.8rem', transition:'color 0.2s', animation: hintCol===c?'pulse 1s ease-in-out infinite':undefined }}>▾</div>
            ))}
          </div>
          {/* Board grid */}
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:10, display:'grid', gridTemplateColumns:`repeat(${COLS},1fr)`, gap:5 }}>
            {Array.from({length:ROWS}, (_,r) =>
              Array.from({length:COLS}, (_,c) => {
                const val = board[r][c];
                const winning = isWinCell(r,c);
                return (
                  <div key={`${r}-${c}`}
                    onClick={() => handleDrop(c)}
                    onMouseEnter={() => setHoveredCol(c)}
                    onMouseLeave={() => setHoveredCol(-1)}
                    style={{
                      width:'clamp(40px,9vw,58px)', height:'clamp(40px,9vw,58px)',
                      borderRadius:'50%',
                      background: winning
                        ? 'radial-gradient(circle at 35% 35%, #ffe066, #c9a84c)'
                        : val === 'player'
                        ? 'radial-gradient(circle at 35% 35%, rgba(220,235,255,0.95), rgba(130,170,240,0.85))'
                        : val === 'ai'
                        ? 'radial-gradient(circle at 35% 35%, rgba(230,170,170,0.95), rgba(180,100,100,0.85))'
                        : 'rgba(255,255,255,0.06)',
                      boxShadow: winning
                        ? '0 0 30px rgba(201,168,76,0.6), 0 0 60px rgba(201,168,76,0.3)'
                        : val === 'player'
                        ? '0 0 14px rgba(130,170,240,0.4)'
                        : val === 'ai'
                        ? '0 0 14px rgba(180,100,100,0.3)'
                        : 'none',
                      cursor: !gameOver && currentPlayer==='player' ? 'pointer' : 'default',
                      transition: 'transform 0.1s',
                    }}
                  />
                );
              })
            )}
          </div>

          {/* Buttons under board */}
          <div style={{ display:'flex', gap:'0.6rem', marginTop:'0.3rem' }}>
            <button onClick={showHint} disabled={gameOver||currentPlayer!=='player'} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'0.6rem 1.2rem', color:'rgba(232,228,220,0.6)', fontSize:'0.7rem', letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer' }}>
              💭 Подсказка
            </button>
            <button onClick={resetGame} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'0.6rem 1.2rem', color:'rgba(232,228,220,0.6)', fontSize:'0.7rem', letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer' }}>
              ↺ Новая игра
            </button>
          </div>

          {/* Clarity */}
          {clarityScore && (
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'1rem 1.5rem', textAlign:'center', marginTop:'0.3rem' }}>
              <div style={{ fontSize:'0.6rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(232,228,220,0.4)', marginBottom:'0.3rem' }}>Индекс ясности</div>
              <div style={{ fontFamily:'Georgia,serif', fontSize:'2.5rem', fontWeight:300, color:'#c9a84c' }}>{clarityScore}</div>
            </div>
          )}
        </div>

        {/* Move History */}
        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'1rem', width:140, maxHeight:380, overflowY:'auto', flexShrink:0 }}>
          <div style={{ fontSize:'0.6rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(232,228,220,0.4)', marginBottom:'0.8rem' }}>История ходов</div>
          {moveHistory.length === 0 && <div style={{ fontSize:'0.7rem', color:'rgba(232,228,220,0.25)', textAlign:'center', marginTop:'1rem' }}>Нет ходов</div>}
          {moveHistory.map((m, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.4rem', padding:'0.35rem 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:'0.72rem', color:'rgba(232,228,220,0.6)' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background: m.who==='player'?'rgba(130,170,240,0.8)':'rgba(200,120,120,0.8)', flexShrink:0 }}/>
              <span>{m.name}</span>
              <span style={{ marginLeft:'auto', color:'rgba(232,228,220,0.35)', fontSize:'0.65rem' }}>К{m.col}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quote bar */}
      <div style={{ padding:'0.8rem 2rem', borderTop:'1px solid rgba(255,255,255,0.06)', background:'rgba(10,10,15,0.9)', textAlign:'center' }}>
        <div style={{ fontFamily:'Georgia,serif', fontSize:'0.9rem', fontStyle:'italic', color: currentQuote.color, transition:'color 0.8s' }}>"{currentQuote.text}"</div>
        <div style={{ fontSize:'0.6rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(232,228,220,0.35)', marginTop:'0.2rem' }}>— {currentQuote.author}</div>
      </div>

      {/* WIN OVERLAY */}
      {showWin && (
        <div style={{ position:'fixed', inset:0, background:'rgba(10,10,15,0.93)', zIndex:200, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', backdropFilter:'blur(20px)', padding:'2rem' }}>
          <div style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.8rem,4vw,3rem)', fontWeight:300, color:'#c9a84c', textAlign:'center', marginBottom:'0.5rem' }}>{winText.title}</div>
          <div style={{ fontSize:'0.85rem', color:'rgba(232,228,220,0.5)', textAlign:'center', marginBottom:'1.5rem', letterSpacing:'0.05em' }}>{winText.sub}</div>
          {clarityScore && <>
            <div style={{ fontSize:'0.6rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(232,228,220,0.4)', marginBottom:'0.3rem' }}>Индекс ясности</div>
            <div style={{ fontFamily:'Georgia,serif', fontSize:'4rem', fontWeight:300, color:'#c9a84c', marginBottom:'1.5rem' }}>{clarityScore}</div>
          </>}
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'1.5rem 2rem', maxWidth:440, marginBottom:'1.5rem' }}>
            <div style={{ fontSize:'0.6rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'#c9a84c', marginBottom:'0.8rem' }}>◆ AI Коуч</div>
            <div style={{ fontFamily:'Georgia,serif', fontSize:'1rem', fontStyle:'italic', color:'#e8e4dc', lineHeight:1.6 }}>{coachTips[Math.floor(Math.random()*coachTips.length)]}</div>
          </div>
          <div style={{ display:'flex', gap:'1rem' }}>
            <button onClick={resetGame} style={{ padding:'0.8rem 2rem', borderRadius:8, background:'rgba(201,168,76,0.15)', border:'1px solid rgba(201,168,76,0.4)', color:'#c9a84c', fontFamily:'sans-serif', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer' }}>Новая игра</button>
            <button onClick={() => setShowWin(false)} style={{ padding:'0.8rem 2rem', borderRadius:8, background:'transparent', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(232,228,220,0.5)', fontFamily:'sans-serif', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer' }}>Смотреть доску</button>
          </div>
        </div>
      )}

      {/* PRO MODAL */}
      {showPro && (
        <div style={{ position:'fixed', inset:0, background:'rgba(10,10,15,0.85)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(20px)' }}>
          <div style={{ background:'#0f0f18', border:'1px solid rgba(201,168,76,0.2)', borderRadius:16, padding:'2.5rem', maxWidth:400, width:'90%', position:'relative' }}>
            <button onClick={() => setShowPro(false)} style={{ position:'absolute', top:'1rem', right:'1rem', background:'none', border:'none', color:'rgba(232,228,220,0.4)', fontSize:'1.2rem', cursor:'pointer' }}>✕</button>
            <div style={{ fontFamily:'Georgia,serif', fontSize:'2rem', fontWeight:300, color:'#c9a84c', marginBottom:'0.3rem' }}>Pro</div>
            <div style={{ fontSize:'0.8rem', color:'rgba(232,228,220,0.4)', marginBottom:'1.5rem' }}>$4.99 / месяц</div>
            {['Дневник мыслей — записывай инсайты после каждой партии','Глубокий анализ каждого хода','Эксклюзивные темы: золото, кварц, обсидиан','Безлимитная история игр с экспортом','Ранний доступ к мультиплееру'].map((f,i) => (
              <div key={i} style={{ display:'flex', gap:'0.8rem', marginBottom:'0.8rem', fontSize:'0.85rem', color:'#e8e4dc', lineHeight:1.5 }}>
                <span style={{ color:'#c9a84c', flexShrink:0 }}>◆</span>{f}
              </div>
            ))}
            <button style={{ width:'100%', background:'rgba(201,168,76,0.15)', border:'1px solid rgba(201,168,76,0.4)', borderRadius:8, padding:'1rem', color:'#c9a84c', fontFamily:'sans-serif', fontSize:'0.8rem', letterSpacing:'0.12em', textTransform:'uppercase', cursor:'pointer', marginTop:'1rem' }}>7 дней бесплатно →</button>
          </div>
        </div>
      )}

      {/* HINT MODAL */}
      {showHintModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(10,10,15,0.7)', zIndex:250, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(10px)' }}>
          <div style={{ background:'#0f0f18', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'2rem', maxWidth:360, width:'90%', textAlign:'center' }}>
            <div style={{ fontSize:'2rem', marginBottom:'1rem' }}>💭</div>
            <div style={{ fontFamily:'Georgia,serif', fontSize:'1.1rem', fontStyle:'italic', color:'#e8e4dc', lineHeight:1.6, marginBottom:'0.5rem' }}>"{hintQuote.text}"</div>
            <div style={{ fontSize:'0.65rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'#c9a84c', marginBottom:'1rem' }}>— {hintQuote.author}</div>
            <div style={{ fontSize:'0.75rem', color:'rgba(232,228,220,0.4)', marginBottom:'1.5rem' }}>Рекомендую колонку {hintCol + 1}</div>
            <button onClick={() => setShowHintModal(false)} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'0.7rem 1.5rem', color:'rgba(232,228,220,0.6)', fontFamily:'sans-serif', fontSize:'0.72rem', letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer' }}>Понял →</button>
          </div>
        </div>
      )}
    </div>
  );
}
