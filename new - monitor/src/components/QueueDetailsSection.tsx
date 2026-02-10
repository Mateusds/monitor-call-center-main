interface QueueData {
  queue: string;
  answered: number;
  abandoned: number;
  channel: string;
}

interface QueueDetailsSectionProps {
  phoneData: Record<string, QueueData[]>;
  chatData: Record<string, QueueData[]>;
  whatsappData: Record<string, QueueData[]>;
}

export const QueueDetailsSection = ({ phoneData, chatData, whatsappData }: QueueDetailsSectionProps) => {
  // Component now empty - rankings removed as requested
  return null;
};