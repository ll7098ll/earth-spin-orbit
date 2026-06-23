import React from 'react';

const Dashboard = ({ onSelectExperiment }) => {
  const experiments = [
    {
      id: 'exp1',
      num: 'EXPERIMENT 01',
      icon: '☀️',
      title: '하루 동안 태양과 별의\n위치 변화',
      desc: '시간에 따라 하늘을 관찰하여 태양과 대표적인 밝은 별(알타이르)이 동쪽에서 떠올라 서쪽으로 지는 운동 규칙을 탐구합니다.',
      ref: '교과서 88~91쪽 / 실관 52~55쪽'
    },
    {
      id: 'exp2',
      num: 'EXPERIMENT 02',
      icon: '🔄',
      title: '지구의 자전과\n천체의 운동',
      desc: '3D 우주 뷰에서 지구 자전축과 서->동 회전을 관찰하고, 회전의자에 앉아 도는 관측자 뷰를 통해 겉보기 운동의 관계를 시각적으로 이해합니다.',
      ref: '교과서 92~93쪽 / 실관 56~57쪽'
    },
    {
      id: 'exp3',
      num: 'EXPERIMENT 03',
      icon: '🌓',
      title: '낮과 밤이 생기는 까닭',
      desc: '태양을 향해 자전하는 3D 지구 모형에서 밝은 낮과 어두운 밤 영역을 관찰하고, 우리나라에 부착된 소형 카메라에 담긴 낮과 밤의 영상을 실시간 모니터링합니다.',
      ref: '교과서 94~95쪽 / 실관 58~59쪽'
    },
    {
      id: 'exp4',
      num: 'EXPERIMENT 04',
      icon: '🌌',
      title: '지구의 공전과\n계절별 별자리',
      desc: '태양 주위를 공전하는 지구의 네 위치(가, 나, 다, 라)를 선택하여 한밤중에 지구의 관측자가 남쪽 하늘에서 관찰하게 되는 계절별 대표 별자리를 탐구합니다.',
      ref: '교과서 96~99쪽 / 실관 60~63쪽'
    }
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <span className="dashboard-badge">초등학교 6학년 과학 | 4단원</span>
        <h1 className="dashboard-title">지구의 운동 가상 실험실</h1>
        <p className="dashboard-subtitle">
          교과서 속 핵심 천체 모형실험을 고품질 3D 및 2D 시뮬레이션으로 직접 조작하고 확인해 보세요.
        </p>
      </header>

      <main>
        {/* 단원 요약 정보 */}
        <section className="info-panel">
          <div>
            <h2 className="info-title">4. 지구의 운동</h2>
            <p style={{ marginTop: '1rem', color: '#a5b4fc', fontWeight: 500, fontSize: '1.05rem' }}>
              지구와 우주의 상호작용
            </p>
          </div>
          <div>
            <p className="info-desc">
              우리는 발을 디디고 서 있는 지구가 정지해 있다고 느끼지만, 실제 지구는 매우 빠른 속도로 움직이고 있습니다. 하루에 한 바퀴씩 스스로 도는 <strong>자전</strong>과 일 년에 한 바퀴씩 태양 주위를 도는 <strong>공전</strong>을 통해, 낮과 밤이 찾아오고 계절마다 밤하늘에 보이는 별자리가 달라집니다. 아래 가상 실험을 통해 이 신비로운 원리를 탐구해 봅시다.
            </p>
            <ul className="info-goals">
              <li>하루 동안 태양과 별의 위치 변화 이해</li>
              <li>지구의 자전과 자전 방향(서 ➔ 동) 파악</li>
              <li>지구 자전으로 인한 낮과 밤의 원리 규명</li>
              <li>지구 공전에 의한 계절별 별자리 변화 탐색</li>
            </ul>
          </div>
        </section>

        {/* 실험 카드 그리드 */}
        <section className="card-grid">
          {experiments.map((exp) => (
            <div
              key={exp.id}
              className="card"
              onClick={() => onSelectExperiment(exp.id)}
            >
              <div className="card-header">
                <div className="card-num">{exp.num}</div>
                <div className="card-icon">{exp.icon}</div>
                <h3 className="card-title" style={{ whiteSpace: 'pre-line' }}>
                  {exp.title}
                </h3>
                <p className="card-desc">{exp.desc}</p>
              </div>
              <div className="card-footer">
                <span className="textbook-ref">{exp.ref}</span>
                <span className="btn-enter">
                  실험 시작
                  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'currentColor' }}>
                    <path d="M5 13h11.86l-5.43 5.43 1.42 1.42L21.14 12l-8.29-8.29-1.42 1.42L16.86 11H5v2z" />
                  </svg>
                </span>
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="dashboard-footer">
        <p>&copy; 2026 초등 과학 가상 실험 교육 자료 | 교과서 연계 가상 시뮬레이션실</p>
      </footer>
    </div>
  );
};

export default Dashboard;
