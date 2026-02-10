import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings2, Check } from "lucide-react";

interface TargetSelectorProps {
  currentTarget: number;
  onTargetChange: (target: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  presets?: number[];
}

export const TargetSelector = ({
  currentTarget,
  onTargetChange,
  min = 0,
  max = 100000,
  step = 1,
  label = "Meta",
  unit = "%",
  presets
}: TargetSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempTarget, setTempTarget] = useState(currentTarget);

  const handleConfirm = () => {
    onTargetChange(tempTarget);
    setIsOpen(false);
  };

  const defaultPresets = unit === "%" ? [70, 75, 80, 85, 90, 95] : undefined;
  const displayPresets = presets || defaultPresets;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0 hover:bg-muted"
          title="Editar meta"
        >
          <Settings2 className="h-3 w-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-3">
          <div className="text-sm font-medium">{label}</div>
          
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={tempTarget}
              onChange={(e) => setTempTarget(Number(e.target.value))}
              min={min}
              max={max}
              step={step}
              className="h-8 text-sm"
            />
            <span className="text-sm text-muted-foreground min-w-[20px]">{unit}</span>
          </div>

          {displayPresets && displayPresets.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {displayPresets.map((preset) => (
                <Button
                  key={preset}
                  variant={tempTarget === preset ? "default" : "outline"}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setTempTarget(preset)}
                >
                  {preset.toLocaleString()}{unit}
                </Button>
              ))}
            </div>
          )}

          <Button 
            size="sm" 
            className="w-full h-8"
            onClick={handleConfirm}
          >
            <Check className="h-3 w-3 mr-1" />
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
