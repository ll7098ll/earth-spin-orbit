import React, { useState, useEffect } from 'react';
import { BookOpen, Settings, CheckSquare, Award, ArrowLeft, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const ExperimentLayout = ({
  title,
  badge,
  onBack,
  simulator,
  controls,
  studyContent = [],
  quizContent = []
}) => {
  const [activeTab, setActiveTab] = useState('controls'); // 'controls' | 'study' | 'quiz'
  
  // Quiz states
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Reset quiz state when changing layout or restarting
  const restartQuiz = () => {
    setQuizIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
    setShowExplanation(false);
  };

  useEffect(() => {
    restartQuiz();
  }, [quizContent]);

  const handleAnswerSelect = (optionIndex) => {
    if (isAnswered) return;
    
    setSelectedAnswer(optionIndex);
    setIsAnswered(true);
    setShowExplanation(true);
    
    const currentQuestion = quizContent[quizIndex];
    if (optionIndex === currentQuestion.answerIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    const nextIndex = quizIndex + 1;
    if (nextIndex < quizContent.length) {
      setQuizIndex(nextIndex);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowExplanation(false);
    } else {
      setQuizFinished(true);
      
      // If perfect score, launch confetti!
      const finalScore = score + (selectedAnswer === quizContent[quizIndex].answerIndex ? 1 : 0);
      if (finalScore === quizContent.length) {
        triggerConfetti();
      }
    }
  };

  const triggerConfetti = () => {
    const duration = 2 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#a5b4fc', '#06b6d4', '#4f46e5']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#a5b4fc', '#06b6d4', '#4f46e5']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  return (
    <div className="experiment-view">
      <header className="experiment-header">
        <div className="header-title-container">
          <button onClick={onBack} className="btn-back">
            <ArrowLeft size={16} />
            대시보드
          </button>
          <h1>{title}</h1>
          <span className="experiment-badge">{badge}</span>
        </div>
      </header>

      <div className="experiment-container">
        {/* Left Side: Simulator Viewport */}
        <div className="simulator-panel">
          {simulator}
        </div>

        {/* Right Side: Sidebar Panel with 3 Tabs */}
        <div className="sidebar-panel">
          <nav className="sidebar-tabs">
            <button
              onClick={() => setActiveTab('controls')}
              className={`sidebar-tab-btn ${activeTab === 'controls' ? 'active' : ''}`}
            >
              <Settings size={16} />
              실험 조작
            </button>
            <button
              onClick={() => setActiveTab('study')}
              className={`sidebar-tab-btn ${activeTab === 'study' ? 'active' : ''}`}
            >
              <BookOpen size={16} />
              내용 학습
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`sidebar-tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
            >
              <CheckSquare size={16} />
              퀴즈 풀기
            </button>
          </nav>

          <div className="sidebar-content">
            {/* Tab 1: Controls */}
            {activeTab === 'controls' && (
              <div className="controls-container">
                {controls}
              </div>
            )}

            {/* Tab 2: Study */}
            {activeTab === 'study' && (
              <div className="study-container">
                <h2 className="study-title">핵심 학습 내용</h2>
                {studyContent.map((card, idx) => (
                  <div key={idx} className="study-card">
                    <h3 className="study-card-title">
                      <span>{card.icon || '📌'}</span>
                      {card.title}
                    </h3>
                    <p className="study-card-desc" dangerouslySetInnerHTML={{ __html: card.description }} />
                    {card.list && (
                      <ul className="study-list">
                        {card.list.map((item, lIdx) => (
                          <li key={lIdx} className="study-list-item" dangerouslySetInnerHTML={{ __html: item }} />
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Quiz */}
            {activeTab === 'quiz' && (
              <div className="quiz-container">
                {!quizFinished && quizContent.length > 0 ? (
                  <>
                    {/* Progress indicator */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span>문제 {quizIndex + 1} / {quizContent.length}</span>
                      <span>맞힌 개수: {score}</span>
                    </div>
                    <div className="quiz-progress-bar">
                      <div
                        className="quiz-progress-fill"
                        style={{ width: `${((quizIndex) / quizContent.length) * 100}%` }}
                      />
                    </div>

                    <div className="quiz-question-box">
                      <p className="quiz-question-text">
                        {quizContent[quizIndex].question}
                      </p>
                      
                      <div className="quiz-options">
                        {quizContent[quizIndex].options.map((option, optIdx) => {
                          let optClass = "quiz-option-btn";
                          if (isAnswered) {
                            if (optIdx === quizContent[quizIndex].answerIndex) {
                              optClass += " correct";
                            } else if (optIdx === selectedAnswer) {
                              optClass += " wrong";
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleAnswerSelect(optIdx)}
                              className={optClass}
                              disabled={isAnswered}
                            >
                              <span>{optIdx + 1}. {option}</span>
                              {isAnswered && optIdx === quizContent[quizIndex].answerIndex && (
                                <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0 }} />
                              )}
                              {isAnswered && optIdx === selectedAnswer && optIdx !== quizContent[quizIndex].answerIndex && (
                                <XCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {showExplanation && (
                        <div className="quiz-feedback-box">
                          <strong style={{ display: 'block', marginBottom: '0.25rem', color: '#fff' }}>
                            {selectedAnswer === quizContent[quizIndex].answerIndex ? "🎉 정답입니다!" : "💡 해설 및 오답 정리"}
                          </strong>
                          {quizContent[quizIndex].explanation}
                        </div>
                      )}

                      {isAnswered && (
                        <button onClick={handleNextQuestion} className="btn active" style={{ marginTop: '0.5rem', alignSelf: 'flex-end' }}>
                          {quizIndex === quizContent.length - 1 ? "결과 보기" : "다음 문제"}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="quiz-result-box">
                    <Award size={48} color="var(--secondary-glow)" />
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>퀴즈 완료!</h2>
                    <div className="quiz-result-score">
                      {score} / {quizContent.length}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                      {score === quizContent.length 
                        ? "축하합니다! 핵심 개념을 완벽하게 이해하셨습니다. 🥳" 
                        : "조금만 더 노력해 봐요! 실험을 한 번 더 관찰하고 내용을 확인해 보세요."}
                    </p>
                    <button onClick={restartQuiz} className="btn active" style={{ gap: '0.5rem' }}>
                      <RefreshCw size={14} />
                      퀴즈 다시 풀기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperimentLayout;
