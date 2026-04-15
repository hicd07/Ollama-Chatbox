import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  onValueChange,
  ...props
}: SliderPrimitive.Root.Props & { onValueChange?: (value: number[]) => void }) {
  // Determine the number of thumbs based on the value or defaultValue
  const values = value ?? defaultValue ?? [min];
  const thumbCount = Array.isArray(values) ? values.length : 1;

  return (
    <SliderPrimitive.Root
      className={cn("relative flex w-full touch-none items-center select-none data-disabled:opacity-50 h-5", className)}
      data-slot="slider"
      value={value}
      defaultValue={defaultValue}
      min={min}
      max={max}
      onValueChange={onValueChange}
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full items-center">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative h-1 w-full grow overflow-hidden rounded-full bg-[#141414]/10"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="absolute h-full bg-[#141414]"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: thumbCount }).map((_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="block size-4 rounded-full border-2 border-[#141414] bg-white ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141414] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-125 active:scale-90 cursor-grab active:cursor-grabbing shadow-sm"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
