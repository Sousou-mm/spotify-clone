import { ProductWithPrice } from "@/types";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";


const getActiveProductsWithPrices = async () : Promise<ProductWithPrice[]> => {
    const supabase = createServerComponentClient({
        cookies: cookies
    });

    const {data,error}= await supabase
        .from("products")
        .select("*, prices(*)")
        .eq("active", true)
        .eq("prices.active", true)
        .order('metadata->index') //сортировка по полю index внутри JSON поля metadata
        .order('unit_amount', {foreignTable: 'prices'});

        if (error){
            console.log(error);
        }

        return (data as any) || [];
};

export default getActiveProductsWithPrices;