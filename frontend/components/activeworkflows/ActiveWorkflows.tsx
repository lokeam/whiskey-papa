
import { Run } from "@/components/recentrunslist/RecentRunsList";
import Link from "next/link";
import WorkflowHistoryItem from "@/components/recentrunslist/WorkflowHistoryItem";

type ActiveWorkflowsProps = {
  runs: Run[];
}

export default function ActiveWorkflows({ runs }: ActiveWorkflowsProps) {
  return (
    <section className="col-span-full lg:col-span-2 mb-8">
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
      <ul className="space-y-4">
        {/* {runs.map((run) => (
          <li key={run?.id}>
            <div>{run?.workflowName}</div>
            <div>simple steptimeline / progress representation</div>
          </li>
        ))} */}
        <WorkflowHistoryItem
          variant="active"
          status="running"
          title="Compliance Processing"
          description="#comp-pl-185730"
          triggeredAtLabel="5 mins ago"
          durationLabel="5m 40s"
        />
        <WorkflowHistoryItem
          variant="active"
          status="running"
          title="Media Transcoding"
          description="#15078…"
          triggeredAtLabel="12 min ago"
          durationLabel="12m 43s"
        />

      </ul>
    </section>
  )
}