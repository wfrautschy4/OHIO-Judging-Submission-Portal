import React from 'react';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
  label: string;
  error?: string;
  type?: 'text' | 'number' | 'email' | 'select' | 'textarea' | 'file';
  options?: string[]; // For select inputs
  helperText?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ 
  label, 
  error, 
  type = 'text', 
  options, 
  className = '', 
  helperText,
  ...props 
}) => {
  const baseClasses = `w-full rounded-md border shadow-sm px-4 py-2 focus:ring-2 focus:ring-[#bb0000] focus:border-[#bb0000] transition-colors ${
    error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
  }`;

  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
      </label>
      
      {type === 'select' ? (
        <select className={baseClasses} {...(props as any)}>
          {options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea className={`${baseClasses} min-h-[100px]`} {...(props as any)} />
      ) : type === 'file' ? (
        <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-[#bb0000] hover:file:bg-red-100" {...(props as any)} />
      ) : (
        <input type={type} className={baseClasses} {...(props as any)} />
      )}

      {helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
      {error && <p className="mt-1 text-sm text-red-600 font-medium">{error}</p>}
    </div>
  );
};