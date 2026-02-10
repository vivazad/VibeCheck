import { useState } from 'react';
import styled from 'styled-components';

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 24px;
`;

const SettingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:last-child { border-bottom: none; }
`;

const SettingInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SettingLabel = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const SettingDescription = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Toggle = styled.button<{ $active: boolean }>`
  width: 48px;
  height: 24px;
  border-radius: 12px;
  background: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.border};
  border: none;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ $active }) => $active ? 'calc(100% - 22px)' : '2px'};
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: all 0.2s;
  }
`;

const SaveButton = styled.button`
  padding: 10px 24px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 24px;
  align-self: flex-end;
  &:disabled { opacity: 0.5; }
`;

interface TaskConfig {
    requireResolutionNote: boolean;
    requireResolutionProof: boolean;
    allowReassignment: boolean;
}

interface TaskGovernorProps {
    config: TaskConfig;
    onSave: (config: TaskConfig) => void;
    isSaving: boolean;
}

export function TaskGovernor({ config, onSave, isSaving }: TaskGovernorProps) {
    const [localConfig, setLocalConfig] = useState<TaskConfig>(config);

    const handleToggle = (key: keyof TaskConfig) => {
        setLocalConfig(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <Section>
            <div>
                <SectionTitle>Task Governance</SectionTitle>
                <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>
                    Control how tasks are resolved and delegated across your team.
                </p>
            </div>

            <Card>
                <SettingRow>
                    <SettingInfo>
                        <SettingLabel>Require Resolution Note</SettingLabel>
                        <SettingDescription>Force managers to leave a comment describing the fix.</SettingDescription>
                    </SettingInfo>
                    <Toggle
                        $active={localConfig.requireResolutionNote}
                        onClick={() => handleToggle('requireResolutionNote')}
                    />
                </SettingRow>

                <SettingRow>
                    <SettingInfo>
                        <SettingLabel>Require Photo Evidence</SettingLabel>
                        <SettingDescription>Resolution requires an uploaded photo of the action taken.</SettingDescription>
                    </SettingInfo>
                    <Toggle
                        $active={localConfig.requireResolutionProof}
                        onClick={() => handleToggle('requireResolutionProof')}
                    />
                </SettingRow>

                <SettingRow>
                    <SettingInfo>
                        <SettingLabel>Allow Task Transfers</SettingLabel>
                        <SettingDescription>Allow managers to reassign tasks to other staff members.</SettingDescription>
                    </SettingInfo>
                    <Toggle
                        $active={localConfig.allowReassignment}
                        onClick={() => handleToggle('allowReassignment')}
                    />
                </SettingRow>
            </Card>

            <SaveButton
                disabled={isSaving}
                onClick={() => onSave(localConfig)}
            >
                {isSaving ? 'Saving...' : 'Save Rules'}
            </SaveButton>
        </Section>
    );
}
