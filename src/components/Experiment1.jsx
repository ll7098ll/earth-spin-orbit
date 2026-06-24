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
      title: '하루 동안 태양과 별의 이동 경로 (교과서 88~91쪽)',
      description: `하루 동안 태양과 별은 같은 방향으로 흐르며 일정한 규칙성을 보입니다.<br/>
      <div style="margin: 8px 0; padding: 10px; background: rgba(255,255,255,0.05); border-left: 4px solid var(--accent-pink); border-radius: 4px; font-weight: bold; text-align: center;">
        천체의 이동 규칙: [동쪽 하늘] ➔ [남쪽 하늘] ➔ [서쪽 하늘] (시계 방향 ↻)
      </div>`,
      list: [
        '<strong>태양의 위치 변화 (89쪽)</strong>: 아침에 동쪽에서 떠올라 낮에 남쪽을 거쳐 저녁에 서쪽으로 집니다.',
        '<strong>태양 관측 타임라인</strong>:<br/>' +
        '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin: 5px 0; text-align: center; font-size: 0.85rem;">' +
        '  <div style="background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); padding: 4px; border-radius: 4px;"><strong>오전 8:30</strong><br/>🌅 동쪽 하늘</div>' +
        '  <div style="background: rgba(245,158,11,0.25); border: 1px solid rgba(245,158,11,0.5); padding: 4px; border-radius: 4px;"><strong>오후 12:30</strong><br/>☀️ 남쪽 (가장 높음)</div>' +
        '  <div style="background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); padding: 4px; border-radius: 4px;"><strong>오후 4:30</strong><br/>🌇 서쪽 하늘</div>' +
        '</div>',
        '<strong>별의 위치 변화 (91쪽)</strong>: 밤하늘의 별(예: 여름철 대표 별 알타이르)도 태양과 똑같이 동에서 남을 지나 서로 이동합니다.',
        '<strong>별 관측 타임라인</strong>:<br/>' +
        '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin: 5px 0; text-align: center; font-size: 0.85rem;">' +
        '  <div style="background: rgba(6,182,212,0.15); border: 1px solid rgba(6,182,212,0.3); padding: 4px; border-radius: 4px;"><strong>오후 8:00 무렵</strong><br/>✨ 동쪽 하늘</div>' +
        '  <div style="background: rgba(6,182,212,0.25); border: 1px solid rgba(6,182,212,0.5); padding: 4px; border-radius: 4px;"><strong>오전 0:00 (자정)</strong><br/>⭐ 남쪽 하늘</div>' +
        '  <div style="background: rgba(6,182,212,0.15); border: 1px solid rgba(6,182,212,0.3); padding: 4px; border-radius: 4px;"><strong>오전 5:00 무렵</strong><br/>🌌 서쪽 하늘</div>' +
        '</div>',
        '<strong>인과적 결론</strong>: 태양과 별의 이러한 하루 동안의 규칙적인 위치 변화는 실제 천체들이 도는 것이 아니라, <strong>지구가 스스로 회전하기 때문(자전)</strong>에 생기는 현상입니다.'
      ]
    },
    {
      icon: '🕶️',
      title: '안전 관측 규칙 및 대기 산란 (교과서 88~90쪽)',
      description: `강렬한 태양빛으로부터 눈을 보호하고 낮과 밤의 별 관측 차이를 이해하는 과학 원리입니다.`,
      list: [
        '<strong>⚠️ 태양 안전 관측 수칙 (88쪽)</strong>: 태양 빛은 눈에 해로우므로 맨눈이나 일반 선글라스, 망원경으로 직접 보면 절대 안 되며, <strong>반드시 태양 관측 안경(특수 필터)</strong>을 착용해야 합니다.',
        '<strong>🌤️ 낮에 별이 보이지 않는 이유 (90쪽)</strong>:<br/>' +
        '<div style="margin: 5px 0; padding: 8px; background: rgba(56,189,248,0.1); border-left: 3px solid #38bdf8; border-radius: 4px; font-size: 0.85rem; line-height: 1.4;">' +
        '  <strong>태양광 입사</strong> ➔ <strong>지구 대기 산란(Scattering)</strong> ➔ <strong>하늘 전체가 밝아짐</strong> ➔ <strong>별빛이 가려짐</strong>' +
        '</div>' +
        '천체 관측 프로그램(시뮬레이터의 [대기 제거])을 통해 대기 산란을 없새면, <strong>낮에도 별들이 하늘에서 계속 흐르고 있음</strong>을 확인할 수 있습니다.'
      ]
    }
  ];

  const quizContent = [
    {
      question: "Q1. 하루 동안 시간이 지남에 따라 태양과 밤하늘의 별들이 이동하는 규칙적인 경로와 방향은 어떻게 되나요? (교과서 89, 91쪽)",
      options: [
        "서쪽 하늘에서 남쪽 하늘을 지나 동쪽 하늘로 달라진다.",
        "동쪽 하늘에서 남쪽 하늘을 지나 서쪽 하늘로 달라진다.",
        "남쪽 하늘에서 북쪽 하늘을 지나 서쪽 하늘로 달라진다.",
        "동쪽 하늘에서 북쪽 하늘을 지나 서쪽 하늘로 달라진다."
      ],
      answerIndex: 1,
      explanation: "교과서 89쪽(태양)과 91쪽(별)에 정리된 것과 같이, 하루 동안 하늘의 모든 천체는 '동쪽 ➔ 남쪽 ➔ 서쪽'으로 이동하는 규칙성을 보여줍니다."
    },
    {
      question: "Q2. 낮에도 별들은 하늘에 떠 있지만 우리 맨눈으로 볼 수 없는 과학적인 까닭은 무엇인가요? (교과서 90쪽)",
      options: [
        "낮에는 태양의 높은 온도로 인해 별들이 잠시 증발하기 때문에",
        "태양 빛이 너무 강해 지구의 대기가 밝게 빛나기(산란) 때문에",
        "지구가 자전을 멈춰 별빛이 차단되기 때문에",
        "낮 동안 별들이 지구 반대편 우주 공간으로 모두 이동하기 때문에"
      ],
      answerIndex: 1,
      explanation: "낮에도 별은 그 자리에 있지만, 태양빛이 지구의 대기에 산란되어 하늘 전체가 별빛보다 훨씬 밝아지기 때문에 눈에 보이지 않는 것입니다."
    },
    {
      question: "Q3. 교과서 실험이나 야외에서 태양의 위치 변화를 기록하고 관찰할 때 지켜야 할 가장 중요한 안전 수칙은 무엇인가요? (교과서 88쪽)",
      options: [
        "망원경이나 쌍안경을 사용해 태양을 확대해서 오랫동안 관찰한다.",
        "일반적인 패션 선글라스를 끼고 태양을 직접 쳐다본다.",
        "맨눈으로 빠르게 태양을 흘겨보며 위치를 기록한다.",
        "반드시 태양 빛을 안전하게 차단하는 태양 관측 안경을 착용한다."
      ],
      answerIndex: 3,
      explanation: "태양 빛은 매우 강하므로 맨눈이나 일반 선글라스, 망원경 등으로 절대 직접 보면 안 되며, 반드시 안전이 검증된 태양 관측 안경을 착용해야 합니다."
    },
    {
      question: "Q4. 7월 15일 오후 8시 무렵 동쪽 하늘에서 관측된 독수리자리의 밝은 별 '알타이르'는 다음 날 오전 0시(자정) 무렵에는 어느 방향 하늘에서 관찰될까요? (교과서 90~91쪽)",
      options: [
        "서쪽 하늘",
        "동쪽 하늘",
        "남쪽 하늘",
        "북쪽 하늘"
      ],
      answerIndex: 2,
      explanation: "별은 하루 동안 동쪽에서 남쪽을 지나 서쪽으로 움직입니다. 오후 8시 무렵 동쪽 하늘에 떴던 별은 시간이 흐르며 남상하여 자정(오전 0시) 무렵에는 남쪽 하늘 중앙(남중)에 오게 됩니다."
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
