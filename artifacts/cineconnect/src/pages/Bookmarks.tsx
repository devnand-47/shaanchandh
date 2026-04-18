import { Link } from "wouter";
import { Bookmark, BookmarkCheck, MapPin, Users } from "lucide-react";
import { useGetMyBookmarks, useBookmarkProject, getGetMyBookmarksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

function BookmarkedProjectCard({ project }: { project: Project }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const bookmark = useBookmarkProject();

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    bookmark.mutate({ params: { projectId: project.id } } as any, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyBookmarksQueryKey() });
        toast({ title: "Removed from bookmarks" });
      },
    });
  };

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all cursor-pointer group">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">{project.title}</h3>
          <button onClick={handleRemove} className="text-primary hover:text-muted-foreground transition-colors p-1 flex-shrink-0">
            <BookmarkCheck className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {project.requiredRoles.map((role) => (
            <span key={role} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
              {role}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {project.location && (
            <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{project.location}</div>
          )}
          <div className="flex items-center gap-1"><Users className="w-3 h-3" />{project.applicationCount} applied</div>
        </div>
      </div>
    </Link>
  );
}

export default function Bookmarks() {
  const { data: projects, isLoading } = useGetMyBookmarks();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-foreground mb-6">Saved Projects</h1>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse h-40" />
          ))}
        </div>
      ) : !projects || projects.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No saved projects</p>
          <p className="text-sm mt-1">Bookmark projects to find them here later</p>
          <Link href="/projects">
            <Button className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">Browse Projects</Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {projects.map((p) => <BookmarkedProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </div>
  );
}
