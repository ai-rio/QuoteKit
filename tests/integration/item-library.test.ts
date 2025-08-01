/**
 * Item Library Management Integration Tests
 * 
 * Tests the item library functionality that allows users to build
 * and manage their catalog of services and materials.
 */

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { 
  getLineItems, 
  createLineItem, 
  updateLineItem, 
  deleteLineItem,
  updateItemLastUsed 
} from '@/features/items/actions';
import { LineItem, ItemCategory } from '@/features/items/types';

// Mock Supabase client
jest.mock('@/libs/supabase/supabase-server-client');

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          limit: jest.fn(),
        })),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
};

(createSupabaseServerClient as jest.Mock).mockResolvedValue(mockSupabase);

describe('Item Library Management Integration Tests', () => {
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
  };

  const sampleLineItems: LineItem[] = [
    {
      id: 'item-1',
      user_id: mockUser.id,
      name: 'Lawn Mowing',
      unit: 'sq ft',
      cost: 0.05,
      category: 'Maintenance',
      tags: ['lawn', 'mowing', 'weekly'],
      is_favorite: true,
      last_used_at: '2024-01-15T10:00:00Z',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 'item-2',
      user_id: mockUser.id,
      name: 'Hedge Trimming',
      unit: 'linear ft',
      cost: 2.50,
      category: 'Maintenance',
      tags: ['hedge', 'trimming', 'seasonal'],
      is_favorite: false,
      last_used_at: null,
      created_at: '2024-01-02T10:00:00Z',
      updated_at: '2024-01-02T10:00:00Z',
    },
    {
      id: 'item-3',
      user_id: mockUser.id,
      name: 'Fertilizer Application',
      unit: 'application',
      cost: 75.00,
      category: 'Treatment',
      tags: ['fertilizer', 'treatment', 'seasonal'],
      is_favorite: true,
      last_used_at: '2024-01-10T10:00:00Z',
      created_at: '2024-01-03T10:00:00Z',
      updated_at: '2024-01-10T10:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('Item Retrieval', () => {
    test('should retrieve all line items for authenticated user', async () => {
      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: sampleLineItems,
        error: null,
      });

      const result = await getLineItems();

      expect(result.error).toBeNull();
      expect(result.data).toEqual(sampleLineItems);
      expect(mockSupabase.from).toHaveBeenCalledWith('line_items');
    });

    test('should return empty array when no items exist', async () => {
      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getLineItems();

      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });

    test('should handle authentication failure', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const result = await getLineItems();

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe('User not authenticated');
      expect(result.data).toBeNull();
    });

    test('should handle database errors', async () => {
      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'DB_ERROR' },
      });

      const result = await getLineItems();

      expect(result.error).not.toBeNull();
      expect(result.data).toBeNull();
    });
  });

  describe('Item Creation', () => {
    test('should create a new line item successfully', async () => {
      const newItem: LineItem = {
        id: 'item-new',
        user_id: mockUser.id,
        name: 'Tree Pruning',
        unit: 'tree',
        cost: 150.00,
        category: 'Tree Care',
        tags: ['tree', 'pruning', 'seasonal'],
        is_favorite: false,
        last_used_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: newItem,
        error: null,
      });

      const formData = new FormData();
      formData.append('name', 'Tree Pruning');
      formData.append('unit', 'tree');
      formData.append('cost', '150.00');
      formData.append('category', 'Tree Care');

      const result = await createLineItem(formData);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(newItem);
      expect(mockSupabase.from).toHaveBeenCalledWith('line_items');
    });

    test('should validate required fields', async () => {
      const formData = new FormData();
      // Missing required name field
      formData.append('unit', 'tree');
      formData.append('cost', '150.00');

      const result = await createLineItem(formData);

      expect(result.error).not.toBeNull();
      expect(result.data).toBeNull();
    });

    test('should validate cost is a positive number', async () => {
      const formData = new FormData();
      formData.append('name', 'Invalid Service');
      formData.append('unit', 'hour');
      formData.append('cost', '-50.00'); // Negative cost

      const result = await createLineItem(formData);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('Cost must be a positive number');
      expect(result.data).toBeNull();
    });

    test('should handle duplicate item names gracefully', async () => {
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'duplicate key value violates unique constraint', code: '23505' },
      });

      const formData = new FormData();
      formData.append('name', 'Lawn Mowing'); // Duplicate name
      formData.append('unit', 'sq ft');
      formData.append('cost', '0.05');

      const result = await createLineItem(formData);

      expect(result.error).not.toBeNull();
      expect(result.data).toBeNull();
    });
  });

  describe('Item Updates', () => {
    test('should update an existing line item successfully', async () => {
      const updatedItem: LineItem = {
        ...sampleLineItems[0],
        cost: 0.06, // Updated cost
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: updatedItem,
        error: null,
      });

      const formData = new FormData();
      formData.append('name', updatedItem.name);
      formData.append('unit', updatedItem.unit || '');
      formData.append('cost', '0.06');
      formData.append('category', updatedItem.category || '');

      const result = await updateLineItem('item-1', formData);

      expect(result.error).toBeNull();
      expect(result.data?.cost).toBe(0.06);
    });

    test('should prevent updating items belonging to other users', async () => {
      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: null,
        error: { message: 'No rows updated', code: 'PGRST116' },
      });

      const formData = new FormData();
      formData.append('name', 'Unauthorized Update');
      formData.append('cost', '999.99');

      const result = await updateLineItem('item-other-user', formData);

      expect(result.error).not.toBeNull();
      expect(result.data).toBeNull();
    });

    test('should update last_used_at timestamp when item is used', async () => {
      const now = new Date().toISOString();
      
      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: { ...sampleLineItems[0], last_used_at: now },
        error: null,
      });

      const result = await updateItemLastUsed('item-1');

      expect(result.error).toBeNull();
      expect(result.data?.last_used_at).toBe(now);
    });
  });

  describe('Item Deletion', () => {
    test('should delete an item successfully', async () => {
      mockSupabase.from().delete().eq.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await deleteLineItem('item-1');

      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('line_items');
    });

    test('should prevent deleting items belonging to other users', async () => {
      mockSupabase.from().delete().eq.mockResolvedValue({
        data: null,
        error: { message: 'No rows deleted', code: 'PGRST116' },
      });

      const result = await deleteLineItem('item-other-user');

      expect(result.error).not.toBeNull();
    });
  });

  describe('Item Categories and Organization', () => {
    test('should handle items with categories correctly', async () => {
      const categorizedItems = sampleLineItems.filter(item => item.category);
      
      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: categorizedItems,
        error: null,
      });

      const result = await getLineItems();

      expect(result.error).toBeNull();
      expect(result.data?.every(item => item.category)).toBe(true);
    });

    test('should handle items with tags correctly', async () => {
      const taggedItems = sampleLineItems.filter(item => item.tags && item.tags.length > 0);
      
      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: taggedItems,
        error: null,
      });

      const result = await getLineItems();

      expect(result.error).toBeNull();
      expect(result.data?.every(item => item.tags && item.tags.length > 0)).toBe(true);
    });

    test('should handle favorite items correctly', async () => {
      const favoriteItems = sampleLineItems.filter(item => item.is_favorite);
      
      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: favoriteItems,
        error: null,
      });

      const result = await getLineItems();

      expect(result.error).toBeNull();
      expect(result.data?.every(item => item.is_favorite)).toBe(true);
    });
  });

  describe('Item Usage Tracking', () => {
    test('should track when items are last used', async () => {
      const itemWithUsage = sampleLineItems.find(item => item.last_used_at);
      
      expect(itemWithUsage?.last_used_at).toBeTruthy();
      expect(new Date(itemWithUsage!.last_used_at!)).toBeInstanceOf(Date);
    });

    test('should handle items that have never been used', async () => {
      const unusedItem = sampleLineItems.find(item => !item.last_used_at);
      
      expect(unusedItem?.last_used_at).toBeNull();
    });

    test('should update usage timestamp when item is used in quote', async () => {
      const beforeUsage = new Date('2024-01-01T10:00:00Z');
      const afterUsage = new Date();
      
      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: { 
          ...sampleLineItems[1], 
          last_used_at: afterUsage.toISOString() 
        },
        error: null,
      });

      const result = await updateItemLastUsed('item-2');

      expect(result.error).toBeNull();
      expect(new Date(result.data!.last_used_at!)).toBeInstanceOf(Date);
      expect(new Date(result.data!.last_used_at!).getTime()).toBeGreaterThan(beforeUsage.getTime());
    });
  });

  describe('Data Validation and Edge Cases', () => {
    test('should handle items with very long names', async () => {
      const longName = 'A'.repeat(255); // Very long name
      const itemWithLongName: LineItem = {
        id: 'item-long',
        user_id: mockUser.id,
        name: longName,
        unit: 'each',
        cost: 100,
        category: null,
        tags: null,
        is_favorite: false,
        last_used_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: itemWithLongName,
        error: null,
      });

      const formData = new FormData();
      formData.append('name', longName);
      formData.append('unit', 'each');
      formData.append('cost', '100');

      const result = await createLineItem(formData);

      expect(result.error).toBeNull();
      expect(result.data?.name).toBe(longName);
    });

    test('should handle items with decimal costs', async () => {
      const precisionItem: LineItem = {
        id: 'item-precision',
        user_id: mockUser.id,
        name: 'Precision Service',
        unit: 'sq ft',
        cost: 0.001, // Very small cost
        category: null,
        tags: null,
        is_favorite: false,
        last_used_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: precisionItem,
        error: null,
      });

      const formData = new FormData();
      formData.append('name', 'Precision Service');
      formData.append('unit', 'sq ft');
      formData.append('cost', '0.001');

      const result = await createLineItem(formData);

      expect(result.error).toBeNull();
      expect(result.data?.cost).toBe(0.001);
    });

    test('should handle items with special characters in names', async () => {
      const specialName = 'Service & Maintenance (Premium) - 50% Off!';
      const specialItem: LineItem = {
        id: 'item-special',
        user_id: mockUser.id,
        name: specialName,
        unit: 'hour',
        cost: 75.50,
        category: null,
        tags: null,
        is_favorite: false,
        last_used_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: specialItem,
        error: null,
      });

      const formData = new FormData();
      formData.append('name', specialName);
      formData.append('unit', 'hour');
      formData.append('cost', '75.50');

      const result = await createLineItem(formData);

      expect(result.error).toBeNull();
      expect(result.data?.name).toBe(specialName);
    });
  });
});
