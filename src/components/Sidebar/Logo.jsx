import { Link } from "react-router-dom";

export default function Logo() {
  return (
    <Link to="/" className="flex items-baseline gap-0 px-2 pt-10 pb-6">
      <span className="text-3xl font-bold black:text-text-main">py</span>
      <span className="text-3xl font-bold text-accent">Learn</span>
      <span 
        className="w-2 h-4 bg-accent ml-1 inline-block" 
        style={{animation: 'blink 1.1s steps(1) infinite'}}
      />
      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </Link>
  );
}