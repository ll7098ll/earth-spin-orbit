import React, { useState, useEffect, useRef } from 'react';
import ExperimentLayout from './ExperimentLayout';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Play, Pause, RefreshCw } from 'lucide-react';

const Experiment2 = ({ onBack }) => {
  const [isRotating, setIsRotating] = useState(false);
  const [rotationDirection, setRotationDirection] = useState(1); // 1: 서->동, -1: 동->서

  const threeContainerRef = useRef(null);
  const observerCanvasRef = useRef(null);

  // Refs to share state with the animation loop without causing constant re-renders
  const isRotatingRef = useRef(isRotating);
  const rotationDirectionRef = useRef(rotationDirection);
  const earthAngleRef = useRef(0);

  // Keep refs in sync with state
  useEffect(() => {
    isRotatingRef.current = isRotating;
  }, [isRotating]);

  useEffect(() => {
    rotationDirectionRef.current = rotationDirection;
  }, [rotationDirection]);

  // ThreeJS & 2D canvas initialization and rendering loop
  useEffect(() => {
    const threeContainer = threeContainerRef.current;
    const obsCanvas = observerCanvasRef.current;
    if (!threeContainer || !obsCanvas) return;

    const obsCtx = obsCanvas.getContext('2d');
    let scene, camera, renderer, controls;
    let earthMesh, axisLine, sunLightMesh, starLightMesh, pinMesh;
    let animationId = null;

    // 1. Initialize 3D Space View
    const init3D = () => {
      let w = threeContainer.clientWidth || 400;
      let h = threeContainer.clientHeight || 300;

      scene = new THREE.Scene();
      scene.background = new THREE.Color('#02020a');

      camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
      camera.position.set(0, 5, 12);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(window.devicePixelRatio);
      threeContainer.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;

      const ambient = new THREE.AmbientLight(0xffffff, 0.85);
      scene.add(ambient);

      // Create Earth Sphere with procedural texture
      const earthGeo = new THREE.SphereGeometry(2, 64, 64);
      const earthTex = createEarthTexture();
      const earthMat = new THREE.MeshStandardMaterial({
        map: earthTex,
        roughness: 0.6
      });
      earthMesh = new THREE.Mesh(earthGeo, earthMat);
      earthMesh.rotation.z = -0.41; // 23.5 degrees tilt
      scene.add(earthMesh);

      // Korea Pin (Cone representing the observer)
      const pinGeo = new THREE.ConeGeometry(0.08, 0.3, 16);
      pinGeo.rotateX(Math.PI / 2);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      pinMesh = new THREE.Mesh(pinGeo, pinMat);

      // Position Pin on Earth at Seoul's coordinates aligned with the procedural texture red dot (525, 140)
      const targetU = 525 / 1024;
      const targetV = 1 - 140 / 512;
      const theta = targetU * 2 * Math.PI;
      const phi = (1 - targetV) * Math.PI;
      const radius = 2.0;

      const px = -radius * Math.cos(theta) * Math.sin(phi);
      const py = radius * Math.cos(phi);
      const pz = radius * Math.sin(theta) * Math.sin(phi);

      pinMesh.position.set(px, py, pz);
      pinMesh.lookAt(new THREE.Vector3(0,0,0));
      pinMesh.position.multiplyScalar(1.04); // Float slightly above surface
      earthMesh.add(pinMesh);

      // 1. Local Compass Rose (N, S, E, W direction lines on the ground)
      const compassGroup = new THREE.Group();
      
      const createDirectionLine = (dir, length, color) => {
        const points = [new THREE.Vector3(0, 0, 0), dir.clone().multiplyScalar(length)];
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
        return new THREE.Line(geo, mat);
      };
      
      // North (+Y), South (-Y), East (+X), West (-X)
      const lineN = createDirectionLine(new THREE.Vector3(0, 0.4, 0), 0.4, 0x3b82f6); // Blue for North
      const lineS = createDirectionLine(new THREE.Vector3(0, -0.4, 0), 0.6, 0xef4444); // Red for South (Sight direction, longer)
      const lineE = createDirectionLine(new THREE.Vector3(0.4, 0, 0), 0.4, 0x10b981); // Green for East
      const lineW = createDirectionLine(new THREE.Vector3(-0.4, 0, 0), 0.4, 0xf59e0b); // Orange for West
      
      compassGroup.add(lineN);
      compassGroup.add(lineS);
      compassGroup.add(lineE);
      compassGroup.add(lineW);
      pinMesh.add(compassGroup);

      // 2. Observer's Field of View Cone (Zenith sky dome)
      const fovGeo = new THREE.ConeGeometry(1.2, 2.5, 16, 1, true); // height 2.5, radius 1.2, open-ended
      fovGeo.translate(0, -1.25, 0); // move tip to (0,0,0)
      fovGeo.rotateX(-Math.PI / 2); // rotate to point along negative Z-axis (straight up into space)
      
      const fovMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const fovMesh = new THREE.Mesh(fovGeo, fovMat);
      
      const fovWireMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        wireframe: true,
        transparent: true,
        opacity: 0.2
      });
      const fovMeshWire = new THREE.Mesh(fovGeo, fovWireMat);
      fovMesh.add(fovMeshWire);
      pinMesh.add(fovMesh);

      // Earth Axis Line (red)
      const axisPoints = [new THREE.Vector3(0, -3.2, 0), new THREE.Vector3(0, 3.2, 0)];
      const axisGeo = new THREE.BufferGeometry().setFromPoints(axisPoints);
      const axisMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 2 });
      axisLine = new THREE.Line(axisGeo, axisMat);
      axisLine.rotation.z = -0.41;
      scene.add(axisLine);

      // Sun Light Sphere
      const sunGeo = new THREE.SphereGeometry(0.8, 32, 32);
      const sunMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      sunLightMesh = new THREE.Mesh(sunGeo, sunMat);
      sunLightMesh.position.set(7, 0, 0);
      scene.add(sunLightMesh);

      // Star Light Sphere
      const starGeo = new THREE.SphereGeometry(0.3, 16, 16);
      const starMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
      starLightMesh = new THREE.Mesh(starGeo, starMat);
      starLightMesh.position.set(-7, 1.5, 0);
      scene.add(starLightMesh);
    };

    // Procedural Earth Texture
    const createEarthTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024; canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Ocean
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += canvas.width / 12) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }

      // Continent 1
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(250, 80); ctx.quadraticCurveTo(380, 50, 500, 80); ctx.lineTo(600, 150); ctx.lineTo(550, 240); ctx.lineTo(450, 350); ctx.lineTo(380, 280); ctx.closePath();
      ctx.fill();

      // Korea Pin Area
      ctx.beginPath(); ctx.arc(520, 140, 12, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(525, 140, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444'; ctx.fill();

      // Continent 2
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(750, 100); ctx.lineTo(850, 140); ctx.lineTo(790, 260); ctx.lineTo(820, 420); ctx.lineTo(750, 320); ctx.closePath();
      ctx.fill();

      ctx.beginPath(); ctx.arc(600, 300, 30, 0, Math.PI*2); ctx.fill();

      return new THREE.CanvasTexture(canvas);
    };

    // 2. Draw 2D Observer View (South sky)
    const drawObserverView = () => {
      const w = obsCanvas.width / (window.devicePixelRatio || 1);
      const h = obsCanvas.height / (window.devicePixelRatio || 1);
      if (w === 0 || h === 0) return;

      obsCtx.clearRect(0, 0, w, h);

      // Sky
      obsCtx.fillStyle = '#02020a';
      obsCtx.fillRect(0, 0, w, h);

      // Background stars
      obsCtx.fillStyle = '#fff';
      obsCtx.globalAlpha = 0.4;
      for (let i = 0; i < 40; i++) {
        // Deterministic placement
        const sx = (Math.sin(i * 98.76) * 0.5 + 0.5) * w;
        const sy = (Math.cos(i * 54.32) * 0.5 + 0.5) * h * 0.7;
        obsCtx.beginPath();
        obsCtx.arc(sx, sy, 0.9, 0, Math.PI * 2);
        obsCtx.fill();
      }
      obsCtx.globalAlpha = 1.0;

      // Apparent motions (sun and star positions are perfectly synchronized with the 3D pin's rotation)
      const R_x = w * 0.38;
      const R_y = h * 0.45;
      const groundY = h * 0.75;

      // World longitude of the observer pin: local longitude (525/1024 * 2 * PI) + Earth's rotation angle
      // Subtract PI to align the physical 3D pin direction (facing the sun) with the 2D noon position
      const theta_local = (525 / 1024) * 2 * Math.PI;
      const theta_obs = theta_local + earthAngleRef.current - Math.PI;

      // Sun position: directly overhead (South, middle of screen) at theta_obs = 0
      const sunRelX = w * 0.5 + R_x * Math.sin(theta_obs);
      const sunRelY = groundY - R_y * Math.cos(theta_obs);

      // Star position: 180 degrees opposite to the Sun
      const starRelX = w * 0.5 - R_x * Math.sin(theta_obs);
      const starRelY = groundY + R_y * Math.cos(theta_obs);

      // Sun (Only draw if above horizon to prevent floating labels)
      if (sunRelY < groundY + 10) {
        obsCtx.beginPath();
        obsCtx.arc(sunRelX, sunRelY, 15, 0, Math.PI * 2);
        obsCtx.fillStyle = '#facc15';
        obsCtx.shadowBlur = 20;
        obsCtx.shadowColor = '#eab308';
        obsCtx.fill();
        obsCtx.shadowBlur = 0;

        obsCtx.fillStyle = '#eab308';
        obsCtx.font = 'bold 10px Noto Sans KR';
        obsCtx.textAlign = 'center';
        obsCtx.fillText('전등 (태양)', sunRelX, sunRelY - 22);
      }

      // Star (Only draw if above horizon to prevent floating labels)
      if (starRelY < groundY + 10) {
        obsCtx.beginPath();
        obsCtx.arc(starRelX, starRelY, 6, 0, Math.PI * 2);
        obsCtx.fillStyle = '#06b6d4';
        obsCtx.shadowBlur = 10;
        obsCtx.shadowColor = '#06b6d4';
        obsCtx.fill();
        obsCtx.shadowBlur = 0;

        obsCtx.fillStyle = '#06b6d4';
        obsCtx.font = 'bold 10px Noto Sans KR';
        obsCtx.textAlign = 'center';
        obsCtx.fillText('별 모형', starRelX, starRelY - 12);
      }

      // Ground
      obsCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      obsCtx.fillRect(0, groundY, w, h - groundY);
      obsCtx.strokeStyle = '#334155';
      obsCtx.lineWidth = 2;
      obsCtx.beginPath();
      obsCtx.moveTo(0, groundY);
      obsCtx.lineTo(w, groundY);
      obsCtx.stroke();

      // Labels
      obsCtx.fillStyle = '#94a3b8';
      obsCtx.font = 'bold 12px Noto Sans KR';
      obsCtx.fillText('동(왼쪽)', w * 0.12, groundY + 22);
      obsCtx.fillText('남(정면)', w * 0.5, groundY + 22);
      obsCtx.fillText('서(오른쪽)', w * 0.88, groundY + 22);
    };

    // 3. Resizers
    const resizeObserverCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = obsCanvas.parentNode.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      obsCanvas.width = rect.width * dpr;
      obsCanvas.height = rect.height * dpr;
      obsCtx.scale(dpr, dpr);
      drawObserverView();
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
      resizeObserverCanvas();
    };

    // Initialize
    init3D();
    resizeAll();

    // 4. Animation loop
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (isRotatingRef.current) {
        earthAngleRef.current += 0.005 * rotationDirectionRef.current;
        if (earthMesh) {
          earthMesh.rotation.y = earthAngleRef.current;
        }
      }

      if (controls) controls.update();
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }

      drawObserverView();
    };

    animate();
    window.addEventListener('resize', resizeAll);

    // Cleanup resources
    return () => {
      window.removeEventListener('resize', resizeAll);
      if (animationId) cancelAnimationFrame(animationId);
      
      // Three.js cleanup
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
      if (pinMesh) {
        pinMesh.geometry.dispose();
        pinMesh.material.dispose();
      }
      if (axisLine) {
        axisLine.geometry.dispose();
        axisLine.material.dispose();
      }
      if (sunLightMesh) {
        sunLightMesh.geometry.dispose();
        sunLightMesh.material.dispose();
      }
      if (starLightMesh) {
        starLightMesh.geometry.dispose();
        starLightMesh.material.dispose();
      }
    };
  }, []);

  const handleResetAngle = () => {
    earthAngleRef.current = 0;
  };

  const simulator = (
    <div className="viewport-row">
      {/* Space View (3D) */}
      <div className="viewport-box" ref={threeContainerRef}>
        <span className="viewport-title">우주 뷰 (3D 지구 자전축과 공전축)</span>
      </div>

      {/* Observer View (2D) */}
      <div className="viewport-box">
        <span className="viewport-title">지구 내부 관측자 뷰 (남쪽 관측)</span>
        <canvas ref={observerCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
    </div>
  );

  const controls = (
    <>
      <div className="control-row">
        <span className="controls-section-title">지구 자전 조작</span>
        <div className="control-row-horizontal">
          <button onClick={() => setIsRotating(!isRotating)} className={`btn ${isRotating ? 'active' : ''}`}>
            {isRotating ? <Pause size={14} /> : <Play size={14} />}
            {isRotating ? '자전 일시정지' : '자전 시작'}
          </button>
          <button onClick={handleResetAngle} className="btn">
            <RefreshCw size={14} />
            자전각 초기화
          </button>
        </div>
      </div>

      <div className="control-row" style={{ marginTop: '0.5rem' }}>
        <span className="controls-section-title">자전 방향 설정</span>
        <div className="control-row-horizontal">
          <button
            onClick={() => setRotationDirection(1)}
            className={`btn ${rotationDirection === 1 ? 'active' : ''}`}
          >
            서쪽 ➔ 동쪽 자전 (실제 지구)
          </button>
          <button
            onClick={() => setRotationDirection(-1)}
            className={`btn ${rotationDirection === -1 ? 'active' : ''}`}
          >
            동쪽 ➔ 서쪽 자전 (가상)
          </button>
        </div>
        <div
          className="rotation-badge"
          style={{
            marginTop: '0.5rem',
            color: rotationDirection === 1 ? 'var(--accent-pink)' : 'var(--secondary-glow)',
            borderColor: rotationDirection === 1 ? 'rgba(236, 72, 153, 0.3)' : 'rgba(6, 182, 212, 0.3)',
            backgroundColor: rotationDirection === 1 ? 'rgba(236, 72, 153, 0.12)' : 'rgba(6, 182, 212, 0.12)',
            alignSelf: 'flex-start'
          }}
        >
          🔄 자전 방향: {rotationDirection === 1 ? '서 ➔ 동' : '동 ➔ 서'}
        </div>
      </div>

      <div className="control-row" style={{ marginTop: '0.5rem' }}>
        <span className="controls-section-title">실험 팁</span>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          • <strong>지구본 드래그</strong>: 3D 우주 뷰를 마우스 드래그하여 다른 각도(예: 북극점 위)에서 관찰해 보세요.<br />
          • 지구가 <strong>서쪽에서 동쪽</strong>(북극 위에서 볼 때 시계 반대 방향)으로 돌 때, 관측자 뷰의 전등(태양)과 별이 <strong>동쪽(왼쪽)에서 떠서 서쪽(오른쪽)으로 이동</strong>하는 현상을 대조해 보세요.
        </p>
      </div>
    </>
  );

  const studyContent = [
    {
      icon: '🔄',
      title: '지구의 자전 (Earth Rotation) (교과서 92~93쪽)',
      description: `지구가 외부의 힘 없이 스스로 하루에 한 바퀴씩 도는 핵심 운동입니다.<br/>
      <div style="margin: 8px 0; padding: 10px; background: rgba(255,255,255,0.05); border-left: 4px solid var(--accent-pink); border-radius: 4px; font-weight: bold;">
        지구 자전의 3대 요소:<br/>
        1. 자전축: 북극과 남극을 잇는 축 (23.5도 경사)<br/>
        2. 자전 주기: 하루에 한 바퀴 (24시간에 360도 회전)<br/>
        3. 자전 방향: [서쪽] ➔ [동쪽] (북극 상공 기준 시계 반대 방향 ↺)
      </div>`,
      list: [
        '<strong>자전축 (93쪽)</strong>: 지구의 북극과 남극을 이은 가상의 직선으로, 공전면에 대해 약간 기울어진 상태를 유지합니다.',
        '<strong>자전 방향 (93쪽)</strong>: 지구는 <strong>서쪽에서 동쪽</strong>(시계 반대 방향 ↺)으로 회전하며, 이로 인해 모든 지역이 하루 주기로 돌게 됩니다.'
      ]
    },
    {
      icon: '🌌',
      title: '자전이 만드는 천체의 겉보기 일주운동 (교과서 93쪽)',
      description: `우리는 지구와 함께 돌고 있어 회전을 느끼지 못하므로, 주변 우주 천체들이 정반대 방향으로 흐르는 것처럼 보입니다.`,
      list: [
        '<strong>상대 운동의 원리</strong>:<br/>' +
        '<div style="margin: 5px 0; padding: 8px; background: rgba(6,182,212,0.1); border-left: 3px solid var(--secondary-glow); border-radius: 4px; font-size: 0.85rem; line-height: 1.4;">' +
        '  <strong>지구의 실제 운동</strong>: [서쪽] ➔ [동쪽] 자전축 기준 ↺<br/>' +
        '  <strong>천체의 겉보기 운동</strong>: [동쪽] ➔ [서쪽] 일주운동 ↻' +
        '</div>',
        '<strong>교과서 역할놀이 비유 (92쪽)</strong>: 회전의자를 타고 시계 반대 방향(왼쪽)으로 빙글빙글 돌면, 주변 방 안의 벽과 사물들은 반대 방향인 시계 방향(오른쪽)으로 빠르게 흘러가는 현상과 완벽히 일치합니다.'
      ]
    }
  ];

  const quizContent = [
    {
      question: "Q1. 지구의 북극과 남극을 이은 가상의 직선으로, 지구가 회전하는 중심 축을 무엇이라고 부르나요? (교과서 93쪽)",
      options: [
        "공전축",
        "자전선",
        "자전축",
        "지평선"
      ],
      answerIndex: 2,
      explanation: "지구의 북극과 남극을 가로지르는 가상의 회전 중심선을 '자전축'이라고 부릅니다."
    },
    {
      question: "Q2. 지구의 실제 자전 방향과 이를 북극 위(상공)에서 내려다보았을 때의 회전 방향을 바르게 짝지은 것은 무엇인가요? (교과서 93쪽)",
      options: [
        "서쪽에서 동쪽, 시계 반대 방향 (↺)",
        "동쪽에서 서쪽, 시계 방향 (↻)",
        "서쪽에서 동쪽, 시계 방향 (↻)",
        "동쪽에서 서쪽, 시계 반대 방향 (↺)"
      ],
      answerIndex: 0,
      explanation: "지구는 하루에 한 바퀴씩 '서쪽에서 동쪽'으로 자전하며, 북극 상공에서 내려다보면 '시계 반대 방향(↺)'으로 회전합니다."
    },
    {
      question: "Q3. 하루 동안 태양과 별이 동쪽에서 떠서 서쪽으로 움직이는 일주운동을 하는 근본적인 이유는 무엇인가요? (교과서 93쪽)",
      options: [
        "태양과 별들이 실제로 지구 주위를 하루에 한 바퀴씩 돌고 있기 때문에",
        "지구가 자전축을 중심으로 하루에 한 바퀴씩 서쪽에서 동쪽으로 자전하기 때문에",
        "지구가 태양 주위를 일 년에 한 바퀴씩 공전하기 때문에",
        "우주의 은하수가 계절에 따라 서서히 회전하기 때문에"
      ],
      answerIndex: 1,
      explanation: "태양과 별은 우주에 고정되어 있으나 지구가 '서 ➔ 동'으로 자전하기 때문에, 지구 안의 관측자에게는 천체들이 반대 방향인 '동 ➔ 서'로 움직이는 것처럼 보이는 '겉보기 운동'이 나타나는 것입니다."
    },
    {
      question: "Q4. [가상 상황] 만약 지구가 실제와 반대로 '동쪽에서 서쪽'으로 자전한다고 가정한다면, 지구에서 바라보는 태양과 별의 하루 동안의 위치 변화는 어떻게 달라질까요? (교과서 93쪽)",
      options: [
        "태양과 별이 서쪽에서 떠서 남쪽 하늘을 지나 동쪽으로 이동할 것이다.",
        "태양과 별이 남쪽에서 떠서 북쪽으로 직선 이동할 것이다.",
        "태양과 별이 동쪽에서 떠서 서쪽으로 지는 현상이 그대로 유지될 것이다.",
        "태양과 별이 자전을 멈추고 하늘 한가운데 고정될 것이다."
      ],
      answerIndex: 0,
      explanation: "자전 방향이 반대로 '동 ➔ 서'가 되면 겉보기 운동 방향도 정반대가 되므로, 천체들은 '서쪽에서 떠서 남쪽을 거쳐 동쪽'으로 지게 됩니다."
    }
  ];

  return (
    <ExperimentLayout
      title="지구의 자전과 천체의 운동"
      badge="실험 02"
      onBack={onBack}
      simulator={simulator}
      controls={controls}
      studyContent={studyContent}
      quizContent={quizContent}
    />
  );
};

export default Experiment2;
