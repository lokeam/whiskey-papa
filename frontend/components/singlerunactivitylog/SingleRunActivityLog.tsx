'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/components/ui/utils';

type LogLevel = 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'DEBUG';
type LogFilter = 'ALL' | 'ERRORS' | 'WARNINGS' | 'SUCCESS';

interface ActivityLogEvent {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  stepId?: string;
  stepName?: string;
}

interface SingleRunActivityLogProps {
  events: ActivityLogEvent[];
  autoScroll?: boolean;
  maxHeight?: string;
}

const LOG_LEVEL_STYLES = {
  INFO: 'text-gray-400',
  SUCCESS: 'text-green-500',
  WARN: 'text-yellow-500',
  ERROR: 'text-red-500',
  DEBUG: 'text-blue-400',
} as const;

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

function filterEvents(events: ActivityLogEvent[], filter: LogFilter): ActivityLogEvent[] {
  switch (filter) {
    case 'ERRORS':
      return events.filter(e => e.level === 'ERROR');
    case 'WARNINGS':
      return events.filter(e => e.level === 'WARN');
    case 'SUCCESS':
      return events.filter(e => e.level === 'SUCCESS');
    case 'ALL':
    default:
      return events;
  }
}

export function SingleRunActivityLog({
  events,
  autoScroll = true,
  maxHeight = '32rem',
}: SingleRunActivityLogProps) {
  const [filter, setFilter] = useState<LogFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const logContainerRef = useRef<HTMLDivElement>(null);

  const filteredEvents = filterEvents(events, filter).filter(event =>
    searchTerm ? event.message.toLowerCase().includes(searchTerm.toLowerCase()) : true
  );

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  const handleCopyLogs = () => {
    const logText = filteredEvents
      .map(e => `${formatTimestamp(e.timestamp)} ${e.level.padEnd(7)} ${e.message}`)
      .join('\n');
    navigator.clipboard.writeText(logText);
  };

  return (
    <section className="col-span-full">
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        {/* Header with filters */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">Activity Log</h2>

          <div className="flex items-center gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Filter buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('ALL')}
                className={cn(
                  'px-3 py-1 text-xs border rounded transition-colors',
                  filter === 'ALL'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'border-border hover:bg-accent'
                )}
              >
                All ({events.length})
              </button>
              <button
                onClick={() => setFilter('ERRORS')}
                className={cn(
                  'px-3 py-1 text-xs border rounded transition-colors',
                  filter === 'ERRORS'
                    ? 'bg-red-500 text-white border-red-500'
                    : 'border-border hover:bg-accent'
                )}
              >
                Errors ({events.filter(e => e.level === 'ERROR').length})
              </button>
              <button
                onClick={() => setFilter('WARNINGS')}
                className={cn(
                  'px-3 py-1 text-xs border rounded transition-colors',
                  filter === 'WARNINGS'
                    ? 'bg-yellow-500 text-white border-yellow-500'
                    : 'border-border hover:bg-accent'
                )}
              >
                Warnings ({events.filter(e => e.level === 'WARN').length})
              </button>
              <button
                onClick={() => setFilter('SUCCESS')}
                className={cn(
                  'px-3 py-1 text-xs border rounded transition-colors',
                  filter === 'SUCCESS'
                    ? 'bg-green-500 text-white border-green-500'
                    : 'border-border hover:bg-accent'
                )}
              >
                Success ({events.filter(e => e.level === 'SUCCESS').length})
              </button>
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopyLogs}
              className="px-3 py-1 text-xs border border-border rounded hover:bg-accent transition-colors"
              title="Copy logs to clipboard"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Terminal-style log area */}
        <div
          ref={logContainerRef}
          className="bg-black/95 p-4 font-mono text-sm overflow-auto"
          style={{ maxHeight }}
          data-activity-log="content"
        >
          {filteredEvents.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              {searchTerm ? 'No logs match your search' : 'No logs to display'}
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                className="flex gap-3 py-0.5 hover:bg-white/5 transition-colors group"
              >
                {/* Timestamp */}
                <span className="text-gray-600 select-none shrink-0">
                  {formatTimestamp(event.timestamp)}
                </span>

                {/* Log level */}
                <span
                  className={cn(
                    'font-semibold shrink-0 w-16',
                    LOG_LEVEL_STYLES[event.level]
                  )}
                >
                  {event.level}
                </span>

                {/* Step name (if applicable) */}
                {event.stepName && (
                  <span className="text-blue-400 shrink-0">
                    [{event.stepName}]
                  </span>
                )}

                {/* Message */}
                <span className="text-gray-300 flex-1">{event.message}</span>

                {/* Copy individual line button (visible on hover) */}
                <button
                  onClick={() => {
                    const lineText = `${formatTimestamp(event.timestamp)} ${event.level.padEnd(7)} ${event.message}`;
                    navigator.clipboard.writeText(lineText);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300 transition-opacity text-xs shrink-0"
                  title="Copy line"
                >
                  📋
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer with stats */}
        <div className="px-4 py-2 border-t border-border bg-accent/5 text-xs text-muted-foreground flex items-center justify-between">
          <span>
            Showing {filteredEvents.length} of {events.length} events
          </span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-blue-500 hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      </div>
    </section>
  );
}