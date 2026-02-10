import styled from 'styled-components';
import { motion } from 'framer-motion';

interface ProgressBarProps {
    progress: number;
}

const ProgressWrapper = styled.div`
  width: 100%;
  height: 4px;
  background: ${({ theme }) => theme.colors.border};
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 40px;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: var(--primary-color);
  border-radius: 2px;
`;

export function ProgressBar({ progress }: ProgressBarProps) {
    return (
        <ProgressWrapper>
            <ProgressFill
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            />
        </ProgressWrapper>
    );
}
