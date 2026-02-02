"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Award, Medal } from "lucide-react";
import { ChartContainer } from "../shared/ChartContainer";

interface VolunteerLeaderboardProps {
    data: Array<{
        id: string;
        name: string;
        deliveries: number;
        bottles: number;
        revenue: number;
        goalProgress: number;
    }>;
}

export function VolunteerLeaderboard({ data }: VolunteerLeaderboardProps) {
    const getRankIcon = (index: number) => {
        switch (index) {
            case 0:
                return <Trophy className="w-5 h-5 text-yellow-500" />;
            case 1:
                return <Award className="w-5 h-5 text-gray-400" />;
            case 2:
                return <Medal className="w-5 h-5 text-amber-600" />;
            default:
                return <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>;
        }
    };

    return (
        <ChartContainer
            title="Volunteer Leaderboard"
            description="Top performers ranked by bottles delivered"
        >
            {data.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    No volunteer deliveries yet
                </div>
            ) : (
                <div className="space-y-3">
                    {data.map((volunteer, index) => (
                        <Card
                            key={volunteer.id}
                            className={`rounded-2xl ${index === 0 ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200' :
                                    index === 1 ? 'bg-gray-50 dark:bg-gray-950/20 border-gray-200' :
                                        index === 2 ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200' :
                                            ''
                                }`}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 flex-1">
                                        {getRankIcon(index)}
                                        <div className="flex-1">
                                            <p className="font-semibold">{volunteer.name}</p>
                                            <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                                                <span>{volunteer.deliveries} deliveries</span>
                                                <span>{volunteer.bottles} bottles</span>
                                                <span>₹{volunteer.revenue.toLocaleString()}</span>
                                            </div>
                                            {volunteer.goalProgress > 0 && (
                                                <div className="mt-2">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span>Goal Progress</span>
                                                        <span>{volunteer.goalProgress}%</span>
                                                    </div>
                                                    <Progress value={volunteer.goalProgress} className="h-2" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Badge
                                        className={
                                            index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                index === 1 ? 'bg-gray-100 text-gray-700' :
                                                    index === 2 ? 'bg-amber-100 text-amber-700' :
                                                        'bg-blue-100 text-blue-700'
                                        }
                                    >
                                        {volunteer.bottles} bottles
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </ChartContainer>
    );
}
