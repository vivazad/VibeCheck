import { useState } from 'react';
import styled from 'styled-components';
import * as Dialog from '@radix-ui/react-dialog';
import * as Avatar from '@radix-ui/react-avatar';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import toast from 'react-hot-toast';
import { X, UserPlus, Shield, User } from 'lucide-react';

// --- Styled Components for Radix UI ---
const Overlay = styled(Dialog.Overlay)`
  background: rgba(0, 0, 0, 0.5);
  position: fixed;
  inset: 0;
  z-index: 50;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const Content = styled(Dialog.Content)`
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 450px;
  padding: 24px;
  z-index: 51;
  animation: slideUp 0.2s ease-out;

  &:focus {
    outline: none;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translate(-50%, -45%); }
    to { opacity: 1; transform: translate(-50%, -50%); }
  }
`;

const DialogTitle = styled(Dialog.Title)`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const DialogDescription = styled(Dialog.Description)`
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 24px;
  font-size: 14px;
`;

const CloseButton = styled(Dialog.Close)`
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  
  &:hover {
    color: #4b5563;
  }
`;

// --- Table Components ---
const Container = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  overflow: hidden;
`;

const Header = styled.div`
  padding: 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 700;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 16px 24px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.textSecondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Td = styled.td`
  padding: 16px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  vertical-align: middle;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AvatarImage = styled(Avatar.Image)`
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 50%;
`;

const AvatarFallback = styled(Avatar.Fallback)`
  width: 40px;
  height: 40px;
  background: #e0e7ff;
  color: #4f46e5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const UserEmail = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Badge = styled.span<{ $role?: 'admin' | 'manager'; $status?: 'active' | 'invited' }>`
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  ${({ $role }) =>
    $role === 'admin' && `
    background: #e0e7ff;
    color: #4338ca;
  `}

  ${({ $role }) =>
    $role === 'manager' && `
    background: #f3f4f6;
    color: #374151;
  `}

  ${({ $status }) =>
    $status === 'active' && `
    background: #dcfce7;
    color: #166534;
  `}

  ${({ $status }) =>
    $status === 'invited' && `
    background: #fef9c3;
    color: #854d0e;
  `}
`;

const ActionButton = styled.button`
  background: #4f46e5;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

// --- Invite Form ---
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
  }
`;

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager']),
});

type InviteInputs = z.infer<typeof inviteSchema>;

const Select = styled.select`
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  width: 100%;
  background: white;
`;

export function Team() {
  const [isOpen, setIsOpen] = useState(false);
  // Mock data for now, replace with API call
  const [users, setUsers] = useState([
    { id: 1, name: 'Alex Johnson', email: 'alex@example.com', role: 'admin', status: 'active', avatar: 'https://i.pravatar.cc/150?u=1' },
    { id: 2, name: 'Sarah Smith', email: 'sarah@example.com', role: 'manager', status: 'invited', avatar: null },
  ]);

  const { register, handleSubmit, reset } = useForm<InviteInputs>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'manager' }
  });

  const onInvite = async (data: InviteInputs) => {
    // API Call to /auth/invite would go here
    console.log('Inviting:', data);

    // Optimistic update
    setUsers([...users, {
      id: Date.now(),
      name: 'Invited User',
      email: data.email,
      role: data.role,
      status: 'invited',
      avatar: null
    } as any]);

    toast.success(`Invited ${data.email} as ${data.role}`);
    setIsOpen(false);
    reset();
  };

  return (
    <Container>
      <Header>
        <Title>Team Members</Title>
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
          <Dialog.Trigger asChild>
            <ActionButton>
              <UserPlus size={18} />
              Invite Member
            </ActionButton>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Overlay />
            <Content>
              <DialogTitle>Invite a team member</DialogTitle>
              <DialogDescription>
                Send an invitation link to join your team. They can set up their account details.
              </DialogDescription>

              <Form onSubmit={handleSubmit(onInvite)}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500 }}>Email Address</label>
                  <Input placeholder="colleague@company.com" {...register('email')} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500 }}>Role</label>
                  <Select {...register('role')}>
                    <option value="manager">Manager (View Only)</option>
                    <option value="admin">Admin (Full Access)</option>
                  </Select>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <ActionButton type="submit" style={{ flex: 1, justifyContent: 'center' }}>Send Invite</ActionButton>
                </div>
              </Form>

              <CloseButton>
                <X size={20} />
              </CloseButton>
            </Content>
          </Dialog.Portal>
        </Dialog.Root>
      </Header>

      <Table>
        <thead>
          <tr>
            <Th>User</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <Td>
                <UserInfo>
                  <Avatar.Root>
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar.Root>
                  <UserDetails>
                    <UserName>{user.name}</UserName>
                    <UserEmail>{user.email}</UserEmail>
                  </UserDetails>
                </UserInfo>
              </Td>
              <Td>
                <Badge $role={user.role as 'admin' | 'manager'}>
                  {user.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                  {user.role === 'admin' ? 'Admin' : 'Manager'}
                </Badge>
              </Td>
              <Td>
                <Badge $status={user.status as 'active' | 'invited'}>
                  {user.status === 'active' ? 'Active' : 'Invited'}
                </Badge>
              </Td>
              <Td>
                {/* Actions dropdown could go here */}
                ...
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}
