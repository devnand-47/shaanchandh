import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, X, Plus } from "lucide-react";
import { useCreateProject, getListProjectsQueryKey, getGetMyProjectsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const ROLES = ["Actor", "Director", "Cameraman", "Editor", "Music", "Writer", "Producer", "Other"];

export default function CreateProject() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const create = useCreateProject();

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || selectedRoles.length === 0) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    create.mutate(
      {
        data: {
          title: title.trim(),
          description: description.trim(),
          requiredRoles: selectedRoles,
          location: location.trim() || undefined,
          isRemote,
        },
      } as any,
      {
        onSuccess: (project: any) => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetMyProjectsQueryKey() });
          toast({ title: "Project posted!" });
          navigate(`/projects/${project.id}`);
        },
        onError: () => {
          toast({ title: "Failed to create project", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/projects")}
        className="mb-4 text-muted-foreground gap-2"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h1 className="text-xl font-bold text-foreground mb-6">Post a Film Project</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-foreground mb-1.5 block">
              Project Title *
            </Label>
            <Input
              id="title"
              placeholder="e.g. Looking for Lead Actor for Short Film"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-background border-border"
              required
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium text-foreground mb-1.5 block">
              Description *
            </Label>
            <Textarea
              id="description"
              placeholder="Describe your project, what you're looking for, timeline, compensation, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="bg-background border-border resize-none"
              required
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">
              Roles Needed *
            </Label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    selectedRoles.includes(role)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            {selectedRoles.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">Selected: {selectedRoles.join(", ")}</p>
            )}
          </div>

          <div>
            <Label htmlFor="location" className="text-sm font-medium text-foreground mb-1.5 block">
              Location
            </Label>
            <Input
              id="location"
              placeholder="e.g. Kochi, Kerala"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-background border-border"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
            <div>
              <p className="text-sm font-medium text-foreground">Remote Work</p>
              <p className="text-xs text-muted-foreground">Can this be done remotely?</p>
            </div>
            <Switch checked={isRemote} onCheckedChange={setIsRemote} />
          </div>

          <Button
            type="submit"
            disabled={create.isPending || !title.trim() || !description.trim() || selectedRoles.length === 0}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {create.isPending ? "Posting..." : "Post Project"}
          </Button>
        </form>
      </div>
    </div>
  );
}
