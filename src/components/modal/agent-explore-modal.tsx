import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import type { AgentExplore } from '@/types/types';

interface AgentExploreModalProps {
  agent: AgentExplore | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AgentExploreModal({ agent, isOpen, onClose }: AgentExploreModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{agent?.title || 'Agent'}</DialogTitle>
          <DialogDescription>
            {agent?.description || 'No description available for this assistant.'}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
