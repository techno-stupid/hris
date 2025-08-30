import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private adminSupabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL', '');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY', '');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_KEY', '');

    // Client for regular operations
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Admin client for user management
    this.adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  getAdminClient(): SupabaseClient {
    return this.adminSupabase;
  }

  async createUser(email: string, password: string, metadata?: any) {
    const { data, error } = await this.adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data;
  }

  async updateUser(userId: string, updates: any) {
    const { data, error } = await this.adminSupabase.auth.admin.updateUserById(
      userId,
      updates,
    );

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return data;
  }

  async deleteUser(userId: string) {
    const { error } = await this.adminSupabase.auth.admin.deleteUser(userId);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    return { success: true };
  }

  async verifyToken(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token);
    
    if (error) {
      throw new Error('Invalid token');
    }

    return data.user;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(`Login failed: ${error.message}`);
    }

    return data;
  }

  async signOut(token: string) {
    const { error } = await this.supabase.auth.signOut();
    
    if (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }

    return { success: true };
  }

  async refreshToken(refreshToken: string) {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }

    return data;
  }
}