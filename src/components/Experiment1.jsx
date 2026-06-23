import React, { useState, useEffect, useRef } from 'react';
import ExperimentLayout from './ExperimentLayout';
import { Play, Pause, Sun, Star, Trash2 } from 'lucide-react';

const Experiment1 = ({ onBack }) => {
  const [time, setTime] = useState(6.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [glassesOn, setGlassesOn] = useState(false);
  const [atmosphereOff, setAtmosphereOff] = useState(false);
  const [showTrajectory, setShowTrajectory] = useState(false);
  const [stickers, setStickers] = useState([]);
  const [warningDismissed, setWarningDismissed] = useState(false);

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
      if (!glassesOn) {
        alert("⚠️ 태양 빛이 너무 눈부셔 태양 딱지를 정확하게 붙일 수 없습니다! 먼저 태양 관측 안경을 착용해 주세요.");
        return;
      }
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
        if (glassesOn) {
          ctx.beginPath();
          ctx.arc(sunPos.x * w, sunPos.y * h, 14, 0, Math.PI * 2);
          ctx.fillStyle = '#22c55e';
          ctx.fill();
          ctx.strokeStyle = '#16a34a';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#fca5a5';
          ctx.font = 'bold 11px Noto Sans KR';
          ctx.fillText('필터 통과한 태양', sunPos.x * w, sunPos.y * h - 22);
        } else {
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
  }, [time, glassesOn, atmosphereOff, showTrajectory, stickers]);

  // Adjust glare overlay DOM directly (since overlay uses CSS custom properties)
  useEffect(() => {
    const sunPos = getSunPosition(time);
    const isDay = time >= 6.0 && time <= 18.0;
    const glare = document.getElementById('exp1-glareOverlay');
    const container = containerRef.current;
    
    if (glare && container) {
      if (sunPos.y < 0.7 && !glassesOn && isDay) {
        glare.classList.add('active');
        const rect = container.getBoundingClientRect();
        const pixelX = sunPos.x * rect.width;
        const pixelY = sunPos.y * rect.height;
        glare.style.setProperty('--sun-x', `${pixelX}px`);
        glare.style.setProperty('--sun-y', `${pixelY}px`);
      } else {
        glare.classList.remove('active');
      }
    }
  }, [time, glassesOn]);

  // UI Components
  const simulator = (
    <>
      {/* Safety Warning Banner */}
      {!warningDismissed && (
        <div className={`safety-warning ${glassesOn ? 'safe' : ''}`}>
          <span style={{ fontSize: '1.2rem' }}>{glassesOn ? '🟢' : '⚠️'}</span>
          <div>
            {glassesOn ? (
              <span>
                <strong>관측 안경 착용 완료!</strong> 특수 필터 덕분에 눈을 보호하고 태양의 위치를 뚜렷하게 관찰할 수 있습니다.
              </span>
            ) : (
              <span>
                <strong>맨눈 관측 주의!</strong> 태양 빛은 매우 강해 눈에 해롭습니다. 
                하늘을 안전하게 관찰하기 위해 <strong>[태양 관측 안경 착용]</strong>을 활성화해 주세요.
              </span>
            )}
          </div>
          <button className="warning-close-btn" onClick={() => setWarningDismissed(true)}>
            &times;
          </button>
        </div>
      )}

      {/* Sky Canvas Container */}
      <div className="canvas-container" ref={containerRef}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div className="glare-overlay" id="exp1-glareOverlay" />
        <div className={`filter-overlay ${glassesOn ? 'active' : ''}`}>
          <span className="filter-label">관측 안경 필터 작동 중</span>
        </div>
      </div>
    </>
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
          <button onClick={() => setGlassesOn(!glassesOn)} className={`btn ${glassesOn ? 'active' : ''}`}>
            👓 안경 필터 {glassesOn ? '해제' : '착용'}
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
      title: '하루 동안 태양과 별의 위치 변화',
      description: '태양과 별은 하루 동안 일정한 규칙을 가지고 동쪽에서 떠올라 서쪽으로 이동하여 지게 됩니다.',
      list: [
        '<strong>태양의 위치 변화</strong>: 오전에는 동쪽 하늘에 보이다가 점차 남쪽 하늘을 지나 오후에는 서쪽 하늘로 움직입니다.',
        '<strong>별의 위치 변화</strong>: 태양과 마찬가지로 동쪽 하늘에서 떠올라 남쪽 하늘을 거쳐 서쪽 하늘로 이동합니다.',
        '<strong>공통적 규칙</strong>: 하늘에 보이는 모든 천체는 하루 동안 <strong>동쪽 ➔ 남쪽 ➔ 서쪽</strong>으로 이동하는 흐름을 보여줍니다.'
      ]
    },
    {
      icon: '👓',
      title: '안전한 태양 관측 방법',
      description: '태양은 빛과 열이 매우 강하므로 맨눈으로 직접 보거나 망원경 등을 통해 보면 눈에 심각한 피해를 입을 수 있습니다.',
      list: [
        '<strong>태양 관측 안경 착용</strong>: 특수 필터가 장착된 태양 관측 안경을 착용해야 눈을 안전하게 지키며 태양의 둥근 모양을 볼 수 있습니다.',
        '낮에 별이 보이지 않는 까닭은 태양빛이 지구 대기층을 눈부시게 산란시켜 하늘 전체를 밝히기 때문입니다. 시뮬레이션의 [대기 제거] 버튼을 통해 대기를 없애면 낮에도 태양과 별이 한 하늘에 공존하는 것을 확인할 수 있습니다.'
      ]
    }
  ];

  const quizContent = [
    {
      question: "Q1. 하루 동안 태양과 별은 어느 쪽 하늘에서 떠올라 어느 쪽 하늘로 위치가 달라질까요?",
      options: [
        "서쪽 하늘에서 동쪽 하늘로 이동한다.",
        "동쪽 하늘에서 남쪽 하늘을 지나 서쪽 하늘로 이동한다.",
        "남쪽 하늘에서 동쪽 하늘로 이동한다."
      ],
      answerIndex: 1,
      explanation: "하루 동안 태양과 별은 모두 동쪽 하늘에서 떠서 남쪽 하늘을 지나 서쪽 하늘로 이동하는 규칙적인 변화를 보입니다."
    },
    {
      question: "Q2. 낮에 밤하늘의 별이 보이지 않는 근본적인 까닭은 무엇일까요?",
      options: [
        "낮에는 우주 공간에 별들이 존재하지 않기 때문에",
        "태양 빛이 너무 강해 지구의 대기가 밝게 빛나기 때문에",
        "지구가 자전을 멈춰 별의 빛을 차단하기 때문에"
      ],
      answerIndex: 1,
      explanation: "낮에도 별은 우주 공간에 존재하지만, 강렬한 태양빛에 의해 지구 대기층이 매우 밝아지므로 맨눈으로 볼 수 없게 됩니다. 대기를 제거하면 낮에도 별의 실제 궤적을 확인해 볼 수 있습니다."
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
