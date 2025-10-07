import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Trash2, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

export interface DuplicateGroup {
  id: string;
  responses: SurveyResponse[];
  similarity_score: number;
  duplicate_type: 'exact_match' | 'similar_location' | 'similar_answers' | 'same_agent_time';
  confidence: 'high' | 'medium' | 'low';
  suggested_action: 'merge' | 'flag' | 'delete' | 'review';
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  agent_id: string;
  agent_name: string;
  respondent_id: string;
  county: string;
  sub_county: string;
  ward: string;
  area: string;
  answers: Record<string, any>;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  created_at: string;
  quality_score: number;
  status: 'submitted' | 'validated' | 'flagged' | 'rejected';
}

interface DuplicateDetectionProps {
  responses: SurveyResponse[];
  onResponseUpdate?: (responseId: string, action: string) => void;
}

const DuplicateDetection = ({ responses, onResponseUpdate }: DuplicateDetectionProps) => {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock duplicate detection algorithm
  const detectDuplicates = (responses: SurveyResponse[]): DuplicateGroup[] => {
    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    responses.forEach((response, index) => {
      if (processed.has(response.id)) return;

      const duplicates: SurveyResponse[] = [response];
      let similarityScore = 100;
      let duplicateType: DuplicateGroup['duplicate_type'] = 'exact_match';
      let confidence: DuplicateGroup['confidence'] = 'high';

      // Check for exact matches
      responses.slice(index + 1).forEach(otherResponse => {
        if (processed.has(otherResponse.id)) return;

        const isExactMatch = 
          response.agent_id === otherResponse.agent_id &&
          response.answers && otherResponse.answers &&
          JSON.stringify(response.answers) === JSON.stringify(otherResponse.answers) &&
          Math.abs(new Date(response.created_at).getTime() - new Date(otherResponse.created_at).getTime()) < 60000; // Within 1 minute

        const isSimilarLocation = 
          response.location && otherResponse.location &&
          Math.abs(response.location.latitude - otherResponse.location.latitude) < 0.001 &&
          Math.abs(response.location.longitude - otherResponse.location.longitude) < 0.001 &&
          response.agent_id === otherResponse.agent_id;

        const isSimilarAnswers = 
          response.answers && otherResponse.answers &&
          calculateAnswerSimilarity(response.answers, otherResponse.answers) > 0.8;

        const isSameAgentTime = 
          response.agent_id === otherResponse.agent_id &&
          Math.abs(new Date(response.created_at).getTime() - new Date(otherResponse.created_at).getTime()) < 300000; // Within 5 minutes

        if (isExactMatch) {
          duplicates.push(otherResponse);
          similarityScore = 100;
          duplicateType = 'exact_match';
          confidence = 'high';
          processed.add(otherResponse.id);
        } else if (isSimilarLocation) {
          duplicates.push(otherResponse);
          similarityScore = 85;
          duplicateType = 'similar_location';
          confidence = 'high';
          processed.add(otherResponse.id);
        } else if (isSimilarAnswers) {
          duplicates.push(otherResponse);
          similarityScore = 75;
          duplicateType = 'similar_answers';
          confidence = 'medium';
          processed.add(otherResponse.id);
        } else if (isSameAgentTime) {
          duplicates.push(otherResponse);
          similarityScore = 60;
          duplicateType = 'same_agent_time';
          confidence = 'low';
          processed.add(otherResponse.id);
        }
      });

      if (duplicates.length > 1) {
        const suggestedAction = getSuggestedAction(duplicateType, confidence, duplicates.length);
        
        groups.push({
          id: `group_${index}`,
          responses: duplicates,
          similarity_score: similarityScore,
          duplicate_type: duplicateType,
          confidence: confidence,
          suggested_action: suggestedAction
        });

        duplicates.forEach(dup => processed.add(dup.id));
      }
    });

    return groups;
  };

  const calculateAnswerSimilarity = (answers1: Record<string, any>, answers2: Record<string, any>): number => {
    const keys1 = Object.keys(answers1);
    const keys2 = Object.keys(answers2);
    const allKeys = new Set([...keys1, ...keys2]);
    
    let matches = 0;
    allKeys.forEach(key => {
      if (answers1[key] === answers2[key]) {
        matches++;
      }
    });
    
    return allKeys.size > 0 ? matches / allKeys.size : 0;
  };

  const getSuggestedAction = (
    type: DuplicateGroup['duplicate_type'], 
    confidence: DuplicateGroup['confidence'], 
    count: number
  ): DuplicateGroup['suggested_action'] => {
    if (type === 'exact_match' && confidence === 'high') {
      return 'delete';
    }
    if (type === 'similar_location' && confidence === 'high') {
      return 'merge';
    }
    if (count > 3) {
      return 'flag';
    }
    return 'review';
  };

  useEffect(() => {
    if (responses.length > 0) {
      setIsProcessing(true);
      // Simulate processing time
      setTimeout(() => {
        const duplicates = detectDuplicates(responses);
        setDuplicateGroups(duplicates);
        setIsProcessing(false);
      }, 2000);
    }
  }, [responses]);

  const filteredGroups = duplicateGroups.filter(group => {
    const matchesSearch = group.responses.some(r => 
      r.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.respondent_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesConfidence = confidenceFilter === 'all' || group.confidence === confidenceFilter;
    const matchesType = typeFilter === 'all' || group.duplicate_type === typeFilter;
    
    return matchesSearch && matchesConfidence && matchesType;
  });

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      high: 'bg-red-600 text-white',
      medium: 'bg-amber-500 text-white',
      low: 'bg-gray-500 text-white'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium ${colors[confidence as keyof typeof colors]}`}>
        {confidence.charAt(0).toUpperCase() + confidence.slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const labels = {
      exact_match: 'Exact Match',
      similar_location: 'Similar Location',
      similar_answers: 'Similar Answers',
      same_agent_time: 'Same Agent/Time'
    };
    
    return (
      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700">
        {labels[type as keyof typeof labels]}
      </span>
    );
  };

  const getActionBadge = (action: string) => {
    const colors = {
      merge: 'bg-blue-500 text-white',
      flag: 'bg-amber-500 text-white',
      delete: 'bg-red-600 text-white',
      review: 'bg-gray-500 text-white'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium ${colors[action as keyof typeof colors]}`}>
        {action.charAt(0).toUpperCase() + action.slice(1)}
      </span>
    );
  };

  const handleBulkAction = (action: string) => {
    if (selectedGroups.length === 0) {
      toast.error('Please select duplicate groups to process');
      return;
    }

    const groupsToProcess = duplicateGroups.filter(g => selectedGroups.includes(g.id));
    let processedCount = 0;

    groupsToProcess.forEach(group => {
      group.responses.forEach(response => {
        if (onResponseUpdate) {
          onResponseUpdate(response.id, action);
          processedCount++;
        }
      });
    });

    // Remove processed groups
    setDuplicateGroups(prev => prev.filter(g => !selectedGroups.includes(g.id)));
    setSelectedGroups([]);
    
    toast.success(`${processedCount} responses processed with action: ${action}`);
  };

  const handleGroupAction = (groupId: string, action: string) => {
    const group = duplicateGroups.find(g => g.id === groupId);
    if (!group) return;

    group.responses.forEach(response => {
      if (onResponseUpdate) {
        onResponseUpdate(response.id, action);
      }
    });

    // Remove processed group
    setDuplicateGroups(prev => prev.filter(g => g.id !== groupId));
    toast.success(`Group processed with action: ${action}`);
  };

  const stats = {
    total_duplicates: duplicateGroups.length,
    high_confidence: duplicateGroups.filter(g => g.confidence === 'high').length,
    medium_confidence: duplicateGroups.filter(g => g.confidence === 'medium').length,
    low_confidence: duplicateGroups.filter(g => g.confidence === 'low').length,
    total_duplicate_responses: duplicateGroups.reduce((sum, g) => sum + g.responses.length, 0)
  };

  if (isProcessing) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-sm text-muted-foreground">Analyzing responses for duplicates...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">Duplicate Detection</h3>
          <p className="text-sm text-muted-foreground">
            AI-powered detection of duplicate and suspicious responses
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleBulkAction('flag')}
            disabled={selectedGroups.length === 0}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Flag Selected
          </Button>
          <Button
            variant="outline"
            onClick={() => handleBulkAction('delete')}
            disabled={selectedGroups.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duplicate Groups</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_duplicates}</div>
            <p className="text-xs text-muted-foreground">
              Groups found
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Confidence</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.high_confidence}</div>
            <p className="text-xs text-muted-foreground">
              Likely duplicates
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Confidence</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{stats.medium_confidence}</div>
            <p className="text-xs text-muted-foreground">
              Possible duplicates
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Confidence</CardTitle>
            <AlertTriangle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{stats.low_confidence}</div>
            <p className="text-xs text-muted-foreground">
              Review needed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_duplicate_responses}</div>
            <p className="text-xs text-muted-foreground">
              In duplicate groups
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Duplicate Groups</CardTitle>
          <CardDescription>Review and manage detected duplicate responses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search duplicate groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Confidence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Confidence</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="exact_match">Exact Match</SelectItem>
                <SelectItem value="similar_location">Similar Location</SelectItem>
                <SelectItem value="similar_answers">Similar Answers</SelectItem>
                <SelectItem value="same_agent_time">Same Agent/Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedGroups.length === filteredGroups.length && filteredGroups.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedGroups(filteredGroups.map(g => g.id));
                        } else {
                          setSelectedGroups([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Responses</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Similarity</TableHead>
                  <TableHead>Suggested Action</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedGroups.includes(group.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedGroups([...selectedGroups, group.id]);
                          } else {
                            setSelectedGroups(selectedGroups.filter(id => id !== group.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">Group {group.id.split('_')[1]}</div>
                      <div className="text-xs text-muted-foreground">
                        {group.responses[0]?.agent_name} • {group.responses[0]?.county}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{group.responses.length}</div>
                      <div className="text-xs text-muted-foreground">
                        {group.responses.map(r => r.respondent_id).join(', ')}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(group.duplicate_type)}</TableCell>
                    <TableCell>{getConfidenceBadge(group.confidence)}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{group.similarity_score}%</div>
                    </TableCell>
                    <TableCell>{getActionBadge(group.suggested_action)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedGroup(group);
                            setIsDetailDialogOpen(true);
                          }}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGroupAction(group.id, group.suggested_action)}
                        >
                          {group.suggested_action === 'delete' ? (
                            <Trash2 className="h-4 w-4" />
                          ) : group.suggested_action === 'flag' ? (
                            <AlertTriangle className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Group Detail Dialog */}
      {selectedGroup && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Duplicate Group Details</DialogTitle>
              <DialogDescription>
                Group {selectedGroup.id.split('_')[1]} - {selectedGroup.responses.length} responses
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Duplicate Type</Label>
                  <div className="mt-1">{getTypeBadge(selectedGroup.duplicate_type)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Confidence</Label>
                  <div className="mt-1">{getConfidenceBadge(selectedGroup.confidence)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Similarity Score</Label>
                  <div className="mt-1">{selectedGroup.similarity_score}%</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Suggested Action</Label>
                  <div className="mt-1">{getActionBadge(selectedGroup.suggested_action)}</div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Responses in Group</Label>
                <div className="mt-2 space-y-2">
                  {selectedGroup.responses.map((response, index) => (
                    <div key={response.id} className="p-3 border rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-medium">{response.respondent_id}</div>
                          <div className="text-xs text-muted-foreground">
                            Agent: {response.agent_name} • {response.county}, {response.ward}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(response.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Quality: {response.quality_score}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => handleGroupAction(selectedGroup.id, selectedGroup.suggested_action)}>
                Apply {selectedGroup.suggested_action}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DuplicateDetection;


