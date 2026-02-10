import { forwardRef, useRef, useEffect } from 'react';
import styled from 'styled-components';

interface TextFeedbackProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    type?: 'text' | 'tel';
}

const StyledInput = styled.input`
  width: 100%;
  padding: 16px 20px;
  background: ${({ theme }) => theme.colors.background};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  color: ${({ theme }) => theme.colors.text};
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
    opacity: 0.6;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 16px 20px;
  background: ${({ theme }) => theme.colors.background};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  color: ${({ theme }) => theme.colors.text};
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  resize: none;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s, height 0.2s;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
    opacity: 0.6;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CharacterCount = styled.div`
  text-align: right;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 8px;
`;

const Wrapper = styled.div`
  width: 100%;
`;

export const TextFeedback = forwardRef<HTMLTextAreaElement, TextFeedbackProps>(
    ({ type = 'text', ...props }, ref) => {
        const textareaRef = useRef<HTMLTextAreaElement | null>(null);

        // Auto-resize textarea
        useEffect(() => {
            const textarea = textareaRef.current;
            if (textarea && type === 'text') {
                const adjustHeight = () => {
                    textarea.style.height = 'auto';
                    textarea.style.height = `${Math.max(120, textarea.scrollHeight)}px`;
                };

                textarea.addEventListener('input', adjustHeight);
                adjustHeight();

                return () => textarea.removeEventListener('input', adjustHeight);
            }
        }, [type]);

        // Merge refs
        const setRefs = (node: HTMLTextAreaElement | null) => {
            textareaRef.current = node;
            if (typeof ref === 'function') {
                ref(node);
            } else if (ref) {
                ref.current = node;
            }
        };

        if (type === 'tel') {
            return (
                <StyledInput
                    type="tel"
                    ref={ref as React.Ref<HTMLInputElement>}
                    {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
                />
            );
        }

        return (
            <Wrapper>
                <StyledTextarea
                    ref={setRefs}
                    {...props}
                />
                {props.maxLength && (
                    <CharacterCount>
                        {(props.value as string)?.length || 0} / {props.maxLength}
                    </CharacterCount>
                )}
            </Wrapper>
        );
    }
);

TextFeedback.displayName = 'TextFeedback';
