import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Edit, Move, Copy, Eye, Save } from 'lucide-react';
import { toast } from 'sonner';

export interface Question {
  id: string;
  type: 'text' | 'multiple_choice' | 'rating' | 'location' | 'date' | 'number' | 'yes_no' | 'dropdown' | 'checkbox' | 'email' | 'phone';
  question: string;
  description?: string;
  required: boolean;
  order: number;
  options?: string[]; // For multiple choice, dropdown, checkbox
  min_value?: number; // For rating/number
  max_value?: number; // For rating/number
  placeholder?: string;
  validation?: {
    min_length?: number;
    max_length?: number;
    pattern?: string;
    allow_duplicates?: boolean;
    custom_message?: string;
  };
}

interface SurveyQuestionBuilderProps {
  questions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
  onSave: () => void;
}

const SurveyQuestionBuilder = ({ questions, onQuestionsChange, onSave }: SurveyQuestionBuilderProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    type: 'text',
    question: '',
    required: true,
    order: questions.length + 1
  });

  const questionTypes = [
    { value: 'text', label: 'Text Input', description: 'Short text answer' },
    { value: 'multiple_choice', label: 'Multiple Choice', description: 'Select one option' },
    { value: 'dropdown', label: 'Dropdown', description: 'Select from dropdown list' },
    { value: 'checkbox', label: 'Checkbox', description: 'Select multiple options' },
    { value: 'rating', label: 'Rating Scale', description: 'Rate from 1-10' },
    { value: 'number', label: 'Number Input', description: 'Numeric value' },
    { value: 'yes_no', label: 'Yes/No', description: 'Binary choice' },
    { value: 'date', label: 'Date', description: 'Date selection' },
    { value: 'email', label: 'Email', description: 'Email address' },
    { value: 'phone', label: 'Phone Number', description: 'Phone number' },
    { value: 'location', label: 'Location', description: 'GPS coordinates' }
  ];

  const handleAddQuestion = () => {
    if (!newQuestion.question?.trim()) {
      toast.error('Please enter a question');
      return;
    }

    const question: Question = {
      id: `q_${Date.now()}`,
      type: newQuestion.type as Question['type'],
      question: newQuestion.question,
      description: newQuestion.description,
      required: newQuestion.required || true,
      order: newQuestion.order || questions.length + 1,
      options: newQuestion.type === 'multiple_choice' ? newQuestion.options || [] : undefined,
      min_value: newQuestion.min_value,
      max_value: newQuestion.max_value,
      placeholder: newQuestion.placeholder
    };

    onQuestionsChange([...questions, question]);
    setNewQuestion({
      type: 'text',
      question: '',
      required: true,
      order: questions.length + 2
    });
    setIsAddDialogOpen(false);
    toast.success('Question added successfully');
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setNewQuestion(question);
    setIsAddDialogOpen(true);
  };

  const handleUpdateQuestion = () => {
    if (!editingQuestion || !newQuestion.question?.trim()) {
      toast.error('Please enter a question');
      return;
    }

    const updatedQuestions = questions.map(q => 
      q.id === editingQuestion.id 
        ? { ...newQuestion, id: editingQuestion.id } as Question
        : q
    );

    onQuestionsChange(updatedQuestions);
    setEditingQuestion(null);
    setNewQuestion({
      type: 'text',
      question: '',
      required: true,
      order: questions.length + 1
    });
    setIsAddDialogOpen(false);
    toast.success('Question updated successfully');
  };

  const handleDeleteQuestion = (questionId: string) => {
    const updatedQuestions = questions.filter(q => q.id !== questionId);
    onQuestionsChange(updatedQuestions);
    toast.success('Question deleted');
  };

  const handleMoveQuestion = (questionId: string, direction: 'up' | 'down') => {
    const currentIndex = questions.findIndex(q => q.id === questionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    const updatedQuestions = [...questions];
    [updatedQuestions[currentIndex], updatedQuestions[newIndex]] = 
    [updatedQuestions[newIndex], updatedQuestions[currentIndex]];

    // Update order numbers
    updatedQuestions.forEach((q, index) => {
      q.order = index + 1;
    });

    onQuestionsChange(updatedQuestions);
  };

  const handleDuplicateQuestion = (question: Question) => {
    const duplicatedQuestion: Question = {
      ...question,
      id: `q_${Date.now()}`,
      order: questions.length + 1,
      question: `${question.question} (Copy)`
    };

    onQuestionsChange([...questions, duplicatedQuestion]);
    toast.success('Question duplicated');
  };

  const renderQuestionPreview = (question: Question) => {
    switch (question.type) {
      case 'text':
        return (
          <div className="space-y-2">
            <Label>{question.question} {question.required && <span className="text-red-500">*</span>}</Label>
            <Input placeholder={question.placeholder || "Enter your answer..."} disabled />
            {question.description && (
              <p className="text-sm text-muted-foreground">{question.description}</p>
            )}
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-2">
            <Label>{question.question} {question.required && <span className="text-red-500">*</span>}</Label>
            <div className="space-y-2">
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input type="radio" disabled />
                  <Label className="text-sm">{option}</Label>
                </div>
              ))}
            </div>
            {question.description && (
              <p className="text-sm text-muted-foreground">{question.description}</p>
            )}
          </div>
        );

      case 'rating':
        return (
          <div className="space-y-2">
            <Label>{question.question} {question.required && <span className="text-red-500">*</span>}</Label>
            <div className="flex items-center space-x-2">
              <span className="text-sm">{question.min_value || 1}</span>
              <div className="flex space-x-1">
                {Array.from({ length: (question.max_value || 10) - (question.min_value || 1) + 1 }, (_, i) => (
                  <button key={i} className="w-8 h-8 border rounded disabled:opacity-50" disabled>
                    {i + (question.min_value || 1)}
                  </button>
                ))}
              </div>
              <span className="text-sm">{question.max_value || 10}</span>
            </div>
            {question.description && (
              <p className="text-sm text-muted-foreground">{question.description}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div className="space-y-2">
            <Label>{question.question} {question.required && <span className="text-red-500">*</span>}</Label>
            <Input type="number" placeholder={question.placeholder || "Enter number..."} disabled />
            {question.description && (
              <p className="text-sm text-muted-foreground">{question.description}</p>
            )}
          </div>
        );

      case 'yes_no':
        return (
          <div className="space-y-2">
            <Label>{question.question} {question.required && <span className="text-red-500">*</span>}</Label>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <input type="radio" disabled />
                <Label className="text-sm">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="radio" disabled />
                <Label className="text-sm">No</Label>
              </div>
            </div>
            {question.description && (
              <p className="text-sm text-muted-foreground">{question.description}</p>
            )}
          </div>
        );

      case 'date':
        return (
          <div className="space-y-2">
            <Label>{question.question} {question.required && <span className="text-red-500">*</span>}</Label>
            <Input type="date" disabled />
            {question.description && (
              <p className="text-sm text-muted-foreground">{question.description}</p>
            )}
          </div>
        );

      case 'dropdown':
        return (
          <div className="space-y-2">
            <Label>{question.question} {question.required && <span className="text-red-500">*</span>}</Label>
            <Select disabled>
              <SelectTrigger>
                <SelectValue placeholder="Select an option..." />
              </SelectTrigger>
              <SelectContent>
                {question.options?.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {question.description && (
              <p className="text-sm text-muted-foreground">{question.description}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            <Label>{question.question} {question.required && <span className="text-red-500">*</span>}</Label>
            <div className="space-y-2">
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input type="checkbox" disabled />
                  <Label className="text-sm">{option}</Label>
                </div>
              ))}
            </div>
            {question.description && (
              <p className="text-sm text-muted-foreground">{question.description}</p>
            )}
          </div>
        );

      case 'email':
        return (
          <div className="space-y-2">
            <Label>{question.question} {question.required && <span className="text-red-500">*</span>}</Label>
            <Input type="email" placeholder="Enter email address..." disabled />
            {question.description && (
              <p className="text-sm text-muted-foreground">{question.description}</p>
            )}
          </div>
        );

      case 'phone':
        return (
          <div className="space-y-2">
            <Label>{question.question} {question.required && <span className="text-red-500">*</span>}</Label>
            <Input type="tel" placeholder="Enter phone number..." disabled />
            {question.description && (
              <p className="text-sm text-muted-foreground">{question.description}</p>
            )}
          </div>
        );

      case 'location':
        return (
          <div className="space-y-2">
            <Label>{question.question} {question.required && <span className="text-red-500">*</span>}</Label>
            <div className="p-3 border rounded bg-muted">
              <p className="text-sm text-muted-foreground">GPS coordinates will be captured automatically</p>
            </div>
            {question.description && (
              <p className="text-sm text-muted-foreground">{question.description}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Survey Questions</h3>
          <p className="text-sm text-muted-foreground">
            Build your research survey by adding questions. Each agent can collect up to 1000 responses.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Survey
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingQuestion ? 'Edit Question' : 'Add New Question'}
                </DialogTitle>
                <DialogDescription>
                  {editingQuestion ? 'Update the question details' : 'Create a new question for your research survey'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="question">Question Text</Label>
                  <Textarea
                    id="question"
                    placeholder="Enter your research question..."
                    value={newQuestion.question || ''}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Additional context or instructions..."
                    value={newQuestion.description || ''}
                    onChange={(e) => setNewQuestion({ ...newQuestion, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Question Type</Label>
                  <Select
                    value={newQuestion.type}
                    onValueChange={(value) => setNewQuestion({ ...newQuestion, type: value as Question['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {questionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(newQuestion.type === 'multiple_choice' || newQuestion.type === 'dropdown' || newQuestion.type === 'checkbox') && (
                  <div className="space-y-2">
                    <Label>Options</Label>
                    <div className="space-y-2">
                      {(newQuestion.options || ['']).map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(newQuestion.options || [])];
                              newOptions[index] = e.target.value;
                              setNewQuestion({ ...newQuestion, options: newOptions });
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const newOptions = newQuestion.options?.filter((_, i) => i !== index) || [];
                              setNewQuestion({ ...newQuestion, options: newOptions });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newOptions = [...(newQuestion.options || []), ''];
                          setNewQuestion({ ...newQuestion, options: newOptions });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                    </div>
                  </div>
                )}

                {(newQuestion.type === 'rating' || newQuestion.type === 'number') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min_value">Minimum Value</Label>
                      <Input
                        id="min_value"
                        type="number"
                        value={newQuestion.min_value || ''}
                        onChange={(e) => setNewQuestion({ ...newQuestion, min_value: parseInt(e.target.value) || undefined })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_value">Maximum Value</Label>
                      <Input
                        id="max_value"
                        type="number"
                        value={newQuestion.max_value || ''}
                        onChange={(e) => setNewQuestion({ ...newQuestion, max_value: parseInt(e.target.value) || undefined })}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="placeholder">Placeholder Text (Optional)</Label>
                  <Input
                    id="placeholder"
                    placeholder="Enter placeholder text..."
                    value={newQuestion.placeholder || ''}
                    onChange={(e) => setNewQuestion({ ...newQuestion, placeholder: e.target.value })}
                  />
                </div>

                {/* Validation Rules */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium">Validation Rules</h4>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="required"
                      checked={newQuestion.required}
                      onCheckedChange={(checked) => setNewQuestion({ ...newQuestion, required: checked })}
                    />
                    <Label htmlFor="required">Required Question</Label>
                  </div>

                  {(newQuestion.type === 'text' || newQuestion.type === 'email' || newQuestion.type === 'phone') && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="min_length">Min Length</Label>
                        <Input
                          id="min_length"
                          type="number"
                          placeholder="0"
                          value={newQuestion.validation?.min_length || ''}
                          onChange={(e) => setNewQuestion({
                            ...newQuestion,
                            validation: {
                              ...newQuestion.validation,
                              min_length: parseInt(e.target.value) || undefined
                            }
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_length">Max Length</Label>
                        <Input
                          id="max_length"
                          type="number"
                          placeholder="255"
                          value={newQuestion.validation?.max_length || ''}
                          onChange={(e) => setNewQuestion({
                            ...newQuestion,
                            validation: {
                              ...newQuestion.validation,
                              max_length: parseInt(e.target.value) || undefined
                            }
                          })}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="pattern">Validation Pattern (Optional)</Label>
                    <Input
                      id="pattern"
                      placeholder="e.g., ^[A-Za-z]+$ for letters only"
                      value={newQuestion.validation?.pattern || ''}
                      onChange={(e) => setNewQuestion({
                        ...newQuestion,
                        validation: {
                          ...newQuestion.validation,
                          pattern: e.target.value || undefined
                        }
                      })}
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Use regex pattern for custom validation (e.g., email, phone format)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="custom_message">Custom Error Message (Optional)</Label>
                    <Input
                      id="custom_message"
                      placeholder="Custom validation error message"
                      value={newQuestion.validation?.custom_message || ''}
                      onChange={(e) => setNewQuestion({
                        ...newQuestion,
                        validation: {
                          ...newQuestion.validation,
                          custom_message: e.target.value || undefined
                        }
                      })}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allow_duplicates"
                      checked={newQuestion.validation?.allow_duplicates || false}
                      onCheckedChange={(checked) => setNewQuestion({
                        ...newQuestion,
                        validation: {
                          ...newQuestion.validation,
                          allow_duplicates: checked
                        }
                      })}
                    />
                    <Label htmlFor="allow_duplicates">Allow Duplicate Answers</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={editingQuestion ? handleUpdateQuestion : handleAddQuestion}>
                  {editingQuestion ? 'Update Question' : 'Add Question'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {questions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">No questions yet</h3>
              <p className="text-sm text-muted-foreground">
                Start building your research survey by adding your first question.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions
            .sort((a, b) => a.order - b.order)
            .map((question, index) => (
              <Card key={question.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Question {question.order}</Badge>
                      <Badge variant="secondary">{question.type.replace('_', ' ')}</Badge>
                      {question.required && <Badge variant="destructive">Required</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoveQuestion(question.id, 'up')}
                        disabled={index === 0}
                      >
                        <Move className="h-4 w-4 rotate-180" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoveQuestion(question.id, 'down')}
                        disabled={index === questions.length - 1}
                      >
                        <Move className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicateQuestion(question)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditQuestion(question)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {renderQuestionPreview(question)}
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
};

export default SurveyQuestionBuilder;

