import {
  getFieldValidationSchema,
  validateField,
  validateFormData,
  useFieldValidation,
} from './form-schemas';
import { FieldType } from '@prisma/client';
import type { ValidationConfig } from '@/lib/form-engine/types';

describe('form-schemas validation helpers', () => {
  it('applies specific field schemas such as F0.1', () => {
    const schema = getFieldValidationSchema('F0.1', FieldType.SHORT_TEXT, true);
    expect(() => schema.parse('TECH-123')).not.toThrow();
    expect(() => schema.parse('invalid value!')).toThrow();
  });

  it('validates repeatable group overrides for known field codes', () => {
    const schema = getFieldValidationSchema('F4.2.a', FieldType.REPEATABLE_GROUP, true);
    expect(() =>
      schema.parse([
        { company: 'Acme', product: 'Widget', description: 'desc', revenue: 'n/a' },
      ])
    ).not.toThrow();

    expect(() => schema.parse([{ company: '', product: '', description: '' }])).toThrow();
  });

  it('enforces data table selector rules for selection and notes', () => {
    const result = validateField(
      'DT1',
      FieldType.DATA_TABLE_SELECTOR,
      [{ include: true, benefit: '' }],
      true
    );

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('benefit');

    const validResult = validateField(
      'DT1',
      FieldType.DATA_TABLE_SELECTOR,
      [{ include: true, benefit: 'Value' }],
      true
    );

    expect(validResult.isValid).toBe(true);
  });

  it('validateFormData returns aggregated errors for responses and repeat groups', () => {
    const questions: Array<{
      fieldCode: string;
      type: FieldType;
      isRequired: boolean;
      validation?: ValidationConfig;
    }> = [
      { fieldCode: 'Q1', type: FieldType.SHORT_TEXT, isRequired: true },
      { fieldCode: 'F4.2.a', type: FieldType.REPEATABLE_GROUP, isRequired: true },
    ];

    const repeatGroups = {
      'F4.2.a': [
        { company: '', product: '', description: '' },
      ],
    } as Record<string, unknown[]>;

    const { isValid, errors } = validateFormData({}, repeatGroups, questions);
    expect(isValid).toBe(false);
    expect(errors).toHaveProperty('Q1');
    expect(errors['F4.2.a']).toBeDefined();
  });

  it('useFieldValidation mirrors validateField results', () => {
    const response = useFieldValidation('Q1', FieldType.SHORT_TEXT, '', false, {
      rules: [{ type: 'required', message: 'Needed' }],
    });

    expect(response.isValid).toBe(false);
    expect(response.error).toBe('Needed');
  });
});
