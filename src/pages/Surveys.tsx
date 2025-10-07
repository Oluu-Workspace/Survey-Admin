import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, Filter, MoreHorizontal, Play, Pause, Edit, Trash2, Users, FileText, Calendar, Target, BarChart3, Download, Eye, Settings } from 'lucide-react';
import { toast } from 'sonner';
import SurveyQuestionBuilder, { Question } from '@/components/SurveyQuestionBuilder';
import SurveyResponseViewer, { SurveyResponse } from '@/components/SurveyResponseViewer';
import ResponseAnalytics from '@/components/ResponseAnalytics';
import ExportManager from '@/components/ExportManager';
import AnalysisReportGenerator from '@/components/AnalysisReportGenerator';
import RegionalAssignment from '@/components/RegionalAssignment';
import DuplicateDetection from '@/components/DuplicateDetection';
import ComparativeInsights from '@/components/ComparativeInsights';
import NotificationSystem from '@/components/NotificationSystem';
import { surveysAPI, responsesAPI } from '@/services/api';

interface Survey {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'closed' | 'expired';
  category: string;
  target_responses: number;
  current_responses: number;
  assigned_agents: number;
  created_at: string;
  updated_at: string;
  start_date?: string;
  end_date?: string;
  questions_count: number;
  completion_rate: number;
  questions?: Question[];
  responses?: SurveyResponse[];
  assigned_regions?: string[];
}

const Surveys = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [activeTab, setActiveTab] = useState<'surveys' | 'questions' | 'responses' | 'analytics' | 'export' | 'reports' | 'assignments' | 'duplicates' | 'insights' | 'notifications'>('surveys');
  const [selectedSurveyForDetails, setSelectedSurveyForDetails] = useState<Survey | null>(null);
  
  // Survey creation form state
  const [newSurvey, setNewSurvey] = useState({
    title: '',
    description: '',
    category: '',
    target_responses: 1000,
    start_date: '',
    end_date: '',
    target_regions: {
      counties: [] as string[],
      constituencies: [] as string[],
      wards: [] as string[]
    }
  });

  // Kiambu County data
  const kiambuData = {
    constituencies: [
      { name: 'Gatundu North', wards: ['Gituamba', 'Githobokoni', 'Chania', 'Mang\'u'] },
      { name: 'Gatundu South', wards: ['Kiamwangi', 'Kiganjo', 'Ndarugo', 'Ngenda'] },
      { name: 'Githunguri', wards: ['Githunguri', 'Githiga', 'Ikinu', 'Ngewa', 'Komothai'] },
      { name: 'Juja', wards: ['Murera', 'Theta', 'Juja', 'Witeithie', 'Kalimoni'] },
      { name: 'Kabete', wards: ['Gitaru', 'Muguga', 'Nyathuna', 'Kabete', 'Uthiru'] },
      { name: 'Kiambaa', wards: ['Cianda', 'Karuri', 'Ndenderu', 'Muchatha', 'Kihara'] },
      { name: 'Kiambu', wards: ['Ting\'ang\'a', 'Ndumberi', 'Riabai', 'Township'] },
      { name: 'Kikuyu', wards: ['Karai', 'Nachu', 'Sigona', 'Kikuyu', 'Kinoo'] },
      { name: 'Lari', wards: ['Kinale', 'Kijabe', 'Nyanduma', 'Kamburu', 'Lari/Kirenga'] },
      { name: 'Limuru', wards: ['Bibirioni', 'Limuru Central', 'Ndeiya', 'Limuru East', 'Ngecha/Tigoni'] },
      { name: 'Ruiru', wards: ['Gitothua', 'Biashara', 'Gatongora', 'Kahawa/Sukari', 'Kahawa Wendani', 'Kiuu', 'Mwiki', 'Mwihoko'] },
      { name: 'Thika Town', wards: ['Township', 'Kamenu', 'Hospital', 'Gatuanyaga', 'Ngoliba'] }
    ]
  };

  // Step-by-step creation flow
  const [creationStep, setCreationStep] = useState(1);
  const [selectedCounty, setSelectedCounty] = useState('');

  // Mock data for research platform
  const mockSurveys: Survey[] = [
    {
      id: '1',
      title: 'Household Economic Status Research 2024',
      description: 'Research survey to assess household income, employment, and economic conditions across Kenya. Each agent collects up to 1000 responses in assigned areas.',
      status: 'active',
      category: 'Economic Research',
      target_responses: 50000, // 50 agents × 1000 responses each
      current_responses: 37800,
      assigned_agents: 45,
      created_at: '2024-01-15',
      updated_at: '2024-01-20',
      start_date: '2024-01-20',
      end_date: '2024-03-20',
      questions_count: 25,
      completion_rate: 75.6,
      questions: [
        {
          id: 'q1',
          type: 'text',
          question: 'What is your household size?',
          description: 'Enter the total number of people living in your household',
          required: true,
          order: 1,
          placeholder: 'Enter number of people...'
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          question: 'What is your main source of income?',
          description: 'Select the primary source of income for your household',
          required: true,
          order: 2,
          options: ['Employment', 'Business', 'Farming', 'Remittances', 'Other']
        },
        {
          id: 'q3',
          type: 'number',
          question: 'What is your monthly household income in KES?',
          description: 'Enter your approximate monthly household income',
          required: true,
          order: 3,
          min_value: 0,
          max_value: 1000000,
          placeholder: 'Enter amount in KES...'
        },
        {
          id: 'q4',
          type: 'rating',
          question: 'How would you rate your access to healthcare services?',
          description: 'Rate from 1 (very poor) to 10 (excellent)',
          required: true,
          order: 4,
          min_value: 1,
          max_value: 10
        },
        {
          id: 'q5',
          type: 'yes_no',
          question: 'Do you have access to clean drinking water?',
          description: 'Select yes if you have reliable access to clean water',
          required: true,
          order: 5
        }
      ],
      responses: [
        {
          id: 'r1',
          survey_id: '1',
          survey_title: 'Household Economic Status Research 2024',
          agent_id: '1',
          agent_name: 'John Doe',
          respondent_id: 'R001',
          county: 'Nairobi',
          sub_county: 'Westlands',
          ward: 'Parklands',
          area: 'Parklands Estate',
          status: 'validated',
          quality_score: 95.2,
          created_at: '2024-01-20T10:30:00Z',
          updated_at: '2024-01-20T11:15:00Z',
          location: {
            latitude: -1.2921,
            longitude: 36.8219,
            address: 'Parklands Estate, Nairobi'
          },
          answers: {
            'q1': '4',
            'q2': 'Employment',
            'q3': '45000',
            'q4': '8',
            'q5': 'Yes'
          },
          validation_notes: 'Complete and accurate response'
        },
        {
          id: 'r2',
          survey_id: '1',
          survey_title: 'Household Economic Status Research 2024',
          agent_id: '2',
          agent_name: 'Jane Smith',
          respondent_id: 'R002',
          county: 'Nairobi',
          sub_county: 'Central',
          ward: 'CBD',
          area: 'Central Business District',
          status: 'flagged',
          quality_score: 72.8,
          created_at: '2024-01-20T09:15:00Z',
          updated_at: '2024-01-20T10:45:00Z',
          location: {
            latitude: -1.2921,
            longitude: 36.8219,
            address: 'CBD, Nairobi'
          },
          answers: {
            'q1': '3',
            'q2': 'Business',
            'q3': '120000',
            'q4': '6',
            'q5': 'No'
          },
          flagged_reasons: ['Inconsistent income data', 'Missing employment details'],
          validation_notes: 'Income seems inconsistent with reported employment'
        }
      ]
    },
    {
      id: '2',
      title: 'Education Access Research Study',
      description: 'Comprehensive research on education access, quality, and infrastructure across Kenya. Field agents collect data from schools, households, and education stakeholders.',
      status: 'active',
      category: 'Education Research',
      target_responses: 32000, // 32 agents × 1000 responses each
      current_responses: 21600,
      assigned_agents: 32,
      created_at: '2024-01-10',
      updated_at: '2024-01-18',
      start_date: '2024-01-18',
      end_date: '2024-02-28',
      questions_count: 18,
      completion_rate: 67.5
    },
    {
      id: '3',
      title: 'Healthcare Services Research',
      description: 'Research assessment of healthcare service availability, quality, and accessibility across Kenyan counties and sub-counties.',
      status: 'closed',
      category: 'Health Research',
      target_responses: 28000, // 28 agents × 1000 responses each
      current_responses: 14900,
      assigned_agents: 28,
      created_at: '2024-01-05',
      updated_at: '2024-01-15',
      start_date: '2024-01-15',
      end_date: '2024-02-15',
      questions_count: 22,
      completion_rate: 53.2
    },
    {
      id: '4',
      title: 'Agricultural Practices Research',
      description: 'Comprehensive study of farming methods, agricultural productivity, and rural development across Kenya. Completed research with full data collection.',
      status: 'closed',
      category: 'Agriculture Research',
      target_responses: 35000, // 35 agents × 1000 responses each
      current_responses: 35000,
      assigned_agents: 35,
      created_at: '2023-12-01',
      updated_at: '2024-01-10',
      start_date: '2023-12-01',
      end_date: '2024-01-10',
      questions_count: 30,
      completion_rate: 100.0
    },
    {
      id: '5',
      title: 'Water Access & Quality Research',
      description: 'Research survey on water availability, quality, and accessibility across Kenyan counties. Focus on rural and urban water infrastructure.',
      status: 'draft',
      category: 'Infrastructure Research',
      target_responses: 40000, // 40 agents × 1000 responses each
      current_responses: 0,
      assigned_agents: 0,
      created_at: '2024-01-20',
      updated_at: '2024-01-20',
      questions_count: 15,
      completion_rate: 0.0
    }
  ];

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        setLoading(true);
        const response = await surveysAPI.getAll({
          page: 1,
          limit: 50,
          status: statusFilter === 'all' ? undefined : statusFilter
        });
        
        // Transform backend data to match frontend interface
        const transformedSurveys = response.surveys.map((survey: any) => ({
          ...survey,
          questions_count: survey.questions?.length || 0,
          current_responses: survey.response_count || 0,
          assigned_agents: survey.assigned_agents_count || 0,
          completion_rate: survey.target_responses > 0 
            ? (survey.response_count / survey.target_responses) * 100 
            : 0,
          questions: survey.questions || [],
          responses: [] // Will be fetched separately when needed
        }));
        
        setSurveys(transformedSurveys);
      } catch (error) {
        console.error('Failed to fetch surveys:', error);
        toast.error('Failed to load surveys');
        // Fallback to mock data for development
        setSurveys(mockSurveys);
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, [statusFilter]);

  const filteredSurveys = surveys.filter(survey => {
    const matchesSearch = survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         survey.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || survey.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || survey.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active':
          return 'bg-green-500 text-white'; // Success - Active surveys
        case 'draft':
          return 'bg-amber-500 text-white'; // Warning - Pending/draft
        case 'closed':
          return 'bg-gray-500 text-white'; // Neutral - Closed
        case 'expired':
          return 'bg-red-600 text-white'; // Error - Expired
        default:
          return 'bg-gray-400 text-white';
      }
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium ${getStatusColor(status)}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Check if survey is expired based on end date
  const isSurveyExpired = (survey: Survey) => {
    if (!survey.end_date) return false;
    return new Date() > new Date(survey.end_date);
  };

  // Auto-update survey status based on dates
  const updateSurveyStatus = (survey: Survey) => {
    // Auto-update survey status based on dates
    
    const now = new Date();
    const startDate = survey.start_date ? new Date(survey.start_date) : null;
    const endDate = survey.end_date ? new Date(survey.end_date) : null;
    
    if (endDate && now > endDate) {
      return { ...survey, status: 'expired' as const };
    }
    
    if (startDate && now >= startDate && survey.status === 'draft') {
      return { ...survey, status: 'active' as const };
    }
    
    return survey;
  };

  const handleCreateSurvey = async () => {
    try {
      // Validate required fields
      if (!newSurvey.title || !newSurvey.description || !newSurvey.category || !newSurvey.start_date || !newSurvey.end_date || !selectedCounty) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate dates
      if (new Date(newSurvey.start_date) >= new Date(newSurvey.end_date)) {
        toast.error('End date must be after start date');
        return;
      }

      // Validate Kiambu selection
      if (selectedCounty === 'Kiambu' && newSurvey.target_regions.constituencies.length === 0) {
        toast.error('Please select at least one constituency for Kiambu County');
        return;
      }

      // Create survey data
      const surveyData = {
        title: newSurvey.title,
        description: newSurvey.description,
        category: newSurvey.category,
        target_responses: newSurvey.target_responses,
        start_date: newSurvey.start_date,
        end_date: newSurvey.end_date,
        assigned_regions: [
          selectedCounty,
          ...newSurvey.target_regions.constituencies,
          ...newSurvey.target_regions.wards
        ],
        status: 'draft',
        questions: []
      };

      // Submit to backend
      const response = await surveysAPI.create(surveyData);
      
      // Add to local state
      const createdSurvey = {
        ...response.survey,
        questions_count: 0,
        current_responses: 0,
        assigned_agents: 0,
        completion_rate: 0,
        questions: [],
        responses: []
      };
      
      setSurveys(prev => [createdSurvey, ...prev]);
      
      // Reset form and close dialog
      setNewSurvey({
        title: '',
        description: '',
        category: '',
        target_responses: 1000,
        start_date: '',
        end_date: '',
        target_regions: { counties: [], constituencies: [], wards: [] }
      });
      setSelectedCounty('');
      setCreationStep(1);
      setIsCreateDialogOpen(false);
      
      toast.success(`Survey "${newSurvey.title}" created successfully`);
    } catch (error) {
      console.error('Failed to create survey:', error);
      toast.error('Failed to create survey. Please try again.');
    }
  };

  const fetchSurveyDetails = async (surveyId: string) => {
    try {
      // Fetch survey with questions
      const surveyResponse = await surveysAPI.getById(surveyId);
      const survey = surveyResponse.survey;
      
      // Fetch responses for this survey
      const responsesResponse = await responsesAPI.getAll({
        survey_id: surveyId,
        limit: 1000 // Get all responses
      });
      
      // Transform responses to match frontend interface
      const transformedResponses = responsesResponse.responses.map((response: any) => ({
        id: response.id,
        survey_id: response.survey_id,
        survey_title: survey.title,
        agent_id: response.agent_id,
        agent_name: response.agent_name || 'Unknown Agent',
        respondent_id: response.respondent_id || response.id,
        county: response.location?.county || 'Unknown',
        sub_county: response.location?.subcounty || 'Unknown',
        ward: response.location?.ward || 'Unknown',
        area: response.location?.village || 'Unknown',
        status: response.status || 'submitted',
        quality_score: response.quality_score || 85,
        created_at: response.created_at || response.submitted_at,
        updated_at: response.updated_at || response.created_at,
        location: response.location,
        answers: response.answers || {},
        validation_notes: response.validation_notes,
        flagged_reasons: response.flagged_reasons
      }));
      
      return {
        ...survey,
        questions_count: survey.questions?.length || 0,
        current_responses: transformedResponses.length,
        assigned_agents: survey.assigned_agents_count || 0,
        completion_rate: survey.target_responses > 0 
          ? (transformedResponses.length / survey.target_responses) * 100 
          : 0,
        questions: survey.questions || [],
        responses: transformedResponses
      };
    } catch (error) {
      console.error('Failed to fetch survey details:', error);
      toast.error('Failed to load survey details');
      return null;
    }
  };

  const handleSurveyAction = async (action: string, survey: Survey) => {
    switch (action) {
      case 'activate':
        try {
          await surveysAPI.update(survey.id, { status: 'active' });
          setSurveys(prev => prev.map(s => 
            s.id === survey.id ? { ...s, status: 'active' } : s
          ));
          toast.success(`Survey "${survey.title}" activated`);
        } catch (error) {
          toast.error('Failed to activate survey');
        }
        break;
      case 'close':
        try {
          await surveysAPI.update(survey.id, { status: 'closed' });
          setSurveys(prev => prev.map(s => 
            s.id === survey.id ? { ...s, status: 'closed' } : s
          ));
          toast.success(`Survey "${survey.title}" closed`);
        } catch (error) {
          toast.error('Failed to close survey');
        }
        break;
      case 'edit':
        // Open edit dialog with pre-filled data
        setSelectedSurvey(survey);
        setNewSurvey({
          title: survey.title,
          description: survey.description,
          category: survey.category,
          target_responses: survey.target_responses,
          start_date: survey.start_date || '',
          end_date: survey.end_date || '',
          target_regions: {
            counties: survey.assigned_regions?.filter(r => r.includes('County')) || [],
            constituencies: survey.assigned_regions?.filter(r => !r.includes('County') && !r.includes('Ward')) || [],
            wards: survey.assigned_regions?.filter(r => r.includes('Ward')) || []
          }
        });
        setSelectedCounty(survey.assigned_regions?.[0] || 'Kiambu');
        setCreationStep(1);
        setIsCreateDialogOpen(true);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete "${survey.title}"? This action cannot be undone.`)) {
          try {
            await surveysAPI.delete(survey.id);
            setSurveys(prev => prev.filter(s => s.id !== survey.id));
            toast.success(`Survey "${survey.title}" deleted`);
          } catch (error) {
            toast.error('Failed to delete survey');
          }
        }
        break;
      case 'view':
        setSelectedSurvey(survey);
        break;
      case 'assign':
        // Navigate to assignments tab
        const surveyForAssignments = await fetchSurveyDetails(survey.id);
        if (surveyForAssignments) {
          setSelectedSurveyForDetails(surveyForAssignments);
          setActiveTab('assignments');
        }
        break;
      case 'export':
        // Navigate to export tab
        const surveyForExport = await fetchSurveyDetails(survey.id);
        if (surveyForExport) {
          setSelectedSurveyForDetails(surveyForExport);
          setActiveTab('export');
        }
        break;
      case 'questions':
        const surveyWithQuestions = await fetchSurveyDetails(survey.id);
        if (surveyWithQuestions) {
          setSelectedSurveyForDetails(surveyWithQuestions);
          setActiveTab('questions');
        }
        break;
      case 'responses':
        const surveyWithResponses = await fetchSurveyDetails(survey.id);
        if (surveyWithResponses) {
          setSelectedSurveyForDetails(surveyWithResponses);
          setActiveTab('responses');
        }
        break;
      case 'analytics':
        const surveyForAnalytics = await fetchSurveyDetails(survey.id);
        if (surveyForAnalytics) {
          setSelectedSurveyForDetails(surveyForAnalytics);
          setActiveTab('analytics');
        }
        break;
      case 'reports':
        const surveyForReports = await fetchSurveyDetails(survey.id);
        if (surveyForReports) {
          setSelectedSurveyForDetails(surveyForReports);
          setActiveTab('reports');
        }
        break;
    }
  };

  const handleQuestionsChange = (questions: Question[]) => {
    if (selectedSurveyForDetails) {
      const updatedSurveys = surveys.map(s => 
        s.id === selectedSurveyForDetails.id 
          ? { ...s, questions, questions_count: questions.length }
          : s
      );
      setSurveys(updatedSurveys);
      setSelectedSurveyForDetails({ ...selectedSurveyForDetails, questions, questions_count: questions.length });
    }
  };

  const handleSaveSurvey = () => {
    toast.success('Survey questions saved successfully');
  };

  const stats = {
    total: surveys.length,
    active: surveys.filter(s => s.status === 'active').length,
    completed: surveys.filter(s => s.status === 'closed').length,
    totalResponses: surveys.reduce((sum, s) => sum + s.current_responses, 0),
    totalTarget: surveys.reduce((sum, s) => sum + s.target_responses, 0)
  };

  if (loading) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Survey Management</h1>
        <p className="text-muted-foreground mt-1">
          Create and manage surveys for field data collection.
        </p>
      </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading surveys...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Research Survey Management</h1>
          <p className="text-muted-foreground mt-1">
            Create research surveys with custom questions for field agents. Each agent can collect up to 1000 responses across assigned geographic areas.
          </p>
        </div>
        {activeTab !== 'surveys' && (
          <Button variant="outline" onClick={() => setActiveTab('surveys')}>
            Back to Surveys
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'surveys' | 'questions' | 'responses' | 'analytics' | 'export' | 'reports' | 'assignments' | 'duplicates' | 'insights' | 'notifications')}>
        <TabsList>
          <TabsTrigger value="surveys">Surveys</TabsTrigger>
          {selectedSurveyForDetails && (
            <>
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="responses">Responses</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="duplicates">Duplicates</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="surveys" className="space-y-6">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Survey
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Survey</DialogTitle>
              <DialogDescription>
                Step {creationStep} of 3: {creationStep === 1 ? 'Basic Information' : creationStep === 2 ? 'Timeline & Target' : 'Geographic Coverage'}
              </DialogDescription>
            </DialogHeader>
            
            {/* Progress Indicator */}
            <div className="flex items-center justify-center space-x-2 mb-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 flex items-center justify-center text-sm font-medium border-2 ${
                    step <= creationStep ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-300'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-12 h-1 mx-2 ${
                      step < creationStep ? 'bg-red-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {/* Step 1: Basic Information */}
              {creationStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Survey Title *</Label>
                    <Input 
                      id="title" 
                      placeholder="e.g., Household Economic Status Research 2024" 
                      value={newSurvey.title}
                      onChange={(e) => setNewSurvey(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Describe the purpose and scope of this survey..."
                      value={newSurvey.description}
                      onChange={(e) => setNewSurvey(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select value={newSurvey.category} onValueChange={(value) => setNewSurvey(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Economic Research">Economic Research</SelectItem>
                          <SelectItem value="Education Research">Education Research</SelectItem>
                          <SelectItem value="Health Research">Health Research</SelectItem>
                          <SelectItem value="Agriculture Research">Agriculture Research</SelectItem>
                          <SelectItem value="Infrastructure Research">Infrastructure Research</SelectItem>
                          <SelectItem value="Social Research">Social Research</SelectItem>
                          <SelectItem value="Environmental Research">Environmental Research</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="target">Target Responses *</Label>
                      <Input 
                        id="target" 
                        type="number" 
                        placeholder="1000" 
                        value={newSurvey.target_responses}
                        onChange={(e) => setNewSurvey(prev => ({ ...prev, target_responses: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Timeline & Target */}
              {creationStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Start Date *</Label>
                      <Input 
                        id="start_date" 
                        type="date" 
                        value={newSurvey.start_date}
                        onChange={(e) => setNewSurvey(prev => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">End Date *</Label>
                      <Input 
                        id="end_date" 
                        type="date" 
                        value={newSurvey.end_date}
                        onChange={(e) => setNewSurvey(prev => ({ ...prev, end_date: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 border border-gray-300">
                    <p className="text-sm text-gray-700">
                      <strong>Note:</strong> After the end date, agents will be prompted to upload all pending data and the survey will be automatically closed.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Geographic Coverage */}
              {creationStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label>Select County *</Label>
                    <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a county..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kiambu">Kiambu County</SelectItem>
                        <SelectItem value="Nairobi">Nairobi County</SelectItem>
                        <SelectItem value="Mombasa">Mombasa County</SelectItem>
                        <SelectItem value="Kisumu">Kisumu County</SelectItem>
                        <SelectItem value="Nakuru">Nakuru County</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCounty === 'Kiambu' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Select Constituencies</Label>
                        <Select onValueChange={(value) => {
                          if (!newSurvey.target_regions.constituencies.includes(value)) {
                            setNewSurvey(prev => ({
                              ...prev,
                              target_regions: {
                                ...prev.target_regions,
                                constituencies: [...prev.target_regions.constituencies, value]
                              }
                            }));
                          }
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Add constituencies..." />
                          </SelectTrigger>
                          <SelectContent>
                            {kiambuData.constituencies.map((constituency) => (
                              <SelectItem key={constituency.name} value={constituency.name}>
                                {constituency.name} ({constituency.wards.length} wards)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {newSurvey.target_regions.constituencies.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {newSurvey.target_regions.constituencies.map((constituency, index) => (
                              <span key={index} className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 flex items-center gap-1">
                                {constituency}
                                <button
                                  onClick={() => setNewSurvey(prev => ({
                                    ...prev,
                                    target_regions: {
                                      ...prev.target_regions,
                                      constituencies: prev.target_regions.constituencies.filter(c => c !== constituency)
                                    }
                                  }))}
                                  className="ml-1 text-xs hover:text-red-600"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {newSurvey.target_regions.constituencies.length > 0 && (
                        <div>
                          <Label>Select Specific Wards (Optional)</Label>
                          <p className="text-sm text-gray-600 mb-2">Leave empty to include all wards from selected constituencies</p>
                          <Select onValueChange={(value) => {
                            if (!newSurvey.target_regions.wards.includes(value)) {
                              setNewSurvey(prev => ({
                                ...prev,
                                target_regions: {
                                  ...prev.target_regions,
                                  wards: [...prev.target_regions.wards, value]
                                }
                              }));
                            }
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Add specific wards..." />
                            </SelectTrigger>
                            <SelectContent>
                              {newSurvey.target_regions.constituencies.flatMap(constituencyName => {
                                const constituency = kiambuData.constituencies.find(c => c.name === constituencyName);
                                return constituency ? constituency.wards.map(ward => (
                                  <SelectItem key={ward} value={ward}>
                                    {ward} ({constituencyName})
                                  </SelectItem>
                                )) : [];
                              })}
                            </SelectContent>
                          </Select>
                          {newSurvey.target_regions.wards.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {newSurvey.target_regions.wards.map((ward, index) => (
                                <span key={index} className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 flex items-center gap-1">
                                  {ward}
                                  <button
                                    onClick={() => setNewSurvey(prev => ({
                                      ...prev,
                                      target_regions: {
                                        ...prev.target_regions,
                                        wards: prev.target_regions.wards.filter(w => w !== ward)
                                      }
                                    }))}
                                    className="ml-1 text-xs hover:text-red-600"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedCounty && selectedCounty !== 'Kiambu' && (
                    <div className="bg-gray-50 p-4 border border-gray-300">
                      <p className="text-sm text-gray-700">
                        <strong>Note:</strong> For {selectedCounty} County, you can add specific regions manually after creating the survey.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (creationStep > 1) {
                    setCreationStep(creationStep - 1);
                  } else {
                    setIsCreateDialogOpen(false);
                    setNewSurvey({
                      title: '',
                      description: '',
                      category: '',
                      target_responses: 1000,
                      start_date: '',
                      end_date: '',
                      target_regions: { counties: [], constituencies: [], wards: [] }
                    });
                    setSelectedCounty('');
                    setCreationStep(1);
                  }
                }}
              >
                {creationStep > 1 ? 'Back' : 'Cancel'}
              </Button>
              
              <div className="flex gap-2">
                {creationStep < 3 && (
                  <Button 
                    onClick={() => {
                      // Validate current step
                      if (creationStep === 1) {
                        if (!newSurvey.title || !newSurvey.description || !newSurvey.category) {
                          toast.error('Please fill in all required fields');
                          return;
                        }
                      } else if (creationStep === 2) {
                        if (!newSurvey.start_date || !newSurvey.end_date) {
                          toast.error('Please select both start and end dates');
                          return;
                        }
                        if (new Date(newSurvey.start_date) >= new Date(newSurvey.end_date)) {
                          toast.error('End date must be after start date');
                          return;
                        }
                      }
                      setCreationStep(creationStep + 1);
                    }}
                  >
                    Next
                  </Button>
                )}
                
                {creationStep === 3 && (
                  <Button 
                    onClick={handleCreateSurvey}
                    disabled={!selectedCounty || (selectedCounty === 'Kiambu' && newSurvey.target_regions.constituencies.length === 0)}
                  >
                    Create Survey
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Surveys</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Surveys</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResponses.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalTarget > 0 ? Math.round((stats.totalResponses / stats.totalTarget) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Surveys</CardTitle>
          <CardDescription>Manage and monitor all surveys</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search surveys..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Economic">Economic</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Health">Health</SelectItem>
                <SelectItem value="Agriculture">Agriculture</SelectItem>
                <SelectItem value="Infrastructure">Infrastructure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Survey</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Agents</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSurveys.map((survey) => (
                  <TableRow key={survey.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{survey.title}</div>
                        <div className="text-sm text-muted-foreground">{survey.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {survey.questions_count} questions
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(survey.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{survey.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {survey.current_responses} / {survey.target_responses}
                        </div>
                        <div className="w-full bg-gray-200 h-2">
                          <div
                            className="bg-red-600 h-2"
                            style={{ width: `${survey.completion_rate}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {survey.completion_rate.toFixed(1)}% complete
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{survey.assigned_agents}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(survey.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleSurveyAction('view', survey)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSurveyAction('questions', survey)}>
                            <Settings className="mr-2 h-4 w-4" />
                            Manage Questions
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSurveyAction('responses', survey)}>
                            <FileText className="mr-2 h-4 w-4" />
                            View Responses
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSurveyAction('analytics', survey)}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSurveyAction('export', survey)}>
                            <Download className="mr-2 h-4 w-4" />
                            Export Data
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSurveyAction('reports', survey)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Generate Reports
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSurveyAction('edit', survey)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Survey
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {survey.status === 'draft' && (
                            <DropdownMenuItem onClick={() => handleSurveyAction('activate', survey)}>
                              <Play className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          {survey.status === 'active' && (
                            <DropdownMenuItem onClick={() => handleSurveyAction('close', survey)}>
                              <Pause className="mr-2 h-4 w-4" />
                              Close Survey
                            </DropdownMenuItem>
                          )}
                          {(survey.status === 'draft' || survey.status === 'active') && (
                            <DropdownMenuItem onClick={() => handleSurveyAction('assign', survey)}>
                              <Users className="mr-2 h-4 w-4" />
                              Assign Agents
                            </DropdownMenuItem>
                          )}
                          {(survey.status === 'closed' || survey.status === 'expired') && (
                            <DropdownMenuItem onClick={() => handleSurveyAction('export', survey)}>
                              <Download className="mr-2 h-4 w-4" />
                              Export Data
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {survey.status === 'draft' && (
                            <DropdownMenuItem 
                              onClick={() => handleSurveyAction('delete', survey)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Survey Details Dialog */}
      {selectedSurvey && (
        <Dialog open={!!selectedSurvey} onOpenChange={() => setSelectedSurvey(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{selectedSurvey.title}</DialogTitle>
              <DialogDescription>{selectedSurvey.description}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedSurvey.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{selectedSurvey.category}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Target Responses</Label>
                  <div className="mt-1">{selectedSurvey.target_responses.toLocaleString()}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Current Responses</Label>
                  <div className="mt-1">{selectedSurvey.current_responses.toLocaleString()}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Assigned Agents</Label>
                  <div className="mt-1">{selectedSurvey.assigned_agents}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Questions</Label>
                  <div className="mt-1">{selectedSurvey.questions_count}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <div className="mt-1">{new Date(selectedSurvey.created_at).toLocaleDateString()}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <div className="mt-1">{new Date(selectedSurvey.updated_at).toLocaleDateString()}</div>
                </div>
              </div>
              {selectedSurvey.start_date && selectedSurvey.end_date && (
                <div>
                  <Label className="text-sm font-medium">Duration</Label>
                  <div className="mt-1">
                    {new Date(selectedSurvey.start_date).toLocaleDateString()} - {new Date(selectedSurvey.end_date).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedSurvey(null)}>
                Close
              </Button>
              <Button onClick={() => handleSurveyAction('edit', selectedSurvey)}>
                Edit Survey
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
        </TabsContent>

      {/* Question Builder Tab */}
      <TabsContent value="questions" className="space-y-6">
        {selectedSurveyForDetails && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Survey Questions</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedSurveyForDetails.title} - Build your research questions
                </p>
              </div>
            </div>
            <SurveyQuestionBuilder
              questions={selectedSurveyForDetails.questions || []}
              onQuestionsChange={handleQuestionsChange}
              onSave={handleSaveSurvey}
            />
          </div>
        )}
      </TabsContent>

      {/* Response Viewer Tab */}
      <TabsContent value="responses" className="space-y-6">
        {selectedSurveyForDetails && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Survey Responses</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedSurveyForDetails.title} - Review collected responses
                </p>
              </div>
            </div>
            <SurveyResponseViewer
              surveyId={selectedSurveyForDetails.id}
              surveyTitle={selectedSurveyForDetails.title}
              responses={selectedSurveyForDetails.responses || []}
              onResponseUpdate={(responseId, status, notes) => {
                toast.success(`Response ${status} successfully`);
              }}
            />
          </div>
        )}
      </TabsContent>

      {/* Response Analytics Tab */}
      <TabsContent value="analytics" className="space-y-6">
        {selectedSurveyForDetails && (
          <ResponseAnalytics
            surveyId={selectedSurveyForDetails.id}
            surveyTitle={selectedSurveyForDetails.title}
            responses={selectedSurveyForDetails.responses || []}
            questions={selectedSurveyForDetails.questions || []}
          />
        )}
      </TabsContent>

      {/* Export Manager Tab */}
      <TabsContent value="export" className="space-y-6">
        {selectedSurveyForDetails && (
          <ExportManager
            surveyId={selectedSurveyForDetails.id}
            surveyTitle={selectedSurveyForDetails.title}
            responses={selectedSurveyForDetails.responses || []}
            questions={selectedSurveyForDetails.questions || []}
          />
        )}
      </TabsContent>

      {/* Analysis Reports Tab */}
      <TabsContent value="reports" className="space-y-6">
        {selectedSurveyForDetails && (
          <AnalysisReportGenerator
            surveyId={selectedSurveyForDetails.id}
            surveyTitle={selectedSurveyForDetails.title}
            responses={selectedSurveyForDetails.responses || []}
            questions={selectedSurveyForDetails.questions || []}
          />
        )}
      </TabsContent>

      {/* Regional Assignments Tab */}
      <TabsContent value="assignments" className="space-y-6">
        {selectedSurveyForDetails && (
          <RegionalAssignment
            surveyId={selectedSurveyForDetails.id}
            surveyTitle={selectedSurveyForDetails.title}
          />
        )}
      </TabsContent>

      {/* Duplicate Detection Tab */}
      <TabsContent value="duplicates" className="space-y-6">
        {selectedSurveyForDetails && (
          <DuplicateDetection
            responses={selectedSurveyForDetails.responses || []}
            onResponseUpdate={(responseId, action) => {
              toast.success(`Response ${action} successfully`);
            }}
          />
        )}
      </TabsContent>

      {/* Comparative Insights Tab */}
      <TabsContent value="insights" className="space-y-6">
        {selectedSurveyForDetails && (
          <ComparativeInsights
            surveyId={selectedSurveyForDetails.id}
            surveyTitle={selectedSurveyForDetails.title}
            responses={selectedSurveyForDetails.responses || []}
            questions={selectedSurveyForDetails.questions || []}
          />
        )}
      </TabsContent>

      {/* Notifications Tab */}
      <TabsContent value="notifications" className="space-y-6">
        <NotificationSystem userId="current-user" />
      </TabsContent>
      </Tabs>
    </div>
  );
};

export default Surveys;
