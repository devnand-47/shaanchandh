import { useState } from "react";
import { Link } from "wouter";
import { Search, MapPin, Briefcase, Star, BadgeCheck, Circle } from "lucide-react";
import { useListUsers, useGetFeedStats } from "@workspace/api-client-react";
import type { UserProfile } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ROLES = ["", "Actor", "Director", "Cameraman", "Editor", "Music", "Writer", "Producer", "Other"];
const LOCATIONS = ["", "Kerala", "Malabar", "Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Mumbai", "Chennai"];

function UserCard({ user }: { user: UserProfile }) {
  return (
    <Link href={`/profile/${user.id}`}>
      <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all cursor-pointer group">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-14 h-14 rounded-full object-cover border-2 border-border group-hover:border-primary/50 transition-colors" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center border-2 border-border text-primary text-xl font-bold group-hover:border-primary/50 transition-colors">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <Circle
              className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 ${
                user.onlineStatus === "online" ? "text-green-500 fill-green-500" : "text-gray-500 fill-gray-500"
              }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground truncate">{user.name}</h3>
              {user.isVerified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
            </div>
            <p className="text-sm text-primary font-medium">{user.role}</p>
            {user.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <MapPin className="w-3 h-3" />
                {user.location}
              </div>
            )}
            {user.averageRating != null && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-muted-foreground">{user.averageRating.toFixed(1)} ({user.totalReviews})</span>
              </div>
            )}
          </div>
        </div>
        {user.bio && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{user.bio}</p>
        )}
        {user.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {user.skills.slice(0, 4).map((skill) => (
              <span key={skill} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                {skill}
              </span>
            ))}
            {user.skills.length > 4 && (
              <span className="text-xs text-muted-foreground">+{user.skills.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function Feed() {
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

  const { data: usersData, isLoading } = useListUsers(params);
  const { data: feedStats } = useGetFeedStats();

  const users = usersData?.users ?? [];
  const total = usersData?.total ?? 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Stats */}
      {feedStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{feedStats.totalUsers}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Members</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{feedStats.activeProjects}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Active Projects</p>
          </div>
          {feedStats.roleBreakdown.slice(0, 2).map((rb) => (
            <div key={rb.role} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{rb.count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{rb.role}s</p>
            </div>
          ))}
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or bio..."
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
            {ROLES.filter(Boolean).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={location} onValueChange={(v) => { setLocation(v === "_all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44 bg-card border-border">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Locations</SelectItem>
            {LOCATIONS.filter(Boolean).map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground">
          {isLoading ? "Loading..." : `${total} professional${total !== 1 ? "s" : ""} found`}
        </h2>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No professionals found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => <UserCard key={user.id} user={user} />)}
        </div>
      )}

      {/* Pagination */}
      {total > 12 && (
        <div className="flex justify-center gap-3 mt-8">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            Previous
          </Button>
          <span className="flex items-center text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / 12)}
          </span>
          <Button variant="outline" disabled={page >= Math.ceil(total / 12)} onClick={() => setPage(p => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
