import Stripe from "stripe";
import {createClient} from "@supabase/supabase-js";

import {Database} from "@/types_db";
import {Price, Product} from "@/types";

import {stripe} from "./stripe";
import {toDateTime} from "./helpers";

export const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
); // создается административный клиент supabase правами сервисной роли

const upsertProductRecord = async (product: Stripe.Product) => {
    const productData: Product = {
        id: product.id,
        active: product.active,
        name: product.name,
        description: product.description ?? undefined,
        image: product.images?.[0] ?? null,
        metadata: product.metadata
    };

    const { error } = await supabaseAdmin
        .from("products")
        .upsert([productData])

    if (error) {
        throw error;
    }

    console.log(`Product inserted/updated: ${product.id}`);
}; // Создание или обновление продукта синхронизуясь с Stripe

const upsertPriceRecord = async (price: Stripe.Price) => {
    if (!price.id || !price.product) {
        throw new Error('Missing required price fields');
    }
    const priceData: Price = {
        id: price.id,
        product_id: typeof price.product === 'string' ? price.product : '',
        active: price.active,
        currency: price.currency,
        description: price.nickname ?? undefined,
        type: price.type,
        unit_amount: price.unit_amount ?? undefined,
        // @ts-ignore
        interval: price.recurring?.interval, 
        interval_count: price.recurring?.interval_count,
        trial_period_days: price.recurring?.trial_period_days,
        metadata:price.metadata
    };

    const {error} = await supabaseAdmin
        .from('prices')
        // @ts-ignore
        .upsert([priceData]);
    
    if (error) {
        throw error;
    };

    console.log(`Price inserted/updated: ${price.id}`);
};// Создание или обновление цен синхронизуясь с Stripe

const createOrRetrieveACustomer = async ({
    email,
    uuid
 }: {
    email: string,
    uuid: string
 }) => {
    const { data, error } = await supabaseAdmin // ищет клиента supabase по uuid
        .from('customers')
        .select('stripe_customer_id')
        .eq('id',uuid)
        .single();
    
    if (error || !data?.stripe_customer_id){
        const customerData: { metadata: { supabaseUUID: string}; email?:string} = {
            metadata: {
                supabaseUUID: uuid
            }
        };
        if (email) customerData.email = email;

        const customer = await stripe.customers.create(customerData);

        const {error: supabaseError} = await supabaseAdmin // создаём клиента
            .from('customers')
            .insert([{id:uuid, stripe_customer_id: customer.id}]);

        if (supabaseError) {
            throw supabaseError;
        }

        console.log(`New customer created and inserted for ${uuid}`);
        return customer.id;
    }

    return data.stripe_customer_id;
}; // Функция реализует паттерн "get or create" для клиентов.

const copyBillingDetailsTOcustomers = async (
    uuid: string,
    payment_method: Stripe.PaymentMethod
 ) => {
    const customer = payment_method.customer as string;
    const {name,phone, address} = payment_method.billing_details;
    if (!name || !phone || !address ) return;

    // @ts-ignore
    await stripe.customers.update(customer, {name, phone, address});
    const { error } = await supabaseAdmin
        .from('users')
        .update({
            billing_address: {...address},
            payment_method: {...payment_method[payment_method.type]}
        })
        .eq('id', uuid);

    if (error) throw error;
}; // вызывается посел привязки платежного метода и при обновлении данных клиента

const manageSubscriptionStatusChange = async (
    subscriptionId: string,
    customerId: string,
    createAction = false // флаг создания новой подписки
 ) => {
    const { data: customerData, error: noCustomerError} = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();
    if (noCustomerError) throw noCustomerError;

    const {id:uuid} = customerData!;

    const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(
        subscriptionId,
        {
            expand: [
                'default_payment_method',
                'items.data.price'
            ]
        }
    )


    
    
    const subscriptionData: Database['public']['Tables']['subscriptions']['Insert'] ={
        id: subscription.id,
        user_id: uuid,
        metadata: subscription.metadata,
        // @ts-ignore
        status: subscription.status,
        price_id: subscription.items.data[0].price.id,
        // @ts-ignore
        quantity:subscription.quantity,
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancel_at: subscription.cancel_at ? toDateTime(subscription.cancel_at)?.toISOString() : null,
        canceled_at:subscription.canceled_at ? toDateTime(subscription.canceled_at)?.toISOString() : null,
        current_period_start: toDateTime(subscription.items.data[0].current_period_start).toISOString(),
        current_period_end: toDateTime(subscription.items.data[0].current_period_end).toISOString(),
        created: toDateTime(subscription.created)?.toISOString(),
        ended_at: subscription.ended_at ? toDateTime(subscription.ended_at).toISOString() : null,
        trial_start: subscription.trial_start ? toDateTime(subscription.trial_start).toISOString() : null,
        trial_end: subscription.trial_end ? toDateTime(subscription.trial_end).toISOString() : null,
   };

    const { error } = await supabaseAdmin
        .from('subscriptions')
        .upsert([subscriptionData]);

    if (error) throw error;

    console.log(`Inserted / Updated subscription [${subscription.id} for ${uuid}]`);

    if (createAction && subscription.default_payment_method && uuid) {
        await copyBillingDetailsTOcustomers(
            uuid,
            subscription.default_payment_method as Stripe.PaymentMethod
        )
    }
}; // находит пользователя в БД по его StripeID, получает актуальные данные подписки из Stripe и сохраняет или обновляет эти данные в БД.

export {
    upsertProductRecord,
    upsertPriceRecord,
    createOrRetrieveACustomer,
    manageSubscriptionStatusChange
}

 

