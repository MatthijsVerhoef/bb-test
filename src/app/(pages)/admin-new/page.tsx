"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import {
  Mailbox,
  Plus,
  TextQuote,
  X,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Image,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  MoreHorizontal,
  GripVertical,
  Bold,
  Italic,
  Underline,
  Link,
} from "lucide-react";

// ============= CONTEXTS =============
const BlockContext = createContext();

// ============= UTILS =============
const generateId = () =>
  Date.now().toString() + Math.random().toString(36).substr(2, 9);

const createBlock = (type = "text", content = "", attributes = {}) => ({
  id: generateId(),
  type,
  content,
  attributes,
});

const blockTypeConfig = {
  text: {
    icon: Type,
    label: "Text",
    description: "Just start writing with plain text.",
  },
  h1: {
    icon: Heading1,
    label: "Heading 1",
    description: "Big section heading.",
  },
  h2: {
    icon: Heading2,
    label: "Heading 2",
    description: "Medium section heading.",
  },
  h3: {
    icon: Heading3,
    label: "Heading 3",
    description: "Small section heading.",
  },
  quote: { icon: Quote, label: "Quote", description: "Capture a quote." },
  code: { icon: Code, label: "Code", description: "Capture a code snippet." },
  image: {
    icon: Image,
    label: "Image",
    description: "Upload or embed with a link.",
  },
  divider: {
    icon: Minus,
    label: "Divider",
    description: "Visually divide blocks.",
  },
  bulletList: {
    icon: List,
    label: "Bullet List",
    description: "Create a simple bulleted list.",
  },
  numberedList: {
    icon: ListOrdered,
    label: "Numbered List",
    description: "Create a numbered list.",
  },
};

// ============= COMPONENTS =============

// Command Menu Component
const CommandMenu = ({ position, onSelect, onClose }) => {
  const menuRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const items = Object.entries(blockTypeConfig);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % items.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + items.length) % items.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const [type] = items[selectedIndex];
        onSelect(type);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [items, selectedIndex, onSelect, onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-64 bg-white rounded-lg shadow-lg border"
      style={{ top: position.top + "px", left: position.left + "px" }}
    >
      <div className="p-2 space-y-1">
        {items.map(([type, config], index) => {
          const Icon = config.icon;
          return (
            <button
              key={type}
              onClick={() => onSelect(type)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors ${
                index === selectedIndex ? "bg-gray-100" : "hover:bg-gray-50"
              }`}
            >
              <Icon size={18} />
              <div>
                <div className="font-medium">{config.label}</div>
                <div className="text-xs text-gray-500">
                  {config.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Inline Toolbar Component
const InlineToolbar = ({ position, onFormat }) => {
  if (!position) return null;

  return (
    <div
      className="absolute z-50 bg-gray-900 text-white rounded-lg shadow-lg p-1 flex gap-1"
      style={{ top: position.top - 40 + "px", left: position.left + "px" }}
    >
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          onFormat("bold");
        }}
        className="p-2 hover:bg-gray-700 rounded transition-colors"
      >
        <Bold size={16} />
      </button>
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          onFormat("italic");
        }}
        className="p-2 hover:bg-gray-700 rounded transition-colors"
      >
        <Italic size={16} />
      </button>
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          onFormat("underline");
        }}
        className="p-2 hover:bg-gray-700 rounded transition-colors"
      >
        <Underline size={16} />
      </button>
      <div className="w-px bg-gray-600 mx-1" />
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          onFormat("link");
        }}
        className="p-2 hover:bg-gray-700 rounded transition-colors"
      >
        <Link size={16} />
      </button>
    </div>
  );
};

// Block Component
const ContentBlock = ({ block, index, isSelected, onSelect }) => {
  const { updateBlock, deleteBlock, addBlock, moveBlock, focusBlock, blocks } =
    useContext(BlockContext);

  const contentRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [toolbarPosition, setToolbarPosition] = useState(null);

  useEffect(() => {
    if (focusBlock === block.id && contentRef.current) {
      contentRef.current.focus();
      // Place cursor at end
      const range = document.createRange();
      const sel = window.getSelection();
      if (contentRef.current.childNodes.length > 0) {
        range.selectNodeContents(contentRef.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }, [focusBlock, block.id]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const text = container.textContent || "";
      const offset = range.startOffset;

      // Split content at cursor
      const beforeCursor = text.substring(0, offset);
      const afterCursor = text.substring(offset);

      // Update current block with content before cursor
      updateBlock(block.id, { content: beforeCursor });

      // Add new block with content after cursor
      addBlock(index, afterCursor);
    } else if (
      e.key === "Backspace" &&
      block.content === "" &&
      block.type === "text"
    ) {
      e.preventDefault();
      if (index > 0) {
        deleteBlock(block.id);
      }
    } else if (e.key === "ArrowUp" && index > 0) {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      if (range.startOffset === 0) {
        e.preventDefault();
        onSelect(blocks[index - 1].id);
      }
    } else if (e.key === "ArrowDown" && index < blocks.length - 1) {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const text = contentRef.current.textContent || "";
      if (range.startOffset === text.length) {
        e.preventDefault();
        onSelect(blocks[index + 1].id);
      }
    }
  };

  const handleInput = () => {
    const content = contentRef.current.textContent || "";
    updateBlock(block.id, { content });
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setToolbarPosition({
        top: rect.top + window.scrollY,
        left: rect.left + rect.width / 2 - 100,
      });
    } else {
      setToolbarPosition(null);
    }
  };

  const handleFormat = (format) => {
    document.execCommand(format, false, null);
    contentRef.current.focus();
  };

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("blockId", block.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("blockId");
    if (draggedId !== block.id) {
      moveBlock(draggedId, index);
    }
  };

  const renderContent = () => {
    const commonProps = {
      ref: contentRef,
      contentEditable: block.type !== "divider" && block.type !== "image",
      suppressContentEditableWarning: true,
      onKeyDown: handleKeyDown,
      onInput: handleInput,
      onMouseUp: handleTextSelection,
      onKeyUp: handleTextSelection,
      onFocus: () => setShowPlaceholder(false),
      onBlur: () => {
        setShowPlaceholder(true);
        setToolbarPosition(null);
      },
      dangerouslySetInnerHTML:
        block.type !== "divider" && block.type !== "image"
          ? { __html: block.content || "" }
          : undefined,
      className: "outline-none w-full",
    };

    switch (block.type) {
      case "title":
        return (
          <h1
            {...commonProps}
            className="text-4xl font-bold outline-none w-full"
          />
        );
      case "h1":
        return (
          <h1
            {...commonProps}
            className="text-3xl font-bold outline-none w-full"
          />
        );
      case "h2":
        return (
          <h2
            {...commonProps}
            className="text-2xl font-semibold outline-none w-full"
          />
        );
      case "h3":
        return (
          <h3
            {...commonProps}
            className="text-xl font-medium outline-none w-full"
          />
        );
      case "quote":
        return (
          <blockquote
            {...commonProps}
            className="border-l-4 border-gray-300 pl-4 italic text-gray-600 outline-none w-full"
          />
        );
      case "code":
        return (
          <pre
            {...commonProps}
            className="bg-gray-100 p-3 rounded font-mono text-sm outline-none w-full overflow-x-auto whitespace-pre-wrap"
          />
        );
      case "bulletList":
        return (
          <ul
            {...commonProps}
            className="list-disc list-inside outline-none w-full"
          />
        );
      case "numberedList":
        return (
          <ol
            {...commonProps}
            className="list-decimal list-inside outline-none w-full"
          />
        );
      case "divider":
        return <hr className="my-4 border-gray-300" />;
      case "image":
        if (!block.content) {
          return (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Image className="mx-auto text-gray-400 mb-2" size={32} />
              <input
                type="text"
                placeholder="Paste image URL..."
                className="w-full text-center outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    updateBlock(block.id, { content: e.target.value });
                  }
                }}
              />
            </div>
          );
        }
        return (
          <img
            src={block.content}
            alt="Content"
            className="max-w-full h-auto rounded-lg"
          />
        );
      default:
        return <div {...commonProps} />;
    }
  };

  const getPlaceholder = () => {
    switch (block.type) {
      case "title":
        return "Untitled";
      case "h1":
        return "Heading 1";
      case "h2":
        return "Heading 2";
      case "h3":
        return "Heading 3";
      case "quote":
        return "Quote";
      case "code":
        return "Code snippet";
      case "bulletList":
        return "List item";
      case "numberedList":
        return "List item";
      default:
        return "Type '/' for commands";
    }
  };

  return (
    <>
      <div
        className={`relative group ${isDragging ? "opacity-50" : ""} ${
          isSelected ? "bg-white" : ""
        }`}
        onClick={() => onSelect(block.id)}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex items-start">
          {/* Drag handle */}
          <div
            className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <GripVertical size={20} className="text-gray-400" />
          </div>

          {/* Content */}
          <div className="flex-1 relative">
            {block.type === "divider" ? (
              renderContent()
            ) : (
              <div className="relative">
                {renderContent()}
                {showPlaceholder &&
                  !block.content &&
                  block.type !== "image" && (
                    <div className="absolute top-0 left-0 text-gray-400 pointer-events-none">
                      {getPlaceholder()}
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="absolute -right-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteBlock(block.id);
              }}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
      <InlineToolbar position={toolbarPosition} onFormat={handleFormat} />
    </>
  );
};

// Editor Component
const NotionEditor = ({ initialBlocks = [], onChange }) => {
  const [blocks, setBlocks] = useState(() =>
    initialBlocks.length > 0
      ? initialBlocks
      : [createBlock("title", ""), createBlock("text", "")]
  );
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [focusBlockId, setFocusBlockId] = useState(null);
  const [commandMenu, setCommandMenu] = useState(null);

  useEffect(() => {
    onChange?.(blocks);
  }, [blocks, onChange]);

  const updateBlock = useCallback((blockId, updates) => {
    setBlocks((prevBlocks) =>
      prevBlocks.map((block) =>
        block.id === blockId ? { ...block, ...updates } : block
      )
    );
  }, []);

  const addBlock = useCallback((afterIndex, content = "") => {
    const newBlock = createBlock("text", content);
    setBlocks((prevBlocks) => {
      const newBlocks = [...prevBlocks];
      newBlocks.splice(afterIndex + 1, 0, newBlock);
      return newBlocks;
    });
    setFocusBlockId(newBlock.id);
  }, []);

  const deleteBlock = useCallback((blockId) => {
    setBlocks((prevBlocks) => {
      if (prevBlocks.length <= 2) return prevBlocks; // Keep at least title and one block
      const index = prevBlocks.findIndex((b) => b.id === blockId);
      if (index > 0) {
        setFocusBlockId(prevBlocks[index - 1].id);
      }
      return prevBlocks.filter((block) => block.id !== blockId);
    });
  }, []);

  const moveBlock = useCallback((draggedId, targetIndex) => {
    setBlocks((prevBlocks) => {
      const draggedIndex = prevBlocks.findIndex((b) => b.id === draggedId);
      if (draggedIndex === -1) return prevBlocks;

      const newBlocks = [...prevBlocks];
      const [draggedBlock] = newBlocks.splice(draggedIndex, 1);

      // Adjust target index if dragging from above
      const adjustedIndex =
        draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
      newBlocks.splice(adjustedIndex, 0, draggedBlock);

      return newBlocks;
    });
  }, []);

  const handleSlashCommand = useCallback(
    (e) => {
      if (e.key === "/" && e.target.textContent === "") {
        e.preventDefault();
        const rect = e.target.getBoundingClientRect();
        setCommandMenu({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          blockId: selectedBlockId,
        });
      }
    },
    [selectedBlockId]
  );

  const handleCommandSelect = useCallback(
    (type) => {
      if (commandMenu?.blockId) {
        updateBlock(commandMenu.blockId, { type, content: "" });
      }
      setCommandMenu(null);
    },
    [commandMenu, updateBlock]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "/" && document.activeElement.contentEditable === "true") {
        const content = document.activeElement.textContent;
        if (content === "") {
          handleSlashCommand(e);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSlashCommand]);

  const contextValue = {
    blocks,
    updateBlock,
    addBlock,
    deleteBlock,
    moveBlock,
    focusBlock: focusBlockId,
  };

  return (
    <BlockContext.Provider value={contextValue}>
      <div className="max-w-3xl mx-auto">
        {blocks.map((block, index) => (
          <div key={block.id} className="mb-2">
            <ContentBlock
              block={block}
              index={index}
              isSelected={selectedBlockId === block.id}
              onSelect={setSelectedBlockId}
            />
          </div>
        ))}

        {commandMenu && (
          <CommandMenu
            position={commandMenu}
            onSelect={handleCommandSelect}
            onClose={() => setCommandMenu(null)}
          />
        )}
      </div>
    </BlockContext.Provider>
  );
};

// ============= MAIN COMPONENTS =============

// Blog List Component
const BlogsList = ({ onEditBlog, onAddBlog, refreshTrigger }) => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchBlogs();
  }, [page, refreshTrigger]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/blogs?page=${page}&limit=10`);
      const data = await response.json();
      setBlogs(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading blogs...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">All Blogs</h3>
        <button
          onClick={onAddBlog}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Add New Blog
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3">
          {blogs.map((blog) => (
            <div
              key={blog.id}
              onClick={() => onEditBlog(blog)}
              className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start gap-4">
                {blog.coverImage && (
                  <img
                    src={blog.coverImage}
                    alt={blog.title}
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{blog.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {blog.excerpt}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(
                        blog.publishedAt || blog.createdAt
                      ).toLocaleDateString()}
                    </span>
                    {blog.categories?.map((cat) => (
                      <span
                        key={cat.id}
                        className="text-xs bg-gray-200 px-2 py-1 rounded"
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4 pt-4 border-t">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// Blog Editor Wrapper
const NotionBlogEditor = ({ blog, onClose, onSave }) => {
  const [blocks, setBlocks] = useState([]);
  const [slug, setSlug] = useState(blog?.slug || "");
  const [excerpt, setExcerpt] = useState(blog?.excerpt || "");
  const [coverImage, setCoverImage] = useState(blog?.coverImage || "");
  const [published, setPublished] = useState(blog?.published || false);
  const [saving, setSaving] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

  // Parse existing content into blocks
  useEffect(() => {
    if (blog?.content) {
      // This is a simplified parser - you'd need a more sophisticated one for production
      const titleBlock = createBlock("title", blog.title);
      const contentBlock = createBlock("text", blog.content);
      setBlocks([titleBlock, contentBlock]);
    }
  }, [blog]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!blog && blocks.length > 0) {
      const titleBlock = blocks.find((b) => b.type === "title");
      if (titleBlock?.content) {
        const generatedSlug = titleBlock.content
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        setSlug(generatedSlug);
      }
    }
  }, [blocks, blog]);

  const handleSave = async () => {
    setSaving(true);
    const titleBlock = blocks.find((b) => b.type === "title");
    const contentBlocks = blocks.filter((b) => b.type !== "title");

    // Convert blocks to HTML content
    const contentHtml = contentBlocks
      .map((block) => {
        switch (block.type) {
          case "h1":
            return `<h1>${block.content}</h1>`;
          case "h2":
            return `<h2>${block.content}</h2>`;
          case "h3":
            return `<h3>${block.content}</h3>`;
          case "quote":
            return `<blockquote>${block.content}</blockquote>`;
          case "code":
            return `<pre><code>${block.content}</code></pre>`;
          case "image":
            return `<img src="${block.content}" alt="" />`;
          case "divider":
            return "<hr />";
          case "bulletList":
            return `<ul><li>${block.content}</li></ul>`;
          case "numberedList":
            return `<ol><li>${block.content}</li></ol>`;
          default:
            return `<p>${block.content}</p>`;
        }
      })
      .join("\n");

    const blogData = {
      title: titleBlock?.content || "Untitled",
      slug,
      excerpt,
      content: contentHtml,
      coverImage,
      published,
      publishedAt: published ? new Date().toISOString() : null,
      authorName: "Admin",
    };

    try {
      const url = blog?.id ? `/api/blogs/${blog.id}` : "/api/blogs";
      const method = blog?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blogData),
      });

      if (response.ok) {
        onSave(await response.json());
      }
    } catch (error) {
      console.error("Error saving blog:", error);
      alert("Error saving blog. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="absolute border rounded-tl-xl bg-white bottom-0 right-0 w-[58vw] z-20 h-[94vh] transition-all duration-300 ease-out">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">
              {blog ? "Edit Blog" : "New Blog"}
            </h2>
            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {showMetadata ? "Hide" : "Show"} metadata
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={
                saving || !blocks.find((b) => b.type === "title")?.content
              }
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : blog ? "Update" : "Publish"}
            </button>
          </div>
        </div>

        {/* Metadata section */}
        {showMetadata && (
          <div className="px-16 py-4 bg-gray-50 border-b space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="blog-post-url"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Cover Image URL
                </label>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Excerpt
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={2}
                placeholder="Brief description..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="published" className="text-sm text-gray-700">
                Publish immediately
              </label>
            </div>
          </div>
        )}

        {/* Cover image preview */}
        {coverImage && (
          <div className="px-16 py-4">
            <img
              src={coverImage}
              alt="Cover"
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Editor content */}
        <div className="flex-1 overflow-y-auto px-16 py-8">
          <NotionEditor initialBlocks={blocks} onChange={setBlocks} />
        </div>
      </div>
    </div>
  );
};

// Canvas Component
const CanvasBoard = ({ cards, onCardUpdate, onCardDelete, onCardClick }) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [draggedCard, setDraggedCard] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  const getIcon = (iconName) => {
    const icons = {
      TextQuote: <TextQuote size={17} />,
      Mailbox: <Mailbox size={18} />,
    };
    return icons[iconName] || null;
  };

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      const newScale = Math.min(Math.max(0.1, scale + delta), 5);

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const scaleRatio = newScale / scale;
      const newOffset = {
        x: x - (x - offset.x) * scaleRatio,
        y: y - (y - offset.y) * scaleRatio,
      };

      setScale(newScale);
      setOffset(newOffset);
    },
    [scale, offset]
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (e.target.closest(".draggable-card")) return;
      setIsPanning(true);
      setStartPan({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    },
    [offset]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (isPanning) {
        setOffset({
          x: e.clientX - startPan.x,
          y: e.clientY - startPan.y,
        });
      }

      if (draggedCard) {
        const newX = (e.clientX - offset.x - dragStart.x) / scale;
        const newY = (e.clientY - offset.y - dragStart.y) / scale;
        onCardUpdate(draggedCard.id, { position: { x: newX, y: newY } });
      }
    },
    [isPanning, startPan, draggedCard, dragStart, offset, scale, onCardUpdate]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggedCard(null);
  }, []);

  const handleCardMouseDown = useCallback((e, card) => {
    e.stopPropagation();
    setDraggedCard(card);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #B1BECE 1px, transparent 1px)`,
          backgroundSize: `${20 * scale}px ${20 * scale}px`,
          backgroundPosition: `${offset.x}px ${offset.y}px`,
          opacity: 0.5,
        }}
      />

      <div
        className="absolute"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => onCardClick(card)}
            className="draggable-card absolute bg-white rounded-lg p-6 cursor-move select-none border transition-shadow hover:shadow-lg"
            style={{
              left: `${card.position.x}px`,
              top: `${card.position.y}px`,
              width: "250px",
            }}
            onMouseDown={(e) => handleCardMouseDown(e, card)}
          >
            {card.editable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCardDelete(card.id);
                }}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            )}
            <div className="flex items-center mb-2">
              {card.icon && getIcon(card.icon)}
              <h3
                className="text-base ms-2 font-medium cursor-text"
                contentEditable={card.editable}
                suppressContentEditableWarning
                onBlur={(e) =>
                  onCardUpdate(card.id, { title: e.target.textContent })
                }
                onMouseDown={(e) => e.stopPropagation()}
              >
                {card.title}
              </h3>
            </div>
            <div className="flex items-start">
              <p
                className="text-gray-600 text-sm cursor-text"
                contentEditable={card.editable}
                suppressContentEditableWarning
                onBlur={(e) =>
                  onCardUpdate(card.id, { content: e.target.textContent })
                }
                onMouseDown={(e) => e.stopPropagation()}
              >
                {card.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Admin Page Component
export default function NewAdminPage() {
  const [activeContent, setActiveContent] = useState(null);
  const [editingBlog, setEditingBlog] = useState(null);
  const [showBlogEditor, setShowBlogEditor] = useState(false);
  const [refreshBlogs, setRefreshBlogs] = useState(0);
  const [cards, setCards] = useState(() => {
    const savedCards = localStorage.getItem("adminCards");
    if (savedCards) {
      try {
        return JSON.parse(savedCards);
      } catch (e) {
        console.error("Error parsing saved cards:", e);
      }
    }

    return [
      {
        id: 1,
        icon: "TextQuote",
        position: { x: 100, y: 100 },
        title: "Blogs",
        content: "Beheer alle blogberichten op BuurBak",
        color: "blue",
        contentType: "blogs",
        editable: false,
      },
      {
        id: 2,
        icon: "Mailbox",
        position: { x: 400, y: 200 },
        title: "Nieuwsbrief",
        content: "Nieuwe nieuwsbrief aanmaken",
        color: "green",
        contentType: "newsletter",
        editable: false,
      },
    ];
  });
  const [nextCardId, setNextCardId] = useState(() => {
    const savedCards = localStorage.getItem("adminCards");
    if (savedCards) {
      try {
        const parsed = JSON.parse(savedCards);
        const maxId = Math.max(...parsed.map((card) => card.id), 0);
        return maxId + 1;
      } catch (e) {
        return 3;
      }
    }
    return 3;
  });

  useEffect(() => {
    localStorage.setItem("adminCards", JSON.stringify(cards));
  }, [cards]);

  const addCard = useCallback(() => {
    const viewCenterX = window.innerWidth / 2 - 125;
    const viewCenterY = window.innerHeight / 2 - 75;

    const colors = ["blue", "green", "purple", "red", "yellow", "indigo"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newCard = {
      id: nextCardId,
      position: { x: viewCenterX, y: viewCenterY },
      title: `Card ${nextCardId}`,
      content: `This is card number ${nextCardId}. Edit me!`,
      color: randomColor,
      editable: true,
    };

    setCards([...cards, newCard]);
    setNextCardId(nextCardId + 1);
  }, [cards, nextCardId]);

  const deleteCard = useCallback(
    (cardId) => {
      setCards(cards.filter((card) => card.id !== cardId));
    },
    [cards]
  );

  const updateCard = useCallback((cardId, updates) => {
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === cardId ? { ...card, ...updates } : card
      )
    );
  }, []);

  const handleCardClick = useCallback((card) => {
    setActiveContent(card.contentType || null);
  }, []);

  return (
    <div className="w-full h-screen overflow-hidden bg-gray-100 relative">
      <div className="absolute top-8 left-8 z-10">
        <button
          onClick={addCard}
          className="flex items-center justify-center gap-2 bg-white border size-10 rounded-lg transition-colors hover:bg-gray-50"
        >
          <Plus size={18} />
        </button>
      </div>

      <CanvasBoard
        cards={cards}
        onCardUpdate={updateCard}
        onCardDelete={deleteCard}
        onCardClick={handleCardClick}
      />

      <div
        className={`absolute border rounded-tl-xl bg-white bottom-0 right-0 w-[60vw] z-10 h-[90vh] transition-all duration-300 ease-out ${
          activeContent
            ? "translate-x-0 translate-y-0 opacity-100"
            : "translate-x-full translate-y-0 opacity-0"
        }`}
      >
        {activeContent && (
          <div className="p-14 h-full flex flex-col">
            <div className="flex flex-col justify-between items-start mb-4">
              <h2 className="text-xl font-semibold capitalize">
                {activeContent}
              </h2>
              <div className="text-gray-600">
                {activeContent === "blogs" && (
                  <p>
                    Hier kun je alle blogberichten beheren, bewerken en nieuwe
                    aanmaken.
                  </p>
                )}
                {activeContent === "newsletter" && (
                  <p>Maak en verstuur nieuwsbrieven naar je abonnees.</p>
                )}
                {!["blogs", "newsletter"].includes(activeContent) && (
                  <p>Content voor {activeContent}</p>
                )}
              </div>
              <button
                onClick={() => setActiveContent(null)}
                className="text-gray-400 absolute top-10 right-8 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              {activeContent === "blogs" && !showBlogEditor && (
                <BlogsList
                  refreshTrigger={refreshBlogs}
                  onEditBlog={(blog) => {
                    setEditingBlog(blog);
                    setShowBlogEditor(true);
                  }}
                  onAddBlog={() => {
                    setEditingBlog(null);
                    setShowBlogEditor(true);
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {showBlogEditor && (
        <NotionBlogEditor
          blog={editingBlog}
          onClose={() => {
            setShowBlogEditor(false);
            setEditingBlog(null);
          }}
          onSave={async (savedBlog) => {
            setShowBlogEditor(false);
            setEditingBlog(null);
            setRefreshBlogs((prev) => prev + 1);
          }}
        />
      )}
    </div>
  );
}
