/**
 * Input validation and sanitization utilities
 */

import DOMPurify from 'isomorphic-dompurify';

// Validation patterns
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  displayName: /^[a-zA-Z0-9\s\-_\.]{2,50}$/,
  groupName: /^[a-zA-Z0-9\s\-_\.]{2,100}$/,
  inviteCode: /^[A-Z0-9]{12}$/,
  itemName: /^[a-zA-Z0-9\s\-_\.\,\(\)]{1,100}$/,
  category: /^[a-zA-Z0-9\s\-_\.]{1,50}$/,
  currency: /^\d+(\.\d{1,2})?$/,
  quantity: /^\d+$/,
  percentage: /^(100|[1-9]?\d)$/,
} as const;

// Validation error messages
export const ValidationMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  displayName: 'Display name must be 2-50 characters and contain only letters, numbers, spaces, hyphens, underscores, and periods',
  groupName: 'Group name must be 2-100 characters and contain only letters, numbers, spaces, hyphens, underscores, and periods',
  inviteCode: 'Invite code must be exactly 12 uppercase letters and numbers',
  itemName: 'Item name must be 1-100 characters',
  category: 'Category must be 1-50 characters',
  currency: 'Please enter a valid amount (e.g., 10.50)',
  quantity: 'Quantity must be a positive number',
  percentage: 'Percentage must be between 0 and 100',
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must be no more than ${max} characters`,
  min: (min: number) => `Must be at least ${min}`,
  max: (max: number) => `Must be no more than ${max}`,
} as const;

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
}

/**
 * Base validator class
 */
export abstract class BaseValidator {
  protected errors: string[] = [];

  abstract validate(value: any): ValidationResult;

  protected addError(message: string): void {
    this.errors.push(message);
  }

  protected reset(): void {
    this.errors = [];
  }

  protected createResult(isValid: boolean, sanitizedValue?: any): ValidationResult {
    return {
      isValid,
      errors: [...this.errors],
      sanitizedValue,
    };
  }
}

/**
 * String validator
 */
export class StringValidator extends BaseValidator {
  private minLength?: number;
  private maxLength?: number;
  private pattern?: RegExp;
  private required: boolean = false;
  private trim: boolean = true;
  private allowEmpty: boolean = false;

  setRequired(required: boolean = true): this {
    this.required = required;
    return this;
  }

  setMinLength(min: number): this {
    this.minLength = min;
    return this;
  }

  setMaxLength(max: number): this {
    this.maxLength = max;
    return this;
  }

  setPattern(pattern: RegExp): this {
    this.pattern = pattern;
    return this;
  }

  setTrim(trim: boolean = true): this {
    this.trim = trim;
    return this;
  }

  setAllowEmpty(allowEmpty: boolean = true): this {
    this.allowEmpty = allowEmpty;
    return this;
  }

  validate(value: any): ValidationResult {
    this.reset();

    // Convert to string and trim if needed
    let stringValue = String(value || '');
    if (this.trim) {
      stringValue = stringValue.trim();
    }

    // Check required
    if (this.required && !stringValue) {
      this.addError(ValidationMessages.required);
      return this.createResult(false);
    }

    // Allow empty if not required
    if (!stringValue && !this.required && this.allowEmpty) {
      return this.createResult(true, stringValue);
    }

    // Check length constraints
    if (this.minLength !== undefined && stringValue.length < this.minLength) {
      this.addError(ValidationMessages.minLength(this.minLength));
    }

    if (this.maxLength !== undefined && stringValue.length > this.maxLength) {
      this.addError(ValidationMessages.maxLength(this.maxLength));
    }

    // Check pattern
    if (this.pattern && !this.pattern.test(stringValue)) {
      this.addError('Invalid format');
    }

    return this.createResult(this.errors.length === 0, stringValue);
  }
}

/**
 * Number validator
 */
export class NumberValidator extends BaseValidator {
  private min?: number;
  private max?: number;
  private integer: boolean = false;
  private required: boolean = false;

  setRequired(required: boolean = true): this {
    this.required = required;
    return this;
  }

  setMin(min: number): this {
    this.min = min;
    return this;
  }

  setMax(max: number): this {
    this.max = max;
    return this;
  }

  setInteger(integer: boolean = true): this {
    this.integer = integer;
    return this;
  }

  validate(value: any): ValidationResult {
    this.reset();

    // Handle empty values
    if (value === null || value === undefined || value === '') {
      if (this.required) {
        this.addError(ValidationMessages.required);
        return this.createResult(false);
      }
      return this.createResult(true, undefined);
    }

    // Convert to number
    const numValue = Number(value);

    // Check if valid number
    if (isNaN(numValue)) {
      this.addError('Must be a valid number');
      return this.createResult(false);
    }

    // Check integer constraint
    if (this.integer && !Number.isInteger(numValue)) {
      this.addError('Must be a whole number');
    }

    // Check range constraints
    if (this.min !== undefined && numValue < this.min) {
      this.addError(ValidationMessages.min(this.min));
    }

    if (this.max !== undefined && numValue > this.max) {
      this.addError(ValidationMessages.max(this.max));
    }

    return this.createResult(this.errors.length === 0, numValue);
  }
}

/**
 * Email validator
 */
export class EmailValidator extends BaseValidator {
  private required: boolean = false;

  setRequired(required: boolean = true): this {
    this.required = required;
    return this;
  }

  validate(value: any): ValidationResult {
    this.reset();

    const stringValue = String(value || '').trim().toLowerCase();

    if (this.required && !stringValue) {
      this.addError(ValidationMessages.required);
      return this.createResult(false);
    }

    if (stringValue && !ValidationPatterns.email.test(stringValue)) {
      this.addError(ValidationMessages.email);
    }

    return this.createResult(this.errors.length === 0, stringValue);
  }
}

/**
 * Array validator
 */
export class ArrayValidator extends BaseValidator {
  private minLength?: number;
  private maxLength?: number;
  private itemValidator?: BaseValidator;
  private required: boolean = false;

  setRequired(required: boolean = true): this {
    this.required = required;
    return this;
  }

  setMinLength(min: number): this {
    this.minLength = min;
    return this;
  }

  setMaxLength(max: number): this {
    this.maxLength = max;
    return this;
  }

  setItemValidator(validator: BaseValidator): this {
    this.itemValidator = validator;
    return this;
  }

  validate(value: any): ValidationResult {
    this.reset();

    if (!Array.isArray(value)) {
      if (this.required) {
        this.addError('Must be an array');
        return this.createResult(false);
      }
      return this.createResult(true, []);
    }

    // Check length constraints
    if (this.minLength !== undefined && value.length < this.minLength) {
      this.addError(`Must have at least ${this.minLength} items`);
    }

    if (this.maxLength !== undefined && value.length > this.maxLength) {
      this.addError(`Must have no more than ${this.maxLength} items`);
    }

    // Validate each item
    const validatedItems: any[] = [];
    if (this.itemValidator) {
      for (let i = 0; i < value.length; i++) {
        const itemResult = this.itemValidator.validate(value[i]);
        if (!itemResult.isValid) {
          this.addError(`Item ${i + 1}: ${itemResult.errors.join(', ')}`);
        } else {
          validatedItems.push(itemResult.sanitizedValue);
        }
      }
    } else {
      validatedItems.push(...value);
    }

    return this.createResult(this.errors.length === 0, validatedItems);
  }
}

/**
 * Object validator
 */
export class ObjectValidator extends BaseValidator {
  private schema: Record<string, BaseValidator> = {};
  private required: boolean = false;
  private allowUnknown: boolean = false;

  setRequired(required: boolean = true): this {
    this.required = required;
    return this;
  }

  setAllowUnknown(allowUnknown: boolean = true): this {
    this.allowUnknown = allowUnknown;
    return this;
  }

  setSchema(schema: Record<string, BaseValidator>): this {
    this.schema = schema;
    return this;
  }

  addField(key: string, validator: BaseValidator): this {
    this.schema[key] = validator;
    return this;
  }

  validate(value: any): ValidationResult {
    this.reset();

    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      if (this.required) {
        this.addError('Must be an object');
        return this.createResult(false);
      }
      return this.createResult(true, {});
    }

    const validatedObject: Record<string, any> = {};

    // Validate known fields
    for (const [key, validator] of Object.entries(this.schema)) {
      const fieldResult = validator.validate(value[key]);
      if (!fieldResult.isValid) {
        fieldResult.errors.forEach(error => {
          this.addError(`${key}: ${error}`);
        });
      } else if (fieldResult.sanitizedValue !== undefined) {
        validatedObject[key] = fieldResult.sanitizedValue;
      }
    }

    // Handle unknown fields
    if (!this.allowUnknown) {
      const unknownKeys = Object.keys(value).filter(key => !this.schema[key]);
      if (unknownKeys.length > 0) {
        this.addError(`Unknown fields: ${unknownKeys.join(', ')}`);
      }
    } else {
      // Include unknown fields as-is
      Object.keys(value).forEach(key => {
        if (!this.schema[key]) {
          validatedObject[key] = value[key];
        }
      });
    }

    return this.createResult(this.errors.length === 0, validatedObject);
  }
}

/**
 * Sanitization utilities
 */
export class Sanitizer {
  /**
   * Sanitize HTML content
   */
  static html(input: string, options?: {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
  }): string {
    const config = {
      ALLOWED_TAGS: options?.allowedTags || ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: options?.allowedAttributes || {},
      KEEP_CONTENT: true,
    };

    return DOMPurify.sanitize(input, config);
  }

  /**
   * Sanitize plain text (remove all HTML)
   */
  static text(input: string): string {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
  }

  /**
   * Sanitize filename
   */
  static filename(input: string): string {
    return input
      .replace(/[^a-zA-Z0-9\-_\.]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 255);
  }

  /**
   * Sanitize SQL input (basic protection)
   */
  static sql(input: string): string {
    return input
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
  }

  /**
   * Remove potentially dangerous characters
   */
  static dangerous(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:/gi, '');
  }
}

/**
 * Predefined validators for common use cases
 */
export const Validators = {
  email: () => new EmailValidator().setRequired(),
  optionalEmail: () => new EmailValidator(),
  
  displayName: () => new StringValidator()
    .setRequired()
    .setMinLength(2)
    .setMaxLength(50)
    .setPattern(ValidationPatterns.displayName),
    
  groupName: () => new StringValidator()
    .setRequired()
    .setMinLength(2)
    .setMaxLength(100)
    .setPattern(ValidationPatterns.groupName),
    
  inviteCode: () => new StringValidator()
    .setRequired()
    .setPattern(ValidationPatterns.inviteCode),
    
  itemName: () => new StringValidator()
    .setRequired()
    .setMinLength(1)
    .setMaxLength(100)
    .setPattern(ValidationPatterns.itemName),
    
  category: () => new StringValidator()
    .setRequired()
    .setMinLength(1)
    .setMaxLength(50)
    .setPattern(ValidationPatterns.category),
    
  currency: () => new NumberValidator()
    .setRequired()
    .setMin(0)
    .setMax(999999.99),
    
  quantity: () => new NumberValidator()
    .setRequired()
    .setInteger()
    .setMin(0)
    .setMax(9999),
    
  percentage: () => new NumberValidator()
    .setRequired()
    .setInteger()
    .setMin(0)
    .setMax(100),
    
  notes: () => new StringValidator()
    .setMaxLength(500)
    .setAllowEmpty(),
    
  description: () => new StringValidator()
    .setMaxLength(1000)
    .setAllowEmpty(),
    
  password: () => new StringValidator()
    .setRequired()
    .setMinLength(8)
    .setMaxLength(128),
};

/**
 * Validation helper function
 */
export function validateInput<T>(
  input: any,
  validator: BaseValidator
): { isValid: boolean; data?: T; errors: string[] } {
  const result = validator.validate(input);
  
  return {
    isValid: result.isValid,
    data: result.isValid ? result.sanitizedValue : undefined,
    errors: result.errors,
  };
}

/**
 * Batch validation helper
 */
export function validateBatch(
  inputs: Record<string, any>,
  validators: Record<string, BaseValidator>
): {
  isValid: boolean;
  data: Record<string, any>;
  errors: Record<string, string[]>;
} {
  const data: Record<string, any> = {};
  const errors: Record<string, string[]> = {};
  let isValid = true;

  for (const [key, validator] of Object.entries(validators)) {
    const result = validator.validate(inputs[key]);
    
    if (result.isValid) {
      data[key] = result.sanitizedValue;
    } else {
      errors[key] = result.errors;
      isValid = false;
    }
  }

  return { isValid, data, errors };
}