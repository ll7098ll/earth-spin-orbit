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
      const pinGeo = new THREE.ConeGeometry(0.1, 0.4, 16);
      pinGeo.rotateX(Math.PI / 2);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      pinMesh = new THREE.Mesh(pinGeo, pinMat);

      // Position Pin on Earth at Seoul's coordinates (~37.5° N, ~127° E)
      const radius = 2.0;
      const phi = (90 - 37.5) * (Math.PI / 180);
      const theta = (127.0 + 180) * (Math.PI / 180);
      
      const px = -radius * Math.sin(phi) * Math.sin(theta);
      const py = radius * Math.cos(phi);
      const pz = radius * Math.sin(phi) * Math.cos(theta);

      pinMesh.position.set(px, py, pz);
      pinMesh.lookAt(new THREE.Vector3(0,0,0));
      pinMesh.position.multiplyScalar(1.08); // Float slightly above surface
      pinMesh.visible = showPinRef.current;
      earthMesh.add(pinMesh);

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

      // Phase offset to align midday with sun direction
      const pinPhase = Math.PI * 0.15;
      const relativeAngle = (earthAngleRef.current + pinPhase) % (Math.PI * 2);

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
      title: '낮과 밤이 생기는 원리',
      description: '지구 전체가 동시에 밝아지거나 어두워지지 않고 지역에 따라 낮과 밤이 교대로 나타나는 것은 지구의 모양과 자전 때문입니다.',
      list: [
        '<strong>태양광선과 밝기</strong>: 지구는 둥근 공 모양이므로 태양 빛을 받는 쪽은 밝은 <strong>낮</strong>이 되고, 빛을 받지 못하는 반대쪽은 어두운 <strong>밤</strong>이 됩니다.',
        '<strong>하루 주기 순환</strong>: 지구가 하루에 한 바퀴씩 스스로 자전하므로, 지구 상의 모든 장소는 낮 영역과 밤 영역을 번갈아 지나게 되며 이로 인해 낮과 밤이 매일 한 번씩 반복됩니다.'
      ]
    },
    {
      icon: '📍',
      title: '핀 카메라 연동 설명',
      description: '시뮬레이션에서 서울(Seoul)에 꽂힌 붉은색 핀은 관측자의 카메라를 나타냅니다.',
      list: [
        '지구본 위의 빨간색 핀이 태양 빛을 정면으로 받는 구간(오른쪽 반구)을 통과할 때는 서울의 스마트폰 전경이 환한 <strong>낮(DAY)</strong>이 되며, 하늘에 태양이 떠 있습니다.',
        '핀이 태양 빛을 받지 못하는 그늘진 구간(왼쪽 반구)으로 회전해 들어갈 때는 서울의 스마트폰 전경이 어두워져 <strong>밤(NIGHT)</strong>이 되며, 가로등 불빛과 별이 나타납니다.'
      ]
    }
  ];

  const quizContent = [
    {
      question: "Q1. 낮과 밤이 매일 한 번씩 규칙적으로 반복되어 찾아오는 근본적인 까닭은 무엇인가요?",
      options: [
        "태양이 스스로 회전하고 빛을 조절하기 때문이다.",
        "지구가 자전축을 중심으로 하루에 한 바퀴씩 자전하기 때문이다.",
        "달이 지구 주위를 공전하며 주기적으로 햇빛을 가리기 때문이다."
      ],
      answerIndex: 1,
      explanation: "지구가 자전하면서 태양빛을 받는 부분(낮)과 받지 못하는 부분(밤)이 지속적으로 순환하며 교대하기 때문에 낮과 밤이 매일 발생합니다."
    },
    {
      question: "Q2. 만약 지구가 자전을 아예 멈추고 정지한다면 지구에는 어떤 밤낮 현상이 생길까요?",
      options: [
        "지구상의 모든 장소가 영원한 낮 상태로 바뀐다.",
        "태양을 바라보는 곳은 영구적인 낮이 되고, 반대편은 영구적인 밤이 된다.",
        "낮과 밤이 1시간 주기로 훨씬 빠르게 회전하며 반복된다."
      ],
      answerIndex: 1,
      explanation: "지구가 회전하지 않으면 태양을 보는 지구의 절반은 계속 낮인 상태에 머무르고, 반대편 절반은 영구히 추운 밤 영역에 갇히게 됩니다."
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
