import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  useListConferences,
  useUpdateConference,
  getListConferencesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Send,
  Tv,
  MessageSquare,
  Video,
  Play,
  Volume2,
  Users
} from "lucide-react";

const GOLD = "hsl(42,68%,50%)";

export default function ConferenceRoom() {
  const { id: paramId } = useParams();
  const { currentMember } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const confId = parseInt(paramId || "", 10);
  const [chatText, setChatText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Poll conferences every 5 seconds to keep chat and live status up-to-date
  const { data: conferences, isLoading } = useListConferences({
    query: {
      refetchInterval: 5000,
      queryKey: getListConferencesQueryKey(),
    },
  });

  const conference = conferences?.find((c) => c.id === confId);

  const sendMessageMutation = useUpdateConference({
    mutation: {
      onSuccess: () => {
        setChatText("");
        queryClient.invalidateQueries({ queryKey: ["/api/community/conferences"] });
      },
      onError: (err: any) => {
        toast({
          title: "Error al enviar mensaje",
          description: err.message || "Por favor intenta de nuevo.",
          variant: "destructive",
        });
      },
    }
  });

  // Scroll to chat bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conference?.chatMessages]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() || isNaN(confId)) return;
    sendMessageMutation.mutate({
      id: confId,
      data: {
        chatMessage: {
          content: chatText.trim(),
        },
      },
    });
  };

  // Convert generic YouTube watch links to embed links if necessary
  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    let cleanUrl = url.trim();
    if (cleanUrl.includes("youtube.com/watch?v=")) {
      const videoId = cleanUrl.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (cleanUrl.includes("youtu.be/")) {
      const videoId = cleanUrl.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    return cleanUrl;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-white/5 border-t-[hsl(42,68%,50%)] animate-spin" />
        <p className="text-muted-foreground text-sm">Entrando a la sala de conferencia...</p>
      </div>
    );
  }

  if (!conference) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">La conferencia especificada no existe.</p>
        <Button onClick={() => setLocation("/community")} className="bg-white/10 text-white hover:bg-white/20">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Comunidad
        </Button>
      </div>
    );
  }

  const isLive = conference.isLive;
  const embedUrl = getEmbedUrl(conference.streamUrl);

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => setLocation("/community")}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Volver a Comunidad
        </Button>
        <div className="flex items-center gap-2">
          {isLive ? (
            <Badge className="bg-red-600 text-white font-black tracking-wider uppercase px-2 py-0.5 text-[10px] animate-pulse">
              EN VIVO
            </Badge>
          ) : (
            <Badge className="bg-white/10 text-muted-foreground uppercase px-2 py-0.5 text-[10px]">
              Offline
            </Badge>
          )}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player & Info Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/80 border border-white/5 shadow-2xl flex items-center justify-center">
            {isLive && embedUrl ? (
              <iframe
                src={embedUrl}
                title={conference.title}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="text-center p-6 space-y-3 z-10 max-w-md">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-muted-foreground border border-white/10">
                  <Tv className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-white">Transmisión Desconectada</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  El orador aún no ha iniciado la transmisión en vivo o la conferencia ha finalizado. Puedes interactuar en el chat mientras comienza.
                </p>
              </div>
            )}
          </div>

          <Card className="bg-card border-white/5 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-black text-white">{conference.title}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Iniciada por Administrador
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white text-sm whitespace-pre-line leading-relaxed">
                {conference.description || "Sin descripción proporcionada."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Live Chat Column */}
        <div className="flex flex-col h-[500px] lg:h-[calc(100vh-220px)] min-h-[400px]">
          <Card className="bg-card border-white/5 flex flex-col h-full shadow-2xl overflow-hidden">
            <CardHeader className="py-4 border-b border-white/5 bg-white/2">
              <CardTitle className="text-sm font-black text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" style={{ color: GOLD }} />
                  CHAT EN VIVO
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1">
                  <Users className="w-3 h-3" /> Equipo
                </span>
              </CardTitle>
            </CardHeader>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {conference.chatMessages && conference.chatMessages.length > 0 ? (
                conference.chatMessages.map((msg, idx) => {
                  const isMsgAdmin = msg.username === "admin";
                  return (
                    <div key={idx} className="space-y-0.5 max-w-full">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-black ${isMsgAdmin ? "text-purple-400" : "text-amber-500"}`}>
                          {msg.fullName}
                        </span>
                        {isMsgAdmin && (
                          <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-black uppercase px-1 rounded">
                            Anfitrión
                          </span>
                        )}
                        <span className="text-[8px] text-muted-foreground">
                          {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                        </span>
                      </div>
                      <p className="text-white text-xs bg-white/3 px-3 py-2 rounded-xl border border-white/5 break-words">
                        {msg.content}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-center p-4">
                  <p className="text-xs text-muted-foreground">El chat está vacío. ¡Envía el primer mensaje!</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChat} className="p-3 border-t border-white/5 bg-white/2 flex gap-2">
              <Input
                placeholder="Di algo en el chat..."
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                className="bg-white/3 border-white/10 text-xs text-white placeholder-muted-foreground rounded-xl h-10 flex-1"
                maxLength={500}
              />
              <Button
                type="submit"
                disabled={sendMessageMutation.isPending || !chatText.trim()}
                size="icon"
                className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black rounded-xl h-10 w-10 shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
