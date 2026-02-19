import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { LandingScreen } from './components/LandingScreen';
import { QuizScreen } from './components/QuizScreen';
import { FinalScreen } from './components/FinalScreen';

type Screen = 'landing' | 'quiz' | 'final';

const topics = [
  "What Is ADH1?",
  "Mechanism of Disease",
  "Average Diagnostic Time",
  "Clinical Presentation",
  "Confirming Diagnosis",
  "Limitations of Conventional Therapy"
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    setCurrentQuestionIndex(0);
    setCurrentScreen('quiz');
  };

  const handleQuizComplete = () => {
    setCurrentScreen('final');
  };

  const handleNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < topics.length) {
      setSelectedTopic(topics[nextIndex]);
      setCurrentQuestionIndex(nextIndex);
    } else {
      // Cycle back to first question or go to final
      setCurrentScreen('final');
    }
  };

  const handleBackToStart = () => {
    setCurrentScreen('landing');
    setSelectedTopic('');
    setCurrentQuestionIndex(0);
  };

  const handleRestart = () => {
    setCurrentScreen('landing');
    setSelectedTopic('');
    setCurrentQuestionIndex(0);
  };

  return (
    <div className="w-full h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {currentScreen === 'landing' && (
          <LandingScreen key="landing" onTopicSelect={handleTopicSelect} />
        )}
        {currentScreen === 'quiz' && (
          <QuizScreen 
            key={`quiz-${currentQuestionIndex}`} 
            topic={selectedTopic} 
            onComplete={handleQuizComplete}
            onNext={handleNextQuestion}
            onBackToStart={handleBackToStart}
          />
        )}
        {currentScreen === 'final' && (
          <FinalScreen key="final" onRestart={handleRestart} />
        )}
      </AnimatePresence>
    </div>
  );
}