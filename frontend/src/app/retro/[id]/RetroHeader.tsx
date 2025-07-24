import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Clock, Share2, User, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function RetroHeader({
  retro,
  participants,
  user,
  currentUserRole,
  setShowShareModal,
  handleLogout,
}: {
  retro: any;
  participants: any[];
  user: any;
  currentUserRole: boolean;
  showShareModal: boolean;
  setShowShareModal: (v: boolean) => void;
  handleLogout: () => void;
}) {
  return (
    <div className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Mobile header */}
          <div className="flex items-center w-full md:hidden">
            <Button variant="outline" size="icon" className="mr-2" onClick={() => setShowShareModal(true)}>
              <Share2 className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold text-gray-900 truncate flex-1">{retro?.title ?? ''}</h1>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ml-2">
                    <Avatar
                      className={`h-9 w-9 border-2 ${currentUserRole ? 'border-blue-500' : 'border-gray-200'} transition`}
                      title={user.name + (currentUserRole ? ' (Facilitator)' : '')}
                    >
                      <AvatarImage 
                        src={user.imageUrl || user.image_url || undefined}
                        alt={user.name}
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <AvatarFallback>
                        {user.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {/* Desktop header */}
          <div className="hidden md:flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{retro?.title ?? ''}</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{participants.length} participants</span>
                  </Badge>
                  {retro && (retro as any).duration && (
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{(retro as any).duration} min</span>
                    </Badge>
                  )}
                  <Badge variant={retro?.status === "draft" ? "default" : "secondary"}>{retro?.status ?? ''}</Badge>
                  {currentUserRole && (
                    <Badge variant="default" className="bg-blue-500">
                      Facilitator
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => setShowShareModal(true)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-14 w-14 rounded-full p-0">
                      <Avatar
                        className={`h-14 w-14 border-2 ${currentUserRole ? 'border-blue-500' : 'border-gray-200'} transition`}
                        title={user.name + (currentUserRole ? ' (Facilitator)' : '')}
                      >
                        <AvatarImage 
                          src={user.imageUrl || user.image_url || undefined}
                          alt={user.name}
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <AvatarFallback>
                          {user.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 