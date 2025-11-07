'use client'

import { FormEvent, useMemo, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SectionInput, createSection, updateSection, deleteSection, moveSection } from '@/app/dynamic-form/builder/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { TemplateDetail } from '@/app/dynamic-form/builder/actions'

const COMMON_SECTION_EXAMPLES: Array<{ code: string; title: string }> = [
  { code: 'F0', title: 'Header & identifiers' },
  { code: 'F1', title: 'Technology overview' },
  { code: 'F2', title: 'Business impact' },
  { code: 'F3', title: 'Market landscape' },
]

interface SectionFormProps {
  templateId: string
  sectionId?: string
  initialValues?: SectionInput
  onClose?: () => void
  existingSections: TemplateDetail['sections']
  disabled?: boolean
}

export function SectionForm({ templateId, sectionId, initialValues, onClose, existingSections, disabled = false }: SectionFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const defaultCode = useMemo(() => {
    if (sectionId) {
      return initialValues?.code ?? ''
    }

    const numericMatches = existingSections
      .map((section) => {
        const match = section.code.match(/(\d+)/)
        return match ? Number(match[1]) : null
      })
      .filter((value): value is number => value !== null)

    const nextNumber = numericMatches.length > 0 ? Math.max(...numericMatches) + 1 : existingSections.length + 1
    return `F${nextNumber}`
  }, [existingSections, initialValues?.code, sectionId])

  async function handleSubmit(formData: FormData) {
    const data: SectionInput = {
      title: (formData.get('title') as string)?.trim() || '',
      code: (formData.get('code') as string)?.trim() || '',
      description: ((formData.get('description') as string) || '').trim() || undefined,
    }

    startTransition(async () => {
      try {
        if (sectionId) {
          const result = await updateSection(sectionId, data)
          if (!result.success) {
            toast.error(result.error)
            return
          }
          toast.success('Section updated')
        } else {
          const result = await createSection(templateId, data)
          if (!result.success) {
            toast.error(result.error)
            return
          }
          toast.success('Section created')
        }
        router.refresh()
        onClose?.()
      } catch (error) {
        console.error('Failed to save section', error)
        toast.error('Unable to save section')
      }
    })
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    handleSubmit(formData)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="section-title">
          Section title
        </label>
        <Input
          id="section-title"
          name="title"
          defaultValue={initialValues?.title}
          placeholder="e.g. Header and identifiers"
          required
          disabled={disabled || pending}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="section-code">
          Section code
        </label>
        <Input
          id="section-code"
          name="code"
          defaultValue={defaultCode}
          placeholder="e.g. F1"
          required
          disabled={disabled || pending}
        />
        <p className="text-xs text-muted-foreground">
          Examples:{' '}
          {COMMON_SECTION_EXAMPLES.map((example, index) => (
            <span key={example.code}>
              {example.code} – {example.title}
              {index < COMMON_SECTION_EXAMPLES.length - 1 ? '; ' : ''}
            </span>
          ))}
        </p>
        {existingSections.length > 0 && (
          <p className="text-xs text-muted-foreground/80">
            In this template: {existingSections.map((section) => `${section.code} – ${section.title}`).join('; ')}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="section-description">
          Description
        </label>
        <Textarea
          id="section-description"
          name="description"
          defaultValue={initialValues?.description}
          placeholder="Optional helper copy"
          rows={3}
          disabled={disabled || pending}
        />
      </div>
      <div className="flex items-center justify-end gap-3">
        {onClose && (
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={pending || disabled}>
          {pending ? 'Saving…' : sectionId ? 'Save changes' : 'Create section'}
        </Button>
      </div>
    </form>
  )
}

interface SectionActionsProps {
  sectionId: string
  disableMoveUp: boolean
  disableMoveDown: boolean
  disabled?: boolean
}

export function SectionActions({ sectionId, disableMoveDown, disableMoveUp, disabled = false }: SectionActionsProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteSection(sectionId)
        if (!result.success) {
          toast.error(result.error)
          return
        }
        toast.success('Section deleted')
        router.refresh()
      } catch (error) {
        console.error('Failed to delete section', error)
        toast.error('Unable to delete section')
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disableMoveUp || pending || disabled}
        onClick={() =>
          startTransition(async () => {
            if (disableMoveUp || disabled) return
            try {
              const result = await moveSection(sectionId, 'up')
              if (!result.success) {
                toast.error(result.error)
                return
              }
              router.refresh()
            } catch (error) {
              console.error('Failed to move section', error)
              toast.error('Unable to reorder section')
            }
          })
        }
      >
        Move up
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disableMoveDown || pending || disabled}
        onClick={() =>
          startTransition(async () => {
            if (disableMoveDown || disabled) return
            try {
              const result = await moveSection(sectionId, 'down')
              if (!result.success) {
                toast.error(result.error)
                return
              }
              router.refresh()
            } catch (error) {
              console.error('Failed to move section', error)
              toast.error('Unable to reorder section')
            }
          })
        }
      >
        Move down
      </Button>
      <Button type="button" variant="ghost" size="sm" className="text-red-600" onClick={handleDelete} disabled={pending}>
        Delete
      </Button>
    </div>
  )
}
