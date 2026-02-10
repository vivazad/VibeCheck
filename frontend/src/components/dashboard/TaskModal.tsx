import { useState } from 'react';
import styled from 'styled-components';
import apiClient from '../../api/client';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  width: 100%;
  max-width: 500px;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  color: ${({ theme }) => theme.colors.text};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Input = styled.input`
  padding: 10px;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.text};
  &:focus { border-color: ${({ theme }) => theme.colors.primary}; outline: none; }
`;

const TextArea = styled.textarea`
  padding: 10px;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.text};
  min-height: 80px;
  resize: vertical;
  &:focus { border-color: ${({ theme }) => theme.colors.primary}; outline: none; }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 12px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  background: ${({ $variant, theme }) => $variant === 'primary' ? theme.colors.primary : 'transparent'};
  color: ${({ $variant, theme }) => $variant === 'primary' ? 'white' : theme.colors.textSecondary};
  border: 1px solid ${({ $variant, theme }) => $variant === 'primary' ? theme.colors.primary : theme.colors.border};
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

interface TaskModalProps {
    task: any;
    mode: 'resolve' | 'delegate';
    config: any;
    onClose: () => void;
    onSuccess: () => void;
}

export function TaskModal({ task, mode, config, onClose, onSuccess }: TaskModalProps) {
    const [isSaving, setIsSaving] = useState(false);

    // Resolve states
    const [note, setNote] = useState('');
    const [proofUrl, setProofUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    // Delegate states
    const [newEmail, setNewEmail] = useState('');
    const [newDueDate, setNewDueDate] = useState('');
    const [reason, setReason] = useState('');

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const res = await apiClient.uploadFile(file);
            setProofUrl(res.data.url);
        } catch (err) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleResolve = async () => {
        setIsSaving(true);
        try {
            await apiClient.resolveTask(task._id, note || undefined);
            // In a real app, since we updated TaskController to check for proof, 
            // we'd need to send it if config demands. resolveTask helper might need update.
            // Let's assume resolveTask(id, note) is what we have in helper but we can pass more.
            // Actually apiClient.resolveTask(id, note) in client.ts only takes note.
            // Let's use raw api to send proofUrl.
            if (proofUrl) {
                await apiClient.post(`/tasks/${task._id}/resolve`, { note, proofUrl });
            } else {
                await apiClient.resolveTask(task._id, note);
            }
            onSuccess();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to resolve');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelegate = async () => {
        setIsSaving(true);
        try {
            await apiClient.reassignTask(task._id, { newEmail, newDueDate, reason });
            onSuccess();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delegate');
        } finally {
            setIsSaving(false);
        }
    };

    const isResolveDisabled = (config.requireResolutionNote && !note) ||
        (config.requireResolutionProof && !proofUrl) ||
        isSaving || uploading;

    const isDelegateDisabled = !newEmail || isSaving;

    return (
        <Overlay onClick={onClose}>
            <Modal onClick={e => e.stopPropagation()}>
                <Title>{mode === 'resolve' ? 'Resolve Task' : 'Transfer Task'}</Title>

                {mode === 'resolve' ? (
                    <>
                        {config.requireResolutionNote && (
                            <FormGroup>
                                <Label>Resolution Note*</Label>
                                <TextArea
                                    placeholder="Describe how the issue was fixed..."
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                />
                            </FormGroup>
                        )}
                        {!config.requireResolutionNote && (
                            <FormGroup>
                                <Label>Note (Optional)</Label>
                                <TextArea
                                    placeholder="Any additional comments..."
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                />
                            </FormGroup>
                        )}

                        {config.requireResolutionProof && (
                            <FormGroup>
                                <Label>Photo Evidence*</Label>
                                <Input type="file" accept="image/*" onChange={handleFileUpload} />
                                {uploading && <span style={{ fontSize: '12px' }}>Uploading...</span>}
                                {proofUrl && <span style={{ fontSize: '12px', color: '#10b981' }}>✓ Image Uploaded</span>}
                            </FormGroup>
                        )}
                    </>
                ) : (
                    <>
                        <FormGroup>
                            <Label>New Assignee Email*</Label>
                            <Input
                                type="email"
                                placeholder="chef@restaurant.com"
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label>New Due Date</Label>
                            <Input
                                type="date"
                                value={newDueDate}
                                onChange={e => setNewDueDate(e.target.value)}
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label>Transfer Reason</Label>
                            <TextArea
                                placeholder="Why are you transferring this?"
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                            />
                        </FormGroup>
                    </>
                )}

                <ButtonGroup>
                    <Button $variant="secondary" onClick={onClose}>Cancel</Button>
                    {mode === 'resolve' ? (
                        <Button $variant="primary" disabled={isResolveDisabled} onClick={handleResolve}>
                            {isSaving ? 'Resolving...' : 'Complete Resolution'}
                        </Button>
                    ) : (
                        <Button $variant="primary" disabled={isDelegateDisabled} onClick={handleDelegate}>
                            {isSaving ? 'Transferring...' : 'Transfer Task'}
                        </Button>
                    )}
                </ButtonGroup>
            </Modal>
        </Overlay>
    );
}
