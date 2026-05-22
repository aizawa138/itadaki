type PantryCardProps = {
  title: string;
  quantity: number;
};

export default function PantryCard({ title, quantity }: PantryCardProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-300 p-4 bg-background">
      <h2 className="text-sm text-foreground">{title}</h2>
      <p className="text-xs bg-foreground text-background rounded-full px-2 py-1">
        x {quantity}
      </p>
    </div>
  );
}
