import { useState, useEffect } from "react";
import { useGetMe, useUpdateMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { X, Plus, LogOut } from "lucide-react";
import { useClerk } from "@clerk/react";
import { useLocation } from "wouter";

const ROLES = ["Actor", "Director", "Cameraman", "Editor", "Music", "Writer", "Producer", "Other"];

export default function MyProfile() {
  const { data: me, isLoading } = useGetMe();
  const update = useUpdateMe();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { signOut } = useClerk();
  const [, navigate] = useLocation();

  const [name, setName] = useState("");
  const [role, setRole] = useState("Other");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (me) {
      setName(me.name ?? "");
      setRole(me.role ?? "Other");
      setBio(me.bio ?? "");
      setLocation(me.location ?? "");
      setSkills(me.skills ?? []);
      setPortfolioUrl(me.portfolioUrl ?? "");
      setAvatarUrl(me.avatarUrl ?? "");
    }
  }, [me]);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills((prev) => [...prev, s]);
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => setSkills((prev) => prev.filter((s) => s !== skill));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(
      {
        data: {
          name: name.trim(),
          role,
          bio: bio.trim() || undefined,
          location: location.trim() || undefined,
          skills,
          portfolioUrl: portfolioUrl.trim() || undefined,
          avatarUrl: avatarUrl.trim() || undefined,
        },
      } as any,
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({ title: "Profile updated!" });
        },
        onError: () => {
          toast({ title: "Failed to update profile", variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-32 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-foreground mb-6">Edit Profile</h1>

      <div className="bg-card border border-border rounded-2xl p-6">
        {/* Avatar preview */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/30 flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-3xl font-bold">
                {name.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium text-foreground mb-1.5 block">Profile Photo URL</Label>
            <Input
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="bg-background border-border text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">Paste an image URL or a link to your photo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-foreground mb-1.5 block">Full Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background border-border"
              required
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-foreground mb-1.5 block">Role *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="bio" className="text-sm font-medium text-foreground mb-1.5 block">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell people about your experience and what you're passionate about..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="bg-background border-border resize-none"
            />
          </div>

          <div>
            <Label htmlFor="location" className="text-sm font-medium text-foreground mb-1.5 block">Location</Label>
            <Input
              id="location"
              placeholder="e.g. Kochi, Kerala"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-background border-border"
            />
          </div>

          {/* Skills */}
          <div>
            <Label className="text-sm font-medium text-foreground mb-1.5 block">Skills</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add a skill..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                className="bg-background border-border flex-1"
              />
              <Button type="button" onClick={addSkill} variant="outline" size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill} className="flex items-center gap-1 bg-secondary text-secondary-foreground text-sm px-2.5 py-1 rounded-full">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="text-muted-foreground hover:text-destructive ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="portfolio" className="text-sm font-medium text-foreground mb-1.5 block">Portfolio / YouTube / Website</Label>
            <Input
              id="portfolio"
              placeholder="https://..."
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              className="bg-background border-border"
            />
          </div>

          <Button
            type="submit"
            disabled={update.isPending || !name.trim()}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {update.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </form>

        {/* Sign out */}
        <div className="mt-6 pt-6 border-t border-border">
          <Button
            variant="outline"
            className="w-full gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
            onClick={() => {
              sessionStorage.removeItem("cc_welcome_shown");
              signOut(() => navigate("/"));
            }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
