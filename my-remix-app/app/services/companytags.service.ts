import { supabase } from "~/hooks/use-auth";

export const updateCompanyTagStatus = async (id: string, status: string) => {
  const { error } = await supabase
                  .from("company_tags")
                  .update({ status: status })
    .eq("id", id);
  if (error) {
    console.error(error);
  }
};