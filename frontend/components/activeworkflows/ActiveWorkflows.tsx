
import { Run } from "@/components/recentrunslist/RecentRunsList";
import Link from "next/link";
import WorkflowHistoryItem from "@/components/recentrunslist/WorkflowHistoryItem";
import { EmptyStateCard } from "@/components/shared/EmptyStateCard";

type ActiveWorkflowsProps = {
  runs: Run[];
}

export default function ActiveWorkflows({ runs }: ActiveWorkflowsProps) {
  return (
    <section className="col-span-full mb-8">
      {/* Header*/}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold">Active Workflows</h2>
        </div>
        <div>
          <Link href="/runs">View all</Link>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
       {runs.length === 0 ? (
          <EmptyStateCard
            key="empty-active-workflows"
            icon="ACTIVE_WORKFLOWS"
            title="You have no active workflows"
            description="Workflow runs will appear here once they are executed."
          />
          ) : (
            <WorkflowHistoryItem
              key="active-workflows"
              variant="active"
              status="running"
              title="Compliance Processing"
              description="#comp-pl-185730"
              triggeredAtLabel="5 mins ago"
              durationLabel="5m 40s"
            />
            // <WorkflowHistoryItem
            //   variant="active"
            //   status="running"
            //   title="Media Transcoding"
            //   description="#15078…"
            //   triggeredAtLabel="12 min ago"
            //   durationLabel="12m 43s"
            // />
        )}
      </div>
    </section>
  )
}