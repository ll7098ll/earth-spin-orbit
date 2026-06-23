# 🌌 지구의 운동 가상 실험실 (Earth Motion Virtual Lab)

> 초등학교 6학년 과학 **'4. 지구의 운동'** 단원 교과 연계형 3D 및 2D 천체 가상 실험실 플랫폼입니다.  
> 학생들과 교사가 교과서 속 자전 및 공전 모형 실험을 웹 브라우저를 통해 손쉽게 관찰하고 학습하며 퀴즈를 풀 수 있는 단일 페이지 애플리케이션(SPA)입니다.

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2.6-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Three.js-r128+-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="ThreeJS" />
  <img src="https://img.shields.io/badge/Vite-8.0.12-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Netlify-Ready-00C7B7?style=for-the-badge&logo=netlify&logoColor=white" alt="Netlify" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

---

## ✨ 주요 핵심 기능 (Features)

### 🪐 4대 천체 가상 실험 제공
1. **실험 01: 하루 동안 태양과 별의 위치 변화**
   - 시간에 따라 동쪽 ➔ 남쪽 ➔ 서쪽으로 흐르는 태양과 밝은 별(알타이르)의 궤적을 2D 돔 하늘로 시각화합니다.
   - 태양 관측 안경(특수 필터) 착용 여부에 따른 눈부심 산란 시뮬레이션 및 시간별 스티커 부착 기능을 제공합니다.
2. **실험 02: 지구의 자전과 천체의 운동**
   - 3D 우주 뷰(지구의 서 ➔ 동 자전)와 지구 내부 관측자 뷰(동 ➔ 남 ➔ 서 겉보기 운동)를 동시 렌더링하여 자전으로 인한 겉보기 일주운동의 상관관계를 파악합니다.
3. **실험 03: 낮과 밤이 생기는 까닭**
   - 태양광을 받는 지구의 낮/밤 경계선과 우리나라 위치(Seoul Pin)를 매핑합니다.
   - 핀 카메라가 낮/밤 영역을 통과할 때마다 스마트폰 목업 스크린 전경(노을, 밤하늘, 가로등 점등 등)이 실시간 연동됩니다.
4. **실험 04: 지구의 공전과 계절별 별자리**
   - 태양 중심의 지구 공전 궤도를 3D로 투영하고, 한밤중(태양 반대 방향)을 가리키는 **Midnight Glowing 점선 벡터**를 표시합니다.
   - 공전 궤도 바깥에 봄/여름/가을/겨울을 대표하는 별자리(사자, 독수리, 페가수스, 오리온)를 3D 입체 라벨로 매핑하여 짤림 없이 직관적인 시선을 표현합니다.

### 💻 Chromebook 최적화 UI/UX
- 학교 현장에서 자주 쓰는 크롬북 화면 규격(1366x768 또는 세로 해상도 740px 이하)에서 스크롤바가 발생하지 않는 **Flex/Grid 핏 레이아웃**을 적용했습니다.
- 좌측에는 인터랙티브 3D/2D 캔버스를, 우측에는 **3탭 학습 패널**을 나누어 공간 효율을 극대화했습니다.

### 📚 3탭 사이드바 구성
- **실험 조작 (Controls)**: 재생/일시정지, 자전 속도 변경, 필터 착용, 핀 켜기 등 시뮬레이터 제어.
- **내용 학습 (Study)**: 단원의 핵심 이론과 원리를 읽기 편한 설명 카드 구조로 요약 제공.
- **퀴즈 풀기 (Quiz)**: 즉시 피드백이 제공되는 퀴즈 모듈. 만점 달성 시 화면 전체에 **축하 꽃가루(Confetti) 효과**가 터집니다.

---

## 🛠️ 기술 스택 (Tech Stack)

- **Library**: `React 19`, `Three.js` (WebGL 기반 3D 그래픽)
- **Bundler**: `Vite 8` (초고속 HMR 및 최적화 번들링)
- **Design & Icons**: `Lucide React` (현대적인 모노톤 라인 아이콘)
- **Effects**: `Canvas Confetti` (퀴즈 완료 축하 연출)
- **Styling**: `Vanilla CSS` (우주 감성의 네온 Glow 및 글래스모피즘 테마)

---

## 📂 프로젝트 구조 (Directory Structure)

```bash
지구의 운동/
├── dist/                   # 빌드 결과물 (Netlify 배포 타겟)
├── public/                 # 파비콘 및 정적 에셋
├── backups/                # 백업 폴더 (이전 단일 HTML 버전 보관)
├── src/
│   ├── assets/             # 정적 이미지 리소스
│   ├── components/
│   │   ├── Dashboard.jsx   # 메인 카드 대시보드
│   │   ├── ExperimentLayout.jsx # 공통 시뮬레이터 + 3탭 사이드바 프레임
│   │   ├── Experiment1.jsx # 실험 1 비즈니스 로직 및 캔버스
│   │   ├── Experiment2.jsx # 실험 2 Three.js + 2D 겉보기 연동
│   │   ├── Experiment3.jsx # 실험 3 Three.js + 폰 목업 연동
│   │   └── Experiment4.jsx # 실험 4 Three.js 궤도 + 별자리 연동
│   ├── App.jsx             # SPA 라우팅 및 전역 상태 제어
│   ├── index.css           # 글로벌 스타일 (글래스모피즘 및 반응형 미디어 쿼리)
│   └── main.jsx            # 진입 스크립트
├── index.html              # Vite 템플릿 엔트리 파일
├── package.json            # 종속성 정의 및 빌드 스크립트
└── vite.config.js          # Vite 빌드 설정
```

---

## 🚀 시작하기 (Getting Started)

### Prerequisites
로컬 PC에 [Node.js](https://nodejs.org/)가 설치되어 있어야 합니다.

### Installation
1. 저장소를 클론하거나 압축을 해제합니다.
2. 프로젝트 루트 폴더에서 다음 명령어로 라이브러리를 설치합니다.
   ```bash
   npm install
   ```

### Development
로컬 개발 서버를 켜서 변경 사항을 실시간으로 확인합니다.
```bash
npm run dev
```

### Production Build
웹 서버에 배포하기 위해 최적화된 빌드 파일을 생성합니다.
```bash
npm run build
```
빌드가 완료되면 루트에 생성되는 `dist/` 폴더 내의 내용물이 배포용 리소스입니다.

---

## ☁️ 배포 가이드 (Netlify Deployment)

Netlify를 사용하여 무료로 웹에 배포할 수 있습니다.

### 방법 1: 폴더 직접 업로드 (Drag & Drop)
1. `npm run build`를 실행하여 `dist/` 폴더를 생성합니다.
2. [Netlify App](https://app.netlify.com/)에 로그인합니다.
3. Sites 메뉴 하단의 업로드 영역에 **`dist/` 폴더를 드래그 앤 드롭**합니다.

### 방법 2: Git 연동 자동 배포 (CI/CD)
GitHub 저장소에 소스코드를 업로드한 뒤 Netlify와 연동하는 경우 설정값:
- **Build command**: `npm run build`
- **Publish directory**: `dist`

---

## 📄 라이선스 (License)

This project is licensed under the MIT License - see the LICENSE file for details.
