"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, GripVertical, Save, X } from "lucide-react"

export interface Question {
  id?: string
  question: string
  question_type: 'text' | 'number' | 'dropdown' | 'multiple-choice' | 'date'
  required: boolean
  order_index: number
  validation_rules?: {
    min?: number
    max?: number
    pattern?: string
    options?: string[]
  }
}

interface QuestionBuilderProps {
  questions: Question[]
  onQuestionsChange: (questions: Question[]) => void
  surveyId?: string
}

export function QuestionBuilder({ questions, onQuestionsChange, surveyId }: QuestionBuilderProps) {
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    question: "",
    question_type: "text",
    required: true,
    validation_rules: {}
  })

  const questionTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'number', label: 'Number Input' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'multiple-choice', label: 'Multiple Choice' },
    { value: 'date', label: 'Date' }
  ]

  const handleAddQuestion = () => {
    if (!newQuestion.question?.trim()) return

    const question: Question = {
      id: editingQuestion?.id || `temp-${Date.now()}`,
      question: newQuestion.question,
      question_type: newQuestion.question_type || 'text',
      required: newQuestion.required ?? true,
      order_index: questions.length,
      validation_rules: newQuestion.validation_rules || {}
    }

    if (editingQuestion) {
      // Update existing question
      const updatedQuestions = questions.map(q => 
        q.id === editingQuestion.id ? question : q
      )
      onQuestionsChange(updatedQuestions)
    } else {
      // Add new question
      onQuestionsChange([...questions, question])
    }

    // Reset form
    setNewQuestion({
      question: "",
      question_type: "text",
      required: true,
      validation_rules: {}
    })
    setEditingQuestion(null)
    setIsAddQuestionOpen(false)
  }

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question)
    setNewQuestion({
      question: question.question,
      question_type: question.question_type,
      required: question.required,
      validation_rules: question.validation_rules || {}
    })
    setIsAddQuestionOpen(true)
  }

  const handleDeleteQuestion = (questionId: string) => {
    const updatedQuestions = questions.filter(q => q.id !== questionId)
    onQuestionsChange(updatedQuestions)
  }

  const handleMoveQuestion = (fromIndex: number, toIndex: number) => {
    const updatedQuestions = [...questions]
    const [movedQuestion] = updatedQuestions.splice(fromIndex, 1)
    updatedQuestions.splice(toIndex, 0, movedQuestion)
    
    // Update order indices
    const reorderedQuestions = updatedQuestions.map((q, index) => ({
      ...q,
      order_index: index
    }))
    
    onQuestionsChange(reorderedQuestions)
  }

  const handleValidationChange = (field: string, value: any) => {
    setNewQuestion(prev => ({
      ...prev,
      validation_rules: {
        ...prev.validation_rules,
        [field]: value
      }
    }))
  }

  const handleOptionsChange = (options: string) => {
    const optionsArray = options.split('\n').filter(opt => opt.trim())
    handleValidationChange('options', optionsArray)
  }

  const getQuestionTypeLabel = (type: string) => {
    return questionTypes.find(qt => qt.value === type)?.label || type
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Survey Questions</h3>
          <p className="text-sm text-muted-foreground">
            {questions.length} question{questions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Dialog open={isAddQuestionOpen} onOpenChange={setIsAddQuestionOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question-text">Question Text</Label>
                <Textarea
                  id="question-text"
                  value={newQuestion.question || ''}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  placeholder="Enter your question here..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="question-type">Question Type</Label>
                  <Select
                    value={newQuestion.question_type}
                    onValueChange={(value: any) => setNewQuestion({ ...newQuestion, question_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {questionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="required">Required</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="required"
                      checked={newQuestion.required}
                      onCheckedChange={(checked) => setNewQuestion({ ...newQuestion, required: checked })}
                    />
                    <Label htmlFor="required" className="text-sm">
                      {newQuestion.required ? 'Required' : 'Optional'}
                    </Label>
                  </div>
                </div>
              </div>

              {/* Validation Rules */}
              {(newQuestion.question_type === 'number') && (
                <div className="space-y-4">
                  <h4 className="font-medium">Validation Rules</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min-value">Minimum Value</Label>
                      <Input
                        id="min-value"
                        type="number"
                        value={newQuestion.validation_rules?.min || ''}
                        onChange={(e) => handleValidationChange('min', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Min value"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-value">Maximum Value</Label>
                      <Input
                        id="max-value"
                        type="number"
                        value={newQuestion.validation_rules?.max || ''}
                        onChange={(e) => handleValidationChange('max', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Max value"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Options for dropdown and multiple choice */}
              {(newQuestion.question_type === 'dropdown' || newQuestion.question_type === 'multiple-choice') && (
                <div className="space-y-2">
                  <Label htmlFor="options">Options (one per line)</Label>
                  <Textarea
                    id="options"
                    value={newQuestion.validation_rules?.options?.join('\n') || ''}
                    onChange={(e) => handleOptionsChange(e.target.value)}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    rows={4}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddQuestionOpen(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleAddQuestion}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingQuestion ? 'Update Question' : 'Add Question'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground text-center">
              No questions added yet. Click "Add Question" to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <Card key={question.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <Badge variant="outline" className="text-xs">
                        {index + 1}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base font-medium">
                        {question.question}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {getQuestionTypeLabel(question.question_type)}
                        </Badge>
                        {question.required && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditQuestion(question)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question.id!)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {question.validation_rules && Object.keys(question.validation_rules).length > 0 && (
                <CardContent className="pt-0">
                  <div className="text-sm text-muted-foreground">
                    {question.validation_rules.min !== undefined && (
                      <span>Min: {question.validation_rules.min} </span>
                    )}
                    {question.validation_rules.max !== undefined && (
                      <span>Max: {question.validation_rules.max} </span>
                    )}
                    {question.validation_rules.options && (
                      <span>Options: {question.validation_rules.options.length} </span>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}