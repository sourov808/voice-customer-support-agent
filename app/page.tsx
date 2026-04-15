"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SpeechRecognitionEvent extends Event {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);


  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Female"));
      if (preferredVoice) utterance.voice = preferredVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleUserSpeech = useCallback(async (transcript: string) => {
    const userMessage: Message = { role: "user", content: transcript };
    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const response = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: transcript }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const assistantMessage: Message = { role: "assistant", content: data.response };
      setMessages((prev) => [...prev, assistantMessage]);
      speak(data.response);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get response from Gemini";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition: SpeechRecognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        handleUserSpeech(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error !== "no-speech") {
           setError(`Error: ${event.error}`);
        }
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      setError("Speech recognition is not supported in this browser.");
    }
  }, [handleUserSpeech]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const startListening = () => {
    setError(null);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start recognition:", err);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30">
      <header className="p-6 border-b border-zinc-800/50 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="text-xl font-medium bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Nisko Voice Agent
          </h1>
        </div>
        {error && (
          <div className="text-xs text-rose-400 bg-rose-400/10 px-3 py-1 rounded-full border border-rose-400/20">
            {error}
          </div>
        )}
      </header>

      <main className="flex-1 overflow-hidden flex flex-col relative px-4 sm:px-6">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto py-8 space-y-6 scroll-smooth scrollbar-hide"
        >
          {messages.length === 0 && !isProcessing && (
            <div className="h-full flex flex-col items-center justify-center opacity-40 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <p className="text-sm font-light">Tap the microphone to start talking to Nisko</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-500`}
            >
              <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user" 
                  ? "bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/10" 
                  : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-zinc-900 border border-zinc-800 px-5 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" />
              </div>
            </div>
          )}
        </div>

        <div className="p-8 flex justify-center pb-12">
          <button
            onClick={() => isListening ? recognitionRef.current?.stop() : startListening()}
            disabled={isProcessing}

            className={`group relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening 
                ? "bg-rose-500 scale-110 shadow-xl shadow-rose-500/20" 
                : "bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 hover:scale-105"
            } disabled:opacity-50 disabled:grayscale`}
          >
            {isListening && (
              <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-25" />
            )}
            
            {isListening ? (
              <div className="w-5 h-5 bg-white rounded-sm" />
            ) : (
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
