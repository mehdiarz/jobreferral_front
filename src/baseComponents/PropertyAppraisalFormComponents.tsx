export function CheckboxField({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
          disabled ? "opacity-60 cursor-not-allowed" : ""
        }`}
      />
      <label className="text-sm text-gray-700">{label}</label>
    </div>
  );
}
