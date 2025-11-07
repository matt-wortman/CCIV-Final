import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormEngineProvider, DynamicFormRenderer, useFormEngine } from '@/lib/form-engine/renderer';
import { DynamicFormNavigation } from './DynamicFormNavigation';
import { buildQuestion, buildSection, buildTemplate } from '@/lib/form-engine/test-utils';
import { FormTemplateWithSections, FormQuestionWithDetails } from '@/lib/form-engine/types';
import { toast } from 'sonner';

type MockFieldProps = {
  question: FormQuestionWithDetails;
  value?: string | number | null;
  onChange: (nextValue: string | number) => void;
};

jest.mock('@/lib/form-engine/fields/FieldAdapters', () => {
  const MockField = ({ question, value, onChange }: MockFieldProps) => (
    <div data-field-code={question.fieldCode}>
      <label>{question.label}</label>
      <input
        data-testid={`field-${question.fieldCode}`}
        value={(value ?? '') as string | number}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );

  const FieldComponents = {
    SHORT_TEXT: MockField,
    LONG_TEXT: MockField,
    INTEGER: MockField,
    SINGLE_SELECT: MockField,
    MULTI_SELECT: MockField,
    CHECKBOX_GROUP: MockField,
    DATE: MockField,
    SCORING_0_3: MockField,
    SCORING_MATRIX: MockField,
    REPEATABLE_GROUP: MockField,
    DATA_TABLE_SELECTOR: MockField,
  };

  return { FieldComponents };
});

jest.mock('@/lib/form-engine/conditional-logic', () => ({
  shouldShowField: jest.fn().mockReturnValue(true),
  shouldRequireField: jest.fn((_config: unknown, baseRequired: boolean) => baseRequired),
  parseConditionalConfig: jest.fn().mockReturnValue(null),
}));

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
jest.mock('@/lib/session', () => ({
  getClientLogger: jest.fn(() => mockLogger),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

function ResponseSetter() {
  const { setResponse } = useFormEngine();
  return (
    <button type="button" data-testid="set-response" onClick={() => setResponse('Q1', 'updated')}>
      Set Response
    </button>
  );
}

function renderNavigation(
  template: FormTemplateWithSections,
  props: React.ComponentProps<typeof DynamicFormNavigation> = {}
) {
  return render(
    <FormEngineProvider template={template}>
      <ResponseSetter />
      <DynamicFormRenderer />
      <DynamicFormNavigation {...props} />
    </FormEngineProvider>
  );
}

const defaultTemplate = buildTemplate({
  sections: [
    buildSection({
      order: 0,
      questions: [buildQuestion({ fieldCode: 'Q1', label: 'First Question', isRequired: true })],
    }),
    buildSection({
      order: 1,
      questions: [buildQuestion({ fieldCode: 'Q2', label: 'Second Question', isRequired: false })],
    }),
  ],
});

type GlobalWithTestPolyfills = typeof globalThis & {
  CSS?: typeof CSS;
};

beforeAll(() => {
  if (!window.HTMLElement.prototype.scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  }
  const globalWithCSS = globalThis as GlobalWithTestPolyfills;
  if (!globalWithCSS.CSS || typeof globalWithCSS.CSS.escape !== 'function') {
    const cssPolyfill = {
      ...(globalWithCSS.CSS ?? {}),
      escape: (value: string) => value,
    } as typeof CSS;
    globalWithCSS.CSS = cssPolyfill;
  }
  if (!global.requestAnimationFrame) {
    global.requestAnimationFrame = (cb: FrameRequestCallback) => {
      setTimeout(() => cb(Date.now()), 0);
      return 0;
    };
  }
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('DynamicFormNavigation', () => {
  it('updates the progress indicator when navigating sections', () => {
    renderNavigation(defaultTemplate);

    expect(screen.getByText('Section 1 of 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(screen.getByText('Section 2 of 2')).toBeInTheDocument();
  });

  it('auto-saves after field changes and surfaces the saved banner', async () => {
    jest.useFakeTimers();
    const onSaveDraft = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    renderNavigation(defaultTemplate, { onSaveDraft });

    await user.click(screen.getByTestId('set-response'));
    await user.click(screen.getByTestId('set-response'));

    await waitFor(() => expect(onSaveDraft).not.toHaveBeenCalled());

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      expect(onSaveDraft).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Last saved at/)).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('blocks submission when required fields are empty and shows a toast', async () => {
    const template = buildTemplate({
      sections: [
        buildSection({
          order: 0,
          questions: [buildQuestion({ fieldCode: 'Q1', label: 'Required Field', isRequired: true })],
        }),
      ],
    });

    const props = { onSubmit: jest.fn() };
    renderNavigation(template, props);

    fireEvent.click(screen.getByRole('button', { name: /Submit Form/i }));

    expect(props.onSubmit).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
    expect(await screen.findByText(/is required/)).toBeInTheDocument();
  });
});
