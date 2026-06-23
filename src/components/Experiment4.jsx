import React, { useState, useEffect, useRef } from 'react';
import ExperimentLayout from './ExperimentLayout';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Play, Pause } from 'lucide-react';

const Experiment4 = ({ onBack }) => {
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [activePosition, setActivePosition] = useState('ga'); // 'ga' | 'na' | 'da' | 'ra'
  const [showLines, setShowLines] = useState(true);
  const [showNames, setShowNames] = useState(true);

  const threeContainerRef = useRef(null);
  const constCanvasRef = useRef(null);

  // Animation refs to bypass React state re-render lags
  const isOrbitingRef = useRef(isOrbiting);
  const orbitAngleRef = useRef(0);
  const showLinesRef = useRef(showLines);
  const showNamesRef = useRef(showNames);
  const activePositionRef = useRef(activePosition);

  // Sync state values with refs
  useEffect(() => {
    isOrbitingRef.current = isOrbiting;
  }, [isOrbiting]);

  useEffect(() => {
    showLinesRef.current = showLines;
  }, [showLines]);

  useEffect(() => {
    showNamesRef.current = showNames;
  }, [showNames]);

  useEffect(() => {
    activePositionRef.current = activePosition;
  }, [activePosition]);

  // Constellations coordinates
  const constellations = {
    ga: {
      name: "사자자리",
      stars: [
        { x: 0.5, y: 0.35, size: 4, name: "레굴루스" },
        { x: 0.52, y: 0.48, size: 2.5 },
        { x: 0.44, y: 0.45, size: 2.5 },
        { x: 0.40, y: 0.38, size: 2.5 },
        { x: 0.43, y: 0.28, size: 2 },
        { x: 0.48, y: 0.25, size: 2 },
        { x: 0.65, y: 0.48, size: 3, name: "데네볼라" },
        { x: 0.60, y: 0.38, size: 2 },
        { x: 0.56, y: 0.56, size: 2.5 }
      ],
      lines: [
        [0, 2], [2, 3], [3, 4], [4, 5],
        [2, 8], [8, 5], [0, 8],
        [0, 7], [7, 6], [8, 6]
      ]
    },
    na: {
      name: "독수리자리",
      stars: [
        { x: 0.5, y: 0.45, size: 5, name: "알타이르" },
        { x: 0.48, y: 0.38, size: 2 },
        { x: 0.52, y: 0.52, size: 2 },
        { x: 0.4, y: 0.35, size: 2.5 },
        { x: 0.32, y: 0.28, size: 2 },
        { x: 0.6, y: 0.55, size: 3 },
        { x: 0.68, y: 0.65, size: 2.5 },
        { x: 0.56, y: 0.28, size: 2.5 },
        { x: 0.62, y: 0.2, size: 2 }
      ],
      lines: [
        [1, 0], [0, 2],
        [3, 1], [4, 3],
        [5, 2], [6, 5],
        [7, 0], [8, 7]
      ]
    },
    da: {
      name: "페가수스자리",
      stars: [
        { x: 0.45, y: 0.35, size: 4, name: "마르카브" },
        { x: 0.6, y: 0.38, size: 4, name: "셰아트" },
        { x: 0.62, y: 0.55, size: 3.5, name: "알게니브" },
        { x: 0.42, y: 0.52, size: 3.5, name: "알페라츠" },
        { x: 0.3, y: 0.3, size: 2 },
        { x: 0.22, y: 0.28, size: 2 },
        { x: 0.72, y: 0.32, size: 2.5 },
        { x: 0.8, y: 0.28, size: 2 },
        { x: 0.72, y: 0.65, size: 2 },
        { x: 0.78, y: 0.75, size: 2 }
      ],
      lines: [
        [0, 1], [1, 3], [3, 2], [2, 0],
        [0, 4], [4, 5],
        [1, 6], [6, 7],
        [2, 8], [8, 9]
      ]
    },
    ra: {
      name: "오리온자리",
      stars: [
        { x: 0.42, y: 0.28, size: 4.5, name: "베텔게우스" },
        { x: 0.58, y: 0.68, size: 5, name: "리겔" },
        { x: 0.56, y: 0.3, size: 3.5 },
        { x: 0.44, y: 0.65, size: 3.5 },
        { x: 0.48, y: 0.48, size: 3 },
        { x: 0.5, y: 0.49, size: 3 },
        { x: 0.52, y: 0.5, size: 3 },
        { x: 0.49, y: 0.22, size: 2 },
        { x: 0.38, y: 0.42, size: 2 },
        { x: 0.36, y: 0.52, size: 2 }
      ],
      lines: [
        [0, 2], [2, 1], [1, 3], [3, 0],
        [4, 5], [5, 6],
        [0, 7], [2, 7],
        [0, 8], [8, 9]
      ]
    }
  };

  // Three.js and 2D canvas effect
  useEffect(() => {
    const threeContainer = threeContainerRef.current;
    const constCanvas = constCanvasRef.current;
    if (!threeContainer || !constCanvas) return;

    const constCtx = constCanvas.getContext('2d');
    let scene, camera, renderer, controls;
    let earthMesh, sunMesh, orbitLine;
    let sunEarthLine, midnightLine;
    let animationId = null;

    // Initialize 3D Heliocentric Model
    const init3D = () => {
      let w = threeContainer.clientWidth || 400;
      let h = threeContainer.clientHeight || 300;

      scene = new THREE.Scene();
      scene.background = new THREE.Color('#02020a');

      // Wide/high viewpoint looking down on orbit, preventing cuts
      camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
      camera.position.set(0, 18, 30); // Moved camera back to prevent orbital labels from being cut off

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(window.devicePixelRatio);
      threeContainer.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;

      const ambient = new THREE.AmbientLight(0xffffff, 0.85);
      scene.add(ambient);

      // Sun (Center)
      const sunGeo = new THREE.SphereGeometry(1.2, 32, 32);
      const sunTex = createSunTexture();
      const sunMat = new THREE.MeshBasicMaterial({ map: sunTex });
      sunMesh = new THREE.Mesh(sunGeo, sunMat);
      scene.add(sunMesh);

      // Orbit Line (blue circle)
      const orbitPoints = [];
      const radius = 5.2;
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        orbitPoints.push(new THREE.Vector3(radius * Math.cos(theta), 0, radius * Math.sin(theta)));
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMat = new THREE.LineBasicMaterial({ color: 0x4f46e5, opacity: 0.5, transparent: true });
      orbitLine = new THREE.Line(orbitGeo, orbitMat);
      scene.add(orbitLine);

      // Earth Sphere with procedural texture
      const earthGeo = new THREE.SphereGeometry(0.5, 64, 64);
      const earthTex = createEarthTexture();
      const earthMat = new THREE.MeshStandardMaterial({
        map: earthTex,
        roughness: 0.5
      });
      earthMesh = new THREE.Mesh(earthGeo, earthMat);
      earthMesh.rotation.z = -0.41;
      earthMesh.position.set(radius * Math.cos(orbitAngleRef.current), 0, radius * Math.sin(orbitAngleRef.current));
      scene.add(earthMesh);

      // Position Markers for Seasons
      createPositionMarker(radius * Math.cos(0), radius * Math.sin(0), 0xa7f3d0); // 가 (봄)
      createPositionMarker(radius * Math.cos(Math.PI*0.5), radius * Math.sin(Math.PI*0.5), 0x06b6d4); // 나 (여름)
      createPositionMarker(radius * Math.cos(Math.PI), radius * Math.sin(Math.PI), 0xfef08a); // 다 (가을)
      createPositionMarker(radius * Math.cos(Math.PI*1.5), radius * Math.sin(Math.PI*1.5), 0xfca5a5); // 라 (겨울)

      // Light ray line (Sun to Earth)
      const sunEarthGeo = new THREE.BufferGeometry();
      const sunEarthPos = new Float32Array(6); // 2 points (0,0,0) and (x,y,z)
      sunEarthGeo.setAttribute('position', new THREE.BufferAttribute(sunEarthPos, 3));
      const sunEarthMat = new THREE.LineBasicMaterial({ color: 0xfef08a, opacity: 0.6, transparent: true });
      sunEarthLine = new THREE.Line(sunEarthGeo, sunEarthMat);
      scene.add(sunEarthLine);

      // Midnight line (Dashed glowing line outwards)
      const midnightGeo = new THREE.BufferGeometry();
      const midnightPos = new Float32Array(6);
      midnightGeo.setAttribute('position', new THREE.BufferAttribute(midnightPos, 3));
      const midnightMat = new THREE.LineDashedMaterial({
        color: 0x38bdf8,
        dashSize: 0.25,
        gapSize: 0.15,
        linewidth: 2.5
      });
      midnightLine = new THREE.Line(midnightGeo, midnightMat);
      scene.add(midnightLine);

      // 3D Sprite Labels for Constellations
      create3DLabel("사자자리 (봄)", 8.5, 0.5, 0, "#10b981");
      create3DLabel("독수리자리 (여름)", 0, 0.5, 8.5, "#06b6d4");
      create3DLabel("페가수스자리 (가을)", -8.5, 0.5, 0, "#ec4899");
      create3DLabel("오리온자리 (겨울)", 0, 0.5, -8.5, "#fef08a");
    };

    // Draw 3D Text sprite
    const create3DLabel = (text, x, y, z, color) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = 'rgba(15, 18, 38, 0.85)';
      ctx.strokeStyle = color || '#06b6d4';
      ctx.lineWidth = 3;
      
      // Rounded rect
      ctx.beginPath();
      ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 12);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Noto Sans KR';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(x, y, z);
      sprite.scale.set(3, 0.75, 1);
      scene.add(sprite);
    };

    const createPositionMarker = (x, z, color) => {
      const geo = new THREE.SphereGeometry(0.15, 16, 16);
      const mat = new THREE.MeshBasicMaterial({ color: color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 0, z);
      scene.add(mesh);
    };

    const createSunTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 256;
      const ctx = canvas.getContext('2d');
      let grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grd.addColorStop(0, '#ff4500');
      grd.addColorStop(0.3, '#ff8c00');
      grd.addColorStop(0.7, '#ffa500');
      grd.addColorStop(1, '#ffd700');
      ctx.fillStyle = grd; ctx.fillRect(0, 0, canvas.width, canvas.height);
      return new THREE.CanvasTexture(canvas);
    };

    const createEarthTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 256;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = '#0a192f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.moveTo(125, 40); ctx.quadraticCurveTo(190, 25, 250, 40); ctx.lineTo(300, 75); ctx.lineTo(275, 120); ctx.lineTo(225, 175); ctx.lineTo(190, 140); ctx.closePath();
      ctx.fill();

      // Red dot for Korea
      ctx.beginPath(); ctx.arc(262, 70, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444'; ctx.fill();

      return new THREE.CanvasTexture(canvas);
    };

    // Draw 2D Constellation Screen
    const drawConstellation = () => {
      const w = constCanvas.width / (window.devicePixelRatio || 1);
      const h = constCanvas.height / (window.devicePixelRatio || 1);
      if (w === 0 || h === 0) return;

      constCtx.clearRect(0, 0, w, h);

      // Gradient bg
      let skyGrd = constCtx.createRadialGradient(w*0.5, h*0.5, 10, w*0.5, h*0.5, w*0.7);
      skyGrd.addColorStop(0, '#090526');
      skyGrd.addColorStop(1, '#02020a');
      constCtx.fillStyle = skyGrd;
      constCtx.fillRect(0, 0, w, h);

      // Background stars
      constCtx.fillStyle = '#fff';
      constCtx.globalAlpha = 0.3;
      for (let i = 0; i < 40; i++) {
        const sx = (Math.sin(i * 44.55) * 0.5 + 0.5) * w;
        const sy = (Math.cos(i * 66.77) * 0.5 + 0.5) * h;
        constCtx.beginPath();
        constCtx.arc(sx, sy, 0.8, 0, Math.PI * 2);
        constCtx.fill();
      }
      constCtx.globalAlpha = 1.0;

      const constData = constellations[activePositionRef.current];
      if (!constData) return;

      // Draw constellation lines
      if (showLinesRef.current) {
        constCtx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
        constCtx.lineWidth = 1.5;
        constCtx.beginPath();
        constData.lines.forEach(line => {
          const startStar = constData.stars[line[0]];
          const endStar = constData.stars[line[1]];
          constCtx.moveTo(startStar.x * w, startStar.y * h);
          constCtx.lineTo(endStar.x * w, endStar.y * h);
        });
        constCtx.stroke();
      }

      // Draw stars and name tags
      constData.stars.forEach(star => {
        const sx = star.x * w;
        const sy = star.y * h;

        constCtx.beginPath();
        constCtx.shadowBlur = 15;
        constCtx.shadowColor = '#fff';
        constCtx.arc(sx, sy, star.size, 0, Math.PI * 2);
        constCtx.fillStyle = '#fff';
        constCtx.fill();
        constCtx.shadowBlur = 0;

        if (showNamesRef.current && star.name) {
          constCtx.fillStyle = '#a5b4fc';
          constCtx.font = '11px Noto Sans KR';
          constCtx.fillText(star.name, sx + 8, sy + 4);
        }
      });
    };

    // Resizers
    const resizeConstCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = constCanvas.parentNode.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      constCanvas.width = rect.width * dpr;
      constCanvas.height = rect.height * dpr;
      constCtx.scale(dpr, dpr);
      drawConstellation();
    };

    const resize3D = () => {
      const w = threeContainer.clientWidth;
      const h = threeContainer.clientHeight;
      if (w === 0 || h === 0 || !camera) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeAll = () => {
      resize3D();
      resizeConstCanvas();
    };

    init3D();
    resizeAll();

    // Map angle to season position
    const updateSeasonFromAngle = (angle) => {
      let targetPos = "ga";
      if (angle >= Math.PI * 0.25 && angle < Math.PI * 0.75) targetPos = "na";
      else if (angle >= Math.PI * 0.75 && angle < Math.PI * 1.25) targetPos = "da";
      else if (angle >= Math.PI * 1.25 && angle < Math.PI * 1.75) targetPos = "ra";
      else targetPos = "ga";

      if (targetPos !== activePositionRef.current) {
        // Sync React state
        setActivePosition(targetPos);
      }
    };

    // Animation Loop
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (isOrbitingRef.current) {
        orbitAngleRef.current += 0.003;
        if (orbitAngleRef.current > Math.PI * 2) {
          orbitAngleRef.current -= Math.PI * 2;
        }

        const radius = 5.2;
        if (earthMesh) {
          earthMesh.position.set(radius * Math.cos(orbitAngleRef.current), 0, radius * Math.sin(orbitAngleRef.current));
          earthMesh.rotation.y += 0.02; // Rotate Earth
        }

        updateSeasonFromAngle(orbitAngleRef.current);
      }

      // Sync sunlight lines and midnight dashed vectors
      if (earthMesh) {
        const earthPos = earthMesh.position;
        const dir = new THREE.Vector3().copy(earthPos).normalize();

        if (sunEarthLine) {
          const pos = sunEarthLine.geometry.attributes.position.array;
          pos[0] = 0; pos[1] = 0; pos[2] = 0;
          pos[3] = earthPos.x; pos[4] = earthPos.y; pos[5] = earthPos.z;
          sunEarthLine.geometry.attributes.position.needsUpdate = true;
        }

        if (midnightLine) {
          const pos = midnightLine.geometry.attributes.position.array;
          const outerPoint = new THREE.Vector3().copy(dir).multiplyScalar(9.5);
          pos[0] = earthPos.x; pos[1] = earthPos.y; pos[2] = earthPos.z;
          pos[3] = outerPoint.x; pos[4] = outerPoint.y; pos[5] = outerPoint.z;
          midnightLine.geometry.attributes.position.needsUpdate = true;
          midnightLine.computeLineDistances();
        }
      }

      if (controls) controls.update();
      if (renderer) renderer.render(scene, camera);

      drawConstellation();
    };

    animate();
    window.addEventListener('resize', resizeAll);

    // Clean WebGL resources on unmount
    return () => {
      window.removeEventListener('resize', resizeAll);
      if (animationId) cancelAnimationFrame(animationId);
      
      if (renderer) {
        threeContainer.removeChild(renderer.domElement);
        renderer.dispose();
      }
      if (controls) controls.dispose();
      if (earthMesh) {
        earthMesh.geometry.dispose();
        earthMesh.material.dispose();
        if (earthMesh.material.map) earthMesh.material.map.dispose();
      }
      if (sunMesh) {
        sunMesh.geometry.dispose();
        sunMesh.material.dispose();
        if (sunMesh.material.map) sunMesh.material.map.dispose();
      }
      if (orbitLine) {
        orbitLine.geometry.dispose();
        orbitLine.material.dispose();
      }
      if (sunEarthLine) {
        sunEarthLine.geometry.dispose();
        sunEarthLine.material.dispose();
      }
      if (midnightLine) {
        midnightLine.geometry.dispose();
        midnightLine.material.dispose();
      }
    };
  }, []);

  // Update Three.js positions directly when user clicks a specific season button manually
  const handleSetPosition = (pos) => {
    setIsOrbiting(false);
    setActivePosition(pos);

    let angle = 0;
    if (pos === "ga") angle = 0;
    else if (pos === "na") angle = Math.PI * 0.5;
    else if (pos === "da") angle = Math.PI;
    else if (pos === "ra") angle = Math.PI * 1.5;

    orbitAngleRef.current = angle;
  };

  const getSeasonTitle = () => {
    if (activePosition === 'ga') return '봄철 남쪽 하늘 별자리 (사자자리)';
    if (activePosition === 'na') return '여름철 남쪽 하늘 별자리 (독수리자리)';
    if (activePosition === 'da') return '가을철 남쪽 하늘 별자리 (페가수스자리)';
    return '겨울철 남쪽 하늘 별자리 (오리온자리)';
  };

  const getSeasonText = () => {
    if (activePosition === 'ga') return '🌱 계절: 봄 (가 위치)';
    if (activePosition === 'na') return '☀️ 계절: 여름 (나 위치)';
    if (activePosition === 'da') return '🍂 계절: 가을 (다 위치)';
    return '❄️ 계절: 겨울 (라 위치)';
  };

  const getSeasonColor = () => {
    if (activePosition === 'ga') return 'var(--accent-green)';
    if (activePosition === 'na') return 'var(--secondary-glow)';
    if (activePosition === 'da') return 'var(--accent-pink)';
    return '#f8fafc';
  };

  const simulator = (
    <div className="viewport-row">
      {/* 3D Orbit View */}
      <div className="viewport-box" ref={threeContainerRef}>
        <span className="viewport-title">태양계 공전 궤도 (태양 중심 공전)</span>
      </div>

      {/* 2D Constellation View */}
      <div className="viewport-box">
        <span className="viewport-title" id="exp4-constTitle">{getSeasonTitle()}</span>
        <canvas ref={constCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
    </div>
  );

  const controls = (
    <>
      <div className="control-row">
        <span className="controls-section-title">지구 공전 조작</span>
        <div className="control-row-horizontal">
          <button onClick={() => setIsOrbiting(!isOrbiting)} className={`btn ${isOrbiting ? 'active' : ''}`}>
            {isOrbiting ? <Pause size={14} /> : <Play size={14} />}
            {isOrbiting ? '공전 일시정지' : '공전 시작'}
          </button>
        </div>
      </div>

      <div className="control-row" style={{ marginTop: '0.5rem' }}>
        <span className="controls-section-title">공전 위치 수동 설정</span>
        <div className="control-row-horizontal">
          <button onClick={() => handleSetPosition('ga')} className={`btn ${activePosition === 'ga' ? 'active' : ''}`}>
            가 (봄 | 4월)
          </button>
          <button onClick={() => handleSetPosition('na')} className={`btn ${activePosition === 'na' ? 'active' : ''}`}>
            나 (여름 | 7월)
          </button>
          <button onClick={() => handleSetPosition('da')} className={`btn ${activePosition === 'da' ? 'active' : ''}`}>
            다 (가을 | 10월)
          </button>
          <button onClick={() => handleSetPosition('ra')} className={`btn ${activePosition === 'ra' ? 'active' : ''}`}>
            라 (겨울 | 1월)
          </button>
        </div>
        
        <div
          className="status-badge"
          style={{
            marginTop: '0.5rem',
            color: getSeasonColor(),
            borderColor: activePosition === 'ra' ? 'rgba(255,255,255,0.2)' : 'rgba(6, 182, 212, 0.3)',
            alignSelf: 'flex-start'
          }}
        >
          {getSeasonText()}
        </div>
      </div>

      <div className="control-row" style={{ marginTop: '0.5rem' }}>
        <span className="controls-section-title">별자리 뷰 설정</span>
        <div className="control-row-horizontal">
          <button onClick={() => setShowLines(!showLines)} className={`btn ${showLines ? 'active' : ''}`}>
            📐 별자리 선 {showLines ? '숨기기' : '표시'}
          </button>
          <button onClick={() => setShowNames(!showNames)} className={`btn ${showNames ? 'active' : ''}`}>
            🏷️ 별의 이름 {showNames ? '숨기기' : '표시'}
          </button>
        </div>
      </div>
    </>
  );

  const studyContent = [
    {
      icon: '🌌',
      title: '지구의 공전 (Revolution)',
      description: '지구가 태양을 중심으로 일 년(365일)에 한 바퀴씩 서쪽에서 동쪽으로 도는 운동을 **지구의 공전**이라고 합니다.',
      list: [
        '<strong>공전 방향</strong>: 지구는 자전과 동일한 방향인 <strong>서쪽에서 동쪽</strong>(태양의 북극 위에서 바라볼 때 시계 반대 방향)으로 공전합니다.',
        '<strong>자전축의 경사</strong>: 지구의 자전축은 기울어진 채 항상 동일한 방향(우측 위)을 향해 유지된 채 공전합니다.'
      ]
    },
    {
      icon: '📐',
      title: '계절별 별자리가 달라지는 원리',
      description: '우리는 지구의 공전으로 인해 매일 한밤중에 바라보는 외계 우주 공간의 방향이 달라지게 됩니다.',
      list: [
        '<strong>한밤중의 시선 (태양 반대편)</strong>: 지구에서 한밤중(오후 9시 무렵)에 남쪽 밤하늘을 올려다볼 때, 우리는 항상 <strong>태양의 정반대 방향</strong>의 우주 공간을 쳐다봅니다.',
        '<strong>시선 방향의 변화</strong>: 지구가 공전 궤도를 따라 이동하면서 태양 반대편의 우주 공간 방향이 계절마다 달라지고, 이에 따라 그 방향에 있는 별자리가 다르게 보입니다. (예: 봄에는 사자자리, 여름에는 독수리자리 등)',
        '<strong>태양 방향의 별자리</strong>: 태양 쪽에 위치한 별자리는 낮에 태양과 함께 뜨기 때문에 태양빛이 너무 밝아서 관측할 수 없습니다.'
      ]
    }
  ];

  const quizContent = [
    {
      question: "Q1. 지구가 태양을 중심으로 일 년에 한 바퀴씩 회전하는 운동을 무엇이라 하나요?",
      options: [
        "지구의 자전",
        "지구의 공전",
        "천체의 일주운동"
      ],
      answerIndex: 1,
      explanation: "지구가 태양 주위를 도는 것을 **공전**이라고 하며, 하루에 한 바퀴씩 스스로 도는 것을 **자전**이라고 합니다."
    },
    {
      question: "Q2. 계절에 따라 밤하늘에 관찰할 수 있는 대표적인 별자리가 달라지는 근본 요인은 무엇인가요?",
      options: [
        "별자리들이 계절마다 스스로 다른 은하계로 이동하기 때문이다.",
        "지구가 공전하면서 계절마다 한밤중에 지구에서 바라보는 우주 공간의 방향이 달라지기 때문이다.",
        "지구의 자전 속도가 계절마다 급격하게 바뀌기 때문이다."
      ],
      answerIndex: 1,
      explanation: "지구가 공전하면서 태양을 기준으로 지구의 위치가 달라지고, 한밤중(태양 반대편)에 지구의 관측자가 바라보게 되는 남쪽 하늘 방향의 우주 공간이 바뀌어 다른 별자리를 관찰하게 됩니다."
    }
  ];

  return (
    <ExperimentLayout
      title="지구의 공전과 계절별 별자리"
      badge="실험 04"
      onBack={onBack}
      simulator={simulator}
      controls={controls}
      studyContent={studyContent}
      quizContent={quizContent}
    />
  );
};

export default Experiment4;
