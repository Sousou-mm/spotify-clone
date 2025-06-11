import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import {  cookies } from "next/headers";
import { NextResponse } from "next/server";

import { stripe } from "@/libs/stripe";
import { getURL } from "@/libs/helpers";
import { createOrRetrieveACustomer } from "@/libs/supabaseAdmin";

export async function POST(
    request: Request
) {
    const { price } = await request.json();
    console.log("Price ID being sent to Stripe:", price.id);
    try {
        const supabase = createRouteHandlerClient({
            cookies,
        });
        
        

        const { data: { user } , error: authError} = await supabase.auth.getUser();

        if (authError || !user) {
            console.error("Ошибка аутентификации:", authError);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const customer = await createOrRetrieveACustomer({
            uuid: user?.id || '',
            email: user?.email || ''
        });
        
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            billing_address_collection: 'required',
            customer,
            line_items: [
                {
                    price: price.id,
                    quantity: 1,
                }
            ],
            mode: 'subscription',
            success_url: `${getURL()}/account`,
            cancel_url: `${getURL()}`
        }); // Создание сессии оформления заказа в Stripe
        

        return NextResponse.json({sessionId: session.id}); //возвращается ID созданной сессии для перенаправления
    } catch (error){
        console.log(error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}; // вызывается из форнтенд-приложения