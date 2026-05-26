import { supabase } from "@/integrations/supabase/client";

export const propertyService = {
  async create(payload: any) {
    const { data, error } = await supabase
      .from("properties")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, payload: any) {
    const { data, error } = await supabase
      .from("properties")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAll() {
    const { data, error } = await supabase
      .from("properties")
      .select("*, property_images(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }
};