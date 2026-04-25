import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../store';
import type { Issue, IssueStatus } from '../types';
import { Clock, ShieldCheck, MapPin, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function SortableItem({ issue }: { issue: Issue }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const resolveIssue = useStore(state => state.resolveIssue);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-slate-800 p-4 rounded-lg shadow cursor-grab active:cursor-grabbing border-l-4 ${
        issue.status === 'New' ? 'border-red-500' :
        issue.status === 'In Progress' ? 'border-amber-500' : 'border-emerald-500'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-semibold text-white">{issue.category}</span>
        {issue.verified && <ShieldCheck size={16} className="text-emerald-400" />}
      </div>
      <p className="text-xs text-slate-400 line-clamp-2 mb-3">{issue.description || 'No description provided.'}</p>
      <div className="flex justify-between items-center text-xs text-slate-500">
        <span className="flex items-center gap-1"><Clock size={12} /> {formatDistanceToNow(new Date(issue.timestamp), { addSuffix: true })}</span>
        <span className="flex items-center gap-1 font-mono"><MapPin size={12} /> x:{issue.coordinates[0].toFixed(0)} z:{issue.coordinates[2].toFixed(0)}</span>
      </div>
      
      {/* Verify Resolution Flow Button */}
      {issue.status !== 'Resolved' && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Don't trigger drag
            resolveIssue(issue.id);
          }}
          className="mt-3 w-full py-1.5 flex items-center justify-center gap-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-500/20 transition-colors"
        >
          <CheckCircle size={14} /> Mark Resolved
        </button>
      )}
    </div>
  );
}

function Column({ title, issues }: { id: IssueStatus; title: string; issues: Issue[] }) {
  return (
    <div className="flex flex-col bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl w-full max-w-sm h-full overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
        <h3 className="font-semibold text-slate-200">{title}</h3>
        <span className="bg-slate-800 text-slate-400 text-xs py-1 px-2 rounded-full font-mono">{issues.length}</span>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        <SortableContext items={issues.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {issues.map(issue => (
            <SortableItem key={issue.id} issue={issue} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const allIssues = useStore(state => state.issues);
  const timeFilter = useStore(state => state.timeFilter);
  const maxHour = (timeFilter / 100) * 24;
  const issues = allIssues.filter(i => new Date(i.timestamp).getHours() <= maxHour);
  const updateIssueStatus = useStore(state => state.updateIssueStatus);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const newIssues = issues.filter(i => i.status === 'New');
  const inProgressIssues = issues.filter(i => i.status === 'In Progress');
  const resolvedIssues = issues.filter(i => i.status === 'Resolved');

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    // Find what status it was dropped into.
    // If dropped on another card, it adopts that card's status.
    // But @dnd-kit default Sortable doesn't cleanly support moving between lists without multiple contexts.
    // Since we only have 3 lists, we can determine target status based on where `over` is located.
    
    // A simple hack when using a single SortableContext or dragging across is finding the issue `over.id`.
    const overIssueId = over.id as string;
    const overIssue = issues.find(i => i.id === overIssueId);
    
    // If it dropped over an issue, change status to match that issue's status
    if (overIssue && active.id !== over.id) {
      updateIssueStatus(active.id as string, overIssue.status);
    }
  };

  return (
    <div className="w-full h-full flex justify-center items-start gap-6 pt-10 px-6 max-h-screen overflow-hidden pb-10">
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <Column id="New" title="New Reports" issues={newIssues} />
        <Column id="In Progress" title="In Progress" issues={inProgressIssues} />
        <Column id="Resolved" title="Resolved (Verified)" issues={resolvedIssues} />
      </DndContext>
    </div>
  );
}
