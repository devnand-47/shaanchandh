import { Link, useParams } from "wouter";
import { MapPin, Users, Calendar, MessageSquare, Bookmark, BookmarkCheck, ArrowLeft, BadgeCheck } from "lucide-react";
import { useGetProject, useApplyToProject, useBookmarkProject, getGetProjectQueryKey, useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function ProjectDetails() {
  const { id } = useParams();
  const projectId = parseInt(id ?? "0", 10);
  const [applyMessage, setApplyMessage] = useState("");
  const [showApplyForm, setShowApplyForm] = useState(false);

  const { data: project, isLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) },
  });
  const { data: me } = useGetMe();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const apply = useApplyToProject();
  const bookmark = useBookmarkProject();

  const handleApply = () => {
    if (!applyMessage.trim()) return;
    apply.mutate({ params: { projectId }, data: { message: applyMessage } } as any, {
      onSuccess: () => {
        toast({ title: "Application submitted!" });
        setApplyMessage("");
        setShowApplyForm(false);
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
      },
    });
  };

  const handleBookmark = () => {
    bookmark.mutate({ params: { projectId } } as any, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
        toast({ title: project?.isBookmarked ? "Removed from bookmarks" : "Bookmarked" });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="h-32 bg-muted rounded" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-muted-foreground">
        <p>Project not found.</p>
        <Link href="/projects"><Button className="mt-4" variant="outline">Back to Projects</Button></Link>
      </div>
    );
  }

  const isOwner = me?.id === project.posterUserId;

  const statusColor = {
    open: "text-green-400 bg-green-400/10 border-green-400/20",
    closed: "text-red-400 bg-red-400/10 border-red-400/20",
    "in-progress": "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  }[project.status] ?? "text-muted-foreground bg-muted border-border";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link href="/projects">
        <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Button>
      </Link>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-2">{project.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColor}`}>
                {project.status}
              </span>
              {project.isRemote && (
                <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">Remote OK</span>
              )}
            </div>
          </div>
          <button onClick={handleBookmark} className="text-muted-foreground hover:text-primary transition-colors p-2">
            {project.isBookmarked ? <BookmarkCheck className="w-6 h-6 text-primary" /> : <Bookmark className="w-6 h-6" />}
          </button>
        </div>

        <p className="text-muted-foreground leading-relaxed mb-6">{project.description}</p>

        {/* Required Roles */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-2">Looking for</h3>
          <div className="flex flex-wrap gap-2">
            {project.requiredRoles.map((role) => (
              <span key={role} className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 font-medium">
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
          {project.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {project.location}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {project.applicationCount} application{project.applicationCount !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {new Date(project.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Poster */}
        <Link href={`/profile/${project.posterUserId}`}>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer mb-6">
            {project.posterAvatarUrl ? (
              <img src={project.posterAvatarUrl} alt={project.posterName} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {project.posterName.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-semibold text-sm text-foreground">{project.posterName}</p>
              <p className="text-xs text-muted-foreground">{project.posterRole}</p>
            </div>
          </div>
        </Link>

        {/* Actions */}
        {!isOwner && project.status === "open" && (
          <div className="space-y-3">
            {showApplyForm ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="Tell them why you're perfect for this project..."
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  rows={4}
                  className="bg-background border-border"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={handleApply}
                    disabled={!applyMessage.trim() || apply.isPending}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1"
                  >
                    {apply.isPending ? "Sending..." : "Submit Application"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowApplyForm(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button onClick={() => setShowApplyForm(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1">
                  Apply Now
                </Button>
                <Link href={`/chat/${project.posterUserId}`}>
                  <Button variant="outline" className="gap-2">
                    <MessageSquare className="w-4 h-4" /> Message
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
