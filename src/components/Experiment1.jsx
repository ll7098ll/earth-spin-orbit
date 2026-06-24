import React, { useState, useEffect, useRef } from 'react';
import ExperimentLayout from './ExperimentLayout';
import { Play, Pause, Sun, Star, Trash2 } from 'lucide-react';

const Experiment1 = ({ onBack }) => {
  const [time, setTime] = useState(6.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [atmosphereOff, setAtmosphereOff] = useState(false);
  const [showTrajectory, setShowTrajectory] = useState(false);
  const [stickers, setStickers] = useState([]);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Autoplay loop
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setTime(prev => {
          let nextTime = prev + 0.05;
          if (nextTime > 30.0) nextTime = 6.0;
          return nextTime;
        });
      }, 50);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  // Position calculations
  const getSunPosition = (t) => {
    const angle = ((t - 6) / 12) * Math.PI;
    const rX = 0.5 - 0.35 * Math.cos(angle);
    const rY = 0.7 - 0.5 * Math.sin(angle);
    return { x: rX, y: rY };
  };

  const getStarPosition = (t) => {
    const angle = ((t - 18) / 12) * Math.PI;
    const rX = 0.5 - 0.32 * Math.cos(angle);
    const rY = 0.7 - 0.45 * Math.sin(angle);
    return { x: rX, y: rY };
  };

  // Sticker actions
  const handleAddSunSticker = () => {
    if (time >= 6.0 && time <= 18.0) {
      const pos = getSunPosition(time);
      setStickers(prev => [...prev, { type: 'sun', time, x: pos.x, y: pos.y }]);
    } else {
      alert("🌙 지금은 해가 져서 밤입니다. 태양 딱지를 붙일 수 없습니다.");
    }
  };

  const handleAddStarSticker = () => {
    const isVisible = (time < 6.0 || time > 18.0) || atmosphereOff;
    if (!isVisible) {
      alert("☀️ 낮에는 하늘이 너무 밝아 별 딱지를 붙일 수 없습니다! 대기를 제거하거나 밤으로 시간을 이동해 주세요.");
      return;
    }
    const pos = getStarPosition(time);
    setStickers(prev => [...prev, { type: 'star', time, x: pos.x, y: pos.y }]);
  };

  const handleClearStickers = () => {
    setStickers([]);
  };

  // Time string converter
  const getTimeString = (t) => {
    let hour = Math.floor(t);
    let minute = Math.floor((t - hour) * 60);
    let displayHour = hour;
    let daySuffix = "";

    if (hour >= 24) {
      displayHour = hour - 24;
      daySuffix = "다음날 ";
    }

    let ampm = "오전";
    if (displayHour >= 12) {
      ampm = "오후";
      if (displayHour > 12) displayHour -= 12;
    } else if (displayHour === 0) {
      displayHour = 12;
    }

    let minStr = minute < 10 ? '0' + minute : minute;
    let hourStr = displayHour < 10 ? '0' + displayHour : displayHour;
    return `${daySuffix}${ampm} ${hourStr}:${minStr}`;
  };

  // Canvas drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const container = containerRef.current;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      draw(rect.width, rect.height);
    };

    const draw = (w, h) => {
      ctx.clearRect(0, 0, w, h);

      // 1. Draw Sky background
      let skyGradient = ctx.createLinearGradient(0, 0, 0, h);
      const isDay = time >= 6.0 && time <= 18.0;

      if (!atmosphereOff && isDay) {
        let intensity = Math.sin(((time - 6) / 12) * Math.PI);
        let topColor = blendColors('#020617', '#38bdf8', intensity);
        let bottomColor = blendColors('#0f172a', '#bae6fd', intensity);
        skyGradient.addColorStop(0, topColor);
        skyGradient.addColorStop(1, bottomColor);
      } else {
        skyGradient.addColorStop(0, '#030712');
        skyGradient.addColorStop(1, '#0f172a');
      }

      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, w, h);

      // 2. Draw sky coordinate grid (at night or when atmosphere is removed)
      if (atmosphereOff || !isDay) {
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 1; i < 10; i++) {
          const gridX = w * (i / 10);
          ctx.moveTo(gridX, 0); ctx.lineTo(gridX, h * 0.7);
        }
        for (let j = 1; j < 6; j++) {
          const gridY = (h * 0.7) * (j / 6);
          ctx.moveTo(0, gridY); ctx.lineTo(w, gridY);
        }
        ctx.stroke();

        // Background stars
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.25;
        // Simple procedural background stars
        for (let i = 0; i < 30; i++) {
          const starX = (Math.sin(i * 123.45) * 0.5 + 0.5) * w;
          const starY = (Math.cos(i * 678.90) * 0.5 + 0.5) * h * 0.65;
          ctx.beginPath();
          ctx.arc(starX, starY, 1.0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;
      }

      // 3. Draw Ground
      const groundY = h * 0.7;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(w, groundY);
      ctx.stroke();

      // Draw Directions
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 14px Noto Sans KR';
      ctx.textAlign = 'center';
      ctx.fillText('동쪽 (왼쪽)', w * 0.15, groundY + 25);
      ctx.fillText('남쪽 (가운데)', w * 0.5, groundY + 25);
      ctx.fillText('서쪽 (오른쪽)', w * 0.85, groundY + 25);

      // 4. Draw trajectories (if enabled)
      if (showTrajectory) {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        for (let t = 6.0; t <= 18.0; t += 0.2) {
          const p = getSunPosition(t);
          if (t === 6.0) ctx.moveTo(p.x * w, p.y * h);
          else ctx.lineTo(p.x * w, p.y * h);
        }
        ctx.stroke();

        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.beginPath();
        for (let t = 18.0; t <= 30.0; t += 0.2) {
          const p = getStarPosition(t);
          if (t === 18.0) ctx.moveTo(p.x * w, p.y * h);
          else ctx.lineTo(p.x * w, p.y * h);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 5. Draw Sun (Daytime)
      const sunPos = getSunPosition(time);
      if (isDay) {
        ctx.beginPath();
        ctx.shadowBlur = 35;
        ctx.shadowColor = '#f59e0b';
        ctx.arc(sunPos.x * w, sunPos.y * h, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#fffbeb';
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 12px Noto Sans KR';
        ctx.fillText('태양', sunPos.x * w, sunPos.y * h - 25);
      }

      // 6. Draw Star (Altair)
      const starPos = getStarPosition(time);
      const isStarVisible = (time < 6.0 || time > 18.0) || atmosphereOff;
      if (isStarVisible) {
        ctx.beginPath();
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#06b6d4';
        ctx.arc(starPos.x * w, starPos.y * h, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#e0f7fa';
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 12px Noto Sans KR';
        ctx.fillText('알타이르(독수리자리)', starPos.x * w, starPos.y * h - 22);

        // Constellation Lines
        const offsetLeftX = starPos.x * w - w * 0.08;
        const offsetLeftY = starPos.y * h + h * 0.05;
        const offsetRightX = starPos.x * w + w * 0.07;
        const offsetRightY = starPos.y * h + h * 0.06;

        ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(starPos.x * w, starPos.y * h);
        ctx.lineTo(offsetLeftX, offsetLeftY);
        ctx.moveTo(starPos.x * w, starPos.y * h);
        ctx.lineTo(offsetRightX, offsetRightY);
        ctx.stroke();

        ctx.fillStyle = 'rgba(6, 182, 212, 0.5)';
        ctx.beginPath();
        ctx.arc(offsetLeftX, offsetLeftY, 3, 0, Math.PI * 2);
        ctx.arc(offsetRightX, offsetRightY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 7. Draw Stickers
      stickers.forEach(s => {
        const sx = s.x * w;
        const sy = s.y * h;
        if (s.type === 'sun') {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(sx, sy, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = '9px Noto Sans KR';
          ctx.fillText('☀️', sx, sy + 3);
        } else {
          ctx.fillStyle = '#06b6d4';
          ctx.beginPath();
          ctx.arc(sx, sy, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = '9px Noto Sans KR';
          ctx.fillText('⭐', sx, sy + 3);
        }
      });
    };

    // Color blenders
    const blendColors = (c1, c2, w) => {
      const rgb1 = hexToRgb(c1);
      const rgb2 = hexToRgb(c2);
      const r = Math.round(rgb1.r * (1 - w) + rgb2.r * w);
      const g = Math.round(rgb1.g * (1 - w) + rgb2.g * w);
      const b = Math.round(rgb1.b * (1 - w) + rgb2.b * w);
      return `rgb(${r}, ${g}, ${b})`;
    };

    const hexToRgb = (str) => {
      if (str.startsWith('#')) {
        let r = parseInt(str.slice(1, 3), 16);
        let g = parseInt(str.slice(3, 5), 16);
        let b = parseInt(str.slice(5, 7), 16);
        return { r, g, b };
      }
      let matches = str.match(/\d+/g);
      return { r: parseInt(matches[0]), g: parseInt(matches[1]), b: parseInt(matches[2]) };
    };

    // Initial resize call
    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [time, atmosphereOff, showTrajectory, stickers]);

  // UI Components
  const simulator = (
    <div className="canvas-container" ref={containerRef}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );

  const controls = (
    <>
      <div className="control-row">
        <span className="controls-section-title">시간 조절 및 재생</span>
        <div className="control-row-time">
          <div className="time-display">{getTimeString(time)}</div>
          <div className="slider-container">
            <label htmlFor="exp1-timeSlider">시간 흐름</label>
            <input
              type="range"
              id="exp1-timeSlider"
              min="6"
              max="30"
              step="0.1"
              value={time}
              onChange={(e) => setTime(parseFloat(e.target.value))}
            />
          </div>
        </div>
        <div className="control-row-horizontal" style={{ marginTop: '0.25rem' }}>
          <button onClick={() => setIsPlaying(!isPlaying)} className={`btn ${isPlaying ? 'active' : ''}`}>
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? '일시정지' : '재생'}
          </button>
        </div>
      </div>

      <div className="control-row" style={{ marginTop: '0.5rem' }}>
        <span className="controls-section-title">관측 모드</span>
        <div className="control-row-horizontal">
          <button onClick={() => setAtmosphereOff(!atmosphereOff)} className={`btn ${atmosphereOff ? 'active' : ''}`}>
            ✨ 대기 제거 {atmosphereOff ? '활성화' : '비활성화'}
          </button>
          <button onClick={() => setShowTrajectory(!showTrajectory)} className={`btn ${showTrajectory ? 'active' : ''}`}>
            〽️ 궤적선 {showTrajectory ? '숨기기' : '표시'}
          </button>
        </div>
      </div>

      <div className="control-row" style={{ marginTop: '0.5rem' }}>
        <span className="controls-section-title">활동: 천체 딱지(스티커) 붙이기</span>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          특정 시간에 맞춘 뒤, 하늘에 천체의 위치를 기록해 보세요.
        </p>
        <div className="control-row-horizontal">
          <button onClick={handleAddSunSticker} className="btn btn-green" style={{ gap: '0.3rem' }}>
            <Sun size={14} />
            태양 딱지 부착
          </button>
          <button onClick={handleAddStarSticker} className="btn btn-green" style={{ gap: '0.3rem' }}>
            <Star size={14} />
            별 딱지 부착
          </button>
          <button
            onClick={handleClearStickers}
            className="btn"
            style={{ color: '#fda4af', borderColor: 'rgba(244,63,94,0.3)', gap: '0.3rem' }}
          >
            <Trash2 size={14} />
            딱지 지우기
          </button>
        </div>
      </div>
    </>
  );

  const studyContent = [
    {
      icon: '📖',
      title: '하루 동안 태양과 별의 위치 변화 (교과서 88~91쪽)',
      description: '하루 동안 태양이 뜨고 질 때까지, 그리고 밤하늘의 별들이 흐르는 모습은 규칙적인 운동을 나타냅니다.',
      list: [
        '<strong>태양의 위치 변화 (교과서 89쪽)</strong>: 하루 동안 태양은 <strong>동쪽 하늘에서 남쪽 하늘을 지나 서쪽 하늘</strong>로 위치가 달라집니다.',
        '<strong>관찰 권장 시각</strong>: 교과서 실험에서는 하루 동안 <strong>오전 8시 30분 무렵, 오후 12시 30분 무렵, 오후 4시 30분 무렵</strong>에 태양의 위치를 각각 측정하여 기록합니다.',
        '<strong>별의 위치 변화 (교과서 91쪽)</strong>: 별(대표적으로 여름철 밤하늘의 알타이르 별) 역시 태양과 마찬가지로 <strong>동쪽 하늘에서 남쪽 하늘을 지나 서쪽 하늘</strong>로 위치가 달라집니다.',
        '<strong>관찰 권장 시각</strong>: 밤 동안 <strong>오후 8시 무렵, 오전 0시(자정) 무렵, 오전 5시 무렵</strong>에 남쪽 하늘을 바라보고 관측하여 기록합니다.',
        '<strong>핵심 결론</strong>: 태양과 별을 포함한 하늘의 천체들은 하루 동안 <strong>동쪽에서 서쪽</strong>으로 위치가 달라지는 규칙성이 있습니다.'
      ]
    },
    {
      icon: '👓',
      title: '태양 안전 관측 및 낮에 별이 안 보이는 까닭',
      description: '태양빛은 강렬하므로 반드시 안전 규칙을 지켜 관측해야 합니다.',
      list: [
        '<strong>태양 관측 안경 착용 (교과서 88쪽)</strong>: 태양 빛은 매우 강하므로 맨눈으로 절대 보지 않고, <strong>반드시 태양 관측 안경</strong>을 착용해 눈을 보호해야 합니다.',
        '<strong>대기 산란 현상 (교과서 90쪽)</strong>: 낮에 밤하늘의 별이 보이지 않는 까닭은, <strong>태양 빛이 너무 강해 지구의 대기가 밝게 빛나기(산란) 때문</strong>입니다. 천체 관측 프로그램(시뮬레이터의 [대기 제거] 버튼)을 통해 대기를 없애면 낮에도 별이 그 자리에 계속 움직이고 있음을 볼 수 있습니다.'
      ]
    }
  ];

  const quizContent = [
    {
      question: "Q1. 하루 동안 태양과 별의 위치는 어느 쪽 하늘에서 어느 쪽 하늘로 달라질까요? (교과서 89, 91쪽)",
      options: [
        "서쪽 하늘에서 동쪽 하늘로 달라진다.",
        "동쪽 하늘에서 남쪽 하늘을 지나 서쪽 하늘로 달라진다.",
        "남쪽 하늘에서 남극 방향으로 달라진다."
      ],
      answerIndex: 1,
      explanation: "교과서 정리 활동에 명시된 대로, 하루 동안 태양과 별은 모두 '동쪽 ➔ 남쪽 ➔ 서쪽'으로 위치가 이동하는 동일한 규칙성을 보여줍니다."
    },
    {
      question: "Q2. 낮에 밤하늘의 별을 맨눈으로 볼 수 없는 까닭은 무엇인가요? (교과서 90쪽)",
      options: [
        "낮에는 우주 공간에 별들이 존재하지 않기 때문에",
        "태양 빛이 너무 강해 지구의 대기가 밝게 빛나기 때문에",
        "지구가 자전을 멈춰 별의 빛을 차단하기 때문에"
      ],
      answerIndex: 1,
      explanation: "낮에도 별은 하늘에 떠 있지만, 강렬한 태양빛에 의해 지구 대기층이 밝게 산란되므로 보이지 않는 것입니다."
    }
  ];

  return (
    <ExperimentLayout
      title="하루 동안 태양과 별의 위치 변화"
      badge="실험 01"
      onBack={onBack}
      simulator={simulator}
      controls={controls}
      studyContent={studyContent}
      quizContent={quizContent}
    />
  );
};

export default Experiment1;
