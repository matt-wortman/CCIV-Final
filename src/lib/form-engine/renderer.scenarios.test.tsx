import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormEngineProvider, DynamicFormRenderer, useFormEngine } from './renderer';
import { FieldType, FormTemplateWithSections } from './types';
import { buildQuestion, buildSection, buildTemplate } from './test-utils';
import { validateField } from '../validation/form-schemas';

jest.mock('./fields/FieldAdapters', () => {
  const MockField = ({ question, value, onChange }: { question: { fieldCode: string; label: string }; value?: string | number | null; onChange: (val: string | number) => void }) => (
    <div>
      <label htmlFor={`field-${question.fieldCode}`}>{question.label}</label>
      <input
        id={`field-${question.fieldCode}`}
        data-testid={`field-${question.fieldCode}`}
        value={(value ?? '') as string | number}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );

  const MockMultiSelect = ({ question, value, onChange }: { question: { fieldCode: string; label: string }; value?: string[] | null; onChange: (val: string[]) => void }) => {
    const serialized = Array.isArray(value) ? value.join(',') : '';
    return (
      <div>
        <label htmlFor={`field-${question.fieldCode}`}>{question.label}</label>
        <input
          id={`field-${question.fieldCode}`}
          data-testid={`field-${question.fieldCode}`}
          value={serialized}
          onChange={(event) => {
            const tokens = event.target.value
              .split(',')
              .map((token) => token.trim())
              .filter((token) => token.length > 0);
            onChange(tokens);
          }}
        />
      </div>
    );
  };

  const MockRepeatable = ({ question, value = [], onChange }: { question: { fieldCode: string; label: string }; value?: Array<Record<string, unknown>>; onChange: (rows: Array<Record<string, unknown>>) => void }) => {
    const rows = value ?? [];
    return (
      <div data-testid={`repeat-${question.fieldCode}`}>
        <button type="button" onClick={() => onChange([...rows, { row: rows.length }])}>
          Add Row
        </button>
        <span data-testid={`repeat-count-${question.fieldCode}`}>{rows.length}</span>
      </div>
    );
  };

  const FieldComponents = {
    SHORT_TEXT: MockField,
    LONG_TEXT: MockField,
    INTEGER: MockField,
    SINGLE_SELECT: MockField,
    MULTI_SELECT: MockMultiSelect,
    CHECKBOX_GROUP: MockMultiSelect,
    DATE: MockField,
    SCORING_0_3: MockField,
    SCORING_MATRIX: MockField,
    REPEATABLE_GROUP: MockRepeatable,
    DATA_TABLE_SELECTOR: MockRepeatable,
  };

  return { FieldComponents };
});

jest.mock('../validation/form-schemas', () => ({
  validateField: jest.fn().mockReturnValue({ isValid: true }),
}));

jest.mock('../scoring/calculations', () => ({
  extractScoringInputs: jest.fn().mockReturnValue({}),
  calculateAllScores: jest.fn().mockReturnValue(null),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockedValidateField = validateField as jest.MockedFunction<typeof validateField>;

describe('FormEngine conditional scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reveals nested fields only after each controlling condition is satisfied', async () => {
    const template = buildScenarioTemplate();
    const user = userEvent.setup();

    renderScenario(template);

    expect(screen.queryByTestId('field-VISIBILITY_ALPHA')).toBeNull();
    expect(screen.queryByTestId('field-VISIBILITY_BETA')).toBeNull();

    await user.type(screen.getByTestId('field-CONTROL_STAGE'), 'ready');
    expect(await screen.findByTestId('field-VISIBILITY_ALPHA')).toBeInTheDocument();

    await user.type(screen.getByTestId('field-VISIBILITY_ALPHA'), 'unlock');
    expect(await screen.findByTestId('field-VISIBILITY_BETA')).toBeInTheDocument();

    await user.type(screen.getByTestId('field-VISIBILITY_BETA'), 'assign');
    expect(await screen.findByTestId('field-FOLLOW_UP_OWNER')).toBeInTheDocument();
  });

  it('hides fields when a hide action matches and restores their prior state afterward', async () => {
    const template = buildScenarioTemplate();
    const user = userEvent.setup();

    renderScenario(template);

    const notesField = screen.getByTestId('field-ESCALATION_NOTES') as HTMLInputElement;
    await user.type(notesField, 'Needs follow-up');

    await user.type(screen.getByTestId('field-CONTROL_STAGE'), 'skip');
    expect(screen.queryByTestId('field-ESCALATION_NOTES')).toBeNull();

    await user.clear(screen.getByTestId('field-CONTROL_STAGE'));
    await user.type(screen.getByTestId('field-CONTROL_STAGE'), 'ready');

    const restoredField = await screen.findByTestId('field-ESCALATION_NOTES');
    expect((restoredField as HTMLInputElement).value).toBe('Needs follow-up');
  });

  it('marks dependent fields required based on conditional require rules', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const template = buildScenarioTemplate();

    renderScenario(template);

    await user.type(screen.getByTestId('field-CONTROL_STAGE'), 'ready');
    await user.type(await screen.findByTestId('field-VISIBILITY_ALPHA'), 'unlock');
    await user.type(await screen.findByTestId('field-VISIBILITY_BETA'), 'assign');

    const ownerField = (await screen.findByTestId('field-FOLLOW_UP_OWNER')) as HTMLInputElement;
    await user.type(ownerField, 'Dr. Owner');

    jest.runOnlyPendingTimers();

    const lastCall = mockedValidateField.mock.calls.at(-1);
    expect(lastCall?.[0]).toBe('FOLLOW_UP_OWNER');
    expect(lastCall?.[3]).toBe(true);

    jest.useRealTimers();
  });

  it('evaluates multi-select conditional visibility and requirement rules', async () => {
    jest.useFakeTimers();
    const template = buildMultiSelectTemplate();

    renderScenario(template);

    expect(screen.queryByTestId('field-MULTI_DEPENDENT')).toBeNull();

    const control = screen.getByTestId('field-CONTROL_MULTI');
    fireEvent.change(control, { target: { value: 'triage, follow-up' } });

    const dependent = await screen.findByTestId('field-MULTI_DEPENDENT');
    fireEvent.change(dependent, { target: { value: 'Detailed plan' } });

    jest.runOnlyPendingTimers();

    const multiCall = [...mockedValidateField.mock.calls].reverse().find((call) => call[0] === 'MULTI_DEPENDENT');
    expect(multiCall?.[3]).toBe(true);

    fireEvent.change(control, { target: { value: '' } });
    expect(screen.queryByTestId('field-MULTI_DEPENDENT')).toBeNull();

    jest.useRealTimers();
  });

  it('invokes onSaveDraft with the latest responses when autosave fires silently', async () => {
    const template = buildScenarioTemplate();
    const onSaveDraft = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderScenario(template, {
      onSaveDraft,
      children: <AutosaveButton silent />,
    });

    await user.type(screen.getByTestId('field-CONTROL_STAGE'), 'ready');

    await user.click(screen.getByTestId('autosave-trigger'));

    await waitFor(() => {
      expect(onSaveDraft).toHaveBeenCalled();
    });

    expect(onSaveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        responses: expect.objectContaining({ CONTROL_STAGE: 'ready' }),
      }),
      { silent: true }
    );
  });
});

function renderScenario(
  template: FormTemplateWithSections,
  options: {
    onSaveDraft?: jest.Mock;
    children?: React.ReactNode;
  } = {}
) {
  return render(
    <FormEngineProvider template={template} onSaveDraft={options.onSaveDraft}>
      {options.children}
      <DynamicFormRenderer />
    </FormEngineProvider>
  );
}

function buildScenarioTemplate(): FormTemplateWithSections {
  const control = buildQuestion({
    fieldCode: 'CONTROL_STAGE',
    label: 'Control Stage',
    type: FieldType.SHORT_TEXT,
  });

  const visibilityAlpha = buildQuestion({
    fieldCode: 'VISIBILITY_ALPHA',
    label: 'Visibility Alpha',
    type: FieldType.SHORT_TEXT,
    conditional: {
      logic: 'AND',
      rules: [
        { field: 'CONTROL_STAGE', operator: 'equals', value: 'ready', action: 'show' },
      ],
    },
  });

  const visibilityBeta = buildQuestion({
    fieldCode: 'VISIBILITY_BETA',
    label: 'Visibility Beta',
    type: FieldType.SHORT_TEXT,
    conditional: {
      logic: 'AND',
      rules: [
        { field: 'CONTROL_STAGE', operator: 'equals', value: 'ready', action: 'show' },
        { field: 'VISIBILITY_ALPHA', operator: 'equals', value: 'unlock', action: 'show' },
      ],
    },
  });

  const hideWhenSkip = buildQuestion({
    fieldCode: 'ESCALATION_NOTES',
    label: 'Escalation Notes',
    type: FieldType.LONG_TEXT,
    conditional: {
      logic: 'OR',
      rules: [
        { field: 'CONTROL_STAGE', operator: 'equals', value: 'skip', action: 'hide' },
      ],
    },
  });

  const followUpOwner = buildQuestion({
    fieldCode: 'FOLLOW_UP_OWNER',
    label: 'Follow Up Owner',
    type: FieldType.SHORT_TEXT,
    isRequired: false,
    conditional: {
      logic: 'AND',
      rules: [
        { field: 'VISIBILITY_BETA', operator: 'equals', value: 'assign', action: 'show' },
        { field: 'VISIBILITY_BETA', operator: 'equals', value: 'assign', action: 'require' },
      ],
    },
  });

  return buildTemplate({
    sections: [
      buildSection({
        questions: [control, visibilityAlpha, visibilityBeta, hideWhenSkip, followUpOwner],
      }),
    ],
  });
}

function buildMultiSelectTemplate(): FormTemplateWithSections {
  const control = buildQuestion({
    fieldCode: 'CONTROL_MULTI',
    label: 'Escalation Tags',
    type: FieldType.MULTI_SELECT,
  });

  const dependent = buildQuestion({
    fieldCode: 'MULTI_DEPENDENT',
    label: 'Escalation Summary',
    type: FieldType.LONG_TEXT,
    conditional: {
      logic: 'OR',
      rules: [
        { field: 'CONTROL_MULTI', operator: 'contains', value: 'triage', action: 'show' },
        { field: 'CONTROL_MULTI', operator: 'contains', value: 'triage', action: 'require' },
      ],
    },
  });

  return buildTemplate({
    sections: [
      buildSection({
        questions: [control, dependent],
      }),
    ],
  });
}

function AutosaveButton({ silent = false }: { silent?: boolean }) {
  const { saveDraft } = useFormEngine();
  return (
    <button type="button" data-testid="autosave-trigger" onClick={() => saveDraft({ silent })}>
      Autosave
    </button>
  );
}
