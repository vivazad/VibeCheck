import { useState } from 'react';
import styled from 'styled-components';

interface FormBlock {
    id: string;
    type: 'nps' | 'csat' | 'text';
    label: string;
    required: boolean;
}

interface FormBuilderProps {
    schema: FormBlock[];
    onSave: (schema: FormBlock[]) => void;
    isSaving?: boolean;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Title = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const Description = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
`;

const ToggleCard = styled.div<{ $active: boolean }>`
  background: ${({ theme, $active }) =>
        $active
            ? `rgba(99, 102, 241, 0.1)`
            : theme.colors.surface};
  border: 2px solid ${({ theme, $active }) =>
        $active
            ? theme.colors.primary
            : theme.colors.border};
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ToggleHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ToggleInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ToggleIcon = styled.span`
  font-size: 24px;
`;

const ToggleLabel = styled.div``;

const ToggleTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 4px;
`;

const ToggleDescription = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Switch = styled.div<{ $active: boolean }>`
  width: 48px;
  height: 28px;
  background: ${({ $active, theme }) =>
        $active ? theme.colors.primary : theme.colors.border};
  border-radius: 14px;
  position: relative;
  transition: background 0.2s;

  &::after {
    content: '';
    position: absolute;
    width: 22px;
    height: 22px;
    background: white;
    border-radius: 50%;
    top: 3px;
    left: ${({ $active }) => ($active ? '23px' : '3px')};
    transition: left 0.2s;
  }
`;

const SaveButton = styled.button<{ $loading?: boolean }>`
  padding: 14px 28px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.primaryDark});
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius}px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: ${({ $loading }) => ($loading ? 'not-allowed' : 'pointer')};
  opacity: ${({ $loading }) => ($loading ? 0.7 : 1)};
  transition: transform 0.2s;
  align-self: flex-start;
  margin-top: 8px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
  }
`;

const ComingSoon = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-style: italic;
`;

const QUESTION_TYPES = [
    {
        id: 'nps_score',
        type: 'nps' as const,
        label: 'How likely are you to recommend us to a friend or colleague?',
        icon: '📊',
        title: 'NPS (0-10 Recommendation)',
        description: 'Classic Net Promoter Score question with 0-10 scale',
    },
    {
        id: 'csat_score',
        type: 'csat' as const,
        label: 'How satisfied are you with your overall experience?',
        icon: '⭐',
        title: 'Star Rating (CSAT)',
        description: '5-star rating for overall satisfaction',
    },
    {
        id: 'feedback_text',
        type: 'text' as const,
        label: 'Any additional feedback for us?',
        icon: '💬',
        title: 'Open Feedback',
        description: 'Free-form text input for detailed comments',
    },
];

export function FormBuilder({ schema, onSave, isSaving }: FormBuilderProps) {
    const [localSchema, setLocalSchema] = useState<FormBlock[]>(schema);

    const isEnabled = (type: string) => {
        return localSchema.some((block) => block.type === type);
    };

    const toggleBlock = (questionType: typeof QUESTION_TYPES[0]) => {
        const exists = localSchema.find((b) => b.type === questionType.type);

        if (exists) {
            setLocalSchema(localSchema.filter((b) => b.type !== questionType.type));
        } else {
            const newBlock: FormBlock = {
                id: questionType.id,
                type: questionType.type,
                label: questionType.label,
                required: questionType.type !== 'text', // NPS and CSAT required by default
            };
            setLocalSchema([...localSchema, newBlock]);
        }
    };

    return (
        <Container>
            <div>
                <Title>Feedback Questions</Title>
                <Description>
                    Choose which questions to include in your feedback form. Toggle on/off as needed.
                </Description>
            </div>

            {QUESTION_TYPES.map((question) => (
                <ToggleCard
                    key={question.id}
                    $active={isEnabled(question.type)}
                    onClick={() => toggleBlock(question)}
                >
                    <ToggleHeader>
                        <ToggleInfo>
                            <ToggleIcon>{question.icon}</ToggleIcon>
                            <ToggleLabel>
                                <ToggleTitle>{question.title}</ToggleTitle>
                                <ToggleDescription>{question.description}</ToggleDescription>
                            </ToggleLabel>
                        </ToggleInfo>
                        <Switch $active={isEnabled(question.type)} />
                    </ToggleHeader>
                </ToggleCard>
            ))}

            <ComingSoon>
                🔮 Custom questions coming soon in Pro Plan...
            </ComingSoon>

            <SaveButton onClick={() => onSave(localSchema)} $loading={isSaving} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Form'}
            </SaveButton>
        </Container>
    );
}
