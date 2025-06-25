"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Clock,
  EyeIcon,
  ImageIcon,
  Loader2,
  Save,
  Settings,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { NotionStyleEditor } from "@/components/admin/blogs/editor";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FullPageBlogEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const blogId = searchParams.get("id");

  const [loading, setLoading] = useState(blogId ? true : false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    coverImage: null as string | null,
    published: false,
    authorName: "Admin",
    metaTitle: "",
    metaDescription: "",
    categories: [] as { id: string; name: string; slug: string }[],
  });

  const [categories, setCategories] = useState<
    { id: string; name: string; slug: string; postCount: number }[]
  >([]);
  const [newCategory, setNewCategory] = useState("");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Fetch blog data if editing an existing blog
  useEffect(() => {
    if (blogId && blogId !== "new") {
      const fetchBlog = async () => {
        try {
          const response = await fetch(`/api/admin/blogs/${blogId}`);
          if (!response.ok) throw new Error("Failed to fetch blog");

          const data = await response.json();
          setFormData(data);
        } catch (err) {
          console.error("Error fetching blog:", err);
          setError("Failed to load blog data");
        } finally {
          setLoading(false);
        }
      };

      fetchBlog();
    } else {
      setLoading(false);
    }
  }, [blogId]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/admin/blogs/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");

      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.title, formData.slug]);

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle content change
  const handleContentChange = (html: string) => {
    setFormData((prev) => ({ ...prev, content: html }));
  };

  // Handle published state
  const handlePublishedChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, published: checked }));
  };

  // Handle cover image upload
  const handleCoverImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverImageFile(file);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/blogs/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      setFormData((prev) => ({ ...prev, coverImage: data.url }));
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Er is een fout opgetreden bij het uploaden van de afbeelding.");
    }
  };

  // Remove cover image
  const handleRemoveCoverImage = () => {
    setCoverImageFile(null);
    setFormData((prev) => ({ ...prev, coverImage: null }));
  };

  // Add category
  const handleAddCategory = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    if (formData.categories.some((c) => c.id === categoryId)) return;

    setFormData((prev) => ({
      ...prev,
      categories: [...prev.categories, category],
    }));
  };

  // Remove category
  const handleRemoveCategory = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== categoryId),
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
      const response = await fetch("/api/admin/blogs/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCategory.trim(),
          slug: slugifiedName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create category");
      }

      const newCategoryObj = await response.json();

      // Add to categories list
      setCategories((prev) => [...prev, { ...newCategoryObj, postCount: 0 }]);

      // Add to selected categories
      setFormData((prev) => ({
        ...prev,
        categories: [...prev.categories, newCategoryObj],
      }));

      setNewCategory("");
    } catch (err: any) {
      console.error("Error creating category:", err);
      setError(
        err.message ||
          "Er is een fout opgetreden bij het aanmaken van de categorie."
      );
    }
  };

  // Save blog
  const handleSave = async (publish = false) => {
    setError(null);
    setSaving(true);

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

      // Prepare data
      const dataToSend = {
        ...formData,
        published: publish ? true : formData.published,
      };

      // Save blog
      const isNew = !blogId || blogId === "new";
      const method = isNew ? "POST" : "PUT";
      const url = isNew ? "/api/admin/blogs" : `/api/admin/blogs/${blogId}`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save blog");
      }

      const savedBlog = await response.json();

      // Redirect to blog list
      router.push("/admin/blogs");
    } catch (err: any) {
      console.error("Error saving blog:", err);
      setError(
        err.message ||
          "Er is een fout opgetreden bij het opslaan van het blog artikel."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500">Blog artikel laden...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top Bar */}
      <div className="border-gray-200 bg-white px-4 py-3 sticky top-0 z-10 border border-t-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => router.push("/admin/blogs")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <Input
                value={formData.title}
                onChange={handleInputChange}
                name="title"
                placeholder="Blog titel..."
                className="text-lg font-medium border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-[300px] px-0"
              />
              <div className="flex items-center text-sm text-gray-500">
                <span className="text-gray-400">/blog/</span>
                <Input
                  value={formData.slug}
                  onChange={handleInputChange}
                  name="slug"
                  placeholder="slug"
                  className="text-sm border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-[200px] p-0 h-6"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Auto-saved</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
              <span>Instellingen</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg"
              onClick={() => window.open(`/blog/${formData.slug}`, "_blank")}
              disabled={!formData.slug}
            >
              <EyeIcon className="h-4 w-4" />
              <span>Preview</span>
            </Button>

            <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-md text-gray-700",
                  !formData.published && "bg-white shadow-sm"
                )}
                onClick={() => handlePublishedChange(false)}
              >
                Concept
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-md text-gray-700",
                  formData.published && "bg-white shadow-sm"
                )}
                onClick={() => handlePublishedChange(true)}
              >
                Gepubliceerd
              </Button>
            </div>

            <Button
              size="sm"
              className="gap-1.5 rounded-lg"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Opslaan...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Opslaan</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {showSettings && (
          <div className="flex border-t border-gray-200 mt-3 pt-3 pb-1 overflow-x-auto gap-6">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1.5 rounded-lg",
                activeSection === "cover" && "bg-gray-100"
              )}
              onClick={() =>
                setActiveSection(activeSection === "cover" ? null : "cover")
              }
            >
              <ImageIcon className="h-4 w-4" />
              <span>Omslagafbeelding</span>
              {formData.coverImage && (
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1.5 rounded-lg",
                activeSection === "categories" && "bg-gray-100"
              )}
              onClick={() =>
                setActiveSection(
                  activeSection === "categories" ? null : "categories"
                )
              }
            >
              <Tag className="h-4 w-4" />
              <span>Categorieën</span>
              {formData.categories.length > 0 && (
                <Badge className="bg-gray-200 text-gray-700 text-xs ml-1 px-1.5">
                  {formData.categories.length}
                </Badge>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1.5 rounded-lg",
                activeSection === "excerpt" && "bg-gray-100"
              )}
              onClick={() =>
                setActiveSection(activeSection === "excerpt" ? null : "excerpt")
              }
            >
              <span>Samenvatting</span>
              {formData.excerpt && (
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1.5 rounded-lg",
                activeSection === "seo" && "bg-gray-100"
              )}
              onClick={() =>
                setActiveSection(activeSection === "seo" ? null : "seo")
              }
            >
              <span>SEO</span>
              {(formData.metaTitle || formData.metaDescription) && (
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
              )}
            </Button>
          </div>
        )}

        {activeSection === "cover" && (
          <div className="border-t border-gray-200 mt-2 pt-4 pb-3">
            <div className="max-w-lg mx-auto">
              {formData.coverImage ? (
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={formData.coverImage}
                    alt="Cover"
                    className="w-full h-40 object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveCoverImage}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Verwijderen
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-10 text-center hover:border-gray-300 transition-colors">
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
                      Kies bestand
                    </label>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === "categories" && (
          <div className="border-t border-gray-200 mt-2 pt-4 pb-3">
            <div className="max-w-lg mx-auto">
              <div className="flex items-center mb-3">
                <h3 className="text-sm font-medium">Categorieën</h3>
                <div className="ml-auto flex gap-2">
                  <Select onValueChange={handleAddCategory}>
                    <SelectTrigger className="w-[180px] h-8 text-sm">
                      <SelectValue placeholder="Categorie toevoegen" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter(
                          (cat) =>
                            !formData.categories.some((c) => c.id === cat.id)
                        )
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      {categories.filter(
                        (cat) =>
                          !formData.categories.some((c) => c.id === cat.id)
                      ).length === 0 && (
                        <SelectItem value="no-categories" disabled>
                          Geen categorieën beschikbaar
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8">
                        Nieuwe categorie
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-4">
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">
                          Nieuwe categorie
                        </h4>
                        <div className="flex gap-2">
                          <Input
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Categorienaam"
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
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.categories.length > 0 ? (
                  formData.categories.map((category) => (
                    <Badge
                      key={category.id}
                      variant="secondary"
                      className="px-3 py-1 text-sm bg-gray-100"
                    >
                      {category.name}
                      <button
                        className="ml-2 text-gray-500 hover:text-gray-700"
                        onClick={() => handleRemoveCategory(category.id)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Geen categorieën geselecteerd
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === "excerpt" && (
          <div className="border-t border-gray-200 mt-2 pt-4 pb-3">
            <div className="max-w-lg mx-auto">
              <h3 className="text-sm font-medium mb-2">Samenvatting</h3>
              <Textarea
                name="excerpt"
                value={formData.excerpt || ""}
                onChange={handleInputChange}
                placeholder="Voeg een korte samenvatting toe voor in lijstweergaven en SEO..."
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>
        )}

        {activeSection === "seo" && (
          <div className="border-t border-gray-200 mt-2 pt-4 pb-3">
            <div className="max-w-lg mx-auto space-y-4">
              <h3 className="text-sm font-medium">SEO Instellingen</h3>

              <div>
                <Label htmlFor="metaTitle" className="text-xs text-gray-500">
                  Meta Titel
                </Label>
                <Input
                  id="metaTitle"
                  name="metaTitle"
                  value={formData.metaTitle || ""}
                  onChange={handleInputChange}
                  placeholder="SEO titel (laat leeg om de normale titel te gebruiken)"
                  className="mt-1"
                />
              </div>

              <div>
                <Label
                  htmlFor="metaDescription"
                  className="text-xs text-gray-500"
                >
                  Meta Beschrijving
                </Label>
                <Textarea
                  id="metaDescription"
                  name="metaDescription"
                  value={formData.metaDescription || ""}
                  onChange={handleInputChange}
                  placeholder="SEO beschrijving (laat leeg om de samenvatting te gebruiken)"
                  className="mt-1 min-h-[80px] resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="border-t border-gray-200 mt-2 pt-3 pb-1">
            <div className="max-w-lg mx-auto px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Main Editor */}
      <div className="flex-1 overflow-auto bg-[#F7F7F7]">
        <div className="max-w-4xl mx-auto py-12 px-8">
          <NotionStyleEditor
            content={formData.content}
            onChange={handleContentChange}
            placeholder="Begin met schrijven of type / voor opties..."
          />
        </div>
      </div>
    </div>
  );
}
