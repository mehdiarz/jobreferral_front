//FormCheckbox
interface SimpleCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
    id?: string;
    error?:string;
}

export default function FormCheckbox({
  checked,
  onChange,
  label,
  disabled = false,
  required = false,
  className = "",
  id,
}: SimpleCheckboxProps) {
  const inputId = id
  return (
    <div className={`flex items-center gap-2 relative w-full m-1 align-middle ${className}`} >
      <input
        type="checkbox"
        id={inputId}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-6 h-6 rounded border"
      />
      {label && (
        <label htmlFor={inputId} className="ml-2 select-none text-sm">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
    </div>
  );
}
