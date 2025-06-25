"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Upload,
  Globe,
  Save,
  Loader2,
  X,
  Plus,
  ArrowLeft,
  Eye,
  EyeOff,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { NotionStyleEditor } from "./editor";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  published: boolean;
  publishedAt: string | null;
  authorName: string;
  metaTitle: string | null;
  metaDescription: string | null;
  categories: { id: string; name: string }[];
}

interface AdminBlogFormProps {
  blog: Blog | null;
  isNew?: boolean;
}

export function AdminBlogForm({ blog, isNew = false }: AdminBlogFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<Blog>>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    coverImage: null,
    published: false,
    metaTitle: "",
    metaDescription: "",
    categories: [],
  });
  const [loading, setLoading] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");

  // Initialize form data
  useEffect(() => {
    if (blog) {
      setFormData({
        ...blog,
      });
      if (blog.coverImage) {
        setCoverImagePreview(blog.coverImage);
      }
    }
  }, [blog]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/blogs/categories');
        
        if (response.ok) {
          const data = await response.json();
          setAllCategories(data);
        } else {
          console.error('Failed to fetch categories');
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-generate slug
    if (name === "title" && (isNew || !formData.slug)) {
      const slug = value
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  // Handle content change
  const handleContentChange = (html: string) => {
    setFormData((prev) => ({ ...prev, content: html }));
  };

  // Handle published state
  const handlePublishedChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, published: checked }));
  };

  // Handle cover image
  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverImageFile(file);

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/blogs/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      setFormData((prev) => ({ ...prev, coverImage: data.url }));
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Er is een fout opgetreden bij het uploaden van de afbeelding.');
    }
  };

  // Remove cover image
  const handleRemoveCoverImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview(null);
    setFormData((prev) => ({ ...prev, coverImage: null }));
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    const category = allCategories.find((c) => c.id === categoryId);
    if (!category) return;

    if (formData.categories?.some((c) => c.id === categoryId)) return;

    setFormData((prev) => ({
      ...prev,
      categories: [...(prev.categories || []), category],
    }));
  };

  // Remove category
  const handleRemoveCategory = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories?.filter((c) => c.id !== categoryId) || [],
    }));
  };

  // Create new category
  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;

    const slugifiedName = newCategory
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

    try {
      const response = await fetch('/api/admin/blogs/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategory.trim(),
          slug: slugifiedName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create category');
      }

      const newCategoryObj = await response.json();
      
      // Add to categories list
      setAllCategories((prev) => [...prev, {...newCategoryObj, postCount: 0}]);
      handleCategorySelect(newCategoryObj.id);
      setNewCategory("");
    } catch (err: any) {
      console.error("Error creating category:", err);
      setError(err.message || "Er is een fout opgetreden bij het aanmaken van de categorie.");
    }
  };

  // Handle save
  const handleSave = async (publish: boolean = false) => {
    setError(null);

    if (publish) {
      setIsPublishing(true);
    } else {
      setIsSaving(true);
    }

    try {
      // Validate
      if (!formData.title) {
        setError("Titel is verplicht");
        return;
      }

      if (!formData.slug) {
        setError("Slug is verplicht");
        return;
      }

      if (!formData.content) {
        setError("Inhoud is verplicht");
        return;
      }

      // Prepare data to send
      const dataToSend = {
        ...formData,
        published: publish ? true : formData.published,
      };

      // Save the blog
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/admin/blogs' : `/api/admin/blogs/${formData.id}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save blog');
      }

      const savedBlog = await response.json();
      
      // Update form data with saved blog
      setFormData(savedBlog);
      
      // Show success notification
      if (publish) {
        router.push('/admin/blogs');
      }
    } catch (err: any) {
      console.error("Error saving blog:", err);
      setError(err.message || "Er is een fout opgetreden bij het opslaan.");
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/blogs")}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug naar overzicht
        </Button>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            {isNew ? "Nieuw blog artikel" : "Blog artikel bewerken"}
          </h1>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {formData.published ? (
                <Eye className="h-4 w-4 text-green-600" />
              ) : (
                <EyeOff className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm text-gray-600">
                {formData.published ? "Gepubliceerd" : "Concept"}
              </span>
            </div>

            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isSaving || isPublishing}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Opslaan
                </>
              )}
            </Button>

            <Button
              onClick={() => handleSave(true)}
              disabled={isSaving || isPublishing || formData.published}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publiceren...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Publiceren
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Slug */}
          <Card className="border-gray-100">
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">
                  Titel
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title || ""}
                  onChange={handleInputChange}
                  placeholder="Voer een titel in"
                  className="mt-2 h-11 text-base"
                />
              </div>

              <div>
                <Label htmlFor="slug" className="text-sm font-medium">
                  URL Slug
                </Label>
                <div className="flex mt-2">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                    /blog/
                  </span>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug || ""}
                    onChange={handleInputChange}
                    placeholder="artikel-slug"
                    className="rounded-l-none h-11"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="excerpt" className="text-sm font-medium">
                  Samenvatting
                </Label>
                <Textarea
                  id="excerpt"
                  name="excerpt"
                  value={formData.excerpt || ""}
                  onChange={handleInputChange}
                  placeholder="Een korte samenvatting van het artikel..."
                  className="mt-2 min-h-[100px] resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card className="border-gray-100">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="border-b border-gray-100">
                <TabsList className="w-full justify-start rounded-none bg-transparent h-12 p-0">
                  <TabsTrigger
                    value="edit"
                    className="rounded-none px-6 h-full data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-gray-900"
                  >
                    Bewerken
                  </TabsTrigger>
                  <TabsTrigger
                    value="preview"
                    className="rounded-none px-6 h-full data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-gray-900"
                  >
                    Voorbeeld
                  </TabsTrigger>
                </TabsList>
              </div>

              <CardContent className="p-0">
                <TabsContent value="edit" className="mt-0">
                  <NotionStyleEditor
                    content={formData.content || ""}
                    onChange={handleContentChange}
                    placeholder="Begin met schrijven..."
                  />
                </TabsContent>

                <TabsContent value="preview" className="p-6 min-h-[500px]">
                  <div className="prose prose-lg max-w-none">
                    {formData.excerpt && (
                      <p className="text-xl text-gray-600 leading-relaxed mb-8">
                        {formData.excerpt}
                      </p>
                    )}
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          formData.content ||
                          '<p class="text-gray-400">Geen inhoud</p>',
                      }}
                    />
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <Card className="border-gray-100">
            <CardContent className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">Publicatie</h3>
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="published"
                  className="text-sm font-normal cursor-pointer"
                >
                  Direct publiceren
                </Label>
                <Switch
                  id="published"
                  checked={formData.published || false}
                  onCheckedChange={handlePublishedChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cover Image */}
          <Card className="border-gray-100">
            <CardContent className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">
                Omslagafbeelding
              </h3>
              {coverImagePreview ? (
                <div className="relative rounded-xl overflow-hidden group">
                  <Image
                    src={coverImagePreview}
                    alt="Cover"
                    width={400}
                    height={200}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleRemoveCoverImage}
                      className="bg-white/90 hover:bg-white"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Verwijderen
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-300 transition-colors">
                  <ImageIcon className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-3">
                    Sleep een afbeelding of klik om te uploaden
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleCoverImageChange}
                      />
                      <Upload className="h-4 w-4 mr-2" />
                      Kies bestand
                    </label>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories */}
          <Card className="border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Categorieën</h3>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4">
                    <h4 className="font-medium text-sm mb-3">
                      Categorie toevoegen
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm">Bestaande categorie</Label>
                        <Select onValueChange={handleCategorySelect}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Selecteer categorie" />
                          </SelectTrigger>
                          <SelectContent>
                            {allCategories
                              .filter(
                                (cat) =>
                                  !formData.categories?.some(
                                    (c) => c.id === cat.id
                                  )
                              )
                              .map((category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id}
                                >
                                  {category.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-gray-500">
                            Of
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm">Nieuwe categorie</Label>
                        <div className="flex mt-2 gap-2">
                          <Input
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Naam"
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            disabled={!newCategory.trim()}
                            onClick={handleCreateCategory}
                          >
                            Toevoegen
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {formData.categories && formData.categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.categories.map((category) => (
                    <Badge
                      key={category.id}
                      variant="secondary"
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 pl-3 pr-1 py-1"
                    >
                      {category.name}
                      <button
                        className="ml-1.5 p-0.5 hover:bg-gray-300 rounded"
                        onClick={() => handleRemoveCategory(category.id)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Geen categorieën geselecteerd
                </p>
              )}
            </CardContent>
          </Card>

          {/* SEO */}
          <Card className="border-gray-100">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-medium text-gray-900">SEO Instellingen</h3>

              <div>
                <Label htmlFor="metaTitle" className="text-sm">
                  Meta titel
                </Label>
                <Input
                  id="metaTitle"
                  name="metaTitle"
                  value={formData.metaTitle || ""}
                  onChange={handleInputChange}
                  placeholder="Standaard: artikel titel"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="metaDescription" className="text-sm">
                  Meta beschrijving
                </Label>
                <Textarea
                  id="metaDescription"
                  name="metaDescription"
                  value={formData.metaDescription || ""}
                  onChange={handleInputChange}
                  placeholder="Standaard: artikel samenvatting"
                  className="mt-2 min-h-[80px] resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
