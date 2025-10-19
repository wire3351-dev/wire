import { supabase, isSupabaseConfigured } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  color: string[];
  description: string | null;
  specifications: Record<string, any>;
  base_price: number;
  unit_type: string;
  stock_quantity: number;
  image_url: string | null;
  brochure_url: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string | null;
  customer_state: string | null;
  customer_pincode: string;
  items: any[];
  subtotal: number;
  shipping_cost: number;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  qr_code_data: string | null;
  transaction_id: string | null;
  estimated_delivery: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Inquiry {
  id: string;
  user_id: string;
  user_type: string;
  location: string;
  product_name: string | null;
  product_specification: string | null;
  quantity: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  additional_requirements: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  company_name: string | null;
  business_type: string | null;
  gst_number: string | null;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

type SubscriptionCallback<T> = (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: T | null; old: T | null }) => void;

class RealtimeDatabase {
  private channels: Map<string, RealtimeChannel> = new Map();

  async getProducts(): Promise<Product[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data || [];
  }

  async getProductById(id: string): Promise<Product | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }

    return data;
  }

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      throw error;
    }

    return data;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      throw error;
    }

    return data;
  }

  async deleteProduct(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      throw error;
    }

    return true;
  }

  subscribeToProducts(callback: SubscriptionCallback<Product>): () => void {
    if (!isSupabaseConfigured) return () => {};

    const channelName = 'products_realtime';

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload: any) => {
          callback({
            eventType: payload.eventType,
            new: payload.new || null,
            old: payload.old || null,
          });
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  async getOrders(userId?: string): Promise<Order[]> {
    if (!isSupabaseConfigured) return [];

    let query = supabase.from('orders').select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    return data || [];
  }

  async getOrderById(id: string): Promise<Order | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching order:', error);
      return null;
    }

    return data;
  }

  async createOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      throw error;
    }

    return data;
  }

  async updateOrderStatus(id: string, status: string, paymentStatus?: string): Promise<Order | null> {
    if (!isSupabaseConfigured) return null;

    const updates: any = { status };
    if (paymentStatus) {
      updates.payment_status = paymentStatus;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating order status:', error);
      throw error;
    }

    return data;
  }

  subscribeToOrders(callback: SubscriptionCallback<Order>, userId?: string): () => void {
    if (!isSupabaseConfigured) return () => {};

    const channelName = userId ? `orders_${userId}` : 'orders_all';

    const filter = userId
      ? { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` }
      : { event: '*', schema: 'public', table: 'orders' };

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', filter, (payload: any) => {
        callback({
          eventType: payload.eventType,
          new: payload.new || null,
          old: payload.old || null,
        });
      })
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  async getInquiries(userId?: string): Promise<Inquiry[]> {
    if (!isSupabaseConfigured) return [];

    let query = supabase.from('inquiries').select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inquiries:', error);
      return [];
    }

    return data || [];
  }

  async createInquiry(inquiry: Omit<Inquiry, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<Inquiry | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('inquiries')
      .insert({ ...inquiry, status: 'pending' })
      .select()
      .single();

    if (error) {
      console.error('Error creating inquiry:', error);
      throw error;
    }

    return data;
  }

  async updateInquiryStatus(id: string, status: string): Promise<Inquiry | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('inquiries')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating inquiry status:', error);
      throw error;
    }

    return data;
  }

  subscribeToInquiries(callback: SubscriptionCallback<Inquiry>, userId?: string): () => void {
    if (!isSupabaseConfigured) return () => {};

    const channelName = userId ? `inquiries_${userId}` : 'inquiries_all';

    const filter = userId
      ? { event: '*', schema: 'public', table: 'inquiries', filter: `user_id=eq.${userId}` }
      : { event: '*', schema: 'public', table: 'inquiries' };

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', filter, (payload: any) => {
        callback({
          eventType: payload.eventType,
          new: payload.new || null,
          old: payload.old || null,
        });
      })
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  }

  async upsertUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          user_id: userId,
          ...profile,
          profile_completed: true,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting user profile:', error);
      throw error;
    }

    return data;
  }

  unsubscribeAll(): void {
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();
  }
}

export const db = new RealtimeDatabase();
