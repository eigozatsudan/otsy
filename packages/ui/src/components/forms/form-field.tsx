import * as React from 'react';
import { Input, InputProps } from '../ui/input';
import { Textarea, TextareaProps } from '../ui/textarea';
import { cn } from '../../utils/cn';

interface BaseFormFieldProps {
  name: string;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

interface FormFieldInputProps extends BaseFormFieldProps, Omit<InputProps, 'error' | 'label' | 'helperText' | 'name'> {
  type?: 'input';
}

interface FormFieldTextareaProps extends BaseFormFieldProps, Omit<TextareaProps, 'error' | 'label' | 'helperText' | 'name'> {
  type: 'textarea';
}

interface FormFieldSelectProps extends BaseFormFieldProps {
  type: 'select';
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

interface FormFieldCheckboxProps extends BaseFormFieldProps {
  type: 'checkbox';
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  description?: string;
}

type FormFieldProps = 
  | FormFieldInputProps 
  | FormFieldTextareaProps 
  | FormFieldSelectProps 
  | FormFieldCheckboxProps;

export function FormField(props: FormFieldProps) {
  const { name, label, error, required, className, type = 'input' } = props;
  const fieldId = React.useId();

  const renderField = () => {
    switch (type) {
      case 'textarea':
        const textareaProps = props as FormFieldTextareaProps;
        const { name: textareaName, label: textareaLabel, error: textareaError, required: textareaRequired, className: textareaClassName, type: textareaType, ...restTextareaProps } = textareaProps;
        return (
          <Textarea
            id={fieldId}
            name={name}
            error={!!error}
            helperText={error}
            {...restTextareaProps}
          />
        );

      case 'select':
        const selectProps = props as FormFieldSelectProps;
        return (
          <select
            id={fieldId}
            name={name}
            value={selectProps.value || ''}
            onChange={(e) => selectProps.onChange?.(e.target.value)}
            className={cn(
              'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-red-500 focus-visible:ring-red-500'
            )}
          >
            {selectProps.placeholder && (
              <option value="" disabled>
                {selectProps.placeholder}
              </option>
            )}
            {selectProps.options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        const checkboxProps = props as FormFieldCheckboxProps;
        return (
          <div className="flex items-start space-x-3">
            <input
              id={fieldId}
              name={name}
              type="checkbox"
              checked={checkboxProps.checked || false}
              onChange={(e) => checkboxProps.onChange?.(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              {label && (
                <label htmlFor={fieldId} className="text-sm font-medium text-gray-900">
                  {label}
                  {required && <span className="text-red-500 ml-1">*</span>}
                </label>
              )}
              {checkboxProps.description && (
                <p className="text-sm text-gray-500 mt-1">{checkboxProps.description}</p>
              )}
            </div>
          </div>
        );

      default:
        const inputProps = props as FormFieldInputProps;
        const { name: inputName, label: inputLabel, error: inputError, required: inputRequired, className: inputClassName, type: inputType, ...restInputProps } = inputProps;
        return (
          <Input
            id={fieldId}
            name={name}
            error={!!error}
            helperText={error}
            {...restInputProps}
          />
        );
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {type !== 'checkbox' && label && (
        <label
          htmlFor={fieldId}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {renderField()}
      
      {type !== 'input' && type !== 'textarea' && error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}