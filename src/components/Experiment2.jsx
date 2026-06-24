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
      const theta_local = (525 / 1024) * 2 * Math.PI;
      const theta_obs = theta_local + earthAngleRef.current;

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
      title: '지구의 자전 (Rotation)',
      description: '지구가 자전축을 중심으로 하루(24시간)에 한 바퀴씩 스스로 회전하는 것을 **지구의 자전**이라고 합니다.',
      list: [
        '<strong>자전 방향</strong>: 지구는 <strong>서쪽에서 동쪽</strong>으로 자전합니다. (북극상공에서 내려다보면 시계 반대 방향)',
        '<strong>자전축</strong>: 지구의 자전축은 공전 궤도면에 대해 수직인 선으로부터 약 <strong>23.5도</strong> 기울어져 있습니다.'
      ]
    },
    {
      icon: '🌌',
      title: '자전으로 인한 겉보기 운동 (Apparent Motion)',
      description: '우리는 지구의 회전을 직접 느끼지 못하므로, 우주 공간의 태양과 별들이 지구와 정반대 방향으로 도는 것처럼 보이게 됩니다.',
      list: [
        '<strong>천체의 일주운동</strong>: 지구가 서쪽에서 동쪽으로 자전하기 때문에, 하늘의 전등(태양)이나 별들은 <strong>동쪽에서 서쪽</strong>으로 하루에 한 바퀴씩 움직이는 것처럼 관측됩니다.',
        '<strong>예시 상황</strong>: 회전의자를 타고 시계 반대 방향(서->동)으로 돌면, 주변 방 안의 풍경은 시계 방향(동->서)으로 빠르게 흘러가는 원리와 같습니다.'
      ]
    }
  ];

  const quizContent = [
    {
      question: "Q1. 지구의 자전축은 수직선에 대해 약 몇 도 기울어져 있을까요?",
      options: [
        "15.5도",
        "23.5도",
        "30.0도",
        "45.0도"
      ],
      answerIndex: 1,
      explanation: "지구의 자전축은 약 23.5도 기울어진 상태로 고정되어 스스로 자전하고 공전합니다."
    },
    {
      question: "Q2. 지구가 서쪽에서 동쪽으로 회전할 때, 지구 내부 관측자의 눈에는 하늘의 별과 해가 어느 쪽에서 어느 쪽으로 움직이는 것처럼 보이나요?",
      options: [
        "동쪽에서 서쪽으로 이동하는 것처럼 보인다 (실제 지구 현상)",
        "서쪽에서 동쪽으로 이동하는 것처럼 보인다 (가상의 지구 현상)",
        "북쪽에서 남쪽으로 직진하는 것처럼 보인다"
      ],
      answerIndex: 0,
      explanation: "지구의 실제 자전 방향은 '서 ➔ 동'이므로, 지구 위의 관측자가 볼 때 태양과 별과 같은 천체들은 반대 방향인 '동 ➔ 서'로 움직이는 일주운동(겉보기 운동)을 나타내게 됩니다."
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
