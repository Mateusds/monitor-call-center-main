import { Moon, Sun, Contrast, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";

type GradientIntensity = "subtle" | "medium" | "intense";

export const ThemeControls = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [gradientIntensity, setGradientIntensity] = useState<GradientIntensity>("medium");
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply gradient intensity
    root.classList.remove("gradient-subtle", "gradient-medium", "gradient-intense");
    root.classList.add(`gradient-${gradientIntensity}`);

    // Apply high contrast
    if (highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }
  }, [theme, gradientIntensity, highContrast]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className="hover-scale"
      >
        {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="hover-scale">
            <Sparkles className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Intensidade do Gradiente</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setGradientIntensity("subtle")}>
            {gradientIntensity === "subtle" && "✓ "}Sutil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setGradientIntensity("medium")}>
            {gradientIntensity === "medium" && "✓ "}Médio
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setGradientIntensity("intense")}>
            {gradientIntensity === "intense" && "✓ "}Intenso
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setHighContrast(!highContrast)}>
            <Contrast className="h-4 w-4 mr-2" />
            {highContrast ? "✓ " : ""}Alto Contraste
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
