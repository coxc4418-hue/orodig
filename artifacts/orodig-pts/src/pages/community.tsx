import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  useGetCommunityFeed,
  useCreatePost,
  useDeletePost,
  useTogglePostLike,
  useGetPostComments,
  useCreateComment,
  useDeleteComment,
  useListConferences,
  useListMembers,
  useGetSocialProfile,
  useToggleFollow,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RankBadge } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Heart,
  MessageSquare,
  Trash2,
  Tv,
  Users,
  Send,
  Video,
  ExternalLink,
  UserPlus,
  UserMinus,
  Sparkles,
  Calendar,
  X,
  FileText
} from "lucide-react";

const GOLD = "hsl(42,68%,50%)";

export default function Community() {
  const { currentMember } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("feed");
  const [postContent, setPostContent] = useState("");
  const [postImageUrl, setPostImageUrl] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

  // Queries
  const { data: posts, isLoading: loadingPosts } = useGetCommunityFeed();
  const { data: conferences, isLoading: loadingConferences } = useListConferences();
  const { data: members, isLoading: loadingMembers } = useListMembers();

  // Mutations
  const createPostMutation = useCreatePost({
    mutation: {
      onSuccess: () => {
        setPostContent("");
        setPostImageUrl("");
        queryClient.invalidateQueries({ queryKey: ["/api/community/feed"] });
        toast({ title: "Publicado", description: "Tu publicación ha sido compartida con éxito." });
      },
    }
  });

  const deletePostMutation = useDeletePost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/community/feed"] });
        toast({ title: "Publicación eliminada" });
      },
    }
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    createPostMutation.mutate({
      data: {
        content: postContent,
        imageUrl: postImageUrl.trim() ? postImageUrl : null,
      },
    });
  };

  const isAdmin = currentMember?.username === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            COMUNIDAD <span style={{ color: GOLD }}>ORODIG</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Conéctate, comparte estrategias y asiste a conferencias de liderazgo.
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setLocation("/admin?tab=conferences")}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
          >
            <Video className="w-4 h-4 mr-2" />
            Gestionar Conferencias
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/5 border border-white/10 p-1 grid grid-cols-3 max-w-md rounded-xl">
          <TabsTrigger value="feed" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white">
            <Sparkles className="w-4 h-4 mr-1.5" /> Feed
          </TabsTrigger>
          <TabsTrigger value="conferences" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white">
            <Tv className="w-4 h-4 mr-1.5" /> En Vivo
          </TabsTrigger>
          <TabsTrigger value="members" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-1.5" /> Explorar
          </TabsTrigger>
        </TabsList>

        {/* FEED TAB */}
        <TabsContent value="feed" className="space-y-6 mt-4">
          {/* Create Post */}
          <Card className="bg-card border-white/5 shadow-xl backdrop-blur-md bg-opacity-60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4" style={{ color: GOLD }} />
                Crear Publicación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePost} className="space-y-3">
                <Textarea
                  placeholder="¿Qué estrategia o logro de OroDig quieres compartir hoy con el equipo?"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="bg-white/3 border-white/10 focus:border-[hsl(42,68%,50%)] focus:ring-1 focus:ring-[hsl(42,68%,50%)] text-white placeholder-muted-foreground min-h-[100px] resize-none rounded-xl"
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="URL de imagen opcional (ej: https://...)"
                    value={postImageUrl}
                    onChange={(e) => setPostImageUrl(e.target.value)}
                    className="bg-white/3 border-white/10 text-white placeholder-muted-foreground rounded-xl flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={createPostMutation.isPending || !postContent.trim()}
                    className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-black uppercase rounded-xl tracking-wider px-6 transition-all"
                  >
                    {createPostMutation.isPending ? "Compartiendo..." : "Publicar"}
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Posts List */}
          {loadingPosts ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={() => deletePostMutation.mutate({ id: post.id })}
                  onViewProfile={(authorId) => setSelectedMemberId(authorId)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-white/3 rounded-xl border border-white/5">
              No hay publicaciones todavía. ¡Sé el primero en compartir!
            </div>
          )}
        </TabsContent>

        {/* CONFERENCES TAB */}
        <TabsContent value="conferences" className="mt-4">
          {loadingConferences ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-44 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : conferences && conferences.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conferences.map((conf) => {
                const isLive = conf.isLive;
                return (
                  <Card key={conf.id} className={`bg-card border-white/5 overflow-hidden transition-all duration-300 relative ${isLive ? "ring-2 ring-[hsl(42,68%,50%)]" : ""}`}>
                    {isLive && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-600/90 text-white text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full animate-pulse shadow-lg">
                        <span className="w-2 h-2 bg-white rounded-full" />
                        EN VIVO
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                        {conf.title}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground text-xs line-clamp-2">
                        {conf.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        {conf.scheduledAt && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Programado: {new Date(conf.scheduledAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          onClick={() => setLocation(`/conference/${conf.id}`)}
                          className={isLive
                            ? "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-black"
                            : "bg-white/10 hover:bg-white/20 text-white font-bold"}
                        >
                          {isLive ? "Entrar a Sala de Stream" : "Ver Detalles y Chat"}
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-white/3 rounded-xl border border-white/5">
              No hay conferencias programadas. Vuelve más tarde.
            </div>
          )}
        </TabsContent>

        {/* EXPLORAR MEMBERS TAB */}
        <TabsContent value="members" className="mt-4">
          {loadingMembers ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : members && members.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {members.filter(m => m.username !== "admin").map((m) => (
                <Card key={m.id} className="bg-card border-white/5 hover:border-white/10 transition-all">
                  <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center font-black text-xl text-black"
                      style={{ background: `linear-gradient(135deg, hsl(42,68%,38%), hsl(42,68%,58%))` }}>
                      {m.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{m.fullName}</h3>
                      <p className="text-xs text-muted-foreground">@{m.username}</p>
                    </div>
                    <RankBadge rank={m.rank} />
                    <div className="grid grid-cols-2 gap-4 w-full pt-2 border-t border-white/5 text-xs text-muted-foreground">
                      <div>
                        <div className="font-black text-white">{m.directReferrals}</div>
                        <div>Referidos</div>
                      </div>
                      <div>
                        <div className="font-black text-white">{m.totalNetwork}</div>
                        <div>Red</div>
                      </div>
                    </div>
                    <Button
                      onClick={() => setSelectedMemberId(m.id)}
                      className="w-full bg-white/5 hover:bg-white/10 text-white font-bold text-xs"
                    >
                      Ver Perfil Social
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-white/3 rounded-xl border border-white/5">
              No hay otros miembros registrados en este momento.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Social Profile Modal */}
      {selectedMemberId && (
        <SocialProfileModal
          memberId={selectedMemberId}
          onClose={() => setSelectedMemberId(null)}
        />
      )}
    </div>
  );
}

// ─── POST CARD COMPONENT ───────────────────────────────────────────────────

function PostCard({ post, onDelete, onViewProfile }: { post: any; onDelete: () => void; onViewProfile: (id: number) => void }) {
  const { currentMember } = useAuth();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const toggleLikeMutation = useTogglePostLike({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/community/feed"] });
      },
    }
  });

  const createCommentMutation = useCreateComment({
    mutation: {
      onSuccess: () => {
        setCommentText("");
        queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${post.id}/comments`] });
        queryClient.invalidateQueries({ queryKey: ["/api/community/feed"] });
      },
    }
  });

  const handleLike = () => {
    toggleLikeMutation.mutate({ id: post.id });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    createCommentMutation.mutate({
      id: post.id,
      data: { content: commentText },
    });
  };

  const isAdmin = currentMember?.username === "admin";
  const isAuthor = currentMember?.id === post.memberId;

  return (
    <Card className="bg-card border-white/5 hover:border-white/10 transition-all overflow-hidden">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onViewProfile(post.memberId)}
              className="w-10 h-10 rounded-full flex items-center justify-center font-black text-black text-sm transition-transform hover:scale-105"
              style={{ background: `linear-gradient(135deg, hsl(42,68%,38%), hsl(42,68%,58%))` }}
            >
              {post.author?.fullName?.charAt(0) || "?"}
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onViewProfile(post.memberId)}
                  className="font-bold text-white hover:underline text-sm"
                >
                  {post.author?.fullName}
                </button>
                {post.author?.rank && <RankBadge rank={post.author.rank} />}
              </div>
              <p className="text-[10px] text-muted-foreground">
                @{post.author?.username} · {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          {(isAuthor || isAdmin) && (
            <Button
              onClick={() => {
                if (confirm("¿Estás seguro de que deseas eliminar esta publicación?")) {
                  onDelete();
                }
              }}
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <p className="text-white text-sm whitespace-pre-line leading-relaxed">
          {post.content}
        </p>

        {post.imageUrl && (
          <div className="relative rounded-xl overflow-hidden border border-white/5 max-h-[300px] bg-black/40">
            <img
              src={post.imageUrl}
              alt="Post media"
              className="w-full h-full object-contain mx-auto"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-white/5">
          <Button
            onClick={handleLike}
            variant="ghost"
            className={`flex items-center gap-1.5 px-3 py-1.5 h-auto text-xs font-bold transition-colors ${
              post.likedByMe
                ? "text-red-500 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <Heart className={`w-4 h-4 ${post.likedByMe ? "fill-current" : ""}`} />
            <span>{post.likesCount}</span>
          </Button>

          <Button
            onClick={() => setShowComments(!showComments)}
            variant="ghost"
            className="flex items-center gap-1.5 px-3 py-1.5 h-auto text-xs font-bold text-muted-foreground hover:text-white"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{post.commentsCount}</span>
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <CommentsSection
            postId={post.id}
            onAddComment={handleAddComment}
            commentText={commentText}
            setCommentText={setCommentText}
            onViewProfile={onViewProfile}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ─── COMMENTS SECTION ──────────────────────────────────────────────────────

function CommentsSection({
  postId,
  onAddComment,
  commentText,
  setCommentText,
  onViewProfile,
}: {
  postId: number;
  onAddComment: (e: React.FormEvent) => void;
  commentText: string;
  setCommentText: (t: string) => void;
  onViewProfile: (id: number) => void;
}) {
  const { currentMember } = useAuth();
  const queryClient = useQueryClient();
  const { data: comments, isLoading } = useGetPostComments(postId);

  const deleteCommentMutation = useDeleteComment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${postId}/comments`] });
        queryClient.invalidateQueries({ queryKey: ["/api/community/feed"] });
      },
    }
  });

  const isAdmin = currentMember?.username === "admin";

  return (
    <div className="pt-4 border-t border-white/5 space-y-4">
      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-8 rounded bg-white/5 animate-pulse" />
          <div className="h-8 rounded bg-white/5 animate-pulse" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
          {comments.map((comment) => {
            const isCommentAuthor = currentMember?.id === comment.memberId;
            return (
              <div key={comment.id} className="flex justify-between items-start gap-2 bg-white/3 p-2.5 rounded-lg border border-white/5">
                <div className="flex gap-2">
                  <button
                    onClick={() => onViewProfile(comment.memberId)}
                    className="w-7 h-7 rounded-full flex items-center justify-center font-black text-black text-xs shrink-0"
                    style={{ background: `linear-gradient(135deg, hsl(42,68%,38%), hsl(42,68%,58%))` }}
                  >
                    {comment.author?.fullName?.charAt(0) || "?"}
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => onViewProfile(comment.memberId)}
                        className="font-bold text-white hover:underline text-xs"
                      >
                        {comment.author?.fullName}
                      </button>
                      {comment.author?.rank && <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1 rounded uppercase font-bold">{comment.author.rank}</span>}
                    </div>
                    <p className="text-white text-xs mt-0.5">{comment.content}</p>
                  </div>
                </div>
                {(isCommentAuthor || isAdmin) && (
                  <Button
                    onClick={() => {
                      if (confirm("¿Estás seguro de que deseas eliminar este comentario?")) {
                        deleteCommentMutation.mutate({ postId, id: comment.id });
                      }
                    }}
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-red-400 h-6 w-6"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">Sin comentarios. Sé el primero.</p>
      )}

      {/* Add Comment Form */}
      <form onSubmit={onAddComment} className="flex gap-2">
        <Input
          placeholder="Escribe un comentario..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="bg-white/3 border-white/10 text-xs text-white placeholder-muted-foreground rounded-lg h-9 flex-1"
        />
        <Button
          type="submit"
          disabled={!commentText.trim()}
          size="sm"
          className="bg-white/10 hover:bg-white/20 text-white font-bold h-9"
        >
          Enviar
        </Button>
      </form>
    </div>
  );
}

// ─── SOCIAL PROFILE MODAL ──────────────────────────────────────────────────

function SocialProfileModal({ memberId, onClose }: { memberId: number; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useGetSocialProfile(memberId);
  const { currentMember } = useAuth();
  const { toast } = useToast();

  const toggleFollowMutation = useToggleFollow({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/community/members/${memberId}/profile`] });
        toast({ title: "Acción completada" });
      },
    }
  });

  const handleFollowToggle = () => {
    toggleFollowMutation.mutate({ id: memberId });
  };

  const isSelf = currentMember?.id === memberId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-card border border-white/10 rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-white/5 border-t-[hsl(42,68%,50%)] animate-spin" />
            <p className="text-sm text-muted-foreground">Cargando perfil...</p>
          </div>
        ) : profile ? (
          <div className="p-6 space-y-6">
            {/* Header info */}
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="w-20 h-20 rounded-full flex items-center justify-center font-black text-3xl text-black shadow-lg"
                style={{ background: `linear-gradient(135deg, hsl(42,68%,38%), hsl(42,68%,58%))` }}>
                {profile.fullName.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-black text-white">{profile.fullName}</h2>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              </div>
              <RankBadge rank={profile.rank} />

              {!isSelf && (
                <Button
                  onClick={handleFollowToggle}
                  className={`font-black text-xs uppercase px-6 py-2 rounded-full tracking-wider mt-2 transition-all ${
                    profile.isFollowing
                      ? "bg-white/10 hover:bg-white/20 text-white"
                      : "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black"
                  }`}
                >
                  {profile.isFollowing ? (
                    <>
                      <UserMinus className="w-3.5 h-3.5 mr-1.5" /> Dejar de Seguir
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Seguir Miembro
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Social stats */}
            <div className="grid grid-cols-3 gap-2 py-4 border-y border-white/5 text-center">
              <div>
                <div className="text-lg font-black text-white">{profile.postsCount}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Publicaciones</div>
              </div>
              <div>
                <div className="text-lg font-black text-white">{profile.followersCount}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Seguidores</div>
              </div>
              <div>
                <div className="text-lg font-black text-white">{profile.followingCount}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Seguidos</div>
              </div>
            </div>

            {/* Network stats */}
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div className="bg-white/3 p-3 rounded-xl border border-white/5">
                <div className="text-white font-black text-sm">{profile.directReferrals}</div>
                <div>Referidos Directos</div>
              </div>
              <div className="bg-white/3 p-3 rounded-xl border border-white/5">
                <div className="text-white font-black text-sm">${(profile.totalEarnings ?? 0).toFixed(2)}</div>
                <div>Ganancia Generada</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">Error al cargar perfil.</div>
        )}
      </div>
    </div>
  );
}
