import React, { useState, useEffect, useRef } from 'react';
import ExperimentLayout from './ExperimentLayout';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Play, Pause, MapPin } from 'lucide-react';

const Experiment3 = ({ onBack }) => {
  const [isRotating, setIsRotating] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(0.005);
  const [showPin, setShowPin] = useState(true);

  const threeContainerRef = useRef(null);
  const phoneCanvasRef = useRef(null);
  const statusBadgeRef = useRef(null);
  const phoneTimeRef = useRef(null);

  // Animation refs to bypass React state re-render lags
  const isRotatingRef = useRef(isRotating);
  const rotationSpeedRef = useRef(rotationSpeed);
  const showPinRef = useRef(showPin);
  const earthAngleRef = useRef(0);

  // Sync state values with refs
  useEffect(() => {
    isRotatingRef.current = isRotating;
  }, [isRotating]);

  useEffect(() => {
    rotationSpeedRef.current = rotationSpeed;
  }, [rotationSpeed]);

  useEffect(() => {
    showPinRef.current = showPin;
  }, [showPin]);

  useEffect(() => {
    const threeContainer = threeContainerRef.current;
    const phoneCanvas = phoneCanvasRef.current;
    if (!threeContainer || !phoneCanvas) return;

    const phoneCtx = phoneCanvas.getContext('2d');
    let scene, camera, renderer, controls;
    let earthMesh, pinMesh, sunMesh;
    let animationId = null;

    // Initialize 3D Space View
    const init3D = () => {
      let w = threeContainer.clientWidth || 400;
      let h = threeContainer.clientHeight || 300;

      scene = new THREE.Scene();
      scene.background = new THREE.Color('#02020a');

      // Camera positioned to view both Earth (left) and Sun (right)
      camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
      camera.position.set(3.4, 5.5, 17);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(window.devicePixelRatio);
      threeContainer.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.target.set(3.4, 0, 0); // Centered target between Earth (0,0,0) and Sun (8,0,0) to prevent cutoffs

      const ambient = new THREE.AmbientLight(0x0a0a1a, 0.5);
      scene.add(ambient);

      // Direct light from the Sun
      const sunLight = new THREE.DirectionalLight(0xffffff, 4.0);
      sunLight.position.set(20, 0, 0);
      scene.add(sunLight);

      // Sun Sphere
      const sunGeo = new THREE.SphereGeometry(0.8, 32, 32);
      const sunMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      sunMesh = new THREE.Mesh(sunGeo, sunMat);
      sunMesh.position.set(8, 0, 0);
      scene.add(sunMesh);

      // Earth Sphere with procedural texture
      const earthGeo = new THREE.SphereGeometry(2, 64, 64);
      const earthTex = createEarthTexture();
      const earthMat = new THREE.MeshStandardMaterial({
        map: earthTex,
        roughness: 0.7,
        metalness: 0.1
      });
      earthMesh = new THREE.Mesh(earthGeo, earthMat);
      earthMesh.rotation.z = -0.41; // Tilt
      scene.add(earthMesh);

      // Seoul Pin (Cone)
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
      pinMesh.visible = showPinRef.current;
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

      // Earth Axis Line
      const axisPoints = [new THREE.Vector3(0, -3.2, 0), new THREE.Vector3(0, 3.2, 0)];
      const axisGeo = new THREE.BufferGeometry().setFromPoints(axisPoints);
      const axisMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 2 });
      const axisLine = new THREE.Line(axisGeo, axisMat);
      axisLine.rotation.z = -0.41;
      scene.add(axisLine);
    };

    // Procedural Earth Texture
    const createEarthTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024; canvas.height = 512;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#0a192f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#172554';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += canvas.width / 12) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }

      ctx.fillStyle = '#059669';
      // Continent 1
      ctx.beginPath();
      ctx.moveTo(250, 80); ctx.quadraticCurveTo(380, 50, 500, 80); ctx.lineTo(600, 150); ctx.lineTo(550, 240); ctx.lineTo(450, 350); ctx.lineTo(380, 280); ctx.closePath();
      ctx.fill();

      // Korea outline red dot
      ctx.beginPath(); ctx.arc(520, 140, 12, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(525, 140, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444'; ctx.fill();

      // Continent 2
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.moveTo(750, 100); ctx.lineTo(850, 140); ctx.lineTo(790, 260); ctx.lineTo(820, 420); ctx.lineTo(750, 320); ctx.closePath();
      ctx.fill();

      ctx.beginPath(); ctx.arc(600, 300, 30, 0, Math.PI*2); ctx.fill();

      return new THREE.CanvasTexture(canvas);
    };

    // 2D Smartphone Simulation View (Seoul)
    const drawPhoneScreen = () => {
      const w = phoneCanvas.width / (window.devicePixelRatio || 1);
      const h = phoneCanvas.height / (window.devicePixelRatio || 1);
      if (w === 0 || h === 0) return;

      phoneCtx.clearRect(0, 0, w, h);

      // World longitude of the observer pin: local longitude (525/1024 * 2 * PI) + Earth's rotation angle
      // Subtract PI to align the physical 3D pin direction (facing the sun) with the 2D noon position
      const theta_local = (525 / 1024) * 2 * Math.PI;
      let theta_obs = (theta_local + earthAngleRef.current - Math.PI) % (Math.PI * 2);
      if (theta_obs < 0) theta_obs += Math.PI * 2;

      // relativeAngle starts at 0 at Sunrise (theta_obs = 3*PI/2) and reaches PI/2 at Noon (theta_obs = 0)
      let relativeAngle = (theta_obs + Math.PI / 2) % (Math.PI * 2);
      if (relativeAngle < 0) relativeAngle += Math.PI * 2;

      const lightIntensity = Math.sin(relativeAngle);
      const isDay = lightIntensity > 0;

      // Update Smartphone top bar digital clock
      if (phoneTimeRef.current) {
        let totalHours = (relativeAngle / (Math.PI * 2)) * 24 + 6;
        if (totalHours >= 24) totalHours -= 24;
        let hh = Math.floor(totalHours);
        let mm = Math.floor((totalHours - hh) * 60);
        let ampm = hh >= 12 ? 'PM' : 'AM';
        let displayH = hh % 12 === 0 ? 12 : hh % 12;
        let minStr = mm < 10 ? '0' + mm : mm;
        phoneTimeRef.current.textContent = `${displayH}:${minStr} ${ampm}`;
      }

      // Update Smartphone Day/Night Badge and Screen Sky Gradient
      let skyGrd = phoneCtx.createLinearGradient(0, 0, 0, h);
      if (isDay) {
        if (statusBadgeRef.current) {
          statusBadgeRef.current.textContent = "낮 (DAY)";
          statusBadgeRef.current.className = "status-badge day";
        }
        
        if (lightIntensity > 0.3) {
          skyGrd.addColorStop(0, '#38bdf8');
          skyGrd.addColorStop(1, '#bae6fd');
        } else {
          // Sunset/Sunrise glow
          skyGrd.addColorStop(0, '#4338ca');
          skyGrd.addColorStop(0.5, '#ea580c');
          skyGrd.addColorStop(1, '#fef08a');
        }
      } else {
        if (statusBadgeRef.current) {
          statusBadgeRef.current.textContent = "밤 (NIGHT)";
          statusBadgeRef.current.className = "status-badge night";
        }

        skyGrd.addColorStop(0, '#030712');
        skyGrd.addColorStop(1, '#1e1b4b');
      }

      phoneCtx.fillStyle = skyGrd;
      phoneCtx.fillRect(0, 0, w, h);

      // Draw stars at night
      if (!isDay) {
        phoneCtx.fillStyle = '#fff';
        phoneCtx.globalAlpha = 0.6;
        for (let i = 0; i < 20; i++) {
          const sx = (Math.sin(i * 12.34) * 0.5 + 0.5) * w;
          const sy = (Math.cos(i * 56.78) * 0.5 + 0.5) * h * 0.5;
          phoneCtx.beginPath();
          phoneCtx.arc(sx, sy, 1.1, 0, Math.PI * 2);
          phoneCtx.fill();
        }
        phoneCtx.globalAlpha = 1.0;
      }

      // Landscape silhouettes (Hills + Namsan Tower)
      phoneCtx.fillStyle = isDay ? '#1e293b' : '#020617';
      phoneCtx.beginPath();
      phoneCtx.moveTo(0, h * 0.75);
      phoneCtx.lineTo(w * 0.2, h * 0.7);
      phoneCtx.lineTo(w * 0.35, h * 0.55); // Mount Namsan peak
      
      // Namsan Tower silhouette
      phoneCtx.lineTo(w * 0.34, h * 0.55);
      phoneCtx.lineTo(w * 0.34, h * 0.35);
      phoneCtx.lineTo(w * 0.36, h * 0.35);
      phoneCtx.lineTo(w * 0.36, h * 0.55);

      phoneCtx.lineTo(w * 0.5, h * 0.72);
      phoneCtx.lineTo(w * 0.6, h * 0.72);
      
      // Building silhouette
      phoneCtx.lineTo(w * 0.6, h * 0.62);
      phoneCtx.lineTo(w * 0.68, h * 0.62);
      phoneCtx.lineTo(w * 0.68, h * 0.72);
      
      phoneCtx.lineTo(w * 0.8, h * 0.65);
      phoneCtx.lineTo(w * 0.88, h * 0.65);
      phoneCtx.lineTo(w * 0.88, h * 0.75);

      phoneCtx.lineTo(w, h * 0.72);
      phoneCtx.lineTo(w, h);
      phoneCtx.lineTo(0, h);
      phoneCtx.closePath();
      phoneCtx.fill();

      // Lights on buildings/tower at night
      if (!isDay) {
        phoneCtx.fillStyle = '#fef08a';
        phoneCtx.globalAlpha = 0.8;
        phoneCtx.fillRect(w * 0.62, h * 0.64, 3, 3);
        phoneCtx.fillRect(w * 0.65, h * 0.66, 3, 3);
        phoneCtx.fillRect(w * 0.82, h * 0.67, 3, 3);
        phoneCtx.fillRect(w * 0.85, h * 0.69, 3, 3);
        
        // Red flashing light on Namsan Tower
        phoneCtx.fillStyle = '#ef4444';
        phoneCtx.beginPath();
        phoneCtx.arc(w * 0.35, h * 0.35, 3, 0, Math.PI*2);
        phoneCtx.fill();
        phoneCtx.globalAlpha = 1.0;
      }

      // Draw Sun moving in sky (only in daytime)
      if (isDay) {
        const sunX = w * 0.5 - w * 0.35 * Math.cos(relativeAngle);
        const sunY = h * 0.6 - h * 0.3 * Math.sin(relativeAngle);

        phoneCtx.beginPath();
        phoneCtx.shadowBlur = 20;
        phoneCtx.shadowColor = '#fbbf24';
        phoneCtx.arc(sunX, sunY, 14, 0, Math.PI * 2);
        phoneCtx.fillStyle = '#fffbeb';
        phoneCtx.fill();
        phoneCtx.shadowBlur = 0;

        phoneCtx.fillStyle = '#eab308';
        phoneCtx.font = 'bold 9px Noto Sans KR';
        phoneCtx.textAlign = 'center';
        phoneCtx.fillText('태양', sunX, sunY - 20);
      }
    };

    // Resizers
    const resizePhoneCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = phoneCanvas.parentNode.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      phoneCanvas.width = rect.width * dpr;
      phoneCanvas.height = rect.height * dpr;
      phoneCtx.scale(dpr, dpr);
      drawPhoneScreen();
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
      resizePhoneCanvas();
    };

    // Initialize 3D scene
    init3D();
    resizeAll();

    // Loop
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (isRotatingRef.current) {
        earthAngleRef.current += rotationSpeedRef.current;
        if (earthMesh) {
          earthMesh.rotation.y = earthAngleRef.current;
        }
      }

      if (pinMesh) {
        pinMesh.visible = showPinRef.current;
      }

      if (controls) controls.update();
      if (renderer) renderer.render(scene, camera);

      drawPhoneScreen();
    };

    animate();
    window.addEventListener('resize', resizeAll);

    // Cleanup resources on unmount
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
      if (pinMesh) {
        pinMesh.geometry.dispose();
        pinMesh.material.dispose();
      }
      if (sunMesh) {
        sunMesh.geometry.dispose();
        sunMesh.material.dispose();
      }
    };
  }, []);

  const simulator = (
    <div className="viewport-row">
      {/* 3D Orbit View */}
      <div className="viewport-box" ref={threeContainerRef}>
        <span className="viewport-title">3D 태양광 조사 및 지구 자전 상태</span>
      </div>

      {/* Seoul Pin Camera View */}
      <div className="viewport-box">
        <span className="viewport-title">지구 관측 카메라 (Seoul Pin) 전경</span>
        <div className="phone-mockup">
          <div className="phone-screen">
            <div className="phone-top-bar">
              <span>Seoul, Korea</span>
              <span ref={phoneTimeRef}>12:00 PM</span>
            </div>
            <div className="phone-canvas-container">
              <canvas ref={phoneCanvasRef} />
              <div className="phone-overlay">
                <span className="status-badge day" ref={statusBadgeRef}>
                  낮 (DAY)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const controls = (
    <>
      <div className="control-row">
        <span className="controls-section-title">자전 제어</span>
        <div className="control-row-horizontal">
          <button onClick={() => setIsRotating(!isRotating)} className={`btn ${isRotating ? 'active' : ''}`}>
            {isRotating ? <Pause size={14} /> : <Play size={14} />}
            {isRotating ? '자전 일시정지' : '자전 시작'}
          </button>
          <button onClick={() => setShowPin(!showPin)} className={`btn ${showPin ? 'active' : ''}`}>
            <MapPin size={14} />
            우리나라 위치 핀 {showPin ? '숨기기' : '표시'}
          </button>
        </div>
      </div>

      <div className="control-row" style={{ marginTop: '0.5rem' }}>
        <span className="controls-section-title">자전 시뮬레이션 속도</span>
        <div className="control-row-horizontal">
          {[1, 2, 4].map((speed) => (
            <button
              key={speed}
              onClick={() => setRotationSpeed(0.005 * speed)}
              className={`btn ${rotationSpeed === 0.005 * speed ? 'active' : ''}`}
            >
              {speed}x 속도
            </button>
          ))}
        </div>
      </div>

      <div className="control-row" style={{ marginTop: '0.5rem' }}>
        <span className="controls-section-title">관찰 지침</span>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          • 태양(우측 노란 구체)에서 직진하는 태양광선이 지구를 비출 때, 밝은 반구는 <strong>낮</strong>이 되고 태양빛이 도달하지 않는 어두운 반구는 <strong>밤</strong>이 됩니다.<br />
          • 지구가 서쪽에서 동쪽으로 자전함에 따라, 우리나라 위치(빨간 핀)가 낮 영역(태양을 향함)에서 밤 영역(태양의 반대편 어둠)으로 순환하는 것을 스마트폰 카메라 전경과 매핑해 보세요.
        </p>
      </div>
    </>
  );

  const studyContent = [
    {
      icon: '🌓',
      title: '낮과 밤이 생기는 원리 (교과서 94~95쪽)',
      description: `지구 전체가 한꺼번에 밝아지거나 어두워지지 않는 이유를 규명하는 물리적 원리입니다.<br/>
      <div style="margin: 8px 0; padding: 10px; background: rgba(255,255,255,0.05); border-left: 4px solid var(--accent-green); border-radius: 4px; font-weight: bold; line-height: 1.5;">
        낮과 밤의 발생 메커니즘:<br/>
        1. 형태 요인: 지구는 스스로 빛을 내지 못하는 둥근 공 모양(구형)임.<br/>
        2. 운동 요인: 지구가 하루에 한 바퀴씩 서 ➔ 동으로 자전함.<br/>
        👉 결과: [태양빛을 받는 반구 = 낮] ⇄ [태양빛을 받지 못하는 반구 = 밤]이 하루 1회 순환함.
      </div>`,
      list: [
        '<strong>빛의 직진성과 지구의 모양 (95쪽)</strong>: 지구는 둥근 공 모양이므로 태양 빛을 받는 쪽만 밝은 <strong>낮</strong>이 되고, 빛이 도달하지 못해 그림자가 지는 반대쪽은 어두운 <strong>밤</strong>이 됩니다.',
        '<strong>자전과 반복 (95쪽)</strong>: 지구가 끊임없이 하루에 한 바퀴씩 회전하기 때문에, 지구 상의 모든 지역은 낮 영역과 밤 영역을 번갈아 통과하며 낮과 밤이 매일 반복됩니다.'
      ]
    },
    {
      icon: '📍',
      title: '동서 지역의 시각 차이와 해돋이 (교과서 95쪽)',
      description: `지구 자전의 방향성 때문에 위도와 경도에 따라 낮이 시작되는 시각이 다릅니다.`,
      list: [
        '<strong>동쪽 지역의 빠른 해돋이</strong>: 지구가 <strong>서쪽에서 동쪽</strong>으로 회전하므로, 더 동쪽에 위치한 지역이 회전 도중 태양 빛을 먼저 받게 됩니다.',
        '<strong>우리나라의 예시 (95쪽)</strong>: 우리나라 국토 중에서 가장 동쪽에 위치한 <strong>독도(동해)</strong>가 서쪽 내륙 지역보다 태양 빛을 먼저 받으므로, <strong>가장 먼저 해돋이를 관찰하며 낮이 시작</strong>됩니다.'
      ]
    }
  ];

  const quizContent = [
    {
      question: "Q1. 지구에 낮과 밤이 생기게 되는 근본적인 물리적 형태 요인은 무엇인가요? (교과서 95쪽)",
      options: [
        "지구가 둥근 공 모양이고 스스로 빛을 내지 못하기 때문에",
        "지구가 납작한 원판 모양이어서 태양 빛을 반사하기 때문에",
        "지구 주위를 도는 달이 주기적으로 햇빛을 가리기 때문에",
        "지구 표면에 넓은 바다가 있어 빛이 흩어지기 때문에"
      ],
      answerIndex: 0,
      explanation: "지구는 스스로 빛을 내지 못하는 둥근 공 모양이기 때문에, 태양 빛을 받는 반구(낮)와 태양 빛을 받지 못해 그림자가 지는 반구(밤)가 절반씩 나뉘게 됩니다."
    },
    {
      question: "Q2. 낮과 밤이 하루에 한 번씩 규칙적으로 번갈아 나타나는 까닭은 무엇인가요? (교과서 95쪽)",
      options: [
        "태양이 지구 주위를 하루에 한 바퀴씩 공전하기 때문에",
        "지구가 자전축을 중심으로 하루에 한 바퀴씩 자전하기 때문에",
        "지구가 태양 주위를 일 년에 한 바퀴씩 공전하기 때문에",
        "자전축이 계절에 따라 반대 방향으로 기울어지기 때문에"
      ],
      answerIndex: 1,
      explanation: "지구가 하루에 한 바퀴씩 자전하므로 태양 빛을 받아 낮이 된 지역이 점차 어두운 밤 영역으로 들어가고, 밤이었던 지역이 낮 영역으로 나오면서 하루 주기로 낮과 밤이 반복됩니다."
    },
    {
      question: "Q3. 우리나라 영토 중에서 지리적으로 가장 먼저 해가 뜨고 낮이 시작되는 장소와 그 과학적 까닭을 바르게 설명한 것은 무엇인가요? (교과서 95쪽)",
      options: [
        "독도, 우리나라 영토 중 가장 동쪽에 있어 지구가 서➔동 자전할 때 태양 빛을 가장 먼저 받기 때문",
        "인천, 우리나라 영토 중 가장 서쪽에 있어 태양이 서쪽에서 가장 먼저 뜨기 때문",
        "서울, 중심부에 위치하여 태양 빛이 항상 가장 먼저 수직으로 내리쬐기 때문",
        "한라산, 가장 높은 남쪽 산이어서 태양과 거리가 가장 가깝기 때문"
      ],
      answerIndex: 0,
      explanation: "지구는 서쪽에서 동쪽으로 회전하므로, 우리나라에서 가장 동쪽에 위치한 독도가 가장 먼저 태양을 향하게 되어 가장 일찍 해가 뜨고 낮이 시작됩니다."
    },
    {
      question: "Q4. [가상 상황] 만약 지구가 자전을 아예 하지 않고 공전만 하거나 우주 공간에 정지해 있다면, 지구의 낮과 밤 현상은 어떻게 변화할까요? (교과서 95쪽)",
      options: [
        "지구 전체가 24시간 내내 계속 환한 낮 상태로 고정될 것이다.",
        "태양을 향하는 지구의 절반은 영원한 낮이 되고, 그 반대편은 영원한 밤이 될 것이다.",
        "낮과 밤이 수 분(minute) 단위로 극도로 빠르게 교대할 것이다.",
        "지구의 대기가 완전히 사라져 낮과 밤의 명암 경계가 흐려질 것이다."
      ],
      answerIndex: 1,
      explanation: "지구가 회전(자전)하지 않으면 태양 빛을 받는 쪽은 영원히 낮 상태로 머무르고, 태양 빛을 받지 못하는 반대쪽 절반은 영구적인 밤이 되어 생명체가 살기 어려워집니다."
    }
  ];

  return (
    <ExperimentLayout
      title="낮과 밤이 생기는 까닭"
      badge="실험 03"
      onBack={onBack}
      simulator={simulator}
      controls={controls}
      studyContent={studyContent}
      quizContent={quizContent}
    />
  );
};

export default Experiment3;
