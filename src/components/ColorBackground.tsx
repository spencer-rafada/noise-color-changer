interface ColorBackgroundProps {
  color: string;
  children: React.ReactNode;
}

export function ColorBackground({ color, children }: ColorBackgroundProps) {
  return (
    <div
      className="color-background"
      style={{ backgroundColor: color }}
    >
      {children}
    </div>
  );
}
