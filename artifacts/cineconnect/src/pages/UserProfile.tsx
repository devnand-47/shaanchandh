import { useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { MapPin, Star, BadgeCheck, Circle, ExternalLink, MessageSquare, ArrowLeft, Flag } from "lucide-react";
import {
  useGetUserById, useGetUserReviews, useCreateReview, useRecordProfileView,
  getGetUserByIdQueryKey, getGetUserReviewsQueryKey, useGetMe
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-xl ${star <= value ? "text-yellow-400" : "text-muted-foreground"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function UserProfile() {
  const { userId } = useParams();
  const [, navigate] = useLocation();
  const { data: me } = useGetMe();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: user, isLoading } = useGetUserById(userId ?? "", {
    query: { enabled: !!userId, queryKey: getGetUserByIdQueryKey(userId ?? "") },
  });

  const { data: reviewsData } = useGetUserReviews(userId ?? "", {
    query: { enabled: !!userId, queryKey: getGetUserReviewsQueryKey(userId ?? "") },
  });

  const recordView = useRecordProfileView();
  const createReview = useCreateReview();

  useEffect(() => {
    if (userId && me?.id !== userId) {
      recordView.mutate({ params: { userId } } as any);
    }
  }, [userId]);

  const handleReview = () => {
    createReview.mutate(
      { params: { userId: userId ?? "" }, data: { rating, comment: comment.trim() || undefined } } as any,
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetUserReviewsQueryKey(userId ?? "") });
          queryClient.invalidateQueries({ queryKey: getGetUserByIdQueryKey(userId ?? "") });
          toast({ title: "Review submitted!" });
          setShowReviewForm(false);
          setComment("");
          setRating(5);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="flex gap-4">
          <div className="w-24 h-24 rounded-full bg-muted" />
          <div className="flex-1 space-y-2 pt-2">
            <div className="h-6 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground">
        <p>User not found.</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate("/feed")}>Back to Feed</Button>
      </div>
    );
  }

  const isOwn = me?.id === userId;
  const reviews = reviewsData?.reviews ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/feed")} className="mb-4 text-muted-foreground gap-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      {/* Profile Header */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <div className="flex items-start gap-5">
          <div className="relative flex-shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-24 h-24 rounded-full object-cover border-2 border-primary/30" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary text-4xl font-bold border-2 border-primary/30">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <Circle
              className={`absolute -bottom-1 -right-1 w-5 h-5 border-2 border-card rounded-full ${
                user.onlineStatus === "online" ? "text-green-500 fill-green-500" : "text-gray-500 fill-gray-500"
              }`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
              {user.isVerified && <BadgeCheck className="w-5 h-5 text-primary" />}
            </div>
            <p className="text-primary font-semibold mb-1">{user.role}</p>
            {user.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <MapPin className="w-3.5 h-3.5" />
                {user.location}
              </div>
            )}
            {user.averageRating != null && (
              <div className="flex items-center gap-1.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(user.averageRating!) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
                ))}
                <span className="text-sm text-muted-foreground">({user.totalReviews})</span>
              </div>
            )}
          </div>
        </div>

        {user.bio && (
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{user.bio}</p>
        )}

        {user.skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {user.skills.map((skill) => (
              <span key={skill} className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        )}

        {user.portfolioUrl && (
          <a href={user.portfolioUrl} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-1.5 text-sm text-primary hover:underline">
            <ExternalLink className="w-3.5 h-3.5" />
            Portfolio / Website
          </a>
        )}

        {!isOwn && (
          <div className="mt-5 flex gap-3">
            <Link href={`/chat/${userId}`}>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 flex-1">
                <MessageSquare className="w-4 h-4" /> Message
              </Button>
            </Link>
            <Button variant="outline" onClick={() => setShowReviewForm(!showReviewForm)}>
              {showReviewForm ? "Cancel" : "Rate"}
            </Button>
          </div>
        )}

        {isOwn && (
          <div className="mt-5">
            <Link href="/profile/me">
              <Button variant="outline" className="w-full">Edit Profile</Button>
            </Link>
          </div>
        )}

        {/* Review form */}
        {showReviewForm && (
          <div className="mt-5 p-4 rounded-xl bg-secondary/30 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Leave a Review</h3>
            <StarPicker value={rating} onChange={setRating} />
            <Textarea
              placeholder="Share your experience working with them..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="bg-background border-border resize-none"
            />
            <Button
              onClick={handleReview}
              disabled={createReview.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {createReview.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        )}
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-semibold text-foreground mb-4">
            Reviews ({reviews.length})
          </h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="pb-4 border-b border-border last:pb-0 last:border-0">
                <div className="flex items-center gap-3 mb-2">
                  {review.reviewerAvatarUrl ? (
                    <img src={review.reviewerAvatarUrl} alt={review.reviewerName} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                      {review.reviewerName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-foreground">{review.reviewerName}</p>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
                      ))}
                    </div>
                  </div>
                </div>
                {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
