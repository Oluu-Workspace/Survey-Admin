import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import {
  QUESTION_TYPE_LABELS,
  newQuestion,
  type QuestionType,
  type SurveyQuestion,
} from '@/lib/questions';
import { COMMON_KNOWLEDGE_PRESETS } from '@/lib/commonKnowledge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useConfirmAction } from '@/components/confirm-action';

type Q = SurveyQuestion & { __new?: boolean };

const CHOICE_TYPES: QuestionType[] = ['single_choice', 'multiple_choice', 'yes_no'];

export function QuestionBuilder({
  questions,
  onChange,
  locked,
}: {
  questions: Q[];
  onChange: (next: Q[]) => void;
  locked: boolean;
}) {
  const confirmAction = useConfirmAction();
  const update = (id: string, patch: Partial<Q>) => {
    onChange(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const move = (index: number, dir: -1 | 1) => {
    if (locked) return;
    const next = [...questions];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    onChange(next);
  };

  const remove = async (id: string) => {
    const q = questions.find((x) => x.id === id);
    if (locked && q && !q.__new) return;
    const ok = await confirmAction({
      title: 'Remove this question?',
      description: q?.__new
        ? 'It has not been saved yet and will be dropped from the builder.'
        : 'It is removed when you save the questionnaire. Existing answers for this question may no longer map.',
      confirmLabel: 'Remove question',
      tone: 'danger',
      facts: q?.label ? [{ label: 'Question', value: q.label }] : undefined,
    });
    if (!ok) return;
    onChange(questions.filter((x) => x.id !== id));
  };

  const add = () => {
    onChange([
      ...questions,
      { ...newQuestion({ label: `Question ${questions.length + 1}` }), __new: true },
    ]);
  };

  const addPreset = (presetId: string) => {
    const preset = COMMON_KNOWLEDGE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    onChange([
      ...questions,
      {
        ...newQuestion({
          type: preset.type as QuestionType,
          label: preset.label,
          required: Boolean(preset.required),
          options: preset.options ? [...preset.options] : [],
          allow_other: Boolean(preset.allow_other),
          other_label: preset.other_label || 'Other',
          min: preset.min,
          max: preset.max,
          pattern: preset.pattern,
        }),
        __new: true,
      },
    ]);
  };

  return (
    <div className="space-y-4">
      {locked ? (
        <p className="border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Existing questions are locked because this survey is active — changing them would break
          collected data. You can still append new questions at the bottom.
        </p>
      ) : null}

      <div className="border border-border bg-card p-3">
        <Label className="font-display text-xs uppercase tracking-wide">Common knowledge</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Predefined answers for gender, phone (country code), region, education, and more. Agents get
          dropdowns; respondents can still pick Other and type a custom answer.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {COMMON_KNOWLEDGE_PRESETS.map((p) => (
            <Button
              key={p.id}
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-sm text-xs"
              onClick={() => addPreset(p.id)}
              title={p.description}
            >
              + {p.name}
            </Button>
          ))}
        </div>
      </div>

      {questions.length === 0 ? (
        <p className="border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          No questions yet — add a common-knowledge field above, or a blank question below.
        </p>
      ) : (
        <ol className="space-y-3">
          {questions.map((q, index) => {
            const isChoice = CHOICE_TYPES.includes(q.type);
            const canEdit = !locked || Boolean(q.__new);

            return (
              <li key={q.id} className="border border-border bg-card p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                    Q{index + 1}
                  </div>
                  <div className="flex gap-1">
                    {!locked ? (
                      <>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-sm"
                          onClick={() => move(index, -1)}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-sm"
                          onClick={() => move(index, 1)}
                          disabled={index === questions.length - 1}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-sm text-destructive"
                          onClick={() => void remove(q.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : canEdit ? (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-sm text-destructive"
                        onClick={() => void remove(q.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Locked</span>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="font-display text-xs uppercase tracking-wide">Question</Label>
                    <Input
                      className="rounded-sm"
                      value={q.label}
                      disabled={!canEdit}
                      onChange={(e) => update(q.id, { label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-display text-xs uppercase tracking-wide">Type</Label>
                    <Select
                      value={q.type}
                      disabled={!canEdit}
                      onValueChange={(v) => {
                        const type = v as QuestionType;
                        const patch: Partial<Q> = { type };
                        if (type === 'yes_no') patch.options = ['Yes', 'No'];
                        if (
                          (type === 'single_choice' || type === 'multiple_choice') &&
                          (!q.options || q.options.length === 0)
                        ) {
                          patch.options = ['Option 1', 'Option 2'];
                          patch.allow_other = true;
                          patch.other_label = 'Other';
                        }
                        if (type === 'phone' || type === 'area') {
                          patch.options = [];
                        }
                        update(q.id, patch);
                      }}
                    >
                      <SelectTrigger className="rounded-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
                          <SelectItem key={t} value={t}>
                            {QUESTION_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2 pb-2">
                    <Checkbox
                      id={`req-${q.id}`}
                      checked={Boolean(q.required)}
                      disabled={!canEdit}
                      onCheckedChange={(v) => update(q.id, { required: Boolean(v) })}
                    />
                    <Label htmlFor={`req-${q.id}`} className="text-sm font-normal">
                      Required
                    </Label>
                  </div>
                </div>

                {q.type === 'phone' ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Agents see a country code dropdown (Kenya +254 default) plus the local number.
                    Unknown countries use Other + custom dial code.
                  </p>
                ) : null}
                {q.type === 'area' ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Agents pick County → Sub-county → Ward → Village from the location list, or choose
                    Other and type a custom place name.
                  </p>
                ) : null}

                {isChoice && q.type !== 'yes_no' ? (
                  <div className="mt-3 space-y-2">
                    <Label className="font-display text-xs uppercase tracking-wide">Options</Label>
                    {(q.options || []).map((opt, oi) => (
                      <div key={oi} className="flex gap-2">
                        <Input
                          className="rounded-sm"
                          value={opt}
                          disabled={!canEdit}
                          onChange={(e) => {
                            const options = [...(q.options || [])];
                            options[oi] = e.target.value;
                            update(q.id, { options });
                          }}
                        />
                        {canEdit ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="rounded-sm"
                            onClick={() =>
                              update(q.id, {
                                options: (q.options || []).filter((_, i) => i !== oi),
                              })
                            }
                          >
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    ))}
                    {canEdit ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-sm"
                          onClick={() =>
                            update(q.id, {
                              options: [
                                ...(q.options || []),
                                `Option ${(q.options?.length || 0) + 1}`,
                              ],
                            })
                          }
                        >
                          Add option
                        </Button>
                        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-border pt-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`other-${q.id}`}
                              checked={Boolean(q.allow_other)}
                              onCheckedChange={(v) =>
                                update(q.id, {
                                  allow_other: Boolean(v),
                                  other_label: q.other_label || 'Other',
                                })
                              }
                            />
                            <Label htmlFor={`other-${q.id}`} className="text-sm font-normal">
                              Allow &quot;Other&quot; with specify text
                            </Label>
                          </div>
                          {q.allow_other ? (
                            <div className="flex min-w-[200px] flex-1 items-center gap-2">
                              <Label className="shrink-0 text-xs text-muted-foreground">
                                Other label
                              </Label>
                              <Input
                                className="h-8 rounded-sm"
                                value={q.other_label || 'Other'}
                                onChange={(e) =>
                                  update(q.id, { other_label: e.target.value || 'Other' })
                                }
                              />
                            </div>
                          ) : null}
                        </div>
                        {q.allow_other ? (
                          <p className="text-xs text-muted-foreground">
                            Respondents can pick this if none of the listed options fit, then type
                            their answer.
                          </p>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                ) : null}

                {q.type === 'number' && canEdit ? (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="font-display text-xs uppercase tracking-wide">Min</Label>
                      <Input
                        className="rounded-sm font-mono"
                        type="number"
                        value={q.min ?? ''}
                        onChange={(e) =>
                          update(q.id, {
                            min: e.target.value === '' ? undefined : Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-display text-xs uppercase tracking-wide">Max</Label>
                      <Input
                        className="rounded-sm font-mono"
                        type="number"
                        value={q.max ?? ''}
                        onChange={(e) =>
                          update(q.id, {
                            max: e.target.value === '' ? undefined : Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                ) : null}

                {q.type === 'short_text' && canEdit ? (
                  <div className="mt-3 space-y-1.5">
                    <Label className="font-display text-xs uppercase tracking-wide">
                      Format check
                    </Label>
                    <Select
                      value={q.pattern || 'none'}
                      onValueChange={(v) =>
                        update(q.id, { pattern: v === 'none' ? undefined : v })
                      }
                    >
                      <SelectTrigger className="rounded-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="phone">Phone number (prefer Phone type)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                {canEdit && index > 0 ? (
                  <div className="mt-3 grid gap-2 border-t border-border pt-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="font-display text-xs uppercase tracking-wide">
                        Skip logic (optional)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Only show this question if an earlier answer matches.
                      </p>
                    </div>
                    <Select
                      value={q.skip?.questionId || 'none'}
                      onValueChange={(v) => {
                        if (v === 'none') update(q.id, { skip: null });
                        else
                          update(q.id, {
                            skip: { questionId: v, equals: q.skip?.equals || '' },
                          });
                      }}
                    >
                      <SelectTrigger className="rounded-sm">
                        <SelectValue placeholder="Depends on…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Always show</SelectItem>
                        {questions.slice(0, index).map((prev, pi) => (
                          <SelectItem key={prev.id} value={prev.id}>
                            Q{pi + 1}: {prev.label || 'Untitled'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {q.skip?.questionId ? (
                      <Input
                        className="rounded-sm"
                        placeholder="Equals…"
                        value={q.skip.equals}
                        onChange={(e) =>
                          update(q.id, {
                            skip: { questionId: q.skip!.questionId, equals: e.target.value },
                          })
                        }
                      />
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}

      <Button type="button" variant="outline" className="rounded-sm" onClick={add}>
        <Plus className="mr-1.5 h-4 w-4" />
        Add blank question
      </Button>
    </div>
  );
}
