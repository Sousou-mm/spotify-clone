import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { stripe } from "@/libs/stripe";
import { getURL } from "@/libs/helpers";
import { createOrRetrieveACustomer } from "@/libs/supabaseAdmin";


export async function POST() {
    try {
        const supabase = createRouteHandlerClient({
            cookies,
        });

        const { data: {user}} = await supabase.auth.getUser();
        
        if (!user) throw new Error('Could not get user');

        const customer = await createOrRetrieveACustomer({
            uuid: user.id || '',
            email: user.email || ''
        });

        if (!customer) throw new Error('Could not get customer');

        const {url} = await stripe.billingPortal.sessions.create({
            customer,
            return_url: `${getURL()}/account` // куда вернуться после работы с проталом
        });

        return NextResponse.json({url}); // возвращем URL поратла клиенту
    } catch (error) {
        console.log(error);
        return new NextResponse('Internal Error', {status: 500});
    }
};