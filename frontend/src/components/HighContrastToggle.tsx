export default function HighContrastToggle({ highContrast, onToggle }: { highContrast: boolean, onToggle: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <span className="text-gray-700 text-lg">
        <svg width="22" height="22" fill="none" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16V2z" fill="#222"/><circle cx="10" cy="10" r="8" stroke="#888" strokeWidth="2"/></svg>
      </span>
      <span className="text-base text-gray-900 font-medium">High Contrast</span>
      <input
        type="checkbox"
        className="ml-2"
        checked={highContrast}
        onChange={onToggle}
      />
    </label>
  );
} 