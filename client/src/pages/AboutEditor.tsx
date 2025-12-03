import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Plus, Trash2, Loader2, Save, ArrowLeft, GripVertical } from 'lucide-react';
import { Link } from 'wouter';
import type { AboutPage } from '@shared/schema';

const roadmapItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(['planned', 'in-progress', 'completed']),
  targetDate: z.string().optional(),
});

const aboutFormSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  roadmap: z.array(roadmapItemSchema),
});

type AboutFormData = z.infer<typeof aboutFormSchema>;

export default function AboutEditor() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const { data: aboutPage, isLoading } = useQuery<AboutPage>({
    queryKey: ['/api/about'],
  });

  const form = useForm<AboutFormData>({
    resolver: zodResolver(aboutFormSchema),
    defaultValues: {
      description: '',
      roadmap: [],
    },
    values: aboutPage ? {
      description: aboutPage.description,
      roadmap: aboutPage.roadmap,
    } : undefined,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'roadmap',
  });

  const mutation = useMutation({
    mutationFn: async (data: AboutFormData) => {
      const response = await apiRequest('PUT', '/api/about', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/about'] });
      toast({
        title: 'Success',
        description: 'About page content has been updated.',
      });
      setIsSaving(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update about page',
        variant: 'destructive',
      });
      setIsSaving(false);
    },
  });

  const onSubmit = (data: AboutFormData) => {
    setIsSaving(true);
    mutation.mutate(data);
  };

  const addRoadmapItem = () => {
    append({
      id: crypto.randomUUID(),
      title: '',
      description: '',
      status: 'planned',
      targetDate: '',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20" data-testid="loading-editor">
        <Loader2 className="w-8 h-8 text-kaspa-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6" data-testid="page-about-editor">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/about">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-heading font-bold text-3xl text-white">
              Edit About <span className="text-kaspa-cyan">Page</span>
            </h1>
            <p className="text-muted-foreground">Manage the About $BMT page content and roadmap</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="border-border" data-testid="card-description">
              <CardHeader>
                <CardTitle className="text-xl">Description</CardTitle>
                <CardDescription>
                  The main content shown on the About page. Use double line breaks to separate paragraphs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={10}
                          className="resize-y font-sans"
                          placeholder="Enter the description for the About page..."
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-border" data-testid="card-roadmap">
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-xl">Roadmap</CardTitle>
                    <CardDescription>
                      Milestones and goals for the project
                    </CardDescription>
                  </div>
                  <Button 
                    type="button" 
                    onClick={addRoadmapItem}
                    className="bg-kaspa-cyan text-background hover:bg-kaspa-cyan/90 gap-2"
                    data-testid="button-add-roadmap"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No roadmap items yet. Click "Add Item" to create one.
                  </p>
                ) : (
                  fields.map((field, index) => (
                    <Card key={field.id} className="border-muted bg-muted/20" data-testid={`card-roadmap-item-${index}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-4">
                          <div className="text-muted-foreground pt-2">
                            <GripVertical className="w-5 h-5" />
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`roadmap.${index}.title`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                      <Input 
                                        {...field} 
                                        placeholder="Milestone title"
                                        data-testid={`input-roadmap-title-${index}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name={`roadmap.${index}.status`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Status</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger data-testid={`select-roadmap-status-${index}`}>
                                            <SelectValue placeholder="Status" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="planned">Planned</SelectItem>
                                          <SelectItem value="in-progress">In Progress</SelectItem>
                                          <SelectItem value="completed">Completed</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`roadmap.${index}.targetDate`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Target</FormLabel>
                                      <FormControl>
                                        <Input 
                                          {...field} 
                                          placeholder="Q1 2025"
                                          data-testid={`input-roadmap-date-${index}`}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                            <FormField
                              control={form.control}
                              name={`roadmap.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      {...field} 
                                      rows={2}
                                      placeholder="Describe this milestone..."
                                      className="resize-none"
                                      data-testid={`input-roadmap-description-${index}`}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            data-testid={`button-remove-roadmap-${index}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Link href="/about">
                <Button type="button" variant="outline" data-testid="button-cancel">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                className="bg-kaspa-green text-background hover:bg-kaspa-green/90 gap-2"
                disabled={isSaving || mutation.isPending}
                data-testid="button-save"
              >
                {isSaving || mutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
