import { useState } from 'react';
import styled from 'styled-components';
import { ChromePicker, ColorResult } from 'react-color';

interface ThemeConfig {
    primaryColor: string;
    backgroundColor: string;
    logoUrl?: string;
    borderRadius: number;
    greetingTitle: string;
    greetingMessage: string;
}

interface ThemeEditorProps {
    config: ThemeConfig;
    onSave: (config: ThemeConfig) => void;
    isSaving?: boolean;
}

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ControlsPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 16px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const Input = styled.input`
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.background};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius}px;
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ColorSwatch = styled.div<{ $color: string }>`
  width: 100%;
  height: 44px;
  background: ${({ $color }) => $color};
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.02);
  }
`;

const ColorPickerWrapper = styled.div`
  position: absolute;
  z-index: 100;
  margin-top: 8px;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
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
  margin-top: 16px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
  }
`;

const Hint = styled.small`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
`;

// Preview Panel Styles
const PreviewContainer = styled.div`
  background: #1a1a23;
  padding: 24px;
  border-radius: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const MobileMockup = styled.div<{ $bgColor: string }>`
  width: 320px;
  height: 580px;
  background: ${({ $bgColor }) => $bgColor};
  border: 10px solid #333;
  border-radius: 36px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
`;

const StatusBar = styled.div`
  height: 24px;
  background: #333;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Notch = styled.div`
  width: 80px;
  height: 20px;
  background: #1a1a1a;
  border-radius: 0 0 12px 12px;
`;

const MockupContent = styled.div`
  padding: 24px 20px;
  text-align: center;
`;

const MockLogo = styled.img`
  height: 48px;
  margin-bottom: 20px;
  object-fit: contain;
`;

const MockTitle = styled.h2`
  color: white;
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const MockMessage = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin-bottom: 32px;
`;

const MockNPSRow = styled.div`
  display: flex;
  gap: 4px;
  justify-content: center;
  margin-bottom: 24px;
`;

const MockNPSButton = styled.div<{ $primary: string; $active?: boolean }>`
  width: 28px;
  height: 28px;
  background: ${({ $active, $primary }) => ($active ? $primary : 'rgba(255,255,255,0.1)')};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: ${({ $active }) => ($active ? 'white' : 'rgba(255,255,255,0.5)')};
`;

const MockSubmitButton = styled.button<{ $primary: string; $radius: number }>`
  width: 100%;
  padding: 14px;
  background: ${({ $primary }) => $primary};
  color: white;
  border: none;
  border-radius: ${({ $radius }) => $radius}px;
  font-weight: 600;
  font-size: 14px;
  margin-top: 16px;
`;

export function ThemeEditor({ config, onSave, isSaving }: ThemeEditorProps) {
    const [localConfig, setLocalConfig] = useState<ThemeConfig>(config);
    const [activeColorPicker, setActiveColorPicker] = useState<'primary' | 'background' | null>(null);

    const handleColorChange = (color: ColorResult, field: 'primaryColor' | 'backgroundColor') => {
        setLocalConfig((prev) => ({ ...prev, [field]: color.hex }));
    };

    const handleInputChange = (field: keyof ThemeConfig, value: string | number) => {
        setLocalConfig((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <Container>
            {/* LEFT: CONTROLS */}
            <ControlsPanel>
                <SectionTitle>Brand Customization</SectionTitle>

                <InputGroup style={{ position: 'relative' }}>
                    <Label>Primary Color</Label>
                    <ColorSwatch
                        $color={localConfig.primaryColor}
                        onClick={() => setActiveColorPicker(activeColorPicker === 'primary' ? null : 'primary')}
                    />
                    {activeColorPicker === 'primary' && (
                        <>
                            <Overlay onClick={() => setActiveColorPicker(null)} />
                            <ColorPickerWrapper>
                                <ChromePicker
                                    color={localConfig.primaryColor}
                                    onChange={(c) => handleColorChange(c, 'primaryColor')}
                                />
                            </ColorPickerWrapper>
                        </>
                    )}
                </InputGroup>

                <InputGroup style={{ position: 'relative' }}>
                    <Label>Background Color</Label>
                    <ColorSwatch
                        $color={localConfig.backgroundColor}
                        onClick={() => setActiveColorPicker(activeColorPicker === 'background' ? null : 'background')}
                    />
                    {activeColorPicker === 'background' && (
                        <>
                            <Overlay onClick={() => setActiveColorPicker(null)} />
                            <ColorPickerWrapper>
                                <ChromePicker
                                    color={localConfig.backgroundColor}
                                    onChange={(c) => handleColorChange(c, 'backgroundColor')}
                                />
                            </ColorPickerWrapper>
                        </>
                    )}
                </InputGroup>

                <InputGroup>
                    <Label>Logo URL</Label>
                    <Input
                        type="text"
                        value={localConfig.logoUrl || ''}
                        placeholder="https://example.com/logo.png"
                        onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                    />
                    <Hint>Paste a direct link to your transparent PNG.</Hint>
                </InputGroup>

                <InputGroup>
                    <Label>Welcome Title</Label>
                    <Input
                        type="text"
                        value={localConfig.greetingTitle}
                        onChange={(e) => handleInputChange('greetingTitle', e.target.value)}
                    />
                </InputGroup>

                <InputGroup>
                    <Label>Welcome Message</Label>
                    <Input
                        type="text"
                        value={localConfig.greetingMessage}
                        onChange={(e) => handleInputChange('greetingMessage', e.target.value)}
                    />
                </InputGroup>

                <InputGroup>
                    <Label>Button Radius</Label>
                    <Input
                        type="number"
                        min={0}
                        max={24}
                        value={localConfig.borderRadius}
                        onChange={(e) => handleInputChange('borderRadius', parseInt(e.target.value) || 0)}
                    />
                </InputGroup>

                <SaveButton onClick={() => onSave(localConfig)} $loading={isSaving} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </SaveButton>
            </ControlsPanel>

            {/* RIGHT: LIVE PREVIEW */}
            <PreviewContainer>
                <MobileMockup $bgColor={localConfig.backgroundColor}>
                    <StatusBar>
                        <Notch />
                    </StatusBar>
                    <MockupContent>
                        {localConfig.logoUrl && <MockLogo src={localConfig.logoUrl} alt="Logo" />}
                        <MockTitle>{localConfig.greetingTitle}</MockTitle>
                        <MockMessage>{localConfig.greetingMessage}</MockMessage>

                        <MockNPSRow>
                            {Array.from({ length: 11 }, (_, i) => (
                                <MockNPSButton
                                    key={i}
                                    $primary={localConfig.primaryColor}
                                    $active={i === 9}
                                >
                                    {i}
                                </MockNPSButton>
                            ))}
                        </MockNPSRow>

                        <MockSubmitButton $primary={localConfig.primaryColor} $radius={localConfig.borderRadius}>
                            Submit Feedback
                        </MockSubmitButton>
                    </MockupContent>
                </MobileMockup>
            </PreviewContainer>
        </Container>
    );
}
