import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface RealTimeStatusProps {
  isConnected: boolean;
  retroId: string;
  itemsCount: number;
  participantsCount: number;
}

export const RealTimeStatus: React.FC<RealTimeStatusProps> = ({
  isConnected,
  retroId,
  itemsCount,
  participantsCount,
}) => {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Badge variant={isConnected ? "default" : "destructive"} className={isConnected ? "bg-green-500" : "bg-red-500"}>
              {isConnected ? "🟢 Real-time Connected" : "🔴 Disconnected"}
            </Badge>
            <span className="text-sm text-gray-600">
              Retro ID: {retroId}
            </span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>📝 Items: {itemsCount}</span>
            <span>👥 Participants: {participantsCount}</span>
          </div>
        </div>
        {!isConnected && (
          <div className="mt-2 text-xs text-red-600">
            ⚠️ Real-time updates may not work. Please check your connection.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
