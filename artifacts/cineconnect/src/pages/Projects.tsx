import { useState } from "react";
import { Link } from "wouter";
import { Search, MapPin, Bookmark, BookmarkCheck, Users, Plus, Briefcase } from "lucide-react";
import { useListProjects, useBookmarkProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import type { Project } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const ROLES = ["Actor", "Director", "Cameraman", "Editor", "Music", "Writer", "Producer", "Other"];

function ProjectCard({ project }: { project: Project }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const bookmark = useBookmarkProject();

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    bookmark.mutate({ params: { projectId: project.id } } as any, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        toast({ title: project.isBookmarked ? "Removed from bookmarks" : "Bookmarked" });
      },
    });
  };

  const statusColor = {
    open: "text-green-400 bg-green-400/10",
    closed: "text-red-400 bg-red-400/10",
    "in-progress": "text-yellow-400 bg-yellow-400/10",
  }[project.status] ?? "text-muted-foreground bg-muted";

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all cursor-pointer group">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">{project.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
                {project.status}
              </span>
              {project.isRemote && (
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Remote</span>
              )}
            </div>
          </div>
          <button
            onClick={handleBookmark}
            className="text-muted-foreground hover:text-primary transition-colors p-1 flex-shrink-0"
          >
            {project.isBookmarked ? (
              <BookmarkCheck className="w-5 h-5 text-primary" />
            ) : (
              <Bookmark className="w-5 h-5" />
            )}
          </button>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{project.description}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {project.requiredRoles.map((role) => (
            <span key={role} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
              {role}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {project.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {project.location}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {project.applicationCount} applied
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {project.posterAvatarUrl ? (
              <img src={project.posterAvatarUrl} alt={project.posterName} className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                {project.posterName.charAt(0)}
              </div>
            )}
            <span>{project.posterName}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Projects() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [page, setPage] = useState(1);

  const params = {
    search: search || undefined,
    role: role || undefined,
    location: location || undefined,
    page,
    limit: 12,
  };

  const { data, isLoading } = useListProjects(params);
  const projects = data?.projects ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Film Projects</h1>
        <Link href="/projects/new">
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Plus className="w-4 h-4" /> Post Project
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Select value={role} onValueChange={(v) => { setRole(v === "_all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40 bg-card border-border">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Roles</SelectItem>
            {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Location..."
            value={location}
            onChange={(e) => { setLocation(e.target.value); setPage(1); }}
            className="pl-9 w-full sm:w-44 bg-card border-border"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Loading..." : `${total} project${total !== 1 ? "s" : ""} found`}
        </p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse h-48" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No projects found</p>
          <p className="text-sm mt-1">Be the first to post a project!</p>
          <Link href="/projects/new">
            <Button className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Plus className="w-4 h-4" /> Post Project
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      {total > 12 && (
        <div className="flex justify-center gap-3 mt-8">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-muted-foreground">Page {page} of {Math.ceil(total / 12)}</span>
          <Button variant="outline" disabled={page >= Math.ceil(total / 12)} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
