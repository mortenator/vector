import React, { useState } from "react";
import ChartPanel from "../components/ChartPanel";
import Header from "../components/Header";

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const showMessage = (text: string, duration = 3000) => {
    setMessage(text);
    setTimeout(() => setMessage(null), duration);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header />

      <main className="flex-1 overflow-y-auto p-4">
        <ChartPanel
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          showMessage={showMessage}
        />
      </main>

      {/* Toast Message */}
      {message && (
        <div className="fixed bottom-4 left-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-pulse">
          {message}
        </div>
      )}
    </div>
  );
};

export default App;
