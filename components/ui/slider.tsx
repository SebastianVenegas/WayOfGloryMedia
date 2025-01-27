"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type BaseSliderProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'value' | 'onChange'>

interface SliderProps extends BaseSliderProps {
  defaultValue?: number[]
  value?: number[]
  min?: number
  max?: number
  step?: number
  onValueChange?: (value: number[]) => void
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ 
    className,
    defaultValue = [0],
    value,
    min = 0,
    max = 100,
    step = 1,
    onValueChange,
    ...props 
  }, ref) => {
    const [localValue, setLocalValue] = React.useState(value || defaultValue)
    const isControlled = value !== undefined

    React.useEffect(() => {
      if (isControlled) {
        setLocalValue(value)
      }
    }, [isControlled, value])

    const handleChange = (newValue: number[]) => {
      if (!isControlled) {
        setLocalValue(newValue)
      }
      onValueChange?.(newValue)
    }

    const percentage = React.useMemo(() => {
      return localValue.map(val => ((val - min) / (max - min)) * 100)
    }, [localValue, min, max])

    const handleThumbDrag = (index: number, event: React.MouseEvent<HTMLDivElement>) => {
      const slider = event.currentTarget.parentElement
      if (!slider) return

      const rect = slider.getBoundingClientRect()
      const offsetX = event.clientX - rect.left
      const percentage = Math.min(Math.max((offsetX / rect.width) * 100, 0), 100)
      const newValue = Math.round((percentage * (max - min)) / 100 / step) * step + min

      const newValues = [...localValue]
      newValues[index] = newValue
      handleChange(newValues)
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        {...props}
      >
        <div className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-gray-200">
          <div
            className="absolute h-full bg-blue-600"
            style={{
              left: `${Math.min(...percentage)}%`,
              width: `${Math.abs(percentage[1] - percentage[0]) || 0}%`
            }}
          />
        </div>
        {localValue.map((val, index) => (
          <div
            key={index}
            role="slider"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={val}
            tabIndex={0}
            className="absolute block h-4 w-4 cursor-pointer rounded-full border border-blue-600 bg-white shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 disabled:pointer-events-none disabled:opacity-50"
            style={{
              left: `calc(${percentage[index]}% - 0.5rem)`
            }}
            onMouseDown={(e) => handleThumbDrag(index, e)}
          />
        ))}
      </div>
    )
  }
)

Slider.displayName = "Slider"

export { Slider }
export type { SliderProps } 