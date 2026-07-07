import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, FileText, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

type BlogFormData = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string;
  published: boolean;
  readTime: number;
  metaTitle: string;
  metaDescription: string;
};

const emptyForm: BlogFormData = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  coverImage: "",
  category: "",
  tags: "",
  published: false,
  readTime: 5,
  metaTitle: "",
  metaDescription: "",
};

export default function AdminBlogCMS() {
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BlogFormData>(emptyForm);

  const utils = trpc.useUtils();
  const { data: posts, isLoading } = trpc.blog.adminList.useQuery();

  const createPost = trpc.blog.create.useMutation({
    onSuccess: () => {
      toast.success("สร้างบทความสำเร็จ");
      utils.blog.adminList.invalidate();
      closeEditor();
    },
    onError: (err) => toast.error(err.message),
  });

  const updatePost = trpc.blog.update.useMutation({
    onSuccess: () => {
      toast.success("อัพเดตบทความสำเร็จ");
      utils.blog.adminList.invalidate();
      closeEditor();
    },
    onError: (err) => toast.error(err.message),
  });

  const deletePost = trpc.blog.delete.useMutation({
    onSuccess: () => {
      toast.success("ลบบทความสำเร็จ");
      utils.blog.adminList.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const closeEditor = () => {
    setShowEditor(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowEditor(true);
  };

  const openEdit = (post: any) => {
    setForm({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt || "",
      content: post.content || "",
      coverImage: post.coverImage || "",
      category: post.category || "",
      tags: post.tags || "",
      published: post.published,
      readTime: post.readTime || 5,
      metaTitle: post.metaTitle || "",
      metaDescription: post.metaDescription || "",
    });
    setEditingId(post.id);
    setShowEditor(true);
  };

  const handleSubmit = () => {
    if (!form.slug || !form.title) {
      toast.error("กรุณากรอก slug และหัวข้อ");
      return;
    }
    if (editingId) {
      updatePost.mutate({ id: editingId, ...form });
    } else {
      createPost.mutate(form);
    }
  };

  const handleDelete = (id: number, title: string) => {
    if (confirm(`ลบบทความ "${title}" ?`)) {
      deletePost.mutate({ id });
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Blog CMS</h1>
          <p className="text-muted-foreground text-sm mt-1">จัดการบทความและเนื้อหา</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> สร้างบทความ
        </Button>
      </div>

      {/* Post List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">กำลังโหลด...</div>
          ) : !posts || posts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>ยังไม่มีบทความ — คลิก "สร้างบทความ" เพื่อเริ่มต้น</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {posts.map((post) => (
                <div key={post.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{post.title}</span>
                        {post.published ? (
                          <Badge variant="outline" className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30">
                            <Eye className="h-2.5 w-2.5 mr-0.5" /> เผยแพร่
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                            <EyeOff className="h-2.5 w-2.5 mr-0.5" /> แบบร่าง
                          </Badge>
                        )}
                        {post.category && (
                          <Badge variant="outline" className="text-[10px]">{post.category}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {post.excerpt || "ไม่มีคำอธิบาย"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        /{post.slug} · {post.readTime} นาที · {new Date(post.createdAt).toLocaleDateString("th-TH")}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(post)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(post.id, post.title)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blog Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={(open) => { if (!open) closeEditor(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? "แก้ไขบทความ" : "สร้างบทความใหม่"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>หัวข้อ *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm((f) => ({
                      ...f,
                      title,
                      slug: !editingId ? generateSlug(title) : f.slug,
                    }));
                  }}
                  placeholder="หัวข้อบทความ"
                />
              </div>
              <div className="col-span-2">
                <Label>Slug *</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="url-friendly-slug"
                />
              </div>
              <div>
                <Label>หมวดหมู่</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="เช่น Solar, BESS, Investment"
                />
              </div>
              <div>
                <Label>เวลาอ่าน (นาที)</Label>
                <Input
                  type="number"
                  value={form.readTime}
                  onChange={(e) => setForm((f) => ({ ...f, readTime: parseInt(e.target.value) || 5 }))}
                />
              </div>
            </div>

            <div>
              <Label>คำอธิบายย่อ</Label>
              <Textarea
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                placeholder="คำอธิบายสั้นๆ สำหรับหน้ารวมบทความ"
                rows={2}
              />
            </div>

            <div>
              <Label>เนื้อหา (Markdown)</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="เขียนเนื้อหาบทความที่นี่... รองรับ Markdown"
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <Label>รูปปก (URL)</Label>
              <Input
                value={form.coverImage}
                onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
                placeholder="https://cdn.example.com/image.jpg"
              />
            </div>

            <div>
              <Label>Tags (คั่นด้วย comma)</Label>
              <Input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="solar, bess, investment, energy"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Meta Title (SEO)</Label>
                <Input
                  value={form.metaTitle}
                  onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))}
                  placeholder="SEO Title"
                />
              </div>
              <div>
                <Label>Meta Description (SEO)</Label>
                <Input
                  value={form.metaDescription}
                  onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
                  placeholder="SEO Description"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Switch
                checked={form.published}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, published: checked }))}
              />
              <div>
                <p className="text-sm font-medium">{form.published ? "เผยแพร่" : "แบบร่าง"}</p>
                <p className="text-xs text-muted-foreground">
                  {form.published ? "บทความจะแสดงบนหน้าเว็บ" : "บทความจะยังไม่แสดงบนหน้าเว็บ"}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeEditor}>ยกเลิก</Button>
              <Button onClick={handleSubmit} disabled={createPost.isPending || updatePost.isPending}>
                {editingId ? "บันทึก" : "สร้างบทความ"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
