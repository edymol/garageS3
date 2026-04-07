interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: "blue" | "green" | "red" | "purple";
}

const colorClasses = {
  blue: "bg-blue-50 text-blue-700",
  green: "bg-green-50 text-green-700",
  red: "bg-red-50 text-red-700",
  purple: "bg-purple-50 text-purple-700",
};

export function StatCard({ title, value, subtitle, color = "blue" }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${colorClasses[color].split(" ")[1]}`}>
        {value}
      </p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
