import { Tenant, Form } from '../../models/index';

describe('Model Integration Tests', () => {
    describe('Tenant Model', () => {
        it('should create a tenant successfully', async () => {
            const tenant = await Tenant.create({
                name: 'Test Restaurant',
                ownerEmail: 'owner@test.com',
                ownerPhone: '+1234567890',
                passwordHash: 'hashedpassword123',
            });

            expect(tenant._id).toBeDefined();
            expect(tenant.name).toBe('Test Restaurant');
            expect(tenant.ownerEmail).toBe('owner@test.com');
            expect(tenant.createdAt).toBeDefined();
        });

        it('should require mandatory fields', async () => {
            await expect(Tenant.create({
                name: 'Test',
            })).rejects.toThrow();
        });

        it('should have default theme config', async () => {
            const tenant = await Tenant.create({
                name: 'Test Store',
                ownerEmail: 'store@test.com',
                ownerPhone: '+1234567890',
                passwordHash: 'hash',
            });

            expect(tenant.themeConfig).toBeDefined();
            expect(tenant.themeConfig?.primaryColor).toBe('#6366f1');
            expect(tenant.themeConfig?.borderRadius).toBe(8);
        });
    });

    describe('Form Model', () => {
        let testTenant: any;

        beforeEach(async () => {
            testTenant = await Tenant.create({
                name: 'Form Test Tenant',
                ownerEmail: 'form@test.com',
                ownerPhone: '+1234567890',
                passwordHash: 'hash',
            });
        });

        it('should create a form with fields', async () => {
            const form = await Form.create({
                tenantId: testTenant._id,
                name: 'Feedback Form',
                active: true,
                fields: [
                    { id: 'nps', type: 'nps', label: 'How likely to recommend?', required: true },
                    { id: 'csat', type: 'csat', label: 'Rate your experience', required: true },
                ],
            });

            expect(form._id).toBeDefined();
            expect(form.name).toBe('Feedback Form');
            expect(form.fields.length).toBe(2);
            expect(form.fields[0].type).toBe('nps');
        });

        it('should link form to tenant', async () => {
            const form = await Form.create({
                tenantId: testTenant._id,
                name: 'Test Form',
                fields: [{ id: 'q1', type: 'text', label: 'Question', required: false }],
            });

            expect(form.tenantId.toString()).toBe(testTenant._id.toString());
        });

        it('should default active to true', async () => {
            const form = await Form.create({
                tenantId: testTenant._id,
                name: 'Default Form',
                fields: [],
            });

            expect(form.active).toBe(true);
        });
    });
});
