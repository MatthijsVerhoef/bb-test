"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useEditor,
  EditorContent,
  BubbleMenu,
  FloatingMenu,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Link from "@tiptap/extension-link";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  Minus,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NotionStyleEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function NotionStyleEditor({
  content,
  onChange,
  placeholder = 'Begin met schrijven of type "/" voor commando\'s',
}: NotionStyleEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [showImagePopover, setShowImagePopover] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      Typography,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class:
            "text-blue-600 underline underline-offset-2 hover:text-blue-800 cursor-pointer",
        },
      }),
      CharacterCount,
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-gray max-w-none focus:outline-none min-h-[500px] px-8 py-6",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || editor.getHTML() === content) return;
    editor.commands.setContent(content);
  }, [editor, content]);

  const setLink = useCallback(() => {
    if (!editor || !linkUrl) return;

    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
    }

    setLinkUrl("");
    setShowLinkPopover(false);
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl("");
    setShowImagePopover(false);
  }, [editor, imageUrl]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (!editor) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8 min-h-[500px] flex items-center justify-center">
        <div className="text-gray-400">Editor wordt geladen...</div>
      </div>
    );
  }

  const MenuButton = ({
    isActive = false,
    onClick,
    children,
    className,
  }: any) => (
    <button
      onClick={onClick}
      className={cn(
        "p-2 rounded-lg hover:bg-gray-100 transition-colors",
        isActive && "bg-gray-100 text-gray-900",
        !isActive && "text-gray-600",
        className
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 relative">
      {/* Bubble Menu */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 100, placement: "top" }}
        className="bg-white shadow-lg rounded-lg border border-gray-200 p-1 flex items-center gap-0.5"
      >
        <MenuButton
          isActive={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          isActive={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          isActive={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="h-4 w-4" />
        </MenuButton>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <Popover open={showLinkPopover} onOpenChange={setShowLinkPopover}>
          <PopoverTrigger asChild>
            <MenuButton isActive={editor.isActive("link")}>
              <LinkIcon className="h-4 w-4" />
            </MenuButton>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3">
            <div className="space-y-3">
              <div>
                <Label htmlFor="link-url" className="text-sm font-medium">
                  Link URL
                </Label>
                <Input
                  id="link-url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="mt-1.5"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setLink();
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={setLink} className="flex-1">
                  Toepassen
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    editor.chain().focus().unsetLink().run();
                    setShowLinkPopover(false);
                  }}
                >
                  Verwijderen
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <MenuButton
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
        >
          <Minus className="h-4 w-4" />
        </MenuButton>
      </BubbleMenu>

      {/* Floating Menu */}
      <FloatingMenu
        editor={editor}
        tippyOptions={{
          duration: 100,
          placement: "left-start",
          offset: [0, 15],
        }}
        className="flex items-center gap-1"
      >
        <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-1 flex items-center">
          <MenuButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1 className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3 className="h-4 w-4" />
          </MenuButton>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="h-4 w-4" />
          </MenuButton>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <Popover open={showImagePopover} onOpenChange={setShowImagePopover}>
            <PopoverTrigger asChild>
              <MenuButton>
                <ImageIcon className="h-4 w-4" />
              </MenuButton>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" side="right" align="start">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Afbeelding toevoegen</h4>

                <div>
                  <Label htmlFor="image-upload" className="text-sm">
                    Upload bestand
                  </Label>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="mt-1.5"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Of</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="image-url" className="text-sm">
                    Afbeelding URL
                  </Label>
                  <Input
                    id="image-url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="mt-1.5"
                  />
                </div>

                <Button
                  size="sm"
                  onClick={addImage}
                  disabled={!imageUrl}
                  className="w-full"
                >
                  Afbeelding invoegen
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <button className="p-2 text-gray-400 hover:text-gray-600">
          <Plus className="h-5 w-5" />
        </button>
      </FloatingMenu>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Bottom Toolbar */}
      <div className="border-t border-gray-100 px-8 py-3 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {editor.storage.characterCount && (
            <>
              <span>{editor.storage.characterCount.characters()} tekens</span>
              <span>·</span>
              <span>{editor.storage.characterCount.words()} woorden</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="text-xs h-7 px-2"
          >
            Ongedaan maken
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="text-xs h-7 px-2"
          >
            Opnieuw
          </Button>
        </div>
      </div>

      <style jsx global>{`
        .ProseMirror {
          outline: none;
        }

        .ProseMirror > * + * {
          margin-top: 0.75em;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }

        .ProseMirror h1 {
          font-size: 2em;
          font-weight: 700;
          margin-top: 1em;
          margin-bottom: 0.5em;
          line-height: 1.2;
        }

        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin-top: 1em;
          margin-bottom: 0.5em;
          line-height: 1.3;
        }

        .ProseMirror h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin-top: 1em;
          margin-bottom: 0.5em;
          line-height: 1.4;
        }

        .ProseMirror blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 1rem;
          font-style: italic;
          color: #6b7280;
        }

        .ProseMirror code {
          background-color: #f3f4f6;
          border-radius: 0.25rem;
          padding: 0.125rem 0.25rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            monospace;
          font-size: 0.875em;
        }

        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
        }

        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
}
