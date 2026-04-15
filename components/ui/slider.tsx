import { cn } from "@/lib/utils"

function Slider({
  className,
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
}: {
  className?: string;
  value: number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange: (value: number[]) => void;
}) {
  // Senior Architect Note: Using a native range input as the interaction layer 
  // ensures maximum compatibility across browsers and prevents event hijacking 
  // by parent scroll containers or animation libraries.
  const val = value[0] ?? min;
  const percentage = ((val - min) / (max - min)) * 100;

  return (
    <div className={cn("relative w-full h-6 flex items-center group touch-none", className)}>
      {/* Track Background */}
      <div className="absolute w-full h-1.5 bg-[#141414]/10 rounded-full overflow-hidden">
        {/* Progress Indicator */}
        <div 
          className="absolute h-full bg-[#141414] transition-all duration-75" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Native Range Input (Hidden but functional) */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={val}
        onChange={(e) => {
          const newValue = parseFloat(e.target.value);
          onValueChange([newValue]);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute w-full h-full opacity-0 cursor-pointer z-20"
        style={{ margin: 0 }}
      />
      
      {/* Custom Thumb */}
      <div 
        className={cn(
          "absolute size-4 rounded-full border-2 border-[#141414] bg-white shadow-md",
          "pointer-events-none transition-all duration-75",
          "group-hover:scale-125 group-active:scale-95 group-active:bg-[#141414]"
        )}
        style={{ 
          left: `calc(${percentage}% - 8px)`,
          transition: 'left 75ms ease-out, transform 75ms ease-out, background-color 75ms ease-out'
        }}
      />
    </div>
  );
}

export { Slider }
