import { useState, useRef, useEffect, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { QRCodeCanvas } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import apiClient from '../../api/client';

interface Store {
  _id: string;
  name: string;
  location?: string;
  storeCode?: string;
}

interface QRGeneratorProps {
  tenantId: string;
  tenantName: string;
  logoUrl?: string;
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
  margin-bottom: 8px;
`;

// Store Selection Section
const StoreSection = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 20px;
`;

const SectionTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

// Searchable Dropdown
const SearchDropdownWrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 14px 16px;
  padding-right: 40px;
  background: ${({ theme }) => theme.colors.background};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  color: ${({ theme }) => theme.colors.text};
  font-size: 15px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
    opacity: 0.7;
  }
`;

const DropdownList = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 300px;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 100;
`;

const DropdownItem = styled.div<{ $active: boolean }>`
  padding: 14px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  background: ${({ $active, theme }) => ($active ? `${theme.colors.primary}15` : 'transparent')};
  border-left: 3px solid ${({ $active, theme }) => ($active ? theme.colors.primary : 'transparent')};

  &:hover {
    background: ${({ theme }) => `${theme.colors.primary}10`};
  }
`;

const DropdownItemName = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const DropdownItemSub = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const SelectedBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: ${({ theme }) => `${theme.colors.primary}15`};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: 12px;
  margin-top: 12px;
`;

const SelectedName = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const ClearButton = styled.button`
  margin-left: auto;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  font-size: 18px;
  padding: 4px 8px;

  &:hover {
    color: ${({ theme }) => theme.colors.error || '#ef4444'};
  }
`;

const ActionRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
`;

// Modals
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${fadeIn} 0.2s ease;
`;

const ModalContent = styled.div<{ $wide?: boolean }>`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 16px;
  padding: 32px;
  width: 100%;
  max-width: ${({ $wide }) => ($wide ? '700px' : '450px')};
  max-height: 80vh;
  overflow-y: auto;
  animation: ${slideUp} 0.3s ease;
`;

const ModalTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 24px;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  gap: 10px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
    opacity: 0.6;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

// QR Display
const QRPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const QRContainer = styled.div`
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
`;

const QRStoreName = styled.p`
  text-align: center;
  font-weight: 600;
  color: #333;
  font-size: 16px;
  margin-bottom: 8px;
`;

const ScanLabel = styled.p`
  text-align: center;
  font-weight: 700;
  color: #333;
  font-size: 14px;
  margin-top: 8px;
  letter-spacing: 1px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' }>`
  padding: 12px 24px;
  background: ${({ $variant, theme }) =>
    $variant === 'secondary'
      ? 'transparent'
      : $variant === 'success'
        ? 'linear-gradient(135deg, #22c55e, #16a34a)'
        : `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`};
  border: ${({ $variant, theme }) =>
    $variant === 'secondary' ? `2px solid ${theme.colors.border}` : 'none'};
  border-radius: ${({ theme }) => theme.borderRadius}px;
  color: ${({ $variant, theme }) => ($variant === 'secondary' ? theme.colors.text : 'white')};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

// Branding Options
const BrandingSection = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 20px;
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const OptionItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const OptionLabel = styled.label`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
`;

const TextInput = styled.input`
  padding: 10px 14px;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ColorInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ColorPreview = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${({ $color }) => $color};
  border: 2px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  position: relative;
  overflow: hidden;

  input {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
`;

const ColorHex = styled.span`
  font-family: monospace;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const LinkPreview = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: 12px 16px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  word-break: break-all;
`;

const CopyLinkButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
  margin-left: 8px;

  &:hover {
    text-decoration: underline;
  }
`;

// Bulk Upload
const FileUploadZone = styled.div<{ $isDragOver?: boolean }>`
  border: 2px dashed ${({ $isDragOver, theme }) => ($isDragOver ? theme.colors.primary : theme.colors.border)};
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  background: ${({ $isDragOver, theme }) => ($isDragOver ? `${theme.colors.primary}10` : 'transparent')};
  transition: all 0.2s;
  cursor: pointer;
`;

const FileUploadIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const FileUploadText = styled.p`
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
  margin-bottom: 8px;
`;

const FileUploadSubtext = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 13px;
`;

const PreviewTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
  font-size: 13px;
`;

const PreviewTh = styled.th`
  text-align: left;
  padding: 10px 12px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 600;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const PreviewTd = styled.td`
  padding: 10px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
`;

const StatusBadge = styled.span<{ $status: 'success' | 'error' | 'pending' }>`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: ${({ $status }) =>
    $status === 'success' ? 'rgba(34, 197, 94, 0.15)' :
      $status === 'error' ? 'rgba(239, 68, 68, 0.15)' :
        'rgba(107, 114, 128, 0.15)'};
  color: ${({ $status }) =>
    $status === 'success' ? '#22c55e' :
      $status === 'error' ? '#ef4444' :
        '#6b7280'};
`;

const ProgressBar = styled.div`
  height: 8px;
  background: ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  overflow: hidden;
  margin: 16px 0;
`;

const ProgressFill = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  background: linear-gradient(90deg, #22c55e, #16a34a);
  transition: width 0.3s ease;
`;

const StoreCount = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export function QRGenerator({ tenantId, tenantName, logoUrl: defaultLogo }: QRGeneratorProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stores state
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  // Search/dropdown state
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Create store modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreLocation, setNewStoreLocation] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Bulk upload modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStores, setBulkStores] = useState<Array<{ name: string; location?: string; storeCode?: string }>>([]);
  const [bulkError, setBulkError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  // PDF generation state
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Branding state
  const [logoUrl, setLogoUrl] = useState(defaultLogo || '');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');

  // Fetch stores on mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await apiClient.get('/stores');
        setStores(response.data.data.stores || []);
      } catch (error) {
        console.error('Failed to fetch stores:', error);
      }
    };
    fetchStores();
  }, []);

  // Filtered stores based on search
  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) return stores;
    const q = searchQuery.toLowerCase();
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.location?.toLowerCase().includes(q) ||
        s.storeCode?.toLowerCase().includes(q)
    );
  }, [stores, searchQuery]);

  // Generate link URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://vibecheck.app';
  const staticLink = selectedStore
    ? `${baseUrl}/rate?t=${tenantId}&store=${selectedStore._id}&src=static_qr`
    : `${baseUrl}/rate?t=${tenantId}&src=static_qr`;

  const downloadQR = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;

    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    const fileName = selectedStore
      ? `vibecheck-qr-${selectedStore.name.replace(/\s+/g, '-').toLowerCase()}.png`
      : `vibecheck-qr-${tenantName.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.download = fileName;
    link.click();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(staticLink);
  };

  const testLink = () => {
    window.open(staticLink, '_blank');
  };

  const handleCreateStore = async () => {
    if (!newStoreName.trim()) return;

    setIsCreating(true);
    try {
      const response = await apiClient.post('/stores', {
        name: newStoreName.trim(),
        location: newStoreLocation.trim() || undefined,
      });
      const newStore = response.data.data.store;
      setStores((prev) => [...prev, newStore]);
      setSelectedStore(newStore);
      setShowCreateModal(false);
      setNewStoreName('');
      setNewStoreLocation('');
    } catch (error) {
      console.error('Failed to create store:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Excel file handling
  const handleFileUpload = (file: File) => {
    setBulkError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Array<Record<string, unknown>>;

        // Map columns (flexible column names)
        const mapped = jsonData.map((row) => ({
          name: String(row['name'] || row['Name'] || row['Store Name'] || row['store_name'] || row['StoreName'] || '').trim(),
          location: String(row['location'] || row['Location'] || row['Address'] || row['address'] || '').trim() || undefined,
          storeCode: String(row['storeCode'] || row['Store Code'] || row['store_code'] || row['Code'] || row['code'] || '').trim() || undefined,
        }));

        // Filter out rows without names
        const valid = mapped.filter((s) => s.name);

        if (valid.length === 0) {
          setBulkError('No valid stores found. Make sure your Excel has a "Name" column.');
          return;
        }

        if (valid.length > 500) {
          setBulkError(`Too many stores (${valid.length}). Maximum 500 allowed per upload.`);
          return;
        }

        setBulkStores(valid);
      } catch (err) {
        setBulkError('Failed to parse Excel file. Please check the format.');
        console.error('Excel parse error:', err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkUpload = async () => {
    if (bulkStores.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const response = await apiClient.post('/stores/bulk', { stores: bulkStores });
      setUploadProgress(100);
      const created = response.data.data.stores;
      setStores((prev) => [...prev, ...created]);
      setTimeout(() => {
        setShowBulkModal(false);
        setBulkStores([]);
        setUploadProgress(0);
      }, 500);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      setBulkError(err.response?.data?.error || 'Failed to upload stores');
    } finally {
      setIsUploading(false);
    }
  };

  // Generate PDF with 4 QR codes per page
  const generateBulkPDF = async () => {
    if (stores.length === 0) return;

    setIsGeneratingPDF(true);

    try {
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const qrSize = 80;

      // Calculate positions for 2x2 grid
      const colWidth = (pageWidth - 2 * margin) / 2;
      const rowHeight = (pageHeight - 2 * margin) / 2;

      const positions = [
        { x: margin + (colWidth - qrSize) / 2, y: margin + 20 },
        { x: margin + colWidth + (colWidth - qrSize) / 2, y: margin + 20 },
        { x: margin + (colWidth - qrSize) / 2, y: margin + rowHeight + 20 },
        { x: margin + colWidth + (colWidth - qrSize) / 2, y: margin + rowHeight + 20 },
      ];

      for (let i = 0; i < stores.length; i++) {
        const store = stores[i];
        const posIndex = i % 4;
        const pos = positions[posIndex];

        // Add new page every 4 stores (except first)
        if (i > 0 && posIndex === 0) {
          pdf.addPage();
        }

        // Create temporary canvas for this store's QR
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 400;
        tempCanvas.height = 400;
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);

        // Render QR to temp canvas using a simple data URL approach
        const qrValue = `${baseUrl}/rate?t=${tenantId}&store=${store._id}&src=static_qr`;

        // Use dynamic import for QR generation
        const QRCode = await import('qrcode');
        const qrDataUrl = await QRCode.toDataURL(qrValue, {
          width: 300,
          margin: 2,
          color: {
            dark: fgColor,
            light: bgColor,
          },
        });

        // Add QR code to PDF
        pdf.addImage(qrDataUrl, 'PNG', pos.x, pos.y, qrSize, qrSize);

        // Add store name above QR
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        const nameWidth = pdf.getTextWidth(store.name);
        pdf.text(store.name, pos.x + (qrSize - nameWidth) / 2, pos.y - 5);

        // Add "SCAN TO RATE" below QR
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const scanText = 'SCAN TO RATE';
        const scanWidth = pdf.getTextWidth(scanText);
        pdf.text(scanText, pos.x + (qrSize - scanWidth) / 2, pos.y + qrSize + 8);

        // Add location if available
        if (store.location) {
          pdf.setFontSize(8);
          pdf.setTextColor(100);
          const locWidth = pdf.getTextWidth(store.location);
          pdf.text(store.location, pos.x + (qrSize - locWidth) / 2, pos.y + qrSize + 14);
          pdf.setTextColor(0);
        }

        // Clean up temp elements
        document.body.removeChild(tempDiv);
      }

      // Save PDF
      pdf.save(`vibecheck-qr-codes-${tenantName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const isValidLogoUrl = logoUrl && (logoUrl.startsWith('http://') || logoUrl.startsWith('https://') || logoUrl.startsWith('data:'));

  return (
    <Container>
      <div>
        <Title>Get Your Feedback Code</Title>
        <Description>
          Print this QR code and place it on tables, receipts, delivery bags, or anywhere customers can scan it.
        </Description>
      </div>

      {/* Store Selection with Searchable Dropdown */}
      <StoreSection>
        <SectionTitle>🏪 Select Store Location</SectionTitle>

        <StoreCount>
          📊 <strong>{stores.length}</strong> store{stores.length !== 1 ? 's' : ''} registered
        </StoreCount>

        <div style={{ marginTop: 16 }}>
          <SearchDropdownWrapper>
            <SearchInput
              type="text"
              placeholder="Search or select a store..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />

            {showDropdown && (
              <DropdownList>
                {/* Default option */}
                <DropdownItem
                  $active={selectedStore === null}
                  onClick={() => {
                    setSelectedStore(null);
                    setShowDropdown(false);
                    setSearchQuery('');
                  }}
                >
                  <span>🏢</span>
                  <div>
                    <DropdownItemName>{tenantName} (Default)</DropdownItemName>
                    <DropdownItemSub>All locations</DropdownItemSub>
                  </div>
                </DropdownItem>

                {/* Filtered stores */}
                {filteredStores.slice(0, 20).map((store) => (
                  <DropdownItem
                    key={store._id}
                    $active={selectedStore?._id === store._id}
                    onClick={() => {
                      setSelectedStore(store);
                      setShowDropdown(false);
                      setSearchQuery('');
                    }}
                  >
                    <span>📍</span>
                    <div>
                      <DropdownItemName>{store.name}</DropdownItemName>
                      {store.location && <DropdownItemSub>{store.location}</DropdownItemSub>}
                    </div>
                  </DropdownItem>
                ))}

                {filteredStores.length > 20 && (
                  <DropdownItem $active={false} onClick={() => { }}>
                    <DropdownItemSub>...and {filteredStores.length - 20} more. Type to search.</DropdownItemSub>
                  </DropdownItem>
                )}
              </DropdownList>
            )}
          </SearchDropdownWrapper>

          {/* Selected store badge */}
          {selectedStore && (
            <SelectedBadge>
              <span>📍</span>
              <SelectedName>{selectedStore.name}</SelectedName>
              {selectedStore.location && (
                <span style={{ opacity: 0.7 }}>({selectedStore.location})</span>
              )}
              <ClearButton onClick={() => setSelectedStore(null)}>✕</ClearButton>
            </SelectedBadge>
          )}
        </div>

        <ActionRow>
          <Button $variant="secondary" onClick={() => setShowCreateModal(true)}>
            ➕ Add Store
          </Button>
          <Button $variant="secondary" onClick={() => setShowBulkModal(true)}>
            📤 Bulk Upload (Excel)
          </Button>
          {stores.length > 0 && (
            <Button
              $variant="success"
              onClick={generateBulkPDF}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? '⏳ Generating...' : '📄 Download All QR (PDF)'}
            </Button>
          )}
        </ActionRow>
      </StoreSection>

      {/* Branding Options */}
      <BrandingSection>
        <SectionTitle>🎨 Customize Your QR Code</SectionTitle>
        <OptionsGrid>
          <OptionItem>
            <OptionLabel>Logo URL (optional)</OptionLabel>
            <TextInput
              type="url"
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </OptionItem>

          <OptionItem>
            <OptionLabel>Foreground Color</OptionLabel>
            <ColorInputWrapper>
              <ColorPreview $color={fgColor}>
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                />
              </ColorPreview>
              <ColorHex>{fgColor.toUpperCase()}</ColorHex>
            </ColorInputWrapper>
          </OptionItem>

          <OptionItem>
            <OptionLabel>Background Color</OptionLabel>
            <ColorInputWrapper>
              <ColorPreview $color={bgColor}>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                />
              </ColorPreview>
              <ColorHex>{bgColor.toUpperCase()}</ColorHex>
            </ColorInputWrapper>
          </OptionItem>
        </OptionsGrid>
      </BrandingSection>

      {/* QR Code Preview */}
      <QRPanel>
        <QRContainer ref={qrRef}>
          <QRStoreName style={{ color: fgColor }}>
            {selectedStore ? `📍 ${selectedStore.name}` : `🏢 ${tenantName}`}
          </QRStoreName>
          <QRCodeCanvas
            value={staticLink}
            size={200}
            fgColor={fgColor}
            bgColor={bgColor}
            level="H"
            imageSettings={
              isValidLogoUrl
                ? {
                  src: logoUrl,
                  height: 40,
                  width: 40,
                  excavate: true,
                }
                : undefined
            }
          />
          <ScanLabel style={{ color: fgColor }}>SCAN TO RATE</ScanLabel>
        </QRContainer>

        <ButtonGroup>
          <Button onClick={downloadQR}>📥 Download PNG</Button>
          <Button $variant="secondary" onClick={testLink}>
            🔗 Test Link
          </Button>
        </ButtonGroup>

        <LinkPreview>
          {staticLink}
          <CopyLinkButton onClick={copyLink}>Copy</CopyLinkButton>
        </LinkPreview>
      </QRPanel>

      {/* Close dropdown when clicking outside */}
      {showDropdown && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
          }}
          onClick={() => setShowDropdown(false)}
        />
      )}

      {/* Create Store Modal */}
      {showCreateModal && (
        <ModalOverlay onClick={() => setShowCreateModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>➕ Add New Store</ModalTitle>
            <FormGroup>
              <Label>Store Name *</Label>
              <Input
                type="text"
                placeholder="e.g., Downtown Branch"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                autoFocus
              />
            </FormGroup>
            <FormGroup>
              <Label>Location (optional)</Label>
              <Input
                type="text"
                placeholder="e.g., 123 Main St, City"
                value={newStoreLocation}
                onChange={(e) => setNewStoreLocation(e.target.value)}
              />
            </FormGroup>
            <ModalActions>
              <Button $variant="secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateStore} disabled={!newStoreName.trim() || isCreating}>
                {isCreating ? 'Creating...' : 'Create Store'}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <ModalOverlay onClick={() => !isUploading && setShowBulkModal(false)}>
          <ModalContent $wide onClick={(e) => e.stopPropagation()}>
            <ModalTitle>📤 Bulk Import Stores from Excel</ModalTitle>

            {bulkStores.length === 0 ? (
              <>
                <FileUploadZone
                  $isDragOver={isDragOver}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleFileUpload(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUploadIcon>📁</FileUploadIcon>
                  <FileUploadText>Drop Excel file here or click to browse</FileUploadText>
                  <FileUploadSubtext>
                    Supports .xlsx, .xls files. Max 500 stores.
                    <br />
                    Columns: Name (required), Location, Store Code
                  </FileUploadSubtext>
                </FileUploadZone>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </>
            ) : (
              <>
                <StatusBadge $status="success">
                  ✓ {bulkStores.length} stores ready to import
                </StatusBadge>

                <PreviewTable>
                  <thead>
                    <tr>
                      <PreviewTh>#</PreviewTh>
                      <PreviewTh>Store Name</PreviewTh>
                      <PreviewTh>Location</PreviewTh>
                      <PreviewTh>Code</PreviewTh>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkStores.slice(0, 10).map((s, i) => (
                      <tr key={i}>
                        <PreviewTd>{i + 1}</PreviewTd>
                        <PreviewTd>{s.name}</PreviewTd>
                        <PreviewTd>{s.location || '—'}</PreviewTd>
                        <PreviewTd>{s.storeCode || '—'}</PreviewTd>
                      </tr>
                    ))}
                  </tbody>
                </PreviewTable>

                {bulkStores.length > 10 && (
                  <p style={{ marginTop: 8, fontSize: 13, color: '#9ca3af' }}>
                    ...and {bulkStores.length - 10} more stores
                  </p>
                )}

                {isUploading && (
                  <ProgressBar>
                    <ProgressFill $percent={uploadProgress} />
                  </ProgressBar>
                )}
              </>
            )}

            {bulkError && (
              <StatusBadge $status="error" style={{ marginTop: 16, display: 'block' }}>
                ❌ {bulkError}
              </StatusBadge>
            )}

            <ModalActions>
              <Button
                $variant="secondary"
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkStores([]);
                  setBulkError('');
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
              {bulkStores.length > 0 && (
                <>
                  <Button
                    $variant="secondary"
                    onClick={() => {
                      setBulkStores([]);
                      setBulkError('');
                    }}
                    disabled={isUploading}
                  >
                    Clear
                  </Button>
                  <Button onClick={handleBulkUpload} disabled={isUploading}>
                    {isUploading ? `Uploading... ${uploadProgress}%` : `Import ${bulkStores.length} Stores`}
                  </Button>
                </>
              )}
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}
