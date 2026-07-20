"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Separator } from "@repo/ui/separator";
import styles from "@app/page.module.css";
import { systemHealthQueryKey } from "@/api/client-api/system/clientHealth.api";
import { useClientSystemHealthQuery } from "@/api/client-api/system/clientHealthDemo";
import { createClientPingRequest } from "@/api/client-api/system/clientPing.api";
import { useClientSystemPingMutation } from "@/api/client-api/system/clientPingDemo";

export function SystemQueryDemo() {
  const queryClient = useQueryClient();
  const healthQuery = useClientSystemHealthQuery();
  const pingMutation = useClientSystemPingMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: systemHealthQueryKey });
    },
  });

  const healthStatus =
    healthQuery.data?.ok === true
      ? "healthy"
      : healthQuery.isError
        ? "error"
        : "loading";
  const pingStatus =
    pingMutation.data?.ok === true
      ? "pong"
      : pingMutation.isError
        ? "error"
        : pingMutation.isPending
          ? "sending"
          : "idle";

  return (
    <section className="grid flex-1 gap-6 pb-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] lg:items-start">
      <Card className={`${styles.secondaryCard} shadow-md backdrop-blur`}>
        <CardHeader>
          <CardTitle>TanStack Query request chain</CardTitle>
          <CardDescription>
            Health is loaded by useQuery. Ping is triggered by useMutation and
            invalidates the health query after success.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="grid gap-4 pt-6 text-body">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              disabled={pingMutation.isPending}
              size="sm"
              onClick={() => pingMutation.mutate(createClientPingRequest())}
            >
              {pingMutation.isPending ? "Pinging..." : "Ping API"}
            </Button>
            <Button
              disabled={healthQuery.isFetching}
              size="sm"
              variant="outline"
              onClick={() => void healthQuery.refetch()}
            >
              {healthQuery.isFetching ? "Refreshing..." : "Refetch health"}
            </Button>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-background/60 p-3">
              <p className="mb-2 font-medium">Health query</p>
              <pre className="overflow-auto whitespace-pre-wrap text-caption text-muted-foreground">
                {JSON.stringify(
                  {
                    queryKey: systemHealthQueryKey,
                    status: healthStatus,
                    isFetching: healthQuery.isFetching,
                    data: healthQuery.data,
                    error:
                      healthQuery.error instanceof Error
                        ? healthQuery.error.message
                        : undefined,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
            <div className="rounded-lg border border-border bg-background/60 p-3">
              <p className="mb-2 font-medium">Ping mutation</p>
              <pre className="overflow-auto whitespace-pre-wrap text-caption text-muted-foreground">
                {JSON.stringify(
                  {
                    status: pingStatus,
                    request: pingMutation.variables,
                    response: pingMutation.data,
                    error:
                      pingMutation.error instanceof Error
                        ? pingMutation.error.message
                        : undefined,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2">
            <span className="font-medium">Invalidated query</span>
            <span
              className={`${styles.statusBadge} rounded-full px-2 py-0.5 text-caption text-primary`}
            >
              {systemHealthQueryKey.join(" / ")}
            </span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
