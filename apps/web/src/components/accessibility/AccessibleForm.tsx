'use client';

import React, { useState, useId, useCallback } from 'react';
import { clsx } from 'clsx';
import { useAccessibility, useAnnouncer } from '@/hooks/useAccessibility';

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio';
  value: string | number | boolean;
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: { value: string; label: string }[];
  validation?: (value: any) => string | null;
  disabled?: boolean;
  autoComplete?: string;
}

export interface FormError {
  field: string;
  message: string;
}

interface AccessibleFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => Promise<void> | void;
  onFieldChange?: (fieldId: string, value: any) => void;
  errors?: FormError[];
  isSubmitting?: boolean;
  submitLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function AccessibleForm({
  fields,
  onSubmit,
  onFieldChange,
  errors = [],
  isSubmitting = false,
  submitLabel = 'Submit',
  className = '',
  children,
}: AccessibleFormProps) {
  const { focusVisible, screenReader } = useAccessibility();
  const { announce } = useAnnouncer();
  const formId = useId();
  
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    fields.forEach(field => {
      initial[field.name] = field.value;
    });
    return initial;
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const getFieldError = useCallback((fieldName: string) => {
    // Check for external errors first
    const externalError = errors.find(error => error.field === fieldName);
    if (externalError) return externalError.message;
    
    // Check for field validation errors
    return fieldErrors[fieldName] || null;
  }, [errors, fieldErrors]);

  const validateField = useCallback((field: FormField, value: any) => {
    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${field.label} is required`;
    }
    
    if (field.validation) {
      return field.validation(value);
    }
    
    return null;
  }, []);

  const handleFieldChange = useCallback((field: FormField, value: any) => {
    setFormData(prev => ({ ...prev, [field.name]: value }));
    
    // Validate field if it has been touched
    if (touched[field.name]) {
      const error = validateField(field, value);
      setFieldErrors(prev => ({
        ...prev,
        [field.name]: error || '',
      }));
    }
    
    onFieldChange?.(field.id, value);
  }, [touched, validateField, onFieldChange]);

  const handleFieldBlur = useCallback((field: FormField) => {
    setTouched(prev => ({ ...prev, [field.name]: true }));
    
    const value = formData[field.name];
    const error = validateField(field, value);
    
    setFieldErrors(prev => ({
      ...prev,
      [field.name]: error || '',
    }));

    // Announce error to screen readers
    if (error && screenReader) {
      announce(`Error in ${field.label}: ${error}`, 'assertive');
    }
  }, [formData, validateField, screenReader, announce]);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    let hasErrors = false;
    
    fields.forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
        hasErrors = true;
      }
    });
    
    setFieldErrors(newErrors);
    setTouched(Object.fromEntries(fields.map(field => [field.name, true])));
    
    if (hasErrors) {
      const errorCount = Object.keys(newErrors).length;
      announce(`Form has ${errorCount} error${errorCount === 1 ? '' : 's'}. Please review and correct.`, 'assertive');
      
      // Focus first field with error
      const firstErrorField = fields.find(field => newErrors[field.name]);
      if (firstErrorField) {
        const element = document.getElementById(`${formId}-${firstErrorField.name}`);
        element?.focus();
      }
      return;
    }
    
    try {
      await onSubmit(formData);
      announce('Form submitted successfully', 'polite');
    } catch (error) {
      announce('Form submission failed. Please try again.', 'assertive');
    }
  }, [fields, formData, validateField, announce, onSubmit, formId]);

  const renderField = (field: FormField) => {
    const fieldId = `${formId}-${field.name}`;
    const errorId = `${fieldId}-error`;
    const descriptionId = `${fieldId}-description`;
    const error = getFieldError(field.name);
    const hasError = Boolean(error);
    
    const commonProps = {
      id: fieldId,
      name: field.name,
      disabled: field.disabled || isSubmitting,
      required: field.required,
      'aria-invalid': hasError,
      'aria-describedby': clsx({
        [descriptionId]: field.description,
        [errorId]: hasError,
      }),
      className: clsx(
        'w-full px-fib-3 py-fib-2 border rounded-lg transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
        {
          'border-error-300 bg-error-50': hasError,
          'border-neutral-300 bg-white': !hasError,
          'opacity-50 cursor-not-allowed': field.disabled || isSubmitting,
          'ring-2 ring-primary-500': focusVisible,
        }
      ),
      onBlur: () => handleFieldBlur(field),
    };

    let inputElement: React.ReactNode;

    switch (field.type) {
      case 'textarea':
        inputElement = (
          <textarea
            {...commonProps}
            value={formData[field.name] || ''}
            placeholder={field.placeholder}
            autoComplete={field.autoComplete}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            rows={4}
          />
        );
        break;

      case 'select':
        inputElement = (
          <select
            {...commonProps}
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        break;

      case 'checkbox':
        inputElement = (
          <div className="flex items-center">
            <input
              {...commonProps}
              type="checkbox"
              checked={Boolean(formData[field.name])}
              onChange={(e) => handleFieldChange(field, e.target.checked)}
              className={clsx(
                'w-4 h-4 text-primary-600 border-neutral-300 rounded',
                'focus:ring-primary-500 focus:ring-2',
                {
                  'border-error-300': hasError,
                  'ring-2 ring-primary-500': focusVisible,
                }
              )}
            />
            <label htmlFor={fieldId} className="ml-fib-2 text-mobile-sm text-neutral-700">
              {field.label}
              {field.required && <span className="text-error-600 ml-1" aria-label="required">*</span>}
            </label>
          </div>
        );
        break;

      case 'radio':
        inputElement = (
          <fieldset className="space-y-fib-2">
            <legend className="text-mobile-sm font-medium text-neutral-900">
              {field.label}
              {field.required && <span className="text-error-600 ml-1" aria-label="required">*</span>}
            </legend>
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center">
                <input
                  id={`${fieldId}-${option.value}`}
                  name={field.name}
                  type="radio"
                  value={option.value}
                  checked={formData[field.name] === option.value}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  disabled={field.disabled || isSubmitting}
                  className={clsx(
                    'w-4 h-4 text-primary-600 border-neutral-300',
                    'focus:ring-primary-500 focus:ring-2',
                    {
                      'border-error-300': hasError,
                      'ring-2 ring-primary-500': focusVisible,
                    }
                  )}
                />
                <label htmlFor={`${fieldId}-${option.value}`} className="ml-fib-2 text-mobile-sm text-neutral-700">
                  {option.label}
                </label>
              </div>
            ))}
          </fieldset>
        );
        break;

      default:
        inputElement = (
          <input
            {...commonProps}
            type={field.type}
            value={formData[field.name] || ''}
            placeholder={field.placeholder}
            autoComplete={field.autoComplete}
            onChange={(e) => {
              const value = field.type === 'number' ? Number(e.target.value) : e.target.value;
              handleFieldChange(field, value);
            }}
          />
        );
    }

    if (field.type === 'checkbox' || field.type === 'radio') {
      return (
        <div key={field.name} className="space-y-fib-1">
          {inputElement}
          {field.description && (
            <p id={descriptionId} className="text-mobile-xs text-neutral-600">
              {field.description}
            </p>
          )}
          {hasError && (
            <p id={errorId} className="text-mobile-xs text-error-600" role="alert">
              {error}
            </p>
          )}
        </div>
      );
    }

    return (
      <div key={field.name} className="space-y-fib-1">
        <label htmlFor={fieldId} className="block text-mobile-sm font-medium text-neutral-900">
          {field.label}
          {field.required && <span className="text-error-600 ml-1" aria-label="required">*</span>}
        </label>
        {inputElement}
        {field.description && (
          <p id={descriptionId} className="text-mobile-xs text-neutral-600">
            {field.description}
          </p>
        )}
        {hasError && (
          <p id={errorId} className="text-mobile-xs text-error-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={clsx('space-y-fib-4', className)}
      noValidate
      aria-label="Form"
    >
      {fields.map(renderField)}
      
      {children}
      
      <div className="flex justify-end space-x-fib-3 pt-fib-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className={clsx(
            'px-fib-4 py-fib-2 bg-primary-600 text-white rounded-lg font-medium',
            'hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-150',
            {
              'ring-2 ring-primary-500': focusVisible,
            }
          )}
          aria-describedby={isSubmitting ? 'submit-status' : undefined}
        >
          {isSubmitting ? 'Submitting...' : submitLabel}
        </button>
      </div>
      
      {isSubmitting && (
        <div id="submit-status" className="sr-only" aria-live="polite">
          Form is being submitted, please wait.
        </div>
      )}
    </form>
  );
}